import { createGame, updateGame, pickup, reload, heal, switchWeapon, WEAPONS, RARITIES, describeNearby, aliveCount } from './game.js';
import { Renderer } from './renderer.js';
import { weaponSVG, WEAPON_SKINS } from './weapon-art.js';
import { MultiplayerClient, websocketURL } from './network.js';

const $ = id => document.getElementById(id);
const canvas = $('world'), renderer = new Renderer(canvas, $('minimap'));
const keys = new Set();
let state = createGame({ seed: 81604, drop: false, botCount:49 });
let mode = 'lobby', selectedMode = 'practice', difficulty = 'normal', color = '#edbd5b', paused = false;
let pointer = { x: innerWidth/2, y: innerHeight/2, down:false };
let touchMove = {x:0,y:0}, touchAim = {x:1,y:0,active:false};
let lastTime = 0, uiTime = 0, previousAmmo = 0, previousHP = 100, toastUntil = 0, jumpRequested = false;
let soundEnabled = true, audioContext, network = null, config = {multiplayerEnabled:false}, configLoaded = false;
let stats = { games:0, wins:0, kills:0, best:0 }, inventorySignature = '', queueDeadline = 0;
let mapOpen = false;
const rarity = id => RARITIES.find(item=>item.id===id) || RARITIES[0];
try {
  const saved = JSON.parse(localStorage.getItem('island-royale-v1')||'{}');
  if(saved.name) $('nickname').value=String(saved.name).slice(0,16);
  if(saved.stats) for(const key of Object.keys(stats)) stats[key]=Math.max(0,Number(saved.stats[key])||0);
  soundEnabled=saved.sound!==false;
} catch {}
function save(){try{localStorage.setItem('island-royale-v1',JSON.stringify({name:$('nickname').value,stats,sound:soundEnabled}));}catch{}}
function clock(seconds){seconds=Math.max(0,Math.ceil(seconds));return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;}
function audioStart(){if(!soundEnabled)return;try{audioContext||=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume().catch(()=>{});}catch{}}
function tone(frequency=180,duration=.05,type='triangle',volume=.035){
  if(!soundEnabled||!audioContext||audioContext.state!=='running')return;
  const osc=audioContext.createOscillator(),gain=audioContext.createGain();
  osc.type=type;osc.frequency.setValueAtTime(frequency,audioContext.currentTime);osc.frequency.exponentialRampToValueAtTime(Math.max(30,frequency/3),audioContext.currentTime+duration);
  gain.gain.setValueAtTime(volume,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);
  osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration);
}
function soundUI(){$('sound-toggle').textContent=soundEnabled?'♪':'♩';$('sound-toggle').setAttribute('aria-label',soundEnabled?'关闭音效':'开启音效');$('sound-toggle').style.opacity=soundEnabled?1:.5;}
soundUI();$('sound-toggle').onclick=()=>{soundEnabled=!soundEnabled;audioStart();soundUI();save();};$('nickname').onchange=save;
function updateMode(){
  const online=selectedMode==='online';
  document.querySelectorAll('[data-mode]').forEach(b=>{const chosen=b.dataset.mode===selectedMode;b.classList.toggle('selected',chosen);b.setAttribute('aria-pressed',String(chosen));});
  $('mode-heading').textContent=online?'单人联机':'机器人练习';$('mode-description').textContent=online?'真人同场 · 10 秒后补齐空位':'你 + 49 位机器人 · 空降登岛';$('mode-tag').textContent=online?'SOLO':'TRAINING';
  $('difficulty-controls').hidden=online;
  $('online-status').classList.toggle('available',config.multiplayerEnabled===true);
  $('online-status').textContent=!configLoaded?'正在检查联机服务…':config.multiplayerEnabled?'联机服务可用 · 满 50 人立即起飞':'联机服务器待配置 · 机器人模式已开放';
  $('play').disabled=online&&!config.multiplayerEnabled;
  $('play-label').textContent=online?(config.multiplayerEnabled?'加入单人联机':'联机服务器待配置'):'登机出发';
}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{selectedMode=b.dataset.mode;updateMode();});
updateMode();
fetch(new URL('../config.json',import.meta.url),{cache:'no-store',signal:AbortSignal.timeout(5000)}).then(r=>{if(!r.ok)throw new Error();return r.json();}).then(value=>{config={multiplayerEnabled:value.multiplayerEnabled===true,multiplayerUrl:String(value.multiplayerUrl||'/ws')};}).catch(()=>{}).finally(()=>{configLoaded=true;updateMode();});
document.querySelectorAll('[data-difficulty]').forEach(button=>button.onclick=()=>{difficulty=button.dataset.difficulty;document.querySelectorAll('[data-difficulty]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});});
document.querySelectorAll('[data-color]').forEach(button=>button.onclick=()=>{color=button.dataset.color;document.querySelectorAll('[data-color]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});});
function showToast(text,seconds=2){$('toast').textContent=text;toastUntil=performance.now()+seconds*1000;}
function resetInput(){keys.clear();pointer.down=false;touchMove={x:0,y:0};touchAim.active=false;jumpRequested=false;network?.neutral();document.querySelectorAll('.joystick i').forEach(i=>i.style.transform='');}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
function drawFullMap(){
  if(!mapOpen)return;
  const map=$('fullmap'),rect=map.getBoundingClientRect(),scale=Math.min(devicePixelRatio||1,2);
  const size=Math.max(1,Math.round(Math.min(rect.width,rect.height)*scale));
  if(map.width!==size||map.height!==size){map.width=size;map.height=size;}
  renderer.renderMap(state,map,{expanded:true});
  $('map-position').textContent=`你的位置 ${Math.round(state.player.x)} / ${Math.round(state.player.y)}`;
}
function setMap(value){
  mapOpen=!!value&&mode==='playing'&&!paused;
  $('map-overlay').hidden=!mapOpen;$('map-open').setAttribute('aria-expanded',String(mapOpen));
  resetInput();
  if(mapOpen){$('map-hint').textContent=matchMedia('(pointer:coarse)').matches?'对局继续进行 · 点击 × 返回':'对局继续进行 · WASD 可移动';drawFullMap();$('map-close').focus({preventScroll:true});}
  else if(mode==='playing')canvas.focus({preventScroll:true});
}
$('map-open').onclick=()=>setMap(true);$('map-close').onclick=()=>setMap(false);
$('map-overlay').addEventListener('click',event=>{if(event.target===$('map-overlay'))setMap(false);});
function enterBattle(nextState){
  if(!nextState)return;
  state=nextState;mode='playing';paused=false;inventorySignature='';closeDialogs();setMap(false);resetInput();
  previousAmmo=state.player.ammo;previousHP=state.player.hp;
  document.body.classList.add('playing');$('hud').hidden=false;$('player-name').textContent=state.player.name;
  $('connection-badge').textContent=network?'● 单人联机 · 服务器同步':'◇ 机器人练习';
  renderer.resize();canvas.focus({preventScroll:true});updateHUD();
  showToast('选择落点，准备跳伞。',3);
}
function start(){
  closeDialogs();resetInput();network?.close();network=null;save();audioStart();
  const name=$('nickname').value.trim()||'无名旅人';
  if(selectedMode==='practice'){
    const next=createGame({botCount:49,name,difficulty,drop:true});next.player.color=color;enterBattle(next);return;
  }
  if(!config.multiplayerEnabled){showNetworkError('联机服务器尚未部署。机器人练习已开放。');return;}
  mode='matching';queueDeadline=0;$('queue-title').textContent='正在连接运输机…';$('queue-humans').textContent='1';$('queue-timer').textContent='10';$('queue-dialog').showModal();
  const client=new MultiplayerClient({
    onWaiting:message=>{if(client!==network)return;$('queue-title').textContent='幸存者正在集结';$('queue-humans').textContent=message.humans;queueDeadline=performance.now()+Math.max(0,Number(message.remaining)||0)*1000;},
    onStart:next=>{if(client===network)enterBattle(next);},
    onError:message=>{if(client===network)showNetworkError(message);},
  });
  network=client;
  try{client.connect(websocketURL(config.multiplayerUrl),{name,color});}catch{showNetworkError('无法建立安全的联机连接，请检查服务器配置。');}
}
function lobby(){
  network?.close();network=null;closeDialogs();mode='lobby';paused=false;setMap(false);resetInput();
  document.body.classList.remove('playing');$('hud').hidden=true;state=createGame({seed:81604,drop:false,botCount:49});renderer.resize();$('play').focus({preventScroll:true});
}
function showNetworkError(message){lobby();$('network-error').textContent=message;$('network-dialog').showModal();}
function setPause(value){
  if(mode!=='playing')return;paused=value;if(value)setMap(false);resetInput();
  $('pause-title').textContent=network?'战斗仍在继续。':'风暴也等你一会儿。';
  $('pause-description').textContent=network?'联机对局无法暂停。关闭菜单即可继续操作，返回大厅会离开本场对局。':'机器人练习已暂停。';
  if(value&&!$('pause-dialog').open)$('pause-dialog').showModal();
  if(!value){$('pause-dialog').close();canvas.focus({preventScroll:true});}
}
function finish(){
  if(mode!=='playing')return;mode='result';paused=false;setMap(false);resetInput();closeDialogs();
  const won=state.status==='won', place=state.placement||state.player.placement||(won?1:aliveCount(state)+1);
  stats.games++;stats.wins+=Number(won);stats.kills+=state.player.kills||0;stats.best=stats.best?Math.min(stats.best,place):place;save();
  $('result-emblem').textContent=won?'♜':'⌖';$('result-eyebrow').textContent=won?'THE LAST SURVIVOR':'EXPEDITION COMPLETE';
  $('result-title').textContent=won?'这座岛，属于你。':'下一次，走得更远。';$('result-description').textContent=won?'你穿过了风暴，成为最后的幸存者。':'每一次落地，都是新的机会。';
  $('result-place').textContent=`#${place}`;$('result-kills').textContent=state.player.kills||0;$('result-time').textContent=clock(state.time);
  network?.close();network=null;$('result-dialog').showModal();tone(won?640:130,.35,'sine');
}
$('play').onclick=start;$('again').onclick=start;$('back-lobby').onclick=lobby;$('leave').onclick=lobby;$('cancel-queue').onclick=lobby;
$('pause').onclick=()=>setPause(true);$('resume').onclick=()=>setPause(false);
$('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();setPause(false);});
for(const id of ['queue-dialog','result-dialog','network-dialog'])$(id).addEventListener('cancel',e=>{e.preventDefault();lobby();});
$('network-dismiss').onclick=lobby;$('network-practice').onclick=()=>{selectedMode='practice';updateMode();start();};
$('nav-play').onclick=()=>$('play').focus();for(const id of ['guide-open','controls-open'])$(id).onclick=()=>$('guide-dialog').showModal();
document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());document.querySelector('.close-guide').onclick=()=>$('guide-dialog').close();
$('stats-open').onclick=()=>{for(const key of ['games','wins','kills','best'])$('stat-'+key).textContent=stats[key]||(key==='best'?'—':'0');$('stats-dialog').showModal();};
function action(type,slot){
  if(mode!=='playing'||paused)return;
  if(type==='jump'){if(network)network.jump();else jumpRequested=true;return;}
  if(state.player.dropState!=='ground'){showToast('落地后才能使用装备',1);return;}
  if(network){network.action(type,slot);return;}
  if(type==='pickup'){if(pickup(state))tone(450,.09);}
  if(type==='reload'){if(reload(state))showToast('正在换弹…',1);}
  if(type==='heal'){const p=state.player;const used=heal(state);showToast(used?'已使用急救包':p.medkits<=0?'没有急救包了':p.hp>=100?'生命值已满':'急救包正在冷却',1.3);}
  if(type==='switch'){switchWeapon(state,slot);previousAmmo=state.player.ammo;}
  updateHUD();
}
$('heal').onclick=()=>action('heal');$('touch-pickup').onclick=()=>action('pickup');$('touch-reload').onclick=()=>action('reload');$('jump').onclick=()=>action('jump');
document.addEventListener('keydown',e=>{
  if(mode!=='playing'||/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName))return;
  const key=e.key.toLowerCase();
  if(key==='escape'&&!e.repeat){e.preventDefault();if(mapOpen)setMap(false);else setPause(!paused);return;}
  if(paused)return;
  if(key==='m'){e.preventDefault();if(!e.repeat)setMap(!mapOpen);return;}
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))e.preventDefault();keys.add(key);
  if(!e.repeat){if(key===' ')action('jump');if(key==='e')action('pickup');if(key==='r')action('reload');if(key==='q')action('heal');if(/^[123]$/.test(key))action('switch',Number(key)-1);}
});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function point(e){const r=canvas.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;}
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')point(e);});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0&&mode==='playing'&&!paused){point(e);pointer.down=true;canvas.setPointerCapture(e.pointerId);audioStart();}});
canvas.addEventListener('pointerup',()=>pointer.down=false);canvas.addEventListener('pointercancel',()=>pointer.down=false);canvas.addEventListener('contextmenu',e=>e.preventDefault());
function away(){if(mode==='playing'){resetInput();if(!network)setPause(true);}else resetInput();}
window.addEventListener('blur',away);document.addEventListener('visibilitychange',()=>{if(document.hidden)away();});window.addEventListener('resize',()=>{renderer.resize();drawFullMap();});window.addEventListener('pagehide',()=>network?.close());
function setupStick(id,isAim){
  const element=$(id),knob=element.querySelector('i');let activeId=null;
  function update(e){const r=element.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/38,y=(e.clientY-r.top-r.height/2)/38;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}knob.style.transform=`translate(${x*28}px,${y*28}px)`;if(isAim)touchAim={x,y,active:length>.18};else touchMove={x,y};}
  element.addEventListener('pointerdown',e=>{if(activeId!==null)return;activeId=e.pointerId;element.setPointerCapture(e.pointerId);update(e);audioStart();e.preventDefault();});
  element.addEventListener('pointermove',e=>{if(e.pointerId===activeId)update(e);});
  function release(e){if(e.pointerId!==activeId)return;activeId=null;knob.style.transform='';if(isAim)touchAim.active=false;else touchMove={x:0,y:0};}
  for(const event of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(event,release);
}
setupStick('move-stick',false);setupStick('aim-stick',true);
function updateHUD(){
  const p=state.player;if(!p)return;const airborne=p.dropState!=='ground',flight=state.phase==='flight';
  $('alive').textContent=aliveCount(state);$('kills').textContent=p.kills||0;$('hp-number').textContent=Math.ceil(p.hp);$('hp-bar').style.width=`${Math.max(0,p.hp)}%`;$('shield-bar').style.width=`${Math.max(0,Math.min(100,p.shield))}%`;
  $('ammo').textContent=airborne?'—':p.reloading>0?'··':p.ammo;$('reserve').textContent=`/ ${p.reserve}`;$('weapon-name').textContent=p.reloading>0?`换弹 ${p.reloading.toFixed(1)}s`:WEAPONS[p.weapon]?.name||'未装备';$('medkits').textContent=p.medkits;
  const quality=rarity(p.rarity);$('weapon-quality').textContent=quality.name;$('weapon-quality').style.color=quality.color;
  const danger=!flight&&!airborne&&Math.hypot(p.x-state.zone.x,p.y-state.zone.y)>state.zone.radius;
  $('zone-box').classList.toggle('danger',danger);$('zone-label').textContent=flight?(airborne?'运输机已出发 · 空降阶段':'已落地 · 可以交战'):danger?'离开风暴！持续受到伤害':`第 ${state.zone.phase+1} 阶段 · 安全区`;
  $('zone-time').textContent=clock(flight?(state.drop?.remaining||0):state.zone.remaining);
  $('flight-panel').hidden=!airborne;$('jump').hidden=p.dropState!=='plane';$('altitude-bar').style.width=`${(p.altitude||0)*100}%`;
  $('flight-title').textContent=p.dropState==='plane'?'选择你的落点':'降落伞已展开';
  $('flight-description').textContent=p.dropState==='plane'?'空格跳伞 · M 查看全图':'WASD 调整落点 · 落地即可交战';
  const sig=p.inventory.map(item=>item?`${item.weapon}:${item.rarity}`:'empty').join(',')+':'+p.slot;
  if(sig!==inventorySignature){
    inventorySignature=sig;const fragment=document.createDocumentFragment();
    for(let i=0;i<3;i++){
      const item=p.inventory[i],q=rarity(item?.rarity),b=document.createElement('button');b.className='weapon-slot'+(i===p.slot?' active':'')+(!item?' empty':'');b.style.setProperty('--rarity',q.color);
      const number=document.createElement('small');number.textContent=i+1;b.append(number);
      const art=document.createElement('span');art.className='slot-art';if(item)art.innerHTML=weaponSVG(item.weapon,item.rarity);else art.textContent='＋';b.append(art);
      const title=document.createElement('span');title.className='slot-name';title.textContent=item?WEAPONS[item.weapon].name:'空位';b.append(title);
      if(item){const badge=document.createElement('span');badge.className='rarity-tag';badge.textContent=q.name;b.append(badge);}
      b.setAttribute('aria-pressed',String(i===p.slot));b.setAttribute('aria-label',`${i+1}号武器 ${item?q.name+' ':''}${title.textContent}`);b.onclick=()=>action('switch',i);fragment.append(b);
    }$('inventory').replaceChildren(fragment);
  }
  const near=airborne?null:describeNearby(state);$('nearby').hidden=!near;
  if(near){$('nearby').replaceChildren();const k=document.createElement('kbd');k.textContent=matchMedia('(pointer:coarse)').matches?'拾取':'E';$('nearby').append(k,document.createTextNode(near.label||'拾取物资'));$('nearby').style.borderColor=near.type==='weapon'?rarity(near.rarity).color:'';}
  const events=(state.events||[]).filter(e=>state.time-e.time<7).slice(0,4);$('feed').replaceChildren(...events.map(e=>{const div=document.createElement('div');div.textContent=e.text;return div;}));
  drawFullMap();
}
let arsenalCategory='全部', arsenalQuality='rare';
function renderArsenal(){
  const quality=rarity(arsenalQuality);
  const choices=WEAPONS.map((weapon,index)=>({weapon,index})).filter(({weapon})=>arsenalCategory==='全部'||weapon.category===arsenalCategory);
  $('arsenal-count').textContent=`${choices.length} / ${WEAPONS.length} 款`;
  $('weapon-gallery').replaceChildren(...choices.map(({weapon,index})=>{
    const skin=WEAPON_SKINS[index],card=document.createElement('article');card.className='weapon-card';card.style.setProperty('--rarity',quality.color);
    const meta=document.createElement('div');meta.className='weapon-meta';
    const number=document.createElement('b');number.textContent=String(index+1).padStart(2,'0');
    const category=document.createElement('span');category.textContent=weapon.category||'武器';meta.append(number,category);
    const art=document.createElement('div');art.className='weapon-display';art.innerHTML=weaponSVG(index,arsenalQuality);
    const heading=document.createElement('h3');heading.textContent=weapon.name;
    const finish=document.createElement('p');finish.className='weapon-finish';finish.textContent=skin?.name||weapon.skinName;
    const role=document.createElement('p');role.className='weapon-role';role.textContent=weapon.role||skin?.finish||'搜集装备，选择适合你的打法。';
    const details=document.createElement('dl');details.className='weapon-specs';
    const damage=Math.round(weapon.damage*quality.damageMultiplier*10)/10;
    const range=weapon.range<500?'近距离':weapon.range<700?'中近距离':weapon.range<950?'中距离':weapon.range<1200?'中远距离':'远距离';
    for(const [label,value] of [['单发伤害',weapon.pellets>1?`${damage} × ${weapon.pellets}`:String(damage)],['弹匣',`${weapon.magazine} 发`],['装填',`${weapon.reloadTime} 秒`],['射程',range]]){
      const row=document.createElement('div'),term=document.createElement('dt'),description=document.createElement('dd');term.textContent=label;description.textContent=value;row.append(term,description);details.append(row);
    }
    card.append(meta,art,heading,finish,role,details);return card;
  }));
  document.querySelectorAll('[data-arsenal-category]').forEach(button=>{const active=button.dataset.arsenalCategory===arsenalCategory;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});
  document.querySelectorAll('[data-arsenal-quality]').forEach(button=>{const active=button.dataset.arsenalQuality===arsenalQuality;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});
}
function fillArsenal(){
  $('hero-weapons').innerHTML=[7,8,13].filter(index=>WEAPONS[index]).map((index,i)=>`<span style="--rarity:${RARITIES[i+2].color}">${weaponSVG(index,RARITIES[i+2].id)}</span>`).join('');
  $('weapon-total').textContent=`探索全部 ${WEAPONS.length} 款武器 ↗`;
  $('arsenal-filters').replaceChildren(...['全部',...new Set(WEAPONS.map(weapon=>weapon.category||'武器'))].map(category=>{
    const button=document.createElement('button');button.dataset.arsenalCategory=category;button.textContent=category;button.onclick=()=>{arsenalCategory=category;renderArsenal();};return button;
  }));
  $('rarity-legend').replaceChildren(...RARITIES.map(quality=>{
    const button=document.createElement('button');button.style.setProperty('--rarity',quality.color);button.dataset.arsenalQuality=quality.id;button.textContent=quality.name;button.setAttribute('aria-label',`预览${quality.name}品质`);button.onclick=()=>{arsenalQuality=quality.id;renderArsenal();};return button;
  }));
  renderArsenal();
}
fillArsenal();for(const id of ['arsenal-open','armory-preview'])$(id).onclick=()=>$('arsenal-dialog').showModal();
function shotSound(){
  const weapon=WEAPONS[state.player.weapon],category=weapon.category;
  const frequency=weapon.id==='suppressed'?320:category==='霰弹枪'?90:category==='狙击枪'?75:category==='机枪'?125:category==='冲锋枪'?235:category==='手枪'?155:185;
  tone(frequency,category==='狙击枪'?.11:category==='霰弹枪'?.085:.045,weapon.id==='suppressed'?'triangle':'sawtooth',weapon.id==='suppressed'?.008:.018);
}
function input(){
  if(paused||document.hidden)return{moveX:0,moveY:0,angle:state.player.angle,shoot:false,sprint:false,jump:false};
  const aim=renderer.screenToWorld(pointer.x,pointer.y);
  return{moveX:Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'))+touchMove.x,moveY:Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'))+touchMove.y,angle:touchAim.active?Math.atan2(touchAim.y,touchAim.x):Math.atan2(aim.y-state.player.y,aim.x-state.player.x),shoot:!mapOpen&&(pointer.down||touchAim.active),sprint:keys.has('shift'),jump:jumpRequested};
}
function frame(now){
  const dt=Math.min((now-lastTime)/1000||0,.05);lastTime=now;
  if(mode==='playing'){
    if(network){network.setInput(input());const next=network.sample(now);if(next)state=next;}
    else if(!paused)updateGame(state,dt,input());
    jumpRequested=false;
    if(state.player.ammo<previousAmmo)shotSound();if(state.player.hp<previousHP)tone(70,.08,'sine',.06);
    previousAmmo=state.player.ammo;previousHP=state.player.hp;
    if(state.status==='won'||state.status==='lost')finish();
  }
  renderer.render(state,{lobby:mode==='lobby'||mode==='matching',mouseX:pointer.x,mouseY:pointer.y});
  if((mode==='playing'||mode==='result')&&now-uiTime>90){updateHUD();uiTime=now;}
  if(mode==='matching'&&queueDeadline)$('queue-timer').textContent=Math.max(0,Math.ceil((queueDeadline-now)/1000));
  if(now>toastUntil&&$('toast').textContent)$('toast').textContent='';requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
