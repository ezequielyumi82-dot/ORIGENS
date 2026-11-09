const canvas = document.querySelector('#world'), ctx = canvas.getContext('2d');
const $ = s => document.querySelector(s);
let W,H,active=false,last=0,energy=68,gen=0,stage=0, cold=false;
let traits={speed:1,shield:0,efficiency:1,tail:0};
const pointer={x:0,y:0};
const creature={x:0,y:0,vx:0,vy:0,r:18};
let motes=[], predators=[], ripples=[];

function resize(){W=canvas.width=innerWidth*devicePixelRatio;H=canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);W=innerWidth;H=innerHeight;if(!creature.x){creature.x=W*.5;creature.y=H*.52}}
addEventListener('resize',resize);resize();
function seed(){motes=[];predators=[]; for(let i=0;i<34;i++)motes.push(newMote());for(let i=0;i<3;i++)predators.push({x:Math.random()*W,y:Math.random()*H,r:20+Math.random()*12,a:Math.random()*6,s:.35+Math.random()*.3});}
function newMote(){return{x:20+Math.random()*(W-40),y:70+Math.random()*(H-140),r:2+Math.random()*3,t:Math.random()*6,kind:Math.random()>.72?'rare':'food'}}
function draw(t){ctx.clearRect(0,0,W,H);let g=ctx.createRadialGradient(W*.52,H*.38,0,W*.52,H*.38,Math.max(W,H)*.7);g.addColorStop(0,cold?'#174957':'#135864');g.addColorStop(1,'#03131f');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(let i=0;i<65;i++){let x=(i*157.7+t*.006*(i%3+1))%W,y=(i*97.3+t*.009*(i%4+1))%H;ctx.fillStyle='rgba(119,232,210,.08)';ctx.beginPath();ctx.arc(x,y,1+(i%4)*.4,0,7);ctx.fill()}
  motes.forEach(m=>{let glow=1+Math.sin(t*.002+m.t)*.25;ctx.fillStyle=m.kind==='rare'?'#d6f3a3':'#8df5d1';ctx.globalAlpha=.45;ctx.beginPath();ctx.arc(m.x,m.y,m.r*glow*3,0,7);ctx.fill();ctx.globalAlpha=1;ctx.beginPath();ctx.arc(m.x,m.y,m.r,0,7);ctx.fill()});
  predators.forEach(p=>{p.x+=Math.cos(t*.0005+p.a)*p.s;p.y+=Math.sin(t*.0006+p.a)*p.s; if(p.x<-40)p.x=W+40;if(p.x>W+40)p.x=-40;if(p.y<-40)p.y=H+40;if(p.y>H+40)p.y=-40;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(Math.sin(t*.0006+p.a),Math.cos(t*.0005+p.a)));ctx.fillStyle='rgba(236,124,120,.38)';ctx.beginPath();ctx.ellipse(0,0,p.r*1.5,p.r*.62,0,0,7);ctx.fill();ctx.restore()});
  ripples.forEach((r,i)=>{r.r+=.9; r.a-=.018;ctx.strokeStyle=`rgba(141,245,209,${r.a})`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,7);ctx.stroke();if(r.a<=0)ripples.splice(i,1)});
  ctx.save();ctx.translate(creature.x,creature.y);ctx.rotate(Math.atan2(creature.vy,creature.vx)||0);let aura=ctx.createRadialGradient(0,0,0,0,0,creature.r*3);aura.addColorStop(0,'rgba(141,245,209,.32)');aura.addColorStop(1,'rgba(141,245,209,0)');ctx.fillStyle=aura;ctx.beginPath();ctx.arc(0,0,creature.r*3,0,7);ctx.fill();ctx.fillStyle='#9bf6da';ctx.beginPath();ctx.ellipse(0,0,creature.r*(1+traits.tail*.16),creature.r*.72,0,0,7);ctx.fill();ctx.fillStyle='#e8ffdf';ctx.beginPath();ctx.arc(creature.r*.25,-creature.r*.13,creature.r*.23,0,7);ctx.fill();ctx.fillStyle='#164a53';ctx.beginPath();ctx.arc(creature.r*.32,-creature.r*.15,creature.r*.07,0,7);ctx.fill();if(traits.shield){ctx.strokeStyle='rgba(225,243,165,.75)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,creature.r*1.15,0,7);ctx.stroke()}ctx.restore();
  if(active) requestAnimationFrame(draw);
}
function move(e){const p=e.touches?e.touches[0]:e;pointer.x=p.clientX;pointer.y=p.clientY} addEventListener('pointermove',move);addEventListener('touchmove',move,{passive:true});
function update(){if(!active)return;let dx=pointer.x-creature.x,dy=pointer.y-creature.y;if(pointer.x){creature.vx+=(dx*.006*traits.speed-creature.vx)*.045;creature.vy+=(dy*.006*traits.speed-creature.vy)*.045}creature.x=Math.max(15,Math.min(W-15,creature.x+creature.vx));creature.y=Math.max(52,Math.min(H-25,creature.y+creature.vy));energy-=.026/(traits.efficiency);motes.forEach((m,i)=>{if(Math.hypot(m.x-creature.x,m.y-creature.y)<creature.r+11){energy=Math.min(100,energy+(m.kind==='rare'?13:6));motes[i]=newMote();ripples.push({x:m.x,y:m.y,r:3,a:.6});if(m.kind==='rare')say('Uma partícula do Pulso foi absorvida. A linhagem mudou.')}});predators.forEach(p=>{if(Math.hypot(p.x-creature.x,p.y-creature.y)<p.r+creature.r*.8){energy-=.16/(1+traits.shield*.75)}});if(energy<=0){energy=35;say('A linhagem quase se perdeu. A seleção não tem piedade.')}$('#energyValue').textContent=Math.ceil(energy);$('#energyBar').style.width=energy+'%';if(stage<3&&energy>=94){energy=70;showMutation()}setTimeout(update,16)}
const mutations=[
 [{name:'Cílios velozes',glyph:'≈',copy:'+ velocidade para buscar energia e escapar',apply:()=>traits.speed+=.55},{name:'Membrana densa',glyph:'◌',copy:'+ defesa contra predadores, com maior custo',apply:()=>{traits.shield++;traits.efficiency-=.12}}],
 [{name:'Núcleo eficiente',glyph:'✦',copy:'- gasto de energia em águas frias',apply:()=>traits.efficiency+=.38},{name:'Cauda propulsora',glyph:'⌁',copy:'+ mobilidade e postura mais alongada',apply:()=>{traits.speed+=.3;traits.tail++}}],
 [{name:'Simbiose luminosa',glyph:'✺',copy:'Energia abundante perto da superfície',apply:()=>traits.efficiency+=.42},{name:'Casulo resistente',glyph:'◉',copy:'Mais proteção em tempos incertos',apply:()=>traits.shield+=1}]
];
function showMutation(){active=false;let box=$('#options');box.innerHTML='';mutations[stage].forEach(m=>{let b=document.createElement('button');b.className='option';b.innerHTML=`<span class="glyph">${m.glyph}</span><h3>${m.name}</h3><p>${m.copy}</p>`;b.onclick=()=>choose(m);box.append(b)});$('#mutation').classList.remove('hidden')}
function choose(m){m.apply();gen++;stage++;$('#lineage').textContent=`${gen} geração${gen>1?'ões':' '}`;$('#mutation').classList.add('hidden');say(`A linhagem desenvolveu ${m.name.toLowerCase()}. Esta escolha permanecerá.`);if(stage===1){cold=true;setTimeout(()=>$('#event').classList.remove('hidden'),700)}else if(stage>=3){finish()}else{active=true;requestAnimationFrame(draw);update()}}
$('#continue').onclick=()=>{$('#event').classList.add('hidden');say('A água esfriou. A evolução continua.');active=true;requestAnimationFrame(draw);update()};
function finish(){const names=traits.shield>traits.tail?'os primeiros organismos couraçados':'os primeiros nadadores de cauda longa';$('#endText').textContent=`Em Atlas III, há 3,8 bilhões de anos, uma célula deu origem a ${names}. O universo guardará essa memória.`;$('#finalStats').innerHTML=`<div>GERAÇÕES<b>${gen}</b></div><div>ADAPTAÇÃO<b>${traits.speed>1.5?'ÁGIL':'RESISTENTE'}</b></div><div>MEMÓRIA<b>REGISTRADA</b></div>`;$('#end').classList.remove('hidden')}
function say(t){$('#journalText').textContent=t}
$('#begin').onclick=()=>{seed();$('#intro').classList.add('hidden');active=true;pointer.x=W*.5;pointer.y=H*.52;requestAnimationFrame(draw);update();say('A vida se moveu pela primeira vez. Procure energia.')};
$('#restart').onclick=()=>location.reload();
draw(0);
