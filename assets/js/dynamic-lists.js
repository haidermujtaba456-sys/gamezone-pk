/* GameZone PK — dynamic listings.
   Listing pages (news.html, guides.html, reviews.html) keep their static
   article cards as a fallback. When the backend API is reachable, this
   script appends any extra items that were added through the admin panel
   (/admin) and are not already on the page. If the API is unreachable,
   nothing changes and the static cards stay visible.
   Usage: <script src="assets/js/dynamic-lists.js" data-kind="news"></script>
   data-kind is one of: news | guides | reviews (folder name is the same). */
(function () {
  var script = document.currentScript;
  if (!script) return;
  var kind = script.getAttribute("data-kind") || "news";
  var folder = kind; // news/ guides/ reviews/
  var readWord = kind === "reviews" ? "review" : kind === "guides" ? "guide" : "article";
  var kindLabel = kind === "reviews" ? "Review" : kind === "guides" ? "Guide" : "News";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function excerptOf(it) {
    if (it.excerpt) return it.excerpt;
    var b = String(it.body || "").replace(/\s+/g, " ").trim();
    if (!b) return "";
    return b.length > 170 ? b.slice(0, 167).trim() + "…" : b;
  }
  function dateOf(it) {
    return String(it.published_at || "").slice(0, 10);
  }

  var main = document.querySelector("main");
  if (!main) return;

  // Slugs already shown as static cards — do not duplicate them.
  var existing = {};
  var links = main.querySelectorAll('a[href^="' + folder + '/"]');
  for (var i = 0; i < links.length; i++) {
    var m = links[i].getAttribute("href").match(/\/([^\/]+)\.html$/);
    if (m) existing[m[1]] = true;
  }

  fetch("/api/" + kind)
    .then(function (r) { if (!r.ok) throw new Error("no api"); return r.json(); })
    .then(function (list) {
      if (!list || !list.length) return;
      var fresh = list.filter(function (it) { return it && it.slug && !existing[it.slug]; });
      if (!fresh.length) return;
      fresh.forEach(function (it) {
        var url = folder + "/article.html?slug=" + encodeURIComponent(it.slug);
        var d = dateOf(it);
        var author = it.author || "GameZone PK Editorial Team";
        var meta;
        if (kind === "reviews") {
          var stars = (it.rating !== undefined && it.rating !== null && it.rating !== "")
            ? '<span class="stars">★ ' + esc(String(it.rating)) + " / 5</span>" : "";
          meta = '<div class="meta">' + (d ? "<span>" + esc(d) + "</span>" : "") + stars + "</div>";
        } else {
          var badge = it.category || kindLabel;
          meta = '<div class="meta">' + (d ? "<span>" + esc(d) + "</span>" : "") +
            "<span>By " + esc(author) + "</span>" +
            '<span class="badge">' + esc(badge) + "</span></div>";
        }
        var div = document.createElement("div");
        div.className = "article";
        div.innerHTML =
          '<h3><a href="' + url + '">' + esc(it.title) + "</a></h3>" +
          "<p>" + esc(excerptOf(it)) + "</p>" + meta +
          '<a href="' + url + '">Read full ' + readWord + " →</a>";
        main.appendChild(div);
      });
    })
    .catch(function () { /* API unreachable — static cards stay as they are. */ });
})();
