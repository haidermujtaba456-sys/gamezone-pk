// GameZone PK - 12 original browser games. All art is drawn with canvas/CSS; no external assets.
(function(){
"use strict";
function $(id){return document.getElementById(id);}
function scoreEl(){return $('gameScore');}
function setScore(t){var e=scoreEl(); if(e) e.textContent=t;}
function setStatus(t){var e=$('gameStatus'); if(e) e.textContent=t;}
function onPlay(slug){ if(typeof recordPlay==='function') recordPlay(slug); }
var canvas, ctx;
function setupCanvas(w,h){canvas=$('gameCanvas'); if(!canvas) return false; canvas.width=w; canvas.height=h; ctx=canvas.getContext('2d'); return true;}
function bindRestart(fn){var b=$('restartBtn'); if(b) b.onclick=fn; var p=$('playBtn'); if(p) p.onclick=function(){onPlay(GAME_SLUG); fn();};}

// ---------- SNAKE ----------
function initSnake(){
 if(!setupCanvas(400,400)) return;
 var cell=20, snake, dir, food, score, timer, over;
 function reset(){snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}]; dir={x:1,y:0}; score=0; over=false; placeFood(); setScore('Score: 0'); setStatus('Use arrow keys or the buttons below. Eat the orbs!'); clearInterval(timer); timer=setInterval(tick,130);}
 function placeFood(){food={x:Math.floor(Math.random()*20),y:Math.floor(Math.random()*20)};}
 function tick(){if(over)return; var head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
  if(head.x<0||head.y<0||head.x>=20||head.y>=20||snake.some(function(s){return s.x===head.x&&s.y===head.y;})){over=true; clearInterval(timer); setStatus('Game over! Final score: '+score+'. Press Restart to play again.'); return;}
  snake.unshift(head);
  if(head.x===food.x&&head.y===food.y){score+=10; setScore('Score: '+score); placeFood();} else snake.pop();
  draw();}
 function draw(){ctx.fillStyle='#0A0E1A'; ctx.fillRect(0,0,400,400); ctx.fillStyle='#FACC15'; ctx.fillRect(food.x*cell+3,food.y*cell+3,14,14); snake.forEach(function(s,i){ctx.fillStyle=i===0?'#4ADE80':'#22C55E'; ctx.fillRect(s.x*cell+1,s.y*cell+1,18,18);});}
 document.addEventListener('keydown',function(e){if(GAME_SLUG!=='snake')return; if(e.key==='ArrowUp'&&dir.y!==1)dir={x:0,y:-1}; else if(e.key==='ArrowDown'&&dir.y!==-1)dir={x:0,y:1}; else if(e.key==='ArrowLeft'&&dir.x!==1)dir={x:-1,y:0}; else if(e.key==='ArrowRight'&&dir.x!==-1)dir={x:1,y:0};});
 [['upBtn',0,-1],['downBtn',0,1],['leftBtn',-1,0],['rightBtn',1,0]].forEach(function(b){var el=$(b[0]); if(el) el.onclick=function(){if(b[1]!==0&&dir.x!==-b[1])dir={x:b[1],y:0}; if(b[2]!==0&&dir.y!==-b[2])dir={x:0,y:b[2]};};});
 bindRestart(reset); reset();
}

// ---------- 2048 ----------
function init2048(){
 var gridEl=$('grid2048'); if(!gridEl) return;
 var grid, score, over;
 function reset(){grid=Array.from({length:4},function(){return [0,0,0,0];}); score=0; over=false; addTile(); addTile(); render(); setScore('Score: 0'); setStatus('Use arrow keys or swipe buttons to slide tiles. Merge matching numbers!');}
 function addTile(){var empty=[]; grid.forEach(function(r,i){r.forEach(function(v,j){if(!v)empty.push([i,j]);});}); if(!empty.length)return; var c=empty[Math.floor(Math.random()*empty.length)]; grid[c[0]][c[1]]=Math.random()<0.9?2:4;}
 function slide(row){var a=row.filter(Boolean); for(var i=0;i<a.length-1;i++){if(a[i]===a[i+1]){a[i]*=2; score+=a[i]; a.splice(i+1,1);}} while(a.length<4)a.push(0); return a;}
 function move(d){if(over)return; var before=JSON.stringify(grid);
  if(d==='left') grid=grid.map(slide);
  if(d==='right') grid=grid.map(function(r){return slide(r.slice().reverse()).reverse();});
  if(d==='up'){grid=transpose(grid).map(slide); grid=transpose(grid);}
  if(d==='down'){grid=transpose(grid).map(function(r){return slide(r.slice().reverse()).reverse();}); grid=transpose(grid);}
  if(JSON.stringify(grid)!==before){addTile(); render(); setScore('Score: '+score); if(!canMove()){over=true; setStatus('Game over! Final score: '+score);}}}
 function transpose(g){return g[0].map(function(_,i){return g.map(function(r){return r[i];});});}
 function canMove(){for(var i=0;i<4;i++)for(var j=0;j<4;j++){if(!grid[i][j])return true; if(j<3&&grid[i][j]===grid[i][j+1])return true; if(i<3&&grid[i][j]===grid[i+1][j])return true;} return false;}
 function render(){gridEl.innerHTML=''; grid.forEach(function(r){r.forEach(function(v){var d=document.createElement('div'); d.className='tile2048'; d.textContent=v||''; d.style.cssText='width:70px;height:70px;display:flex;align-items:center;justify-content:center;background:'+(v?'#7C3AED':'#1E2A4A')+';border-radius:8px;font-weight:800;font-size:'+(v>=128?'1.1rem':'1.4rem')+';'; gridEl.appendChild(d);});}); gridEl.style.cssText='display:grid;grid-template-columns:repeat(4,70px);gap:8px;justify-content:center;margin:10px auto;';}
 document.addEventListener('keydown',function(e){if(GAME_SLUG!=='2048')return; var m={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[e.key]; if(m){e.preventDefault(); move(m);}});
 [['upBtn','up'],['downBtn','down'],['leftBtn','left'],['rightBtn','right']].forEach(function(b){var el=$(b[0]); if(el) el.onclick=function(){move(b[1]);};});
 bindRestart(reset); reset();
}

// ---------- MEMORY MATCH ----------
function initMemory(){
 var board=$('memoryBoard'); if(!board) return;
 var symbols=['🎮','🚀','⭐','🎯','🧩','🍕','🐍','⚡'], cards, flipped, matched, moves;
 function reset(){var deck=symbols.concat(symbols).sort(function(){return Math.random()-0.5;}); cards=deck; flipped=[]; matched=0; moves=0; setScore('Moves: 0 | Pairs: 0/8'); setStatus('Flip two cards. Match all 8 pairs!'); board.innerHTML=''; board.style.cssText='display:grid;grid-template-columns:repeat(4,70px);gap:8px;justify-content:center;';
  deck.forEach(function(sym,i){var b=document.createElement('button'); b.textContent='?'; b.style.cssText='width:70px;height:70px;font-size:1.6rem;background:#7C3AED;color:#fff;border:0;border-radius:10px;cursor:pointer;';
   b.onclick=function(){if(flipped.length===2||b.dataset.done)return; b.textContent=sym; b.style.background='#00D4FF'; b.style.color='#0A0E1A'; flipped.push({el:b,sym:sym});
    if(flipped.length===2){moves++; if(flipped[0].sym===flipped[1].sym){flipped.forEach(function(f){f.el.dataset.done='1'; f.el.style.background='#22C55E';}); matched++; setScore('Moves: '+moves+' | Pairs: '+matched+'/8'); flipped=[]; if(matched===8) setStatus('You win! Finished in '+moves+' moves. Play again to beat it.');}
    else{var pair=flipped.slice(); flipped=[]; setScore('Moves: '+moves+' | Pairs: '+matched+'/8'); setTimeout(function(){pair.forEach(function(f){f.el.textContent='?'; f.el.style.background='#7C3AED'; f.el.style.color='#fff';});},700);}}};
   board.appendChild(b);});}
 bindRestart(reset); reset();
}

// ---------- BREAKOUT ----------
function initBreakout(){
 if(!setupCanvas(480,360)) return;
 var paddleX=200, ball={x:240,y:300,dx:3,dy:-3}, bricks=[], score=0, lives=3, timer, running=false;
 function reset(){paddleX=200; ball={x:240,y:300,dx:3,dy:-3}; score=0; lives=3; bricks=[]; for(var r=0;r<4;r++)for(var c=0;c<8;c++)bricks.push({x:c*60+4,y:r*26+30,alive:true}); setScore('Score: 0 | Lives: 3'); setStatus('Move the paddle with mouse, arrow keys, or touch. Clear all bricks!'); clearInterval(timer); timer=setInterval(tick,16); running=true;}
 function tick(){ctx.fillStyle='#0A0E1A'; ctx.fillRect(0,0,480,360);
  bricks.forEach(function(b){if(b.alive){ctx.fillStyle='#7C3AED'; ctx.fillRect(b.x,b.y,52,18);}});
  ctx.fillStyle='#00D4FF'; ctx.fillRect(paddleX,340,80,10);
  ctx.fillStyle='#FACC15'; ctx.beginPath(); ctx.arc(ball.x,ball.y,8,0,7); ctx.fill();
  ball.x+=ball.dx; ball.y+=ball.dy;
  if(ball.x<8||ball.x>472)ball.dx*=-1; if(ball.y<8)ball.dy*=-1;
  if(ball.y>332&&ball.x>paddleX&&ball.x<paddleX+80){ball.dy=-Math.abs(ball.dy); ball.dx=(ball.x-(paddleX+40))/20;}
  bricks.forEach(function(b){if(b.alive&&ball.x>b.x&&ball.x<b.x+52&&ball.y>b.y&&ball.y<b.y+18){b.alive=false; ball.dy*=-1; score+=10; setScore('Score: '+score+' | Lives: '+lives);}});
  if(bricks.every(function(b){return !b.alive;})){clearInterval(timer); setStatus('You win! Final score: '+score);}
  if(ball.y>360){lives--; if(lives<=0){clearInterval(timer); setStatus('Game over! Final score: '+score+'. Press Restart.');} else{setScore('Score: '+score+' | Lives: '+lives); ball={x:240,y:300,dx:3,dy:-3}; paddleX=200;}}}
 canvas.addEventListener('mousemove',function(e){var r=canvas.getBoundingClientRect(); paddleX=Math.max(0,Math.min(400,(e.clientX-r.left)*(480/r.width)-40));});
 canvas.addEventListener('touchmove',function(e){e.preventDefault(); var r=canvas.getBoundingClientRect(); var t=e.touches[0]; paddleX=Math.max(0,Math.min(400,(t.clientX-r.left)*(480/r.width)-40));},{passive:false});
 document.addEventListener('keydown',function(e){if(GAME_SLUG!=='breakout')return; if(e.key==='ArrowLeft')paddleX=Math.max(0,paddleX-18); if(e.key==='ArrowRight')paddleX=Math.min(400,paddleX+18);});
 bindRestart(reset); reset();
}

// ---------- SPACE SHOOTER ----------
function initShooter(){
 if(!setupCanvas(480,400)) return;
 var ship={x:220}, bullets=[], enemies=[], score=0, lives=3, timer, wave=1;
 function reset(){ship={x:220}; bullets=[]; enemies=[]; score=0; lives=3; wave=1; spawnWave(); setScore('Score: 0 | Lives: 3 | Wave: 1'); setStatus('Arrow keys to move, Space to shoot. Destroy all enemies!'); clearInterval(timer); timer=setInterval(tick,20);}
 function spawnWave(){for(var i=0;i<5+wave;i++)enemies.push({x:30+Math.random()*400,y:-20-Math.random()*120,vy:0.6+wave*0.15});}
 function tick(){ctx.fillStyle='#0A0E1A'; ctx.fillRect(0,0,480,400); ctx.fillStyle='#fff'; for(var s=0;s<30;s++){ctx.fillRect((s*97)%480,(s*53)%400,2,2);}
  ctx.fillStyle='#00D4FF'; ctx.beginPath(); ctx.moveTo(ship.x+20,360); ctx.lineTo(ship.x,390); ctx.lineTo(ship.x+40,390); ctx.closePath(); ctx.fill();
  bullets.forEach(function(b){b.y-=7; ctx.fillStyle='#FACC15'; ctx.fillRect(b.x,b.y,4,12);});
  enemies.forEach(function(en){en.y+=en.vy; ctx.fillStyle='#EF4444'; ctx.fillRect(en.x,en.y,30,20);});
  bullets=bullets.filter(function(b){return b.y>0;});
  enemies=enemies.filter(function(en){
    var hit=bullets.some(function(b){return b.x>en.x&&b.x<en.x+30&&b.y>en.y&&b.y<en.y+20;});
    if(hit){bullets=bullets.filter(function(b){return !(b.x>en.x&&b.x<en.x+30&&b.y>en.y&&b.y<en.y+20);}); score+=20; setScore('Score: '+score+' | Lives: '+lives+' | Wave: '+wave); return false;}
    if(en.y>400){lives--; setScore('Score: '+score+' | Lives: '+lives+' | Wave: '+wave); if(lives<=0){clearInterval(timer); setStatus('Game over! Final score: '+score+'. Press Restart.');} return false;}
    return true;});
  if(!enemies.length&&lives>0){wave++; spawnWave(); setScore('Score: '+score+' | Lives: '+lives+' | Wave: '+wave); setStatus('Wave '+wave+' incoming!');}}
 document.addEventListener('keydown',function(e){if(GAME_SLUG!=='space-shooter')return; if(e.key==='ArrowLeft')ship.x=Math.max(0,ship.x-16); if(e.key==='ArrowRight')ship.x=Math.min(440,ship.x+16); if(e.key===' '){e.preventDefault(); bullets.push({x:ship.x+18,y:355});}});
 var shoot=$('shootBtn'); if(shoot) shoot.onclick=function(){bullets.push({x:ship.x+18,y:355});};
 [['leftBtn',-16],['rightBtn',16]].forEach(function(b){var el=$(b[0]); if(el) el.onclick=function(){ship.x=Math.max(0,Math.min(440,ship.x+b[1]));};});
 bindRestart(reset); reset();
}

// ---------- NEON FLAP ----------
function initFlap(){
 if(!setupCanvas(400,400)) return;
 var birdY=200, vel=0, pipes=[], score=0, timer, over;
 function reset(){birdY=200; vel=0; pipes=[{x:400,gap:170}]; score=0; over=false; setScore('Score: 0'); setStatus('Click, tap, or press Space to flap. Fly through the gaps!'); clearInterval(timer); timer=setInterval(tick,20);}
 function flap(){if(over)return; vel=-6;}
 function tick(){if(over)return; vel+=0.35; birdY+=vel;
  pipes.forEach(function(p){p.x-=2.4; if(p.x===200){score++; setScore('Score: '+score);}});
  if(pipes[pipes.length-1].x<220) pipes.push({x:400,gap:60+Math.random()*220});
  pipes=pipes.filter(function(p){return p.x>-60;});
  ctx.fillStyle='#0A0E1A'; ctx.fillRect(0,0,400,400);
  ctx.fillStyle='#22C55E'; pipes.forEach(function(p){ctx.fillRect(p.x,0,50,p.gap-40); ctx.fillRect(p.x,p.gap+40,50,400);});
  ctx.fillStyle='#FACC15'; ctx.beginPath(); ctx.arc(80,birdY,14,0,7); ctx.fill();
  if(birdY>390||birdY<0||pipes.some(function(p){return 80+14>p.x&&80-14<p.x+50&&(birdY-14<p.gap-40||birdY+14>p.gap+40);})){over=true; clearInterval(timer); setStatus('Game over! Final score: '+score+'. Press Restart.');}}
 canvas.addEventListener('click',flap);
 document.addEventListener('keydown',function(e){if(GAME_SLUG==='neon-flap'&&e.key===' '){e.preventDefault(); flap();}});
 var f=$('flapBtn'); if(f) f.onclick=flap;
 bindRestart(reset); reset();
}

// ---------- MINESWEEPER ----------
function initMines(){
 var board=$('mineBoard'); if(!board) return;
 var size=9, mines=10, grid, revealed, flags, over, won;
 function reset(){grid=Array.from({length:size},function(){return Array(size).fill(0);}); revealed=0; flags=0; over=false; won=false;
  var placed=0; while(placed<mines){var r=Math.floor(Math.random()*size),c=Math.floor(Math.random()*size); if(grid[r][c]!=='M'){grid[r][c]='M'; placed++;}}
  for(var i=0;i<size;i++)for(var j=0;j<size;j++){if(grid[i][j]==='M')continue; var n=0; for(var di=-1;di<=1;di++)for(var dj=-1;dj<=1;dj++){var ni=i+di,nj=j+dj; if(ni>=0&&ni<size&&nj>=0&&nj<size&&grid[ni][nj]==='M')n++;} grid[i][j]=n;}
  setScore('Mines: 10 | Flags: 0'); setStatus('Click to reveal. Right-click to flag a mine. Clear all safe squares!'); render();}
 function render(){board.innerHTML=''; board.style.cssText='display:grid;grid-template-columns:repeat(9,34px);gap:3px;justify-content:center;';
  grid.forEach(function(row,i){row.forEach(function(v,j){var b=document.createElement('button'); b.textContent=''; b.dataset.r=i; b.dataset.c=j; b.style.cssText='width:34px;height:34px;background:#1E2A4A;color:#fff;border:1px solid #3A4A73;border-radius:4px;cursor:pointer;font-weight:700;';
   b.onclick=function(){reveal(i,j,b);};
   b.oncontextmenu=function(e){e.preventDefault(); if(b.dataset.done||over)return; if(b.textContent==='🚩'){b.textContent=''; flags--;} else{b.textContent='🚩'; flags++;} setScore('Mines: 10 | Flags: '+flags);};
   board.appendChild(b);});});}
 function reveal(i,j,btn){if(over||btn.dataset.done)return; btn.dataset.done='1'; btn.style.background='#0F1830';
  if(grid[i][j]==='M'){btn.textContent='💣'; over=true; setStatus('Boom! You hit a mine. Press Restart to try again.'); return;}
  revealed++; if(grid[i][j]){btn.textContent=grid[i][j]; btn.style.color='#00D4FF';}
  else{for(var di=-1;di<=1;di++)for(var dj=-1;dj<=1;dj++){var ni=i+di,nj=j+dj; if(ni>=0&&ni<size&&nj>=0&&nj<size){var nb=board.children[ni*size+nj]; if(nb&&!nb.dataset.done) reveal(ni,nj,nb);}}}
  if(revealed===size*size-mines){won=true; over=true; setStatus('You win! The minefield is clear. Well done!');}}
 bindRestart(reset); reset();
}

// ---------- TIC-TAC-TOE ----------
function initTTT(){
 var board=$('tttBoard'); if(!board) return;
 var cells, turn, over, wins={you:0,ai:0,draw:0};
 function reset(){cells=Array(9).fill(''); turn='you'; over=false; setScore('You: '+wins.you+' | AI: '+wins.ai+' | Draws: '+wins.draw); setStatus('You are X. Click a square to play.'); render();}
 function render(){board.innerHTML=''; board.style.cssText='display:grid;grid-template-columns:repeat(3,90px);gap:6px;justify-content:center;';
  cells.forEach(function(v,i){var b=document.createElement('button'); b.textContent=v; b.style.cssText='width:90px;height:90px;font-size:2rem;background:#1E2A4A;color:#fff;border:1px solid #3A4A73;border-radius:10px;cursor:pointer;';
   b.onclick=function(){if(over||cells[i]||turn!=='you')return; cells[i]='X'; afterMove();};
   board.appendChild(b);});}
 function winner(){var lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; for(var k=0;k<lines.length;k++){var l=lines[k]; if(cells[l[0]]&&cells[l[0]]===cells[l[1]]&&cells[l[0]]===cells[l[2]])return cells[l[0]];} return cells.every(Boolean)?'D':null;}
 function afterMove(){var w=winner(); render(); if(w){finish(w); return;} turn=turn==='you'?'ai':'you'; if(turn==='ai'){setTimeout(function(){var empty=cells.map(function(v,i){return v?'':i;}).filter(function(v){return v!=='';}); var pick=empty[Math.floor(Math.random()*empty.length)]; cells[pick]='O'; var w2=winner(); render(); if(w2)finish(w2); else turn='you';},400);}}
 function finish(w){over=true; if(w==='X'){wins.you++; setStatus('You win! Well played.');} else if(w==='O'){wins.ai++; setStatus('The AI wins this time. Try again!');} else{wins.draw++; setStatus('It is a draw!');} setScore('You: '+wins.you+' | AI: '+wins.ai+' | Draws: '+wins.draw);}
 bindRestart(reset); reset();
}

// ---------- WHACK-A-MOLE ----------
function initWhack(){
 var board=$('whackBoard'); if(!board) return;
 var score, timeLeft, timer, moleTimer, active=-1;
 function reset(){score=0; timeLeft=30; setScore('Score: 0 | Time: 30s'); setStatus('Tap the moles as fast as you can. 30 seconds on the clock!'); board.innerHTML=''; board.style.cssText='display:grid;grid-template-columns:repeat(3,90px);gap:8px;justify-content:center;';
  for(var i=0;i<9;i++){var b=document.createElement('button'); b.textContent='🕳️'; b.style.cssText='width:90px;height:90px;font-size:2rem;background:#1E2A4A;border:1px solid #3A4A73;border-radius:10px;cursor:pointer;';
   b.onclick=(function(idx,btn){return function(){if(idx===active){score++; setScore('Score: '+score+' | Time: '+timeLeft+'s'); btn.textContent='🕳️'; active=-1;}};})(i,b); board.appendChild(b);}
  clearInterval(timer); clearInterval(moleTimer);
  timer=setInterval(function(){timeLeft--; setScore('Score: '+score+' | Time: '+timeLeft+'s'); if(timeLeft<=0){clearInterval(timer); clearInterval(moleTimer); setStatus('Time up! Final score: '+score+'. Press Restart to play again.');}},1000);
  moleTimer=setInterval(function(){if(active>=0)board.children[active].textContent='🕳️'; active=Math.floor(Math.random()*9); board.children[active].textContent='🐹';},750);}
 bindRestart(reset); reset();
}

// ---------- SIMON SAYS ----------
function initSimon(){
 var board=$('simonBoard'); if(!board) return;
 var colors=['#EF4444','#22C55E','#00D4FF','#FACC15'], seq=[], step=0, playing=false, score=0;
 function reset(){seq=[]; score=0; setScore('Round: 0'); setStatus('Press Start Round, watch the sequence, then repeat it!'); render(); addStep();}
 function addStep(){seq.push(Math.floor(Math.random()*4)); playSeq();}
 function playSeq(){playing=true; step=0; setStatus('Watch carefully...'); seq.forEach(function(c,i){setTimeout(function(){flash(c);},600*(i+1));}); setTimeout(function(){playing=false; setStatus('Your turn — repeat the sequence!');},600*(seq.length+1));}
 function flash(c){var btn=board.children[c]; if(!btn)return; btn.style.opacity='0.4'; setTimeout(function(){btn.style.opacity='1';},300);}
 function render(){board.innerHTML=''; board.style.cssText='display:grid;grid-template-columns:repeat(2,110px);gap:10px;justify-content:center;';
  colors.forEach(function(col,i){var b=document.createElement('button'); b.style.cssText='width:110px;height:110px;background:'+col+';border:0;border-radius:14px;cursor:pointer;';
   b.onclick=function(){if(playing)return; flash(i); if(i===seq[step]){step++; if(step===seq.length){score++; setScore('Round: '+score); setStatus('Correct! Next round adds one more step.'); setTimeout(addStep,800);}} else{setStatus('Wrong colour! You reached round '+score+'. Press Restart to try again.'); playing=true;}};
   board.appendChild(b);});}
 bindRestart(reset); reset();
}

// ---------- BLOCK STACK ----------
function initBlocks(){
 if(!setupCanvas(300,480)) return;
 var COLS=10, ROWS=20, CELL=24, grid, cur, score=0, lines=0, timer;
 var SHAPES=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]]];
 function newGrid(){return Array.from({length:ROWS},function(){return Array(COLS).fill(0);});}
 function reset(){grid=newGrid(); score=0; lines=0; setScore('Score: 0 | Lines: 0'); setStatus('Arrow keys to move, Up to rotate, Down to drop faster.'); spawn(); clearInterval(timer); timer=setInterval(tick,600); draw();}
 function spawn(){var s=SHAPES[Math.floor(Math.random()*SHAPES.length)]; cur={shape:s,x:3,y:0}; if(collides(cur.shape,cur.x,cur.y)){clearInterval(timer); setStatus('Game over! Final score: '+score+'. Press Restart.');}}
 function collides(shape,x,y){for(var i=0;i<shape.length;i++)for(var j=0;j<shape[i].length;j++){if(!shape[i][j])continue; var nx=x+j,ny=y+i; if(nx<0||nx>=COLS||ny>=ROWS||(ny>=0&&grid[ny][nx]))return true;} return false;}
 function tick(){if(!collides(cur.shape,cur.x,cur.y+1))cur.y++; else{place();} draw();}
 function place(){cur.shape.forEach(function(r,i){r.forEach(function(v,j){if(v&&cur.y+i>=0)grid[cur.y+i][cur.x+j]=1;});});
  for(var i=ROWS-1;i>=0;i--){if(grid[i].every(Boolean)){grid.splice(i,1); grid.unshift(Array(COLS).fill(0)); lines++; score+=100; i++;}}
  setScore('Score: '+score+' | Lines: '+lines); spawn();}
 function draw(){ctx.fillStyle='#0A0E1A'; ctx.fillRect(0,0,300,480); ctx.fillStyle='#1E2A4A'; grid.forEach(function(r,i){r.forEach(function(v,j){if(v)ctx.fillRect(j*CELL+1,i*CELL+1,CELL-2,CELL-2);});});
  ctx.fillStyle='#7C3AED'; cur.shape.forEach(function(r,i){r.forEach(function(v,j){if(v)ctx.fillRect((cur.x+j)*CELL+1,(cur.y+i)*CELL+1,CELL-2,CELL-2);});});}
 document.addEventListener('keydown',function(e){if(GAME_SLUG!=='block-stack'||!cur)return;
  if(e.key==='ArrowLeft'&&!collides(cur.shape,cur.x-1,cur.y))cur.x--;
  if(e.key==='ArrowRight'&&!collides(cur.shape,cur.x+1,cur.y))cur.x++;
  if(e.key==='ArrowDown')tick();
  if(e.key==='ArrowUp'){var rot=cur.shape[0].map(function(_,i){return cur.shape.map(function(r){return r[i];}).reverse();}); if(!collides(rot,cur.x,cur.y))cur.shape=rot;}
  draw();});
 [['leftBtn',-1],['rightBtn',1]].forEach(function(b){var el=$(b[0]); if(el) el.onclick=function(){if(cur&&!collides(cur.shape,cur.x+b[1],cur.y)){cur.x+=b[1]; draw();}};});
 var rot=$('rotateBtn'); if(rot) rot.onclick=function(){if(!cur)return; var r2=cur.shape[0].map(function(_,i){return cur.shape.map(function(row){return row[i];}).reverse();}); if(!collides(r2,cur.x,cur.y)){cur.shape=r2; draw();}};
 bindRestart(reset); reset();
}

// ---------- PONG ----------
function initPong(){
 if(!setupCanvas(480,320)) return;
 var py=130, ay=130, ball={x:240,y:160,dx:3,dy:2}, ps=0, as=0, timer;
 function reset(){py=130; ay=130; ball={x:240,y:160,dx:3,dy:2}; ps=0; as=0; setScore('You: 0 | AI: 0 — first to 7 wins'); setStatus('Arrow keys or mouse to move your paddle.'); clearInterval(timer); timer=setInterval(tick,16);}
 function tick(){ball.x+=ball.dx; ball.y+=ball.dy;
  if(ball.y<6||ball.y>314)ball.dy*=-1;
  ay+=((ball.y-ay-30)*0.06);
  if(ball.x<16&&ball.y>py&&ball.y<py+70){ball.dx=Math.abs(ball.dx); ball.dy+=(ball.y-(py+35))/14;}
  if(ball.x>464&&ball.y>ay&&ball.y<ay+70){ball.dx=-Math.abs(ball.dx); ball.dy+=(ball.y-(ay+35))/14;}
  if(ball.x<0){as++; point();} if(ball.x>480){ps++; point();}
  ctx.fillStyle='#0A0E1A'; ctx.fillRect(0,0,480,320); ctx.fillStyle='#fff'; ctx.fillRect(0,0,2,320);
  ctx.fillStyle='#00D4FF'; ctx.fillRect(8,py,10,70); ctx.fillStyle='#EF4444'; ctx.fillRect(462,ay,10,70);
  ctx.fillStyle='#FACC15'; ctx.beginPath(); ctx.arc(ball.x,ball.y,8,0,7); ctx.fill();}
 function point(){setScore('You: '+ps+' | AI: '+as+' — first to 7 wins'); if(ps>=7){clearInterval(timer); setStatus('You win the match! Press Restart for a rematch.'); return;} if(as>=7){clearInterval(timer); setStatus('The AI wins the match. Press Restart for a rematch.'); return;} ball={x:240,y:160,dx:3*(Math.random()<0.5?-1:1),dy:2};}
 document.addEventListener('keydown',function(e){if(GAME_SLUG!=='pong')return; if(e.key==='ArrowUp')py=Math.max(0,py-16); if(e.key==='ArrowDown')py=Math.min(250,py+16);});
 canvas.addEventListener('mousemove',function(e){var r=canvas.getBoundingClientRect(); py=Math.max(0,Math.min(250,(e.clientY-r.top)*(320/r.height)-35));});
 bindRestart(reset); reset();
}

var GAME_SLUG = (document.body&&document.body.dataset&&document.body.dataset.game)||'';
document.addEventListener('DOMContentLoaded',function(){
 var map={snake:initSnake,'2048':init2048,'memory-match':initMemory,breakout:initBreakout,'space-shooter':initShooter,'neon-flap':initFlap,minesweeper:initMines,'tic-tac-toe':initTTT,'whack-a-mole':initWhack,'simon-says':initSimon,'block-stack':initBlocks,pong:initPong};
 if(map[GAME_SLUG]){try{map[GAME_SLUG]();}catch(err){var s=$('gameStatus'); if(s)s.textContent='The game could not start. Please reload the page.'; console.error(err);}}
});

// ---------- LEADERBOARD + SCORE SUBMIT (real backend, graceful fallback) ----------
function gzApiBase(){ return (typeof API_BASE !== "undefined" && API_BASE) ? API_BASE : ""; }
function gzEscape(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function gzParseScore(){
  var el = $("gameScore"); if(!el) return null;
  var m = /Score:\s*(\d+)/.exec(el.textContent || "");
  return m ? parseInt(m[1], 10) : null;
}
function gzLoadLeaderboard(){
  var box = $("leaderboardList"); if(!box || !GAME_SLUG) return;
  fetch(gzApiBase() + "/api/scores/" + encodeURIComponent(GAME_SLUG) + "?limit=5")
    .then(function(r){ if(!r.ok) throw new Error("no api"); return r.json(); })
    .then(function(list){
      if(!list.length){ box.innerHTML = "<p style=\"color:#A8B3CF\">No scores yet — be the first!</p>"; return; }
      box.innerHTML = "<ol>" + list.map(function(s){ return "<li><b>" + s.score + "</b> — " + gzEscape(s.player_name) + "</li>"; }).join("") + "</ol>";
    })
    .catch(function(){ var w = $("leaderboardBox"); if(w) w.style.display = "none"; });
}
document.addEventListener("DOMContentLoaded", function(){
  gzLoadLeaderboard();
  var btn = $("submitScoreBtn"); if(!btn) return;
  if(gzParseScore() === null){
    btn.disabled = true;
    var m0 = $("scoreMsg"); if(m0) m0.textContent = "This game has no numeric score to submit.";
    return;
  }
  btn.onclick = function(){
    var s = gzParseScore(); if(s === null) return;
    var name = (($("playerName") && $("playerName").value) || "Guest").trim().slice(0, 30) || "Guest";
    btn.disabled = true;
    fetch(gzApiBase() + "/api/scores", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game_slug: GAME_SLUG, player_name: name, score: s }) })
      .then(function(r){ return r.json().then(function(j){ if(!r.ok) throw new Error(j.error || "Failed"); return j; }); })
      .then(function(){ var m = $("scoreMsg"); if(m) m.textContent = "Score submitted! Thanks, " + name + "."; gzLoadLeaderboard(); })
      .catch(function(){ var m = $("scoreMsg"); if(m) m.textContent = "Could not reach the server — your score was not saved. (The backend may not be running.)"; btn.disabled = false; });
  };
});
})();
