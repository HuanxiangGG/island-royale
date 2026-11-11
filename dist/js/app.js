import { createGame, updateGame, pickup, reload, heal, switchWeapon, WEAPONS, describeNearby, aliveCount } from './game.js';
import { Renderer } from './renderer.js';

const $ = id => document.getElementById(id);
const canvas = $('world');
const renderer = new Renderer(canvas, $('minimap'));
const keys = new Set();
let state = createGame({ seed: 81604 });
let mode = 'lobby', difficulty = 'normal', color = '#edbd5b', paused = false;
let pointer = { x: innerWidth / 2, y: innerHeight / 2, down: false };
let touchMove = { x: 0, y: 0 }, touchAim = { x: 1, y: 0, active: false };
let lastTime = 0, uiTime = 0, previousAmmo = 0, previousHP = 100, toastUntil = 0;
let soundEnabled = true, audioContext, stats = { games: 0, wins: 0, kills: 0, best: 0 };
const gunIcon = '<svg viewBox="0 0 64 24" aria-hidden="true"><path d="M6 8h35V5h9v4h11v5H39l-5 9h-8l3-9H15v6H7V13H2V8z"/></svg>';
try {
  const saved = JSON.parse(localStorage.getItem('island-royale-v1') || '{}');
  if (saved.name) $('nickname').value = String(saved.name).slice(0,16);
  if (saved.stats) for (const key of Object.keys(stats)) stats[key] = Math.max(0, Number(saved.stats[key]) || 0);
  soundEnabled = saved.sound !== false;
} catch {}
function save() { try { localStorage.setItem('island-royale-v1', JSON.stringify({ name: $('nickname').value, stats, sound: soundEnabled })); } catch {} }
function audioStart() {
  if (!soundEnabled) return;
  try { audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); audioContext.resume().catch(()=>{}); } catch {}
}
function tone(frequency = 180, duration = .05, type = 'triangle', volume = .035) {
  if (!soundEnabled || !audioContext || audioContext.state !== 'running') return;
  const osc = audioContext.createOscillator(), gain = audioContext.createGain();
  osc.type = type; osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, frequency / 3), audioContext.currentTime + duration);
  gain.gain.setValueAtTime(volume, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
  osc.connect(gain); gain.connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + duration);
}
function soundUI() { $('sound-toggle').textContent = soundEnabled ? '♪' : '♩'; $('sound-toggle').setAttribute('aria-label', soundEnabled ? '关闭音效' : '开启音效'); $('sound-toggle').style.opacity = soundEnabled ? 1 : .5; }
soundUI();
$('sound-toggle').onclick = () => { soundEnabled = !soundEnabled; audioStart(); soundUI(); save(); };
$('nickname').addEventListener('change', save);
document.querySelectorAll('[data-difficulty]').forEach(button => button.onclick = () => {
  difficulty = button.dataset.difficulty;
  document.querySelectorAll('[data-difficulty]').forEach(b => { b.classList.toggle('selected', b===button); b.setAttribute('aria-pressed', String(b===button)); });
});
document.querySelectorAll('[data-color]').forEach(button => button.onclick = () => {
  color = button.dataset.color;
  document.querySelectorAll('[data-color]').forEach(b => { b.classList.toggle('selected', b===button); b.setAttribute('aria-pressed', String(b===button)); });
});
function resetInput() { keys.clear(); pointer.down = false; touchMove = {x:0,y:0}; touchAim.active = false; document.querySelectorAll('.joystick i').forEach(i=>i.style.transform=''); }
function showToast(text, seconds = 2) { $('toast').textContent = text; toastUntil = performance.now() + seconds*1000; }
function start() {
  document.querySelectorAll('dialog[open]').forEach(d=>d.close());
  const name = $('nickname').value.trim() || '无名旅人';
  state = createGame({ botCount: 23, name, difficulty }); state.player.color = color;
  mode = 'playing'; paused = false; previousAmmo = state.player.ammo; previousHP = state.player.hp;
  resetInput(); save(); audioStart();
  document.body.classList.add('playing'); $('hud').hidden = false; $('player-name').textContent = name;
  renderer.resize(); canvas.focus({preventScroll:true}); updateHUD();
  showToast('保持移动，成为最后的幸存者。', 3.5);
}
function lobby() {
  document.querySelectorAll('dialog[open]').forEach(d=>d.close());
  mode = 'lobby'; paused = false; resetInput(); document.body.classList.remove('playing'); $('hud').hidden = true;
  state = createGame({seed:81604}); renderer.resize(); $('play').focus({preventScroll:true});
}
function setPause(value) {
  if (mode !== 'playing') return;
  paused = value; resetInput();
  if (value && !$('pause-dialog').open) $('pause-dialog').showModal();
  if (!value) { $('pause-dialog').close(); canvas.focus({preventScroll:true}); }
}
function finish() {
  mode = 'result'; resetInput();
  const won = state.status === 'won';
  stats.games++; stats.wins += Number(won); stats.kills += state.kills;
  const place = state.placement || (won ? 1 : aliveCount(state)+1);
  stats.best = stats.best ? Math.min(stats.best,place) : place; save();
  $('result-emblem').textContent = won ? '♜' : '⌖'; $('result-eyebrow').textContent = won ? 'THE LAST SURVIVOR' : 'EXPEDITION COMPLETE';
  $('result-title').textContent = won ? '这座岛，属于你。' : '下一次，走得更远。';
  $('result-description').textContent = won ? '你穿过了风暴，成为最后的幸存者。' : '每一次落地，都是新的机会。';
  $('result-place').textContent = `#${place}`; $('result-kills').textContent = state.kills; $('result-time').textContent = clock(state.time);
  $('result-dialog').showModal(); tone(won ? 640 : 130,.35,'sine');
}
$('play').onclick = start; $('again').onclick = start; $('back-lobby').onclick = lobby; $('leave').onclick = lobby;
$('pause').onclick = () => setPause(true); $('resume').onclick = () => setPause(false);
$('pause-dialog').addEventListener('cancel',e=>{ e.preventDefault(); setPause(false); });
$('result-dialog').addEventListener('cancel',e=>{ e.preventDefault(); lobby(); });
$('nav-play').onclick = () => $('play').focus();
for (const id of ['guide-open','controls-open']) $(id).onclick = () => $('guide-dialog').showModal();
document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelector('.close-guide').onclick=()=>$('guide-dialog').close();
$('stats-open').onclick = () => { for (const key of ['games','wins','kills','best']) $('stat-'+key).textContent = stats[key] || (key==='best'?'—':'0'); $('stats-dialog').showModal(); };
function action(type) {
  if (mode!=='playing'||paused) return;
  if (type==='pickup') { const item = describeNearby(state); pickup(state); if(item) tone(450,.09); }
  if (type==='reload') { reload(state); if(state.player.reloading>0) showToast('正在换弹…',1); }
  if (type==='heal') { const old=state.player.hp; heal(state); showToast(state.player.hp>old?'已使用急救包':state.player.medkits<=0?'没有急救包了':state.player.hp>=100?'生命值已满':'急救包正在冷却',1.3); }
  updateHUD();
}
$('heal').onclick=()=>action('heal'); $('touch-pickup').onclick=()=>action('pickup'); $('touch-reload').onclick=()=>action('reload');
document.addEventListener('keydown', e => {
  if (mode!=='playing'||/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
  const key = e.key.toLowerCase();
  if (['arrowup','arrowdown','arrowleft','arrowright',' ','escape'].includes(key)) e.preventDefault();
  if(key==='escape' && !e.repeat) { setPause(!paused); return; }
  if(paused) return;
  keys.add(key);
  if(!e.repeat) { if(key==='e') action('pickup'); if(key==='r') action('reload'); if(key==='q') action('heal'); if(/^[123]$/.test(key)) {switchWeapon(state,Number(key)-1);previousAmmo=state.player.ammo;updateHUD();} }
});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
canvas.addEventListener('pointermove',e=>{ if(e.pointerType==='mouse'){const rect=canvas.getBoundingClientRect();pointer.x=e.clientX-rect.left;pointer.y=e.clientY-rect.top;} });
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse' && e.button===0 && mode==='playing'&&!paused){pointer.down=true;canvas.setPointerCapture(e.pointerId);audioStart();}});
canvas.addEventListener('pointerup',()=>pointer.down=false); canvas.addEventListener('pointercancel',()=>pointer.down=false);
canvas.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('blur',()=>{if(mode==='playing')setPause(true);else resetInput();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')setPause(true);});
window.addEventListener('resize',()=>renderer.resize());
function setupStick(id,isAim) {
  const element=$(id), knob=element.querySelector('i'); let activeId=null;
  function update(e){const r=element.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/38,y=(e.clientY-r.top-r.height/2)/38;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}knob.style.transform=`translate(${x*28}px,${y*28}px)`;if(isAim){touchAim={x,y,active:length>.18};}else touchMove={x,y};}
  element.addEventListener('pointerdown',e=>{if(activeId!==null)return;activeId=e.pointerId;element.setPointerCapture(e.pointerId);update(e);audioStart();e.preventDefault();});
  element.addEventListener('pointermove',e=>{if(e.pointerId===activeId)update(e);});
  function release(e){if(e.pointerId!==activeId)return;activeId=null;knob.style.transform='';if(isAim)touchAim.active=false;else touchMove={x:0,y:0};}
  element.addEventListener('pointerup',release);element.addEventListener('pointercancel',release);element.addEventListener('lostpointercapture',release);
}
setupStick('move-stick',false);setupStick('aim-stick',true);
function clock(seconds){seconds=Math.max(0,Math.ceil(seconds));return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;}
let inventorySignature='';
function updateHUD(){
  const p=state.player; $('alive').textContent=aliveCount(state);$('kills').textContent=state.kills;
  $('hp-number').textContent=Math.ceil(p.hp);$('hp-bar').style.width=`${Math.max(0,p.hp)}%`;$('shield-bar').style.width=`${Math.max(0,Math.min(100,p.shield))}%`;
  $('ammo').textContent=p.reloading>0?'··':p.ammo;$('reserve').textContent=`/ ${p.reserve}`;$('weapon-name').textContent=p.reloading>0?`换弹 ${p.reloading.toFixed(1)}s`:WEAPONS[p.weapon]?.name||'';$('medkits').textContent=p.medkits;
  const danger=Math.hypot(p.x-state.zone.x,p.y-state.zone.y)>state.zone.radius;
  $('zone-box').classList.toggle('danger',danger);$('zone-label').textContent=danger?'离开风暴！持续受到伤害':`第 ${state.zone.phase+1} 阶段 · 安全区`;$('zone-time').textContent=clock(state.zone.remaining);
  const sig=p.inventory.join(',')+':'+p.slot;if(sig!==inventorySignature){inventorySignature=sig;const fragment=document.createDocumentFragment();for(let i=0;i<3;i++){const b=document.createElement('button');b.className='weapon-slot'+(i===p.slot?' active':'');b.innerHTML=`<small>${i+1}</small>${gunIcon}`;const text=document.createElement('span');text.textContent=WEAPONS[p.inventory[i]]?.name||'空位';b.append(text);b.setAttribute('aria-label',`${i+1}号武器 ${text.textContent}`);b.onclick=()=>{if(mode==='playing'&&!paused){switchWeapon(state,i);previousAmmo=state.player.ammo;updateHUD();}};fragment.append(b);}$('inventory').replaceChildren(fragment);}
  const near=describeNearby(state);$('nearby').hidden=!near;if(near){const text=typeof near==='string'?near:(near.label||near.name||'拾取物资');$('nearby').replaceChildren();const k=document.createElement('kbd');k.textContent=matchMedia('(pointer:coarse)').matches?'拾取':'E';$('nearby').append(k,document.createTextNode(text));}
  const events=state.events.filter(e=>state.time-e.time<7).slice(0,4);$('feed').replaceChildren(...events.map(e=>{const div=document.createElement('div');div.textContent=e.text;return div;}));
}
function frame(now){
  const dt=Math.min((now-lastTime)/1000||0,0.05);lastTime=now;
  if(mode==='playing'&&!paused){
    const aim=renderer.screenToWorld(pointer.x,pointer.y);
    const angle=touchAim.active?Math.atan2(touchAim.y,touchAim.x):Math.atan2(aim.y-state.player.y,aim.x-state.player.x);
    updateGame(state,dt,{moveX:Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'))+touchMove.x,moveY:Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'))+touchMove.y,angle,shoot:pointer.down||touchAim.active,sprint:keys.has('shift')});
    if(state.player.ammo<previousAmmo)tone(150+state.player.weapon*40,.045,'sawtooth',.018);
    if(state.player.hp<previousHP)tone(70,.08,'sine',.06);
    previousAmmo=state.player.ammo;previousHP=state.player.hp;
    if(state.status!=='playing')finish();
  }
  renderer.render(state,{lobby:mode==='lobby',mouseX:pointer.x,mouseY:pointer.y});
  if(mode!=='lobby'&&now-uiTime>90){updateHUD();uiTime=now;}
  if(now>toastUntil&&$('toast').textContent)$('toast').textContent='';
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
