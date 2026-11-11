// GameZone PK - shared site script
// API_BASE: same origin by default (the Node backend serves this site).
// If the frontend is hosted separately from the backend (e.g. GitHub Pages
// frontend + Render backend), set it to the backend URL, e.g.
//   var API_BASE = "https://gamezone-pk-backend.onrender.com";
// and re-deploy the frontend. Leave it "" when backend and frontend share a domain.
var API_BASE = "";

function apiPost(path, data) {
  return fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(function (r) {
    return r.json().then(function (j) {
      if (!r.ok) throw new Error(j.error || ("Request failed (" + r.status + ")"));
      return j;
    });
  });
}

document.addEventListener('DOMContentLoaded', function(){
  var ham=document.querySelector('.hamburger'), nav=document.querySelector('nav.main');
  if(ham&&nav){ham.addEventListener('click',function(){nav.classList.toggle('open');});}

  // newsletter — tries the real backend first; if the API is unreachable
  // (static hosting with no backend), falls back to localStorage and says so.
  var nl=document.getElementById('newsletterForm');
  if(nl){nl.addEventListener('submit',function(e){e.preventDefault();var em=document.getElementById('nlEmail');if(!em||!/^\S+@\S+\.\S+$/.test(em.value)){alert('Please enter a valid email address.');return;}
    var s=document.getElementById('nlSuccess');
    apiPost('/api/newsletter',{email:em.value.trim()}).then(function(){
      if(s){s.textContent='Thank you! You are subscribed — your email was saved on our server.';s.style.display='block';}
      nl.reset();
    }).catch(function(err){
      var list=JSON.parse(localStorage.getItem('gzpk-newsletter')||'[]');list.push(em.value);localStorage.setItem('gzpk-newsletter',JSON.stringify(list));
      if(s){s.textContent='Subscribed on this device only — the backend is not connected, so your email was saved in this browser only (localStorage). '+(err&&err.message?err.message:'');s.style.display='block';}
      nl.reset();
    });});}

  // contact form — tries the real backend first; falls back honestly.
  var cf=document.getElementById('contactForm');
  if(cf){cf.addEventListener('submit',function(e){e.preventDefault();var ok=true;['cfName','cfEmail','cfSubject','cfMessage'].forEach(function(id){var el=document.getElementById(id);var err=document.getElementById(id+'Err');if(!el||!el.value.trim()||(id==='cfEmail'&&!/^\S+@\S+\.\S+$/.test(el.value))){ok=false;if(err)err.style.display='block';}else if(err)err.style.display='none';});if(!ok)return;
    var payload={name:document.getElementById('cfName').value.trim(),email:document.getElementById('cfEmail').value.trim(),subject:document.getElementById('cfSubject').value,message:document.getElementById('cfMessage').value.trim()};
    var s=document.getElementById('cfSuccess');
    apiPost('/api/contact',payload).then(function(){
      if(s){s.textContent='Thank you! Your message has been received and saved on our server. We will reply to the email address you provided.';s.style.display='block';}
      cf.reset();
    }).catch(function(err){
      var msgs=JSON.parse(localStorage.getItem('gzpk-contact')||'[]');msgs.push(Object.assign({},payload,{date:new Date().toISOString()}));localStorage.setItem('gzpk-contact',JSON.stringify(msgs));
      if(s){s.textContent='Your message was saved on this device only — the backend is not connected, so it did NOT reach us. Please email hello@gamezonepk.com directly instead. ('+(err&&err.message?err.message:'server unreachable')+')';s.style.display='block';}
      cf.reset();
    });});}

  // site search (header) -> games page with query
  var sb=document.getElementById('siteSearchBtn');
  if(sb){sb.addEventListener('click',function(){var q=document.getElementById('siteSearch');if(q&&q.value.trim()){window.location.href=(window.location.pathname.indexOf('/games/')>-1||window.location.pathname.indexOf('/categories/')>-1?'../games.html':'games.html')+'?q='+encodeURIComponent(q.value.trim());}});}

  // recently played
  var rp=document.getElementById('recentlyPlayed');
  if(rp&&typeof GAMES_DATA!=='undefined'){var recent=JSON.parse(localStorage.getItem('gzpk-recent')||'[]');if(recent.length){var html='';recent.slice(0,4).forEach(function(slug){var g=GAMES_DATA.find(function(x){return x.slug===slug;});if(g)html+='<div class="card"><div class="thumb" style="background:'+g.color+'22">'+g.icon+'</div><div class="card-body"><h3><a href="games/'+g.slug+'.html">'+g.title+'</a></h3><p>'+g.desc+'</p><a class="btn small" href="games/'+g.slug+'.html">Play Again</a></div></div>';});if(html){rp.innerHTML=html;var sec=document.getElementById('recentSection');if(sec)sec.style.display='block';}}}
});
function recordPlay(slug){try{var r=JSON.parse(localStorage.getItem('gzpk-recent')||'[]');r=r.filter(function(x){return x!==slug;});r.unshift(slug);localStorage.setItem('gzpk-recent',JSON.stringify(r.slice(0,8)));}catch(e){}}
function toggleFullscreen(el){var t=document.getElementById('gameArea')||el;if(document.fullscreenElement){document.exitFullscreen();}else if(t.requestFullscreen){t.requestFullscreen();}}
