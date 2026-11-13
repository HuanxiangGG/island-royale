import { WEAPONS } from './game.js';
import { drawWeapon, rarityColor } from './weapon-art.js';

const TAU = Math.PI * 2;
const colors = { grass: '#adc58b', grassDark: '#89aa73', sand: '#e2d6b0', ink: '#29483b', water: '#82baaf' };

function circle(ctx, x, y, r, fill, stroke, width = 1) {
  ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = width; ctx.strokeStyle = stroke; ctx.stroke(); }
}

function rounded(ctx, x, y, w, h, radius, fill, stroke, width = 1) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = width; ctx.strokeStyle = stroke; ctx.stroke(); }
}

function path(ctx, points, fill, stroke, width = 1) {
  ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = width; ctx.strokeStyle = stroke; ctx.stroke(); }
}

function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

const REGION_NAMES = ['杉林哨站','北岸农场','晨雾山庄','西风营地','绿洲小镇','红岩工坊','潮汐码头','南野牧场','落日别院'];
const REGION_PALETTES = ['#9eb985','#b6c38a','#a7bd8c','#a0b98a','#adc58a','#b9bd89','#a6c194','#b8c58b','#b0bf88'];
const BUILDING_STYLES = {
  cottage:{roof:'#b8785b',light:'#d9a17a',dark:'#8d624d',floor:'#d8c5a0',wall:'#eee1c1',accent:'#799d85'},
  villa:{roof:'#638c83',light:'#8cb1a0',dark:'#486e65',floor:'#ded3b5',wall:'#eee8d2',accent:'#b3bf86'},
  workshop:{roof:'#8e9d9b',light:'#bdc9bd',dark:'#657b78',floor:'#c1c4b0',wall:'#d9ddc7',accent:'#d2ac65'},
  barn:{roof:'#b56d5c',light:'#d58b6d',dark:'#865345',floor:'#c3a881',wall:'#e8cdb0',accent:'#dec183'},
  store:{roof:'#ddd6b8',light:'#f1e9ce',dark:'#acb49a',floor:'#d7d6bb',wall:'#f0e5c8',accent:'#729b7e'},
  clinic:{roof:'#e3e9d9',light:'#f6f4df',dark:'#a0b3a0',floor:'#d7e2ca',wall:'#eff0de',accent:'#6d9d8a'},
};
const kindFor=b=>BUILDING_STYLES[b.kind]?b.kind:['cottage','barn','workshop'][(b.style||0)%3];
const paletteFor=b=>BUILDING_STYLES[kindFor(b)];

function softBoxShadow(ctx,x,y,w,h,r=5) {
  rounded(ctx,x+5,y+10,w+6,h+7,r+6,'rgba(39,62,42,.06)');
  rounded(ctx,x+7,y+9,w+3,h+3,r+2,'rgba(39,62,42,.08)');
  rounded(ctx,x+7,y+8,w,h,r,'rgba(39,62,42,.1)');
}

function planter(ctx,x,y,w=48,h=17,flowers=true) {
  rounded(ctx,x+2,y+3,w,h,5,'rgba(53,79,44,.12)');rounded(ctx,x,y,w,h,5,'#a08b64','#8a7e5c',1);
  rounded(ctx,x+3,y+3,w-6,h-6,3,'#6d865a');
  for(let k=7;k<w-3;k+=10){circle(ctx,x+k,y+h/2,6,'#7da16c');circle(ctx,x+k-1,y+h/2-2,3.6,'#a2bc7a');if(flowers)circle(ctx,x+k+2,y+h/2-3,2.3,k%3?'#f0d5a2':'#dba59a');}
}

function bed(ctx,x,y,blanket='#8fab98',clinical=false) {
  rounded(ctx,x+2,y+4,43,72,5,'rgba(73,83,59,.1)');rounded(ctx,x,y,43,72,5,clinical?'#a3b5ab':'#a38e68','#7a8a70',1.2);
  rounded(ctx,x+4,y+4,35,64,4,'#eee9cf');rounded(ctx,x+7,y+8,29,14,4,'#fff5db');
  rounded(ctx,x+5,y+29,33,34,2,blanket);rounded(ctx,x+5,y+26,33,8,2,clinical?'#d8ead7':'#d9d9b6');
  ctx.strokeStyle='rgba(248,245,212,.45)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+30,y+36);ctx.lineTo(x+30,y+59);ctx.stroke();
}

function cabinet(ctx,x,y,w,h,fill='#b09a76') {
  rounded(ctx,x,y,w,h,3,fill,'#7d8c73',1.2);rounded(ctx,x+3,y+3,w-6,h-6,2,'rgba(240,228,192,.2)');
  ctx.strokeStyle='rgba(101,114,86,.4)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+w/2,y+3);ctx.lineTo(x+w/2,y+h-3);ctx.stroke();
  circle(ctx,x+w/2-4,y+h/2,1.4,'#667b64');circle(ctx,x+w/2+4,y+h/2,1.4,'#667b64');
}

function crossMark(ctx,x,y,size,color) {
  rounded(ctx,x-size*.18,y-size*.5,size*.36,size,2,color);rounded(ctx,x-size*.5,y-size*.18,size,size*.36,2,color);
}

function regionsFor(state) {
  if (state.regions?.length) return state.regions;
  const size=state.worldSize||8400;
  return REGION_NAMES.map((name,i)=>({id:`region-${i}`,name,x:(1800+i%3*2400)/8400*size,y:(2000+Math.floor(i/3)*2200)/8400*size,style:i%3}));
}

function insideBuilding(actor,building,margin=0) {
  return actor&&Math.abs(actor.x-building.x)<building.w/2+margin&&Math.abs(actor.y-building.y)<building.h/2+margin;
}

function doorway(building) {
  const {x,y,w,h,doorSide='south'}=building;
  return {x:x+(doorSide==='east'?w/2:doorSide==='west'?-w/2:0),y:y+(doorSide==='south'?h/2:doorSide==='north'?-h/2:0)};
}

export class Renderer {
  constructor(canvas, minimapCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.minimap = minimapCanvas;
    this.mctx = minimapCanvas?.getContext('2d');
    this._camera = { x: 1400, y: 1400, zoom: 1 };
    this.width = 1; this.height = 1; this.dpr = 1;
    this.terrain = null; this.lastMode = null; this.lastFrame = 0;
    this.roofOpacity = new Map(); this.mapBase = null; this.regions = [];
    this.resize();
  }

  get camera() { return this._camera; }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width || this.canvas.parentElement?.clientWidth || window.innerWidth);
    this.height = Math.max(1, rect.height || this.canvas.parentElement?.clientHeight || window.innerHeight);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    if (this.minimap) {
      const m = this.minimap.getBoundingClientRect();
      this.miniWidth = m.width || 150; this.miniHeight = m.height || 150;
      this.minimap.width = this.miniWidth * this.dpr;
      this.minimap.height = this.miniHeight * this.dpr;
    }
  }

  screenToWorld(x, y) {
    return { x: this._camera.x + (x - this.width / 2) / this._camera.zoom,
      y: this._camera.y + (y - this.height / 2) / this._camera.zoom };
  }

  makeTerrain(state) {
    const size=state.worldSize||8400, resolution=Math.min(1536,size);
    const c=this.canvas.ownerDocument.createElement('canvas');c.width=resolution;c.height=resolution;
    const ctx=c.getContext('2d');ctx.scale(resolution/size,resolution/size);
    this.regions=regionsFor(state);
    rounded(ctx,0,0,size,size,180,colors.sand);
    rounded(ctx,40,40,size-80,size-80,170,'#c4ce91');
    rounded(ctx,78,78,size-156,size-156,160,colors.grass);
    // Bounded atlas: broad landforms only. Close-up detail is drawn for visible cells.
    for(let i=0;i<this.regions.length;i++) {
      const region=this.regions[i];
      ctx.save();ctx.translate(region.x,region.y);ctx.scale(1.12,.92);ctx.globalAlpha=.65;
      circle(ctx,0,0,size*.17,REGION_PALETTES[i%REGION_PALETTES.length]);ctx.restore();
    }
    for(let i=0;i<390;i++) {
      const x=140+hash(i+40)*(size-280),y=140+hash(i+719)*(size-280);
      ctx.save();ctx.translate(x,y);ctx.rotate(hash(i+340)*TAU);ctx.scale(1,.65);
      circle(ctx,0,0,40+hash(i+420)*145,i%3?'rgba(91,143,78,.09)':'rgba(224,226,159,.16)');ctx.restore();
    }
    this.drawRoads(ctx,size,false);
    this.terrain=c;this.terrainSize=size;this.terrainKey=`${size}:${state.seed}:${this.regions.length}`;this.mapBase=null;this.roofOpacity.clear();
  }

  drawRoads(ctx,size,detailed=true) {
    const regions=this.regions;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    const paths=[];
    for(let row=0;row<3;row++) {
      const list=regions.slice(row*3,row*3+3);if(list.length<3)continue;
      paths.push([[110,list[0].y],[list[0].x,list[0].y],[list[1].x,list[1].y],[list[2].x,list[2].y],[size-110,list[2].y]]);
    }
    for(let col=0;col<3;col++) {
      const list=[regions[col],regions[col+3],regions[col+6]].filter(Boolean);if(list.length<3)continue;
      paths.push([[list[0].x,110],[list[0].x,list[0].y],[list[1].x,list[1].y],[list[2].x,list[2].y],[list[2].x,size-110]]);
    }
    for(const points of paths) {
      ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
      ctx.strokeStyle='#98ae7b';ctx.lineWidth=114;ctx.stroke();ctx.strokeStyle='#d0c69b';ctx.lineWidth=92;ctx.stroke();ctx.strokeStyle='#e0d3ad';ctx.lineWidth=64;ctx.stroke();
      if(detailed){ctx.strokeStyle='rgba(170,153,103,.28)';ctx.lineWidth=2;ctx.setLineDash([16,35]);ctx.stroke();ctx.setLineDash([]);}
    }
    ctx.restore();
  }

  drawGroundDetail(ctx,size) {
    if(this._camera.zoom<.3)return;
    const cell=105,left=Math.max(0,Math.floor(this.view.left/cell)),right=Math.min(Math.ceil(size/cell),Math.ceil(this.view.right/cell));
    const top=Math.max(0,Math.floor(this.view.top/cell)),bottom=Math.min(Math.ceil(size/cell),Math.ceil(this.view.bottom/cell));
    ctx.lineWidth=1.6;
    for(let iy=top;iy<=bottom;iy++)for(let ix=left;ix<=right;ix++) {
      const seed=ix+iy*997,x=ix*cell+hash(seed)*cell,y=iy*cell+hash(seed+315)*cell;
      if(x<85||y<85||x>size-85||y>size-85)continue;
      if(this.regions.some(region=>Math.abs(region.x-x)<58||Math.abs(region.y-y)<58))continue;
      ctx.strokeStyle=hash(seed+8)>.5?'rgba(79,132,62,.3)':'rgba(226,232,168,.55)';
      ctx.beginPath();ctx.moveTo(x-5,y-3);ctx.lineTo(x,y+3);ctx.lineTo(x+5,y-5);ctx.stroke();
      if(seed%13===0){circle(ctx,x+12,y-3,2.2,'#ede5aa');circle(ctx,x+15,y+3,1.8,'#eee7af');}
      if(seed%19===0){circle(ctx,x-15,y+11,3.5,'rgba(112,135,79,.24)');circle(ctx,x-10,y+14,2,'rgba(112,135,79,.18)');}
    }
  }

  render(state, { lobby = false, mouseX = 0, mouseY = 0 } = {}) {
    if (!state?.player) return;
    const ctx = this.ctx, now = performance.now() / 1000;
    const dt = Math.min(.08, this.lastFrame ? now - this.lastFrame : .016); this.lastFrame = now;
    const size = state.worldSize || 8400;
    const terrainKey=`${size}:${state.seed}:${regionsFor(state).length}`;
    if (!this.terrain || this.terrainKey !== terrainKey) this.makeTerrain(state);
    const airborne = state.player.dropState === 'plane' || state.player.dropState === 'falling';
    const altitude = airborne ? Math.max(0,Math.min(1,state.player.altitude ?? 1)) : 0;
    const groundZoom = Math.max(.65, Math.min(1.08, this.width / 1150));
    const flightZoom = state.player.dropState === 'plane' ? .5 : groundZoom * (1 - altitude * .36);
    const targetZoom = lobby ? Math.max(.32, Math.min(.56, this.width / 2600)) : airborne ? flightZoom : groundZoom;
    const targetX = lobby ? size / 2 + Math.sin(now * .045) * 70 : state.player.x;
    const targetY = lobby ? size / 2 - 110 + Math.cos(now * .04) * 50 : state.player.y - altitude * 90;
    if (this.lastMode !== lobby) { this._camera = { x: targetX, y: targetY, zoom: targetZoom }; this.lastMode = lobby; }
    const ease = 1 - Math.exp(-9 * dt);
    this._camera.x += (targetX - this._camera.x) * ease;
    this._camera.y += (targetY - this._camera.y) * ease;
    this._camera.zoom += (targetZoom - this._camera.zoom) * (1 - Math.exp(-2.4 * dt));
    const { x, y, zoom } = this._camera;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = colors.water; ctx.fillRect(0, 0, this.width, this.height);
    ctx.save(); ctx.translate(this.width / 2, this.height / 2); ctx.scale(zoom, zoom); ctx.translate(-x, -y);
    this.view = { left: x - this.width / 2 / zoom - 160, top: y - this.height / 2 / zoom - 160,
      right: x + this.width / 2 / zoom + 160, bottom: y + this.height / 2 / zoom + 160 };
    this.drawWater(ctx, size, now);
    ctx.drawImage(this.terrain, 0, 0, size, size);
    this.drawRoads(ctx,size);
    this.drawGroundDetail(ctx,size);
    this.drawLocations(ctx, lobby);
    const buildings=(state.buildings||[]).filter(building=>this.visible(building));
    for(const building of buildings)this.drawBuildingFloor(ctx,building);
    for (const item of state.loot || []) if (item.alive !== false && this.visible(item)) this.drawLoot(ctx, item, now);
    const solid = (state.obstacles || []).filter(o => o.alive !== false && this.visible(o));
    for (const o of solid) if (o.type !== 'tree') this.drawObstacle(ctx, o);
    for (const a of state.actors || [state.player]) if (a.alive && this.visible(a) && (lobby || !a.dropState || a.dropState === 'ground')) this.drawActor(ctx, a, now, lobby);
    for (const b of state.bullets || []) {
      ctx.beginPath(); ctx.moveTo(b.px ?? b.x - b.vx * .016, b.py ?? b.y - b.vy * .016); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = b.owner === state.player.id ? '#fff6b6' : '#ffd49c'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
      circle(ctx, b.x, b.y, 2, '#fffde1');
    }
    for (const o of solid) if (o.type === 'tree') {
      ctx.save(); if (Math.hypot(o.x - state.player.x, o.y - state.player.y) < (o.w || 70) * .75) ctx.globalAlpha = .45;
      this.drawObstacle(ctx, o); ctx.restore();
    }
    for(const building of buildings) {
      const revealed=!lobby&&state.player.dropState==='ground'&&insideBuilding(state.player,building);
      const target=revealed?.035:1,previous=this.roofOpacity.get(building.id)??target;
      const opacity=previous+(target-previous)*(1-Math.exp(-10*dt));this.roofOpacity.set(building.id,opacity);
      this.drawBuildingRoof(ctx,building,opacity);
    }
    if (!lobby) {
      for (const a of state.actors || []) if (a.alive && a.dropState === 'falling' && this.visible(a)) this.drawParachutist(ctx,a,now);
      if (state.phase === 'flight' && state.drop?.plane) this.drawPlane(ctx,state.drop.plane,now);
    }
    for (const p of state.particles || []) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / (p.maxLife || .5)));
      circle(ctx, p.x, p.y, p.size || 3, p.color || '#fff3c8');
    }
    ctx.globalAlpha = 1;
    if (!lobby && state.zone) this.drawStorm(ctx, state.zone, size, now);
    ctx.restore();
    if (!lobby) {
      const vignette = ctx.createRadialGradient(this.width / 2, this.height / 2, this.height * .15, this.width / 2, this.height / 2, this.width * .7);
      vignette.addColorStop(0, 'rgba(17, 42, 32, 0)'); vignette.addColorStop(1, 'rgba(17, 42, 32, .18)');
      ctx.fillStyle = vignette; ctx.fillRect(0, 0, this.width, this.height);
      if (state.player.hp < 30 && state.player.alive) {
        ctx.strokeStyle = `rgba(198, 66, 53, ${.25 + Math.sin(now * 5) * .08})`; ctx.lineWidth = 18; ctx.strokeRect(0, 0, this.width, this.height);
      }
      this.drawMinimap(state);
    }
  }

  visible(o) {
    const x=o.w?o.w/2:0,y=o.h?o.h/2:0;
    return o.x+x>this.view.left&&o.x-x<this.view.right&&o.y+y>this.view.top&&o.y-y<this.view.bottom;
  }

  drawWater(ctx, size, t) {
    rounded(ctx, -44, -44, size + 88, size + 88, 190, '#97c8b9');
    rounded(ctx, -20, -20, size + 40, size + 40, 165, '#c0dbc3');
    ctx.strokeStyle = '#c4e0ce'; ctx.lineWidth = 2;
    for (let i = 0; i < 75; i++) {
      const side = i % 4, k = hash(i + 2), along = k * (size + 400) - 200;
      const away = 60 + hash(i + 700) * 280;
      const x = side === 0 ? -away : side === 1 ? size + away : along;
      const y = side === 2 ? -away : side === 3 ? size + away : along;
      const shift = Math.sin(t * .6 + i) * 6;
      ctx.globalAlpha = .15 + hash(i + 34) * .4;
      ctx.beginPath(); ctx.moveTo(x - 12 + shift, y); ctx.quadraticCurveTo(x, y + 5, x + 12 + shift, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  drawLocations(ctx, lobby) {
    ctx.save();ctx.textAlign='center';ctx.font='600 28px system-ui,sans-serif';ctx.fillStyle='rgba(55,84,51,.26)';
    for(const region of this.regions)if(this.visible({x:region.x,y:region.y-530,w:600,h:50}))ctx.fillText(region.name.split('').join('  '),region.x,region.y-530);
    if(lobby){ctx.font='500 15px ui-monospace,monospace';ctx.fillText('— THE GREEN ISLAND —',this.terrainSize/2,this.terrainSize/2-650);}
    ctx.restore();
  }

  drawBuildingFloor(ctx,b) {
    const palette=paletteFor(b),kind=kindFor(b),{w,h}=b;
    ctx.save();ctx.translate(b.x,b.y);
    const entry=doorway({...b,x:0,y:0}),region=this.regions.find(r=>r.name===b.name),horizontalEntry=['east','west'].includes(b.doorSide);
    if(region) {
      ctx.beginPath();ctx.moveTo(entry.x,entry.y);ctx.lineTo(horizontalEntry?region.x-b.x:entry.x,horizontalEntry?entry.y:region.y-b.y);
      ctx.lineCap='round';ctx.lineWidth=38;ctx.strokeStyle='#c6c49a';ctx.stroke();ctx.lineWidth=26;ctx.strokeStyle='#dfd3ac';ctx.stroke();
      ctx.setLineDash([3,20]);ctx.lineWidth=12;ctx.strokeStyle='#c0bb94';ctx.stroke();ctx.setLineDash([]);
    }
    // Courtyard stone, a real open doorway and shallow steps establish the footprint.
    rounded(ctx,-w/2-17,-h/2-17,w+34,h+34,12,'#b6b98c');
    rounded(ctx,-w/2-11,-h/2-11,w+22,h+22,8,'#d3cfaa');
    ctx.strokeStyle='rgba(124,132,93,.19)';ctx.lineWidth=1;
    for(let x=-w/2-5;x<w/2+10;x+=25){ctx.beginPath();ctx.moveTo(x,-h/2-10);ctx.lineTo(x,-h/2);ctx.moveTo(x,h/2);ctx.lineTo(x,h/2+10);ctx.stroke();}
    // Flowerbeds are low ground planting, not additional walls or collision objects.
    planter(ctx,-w/2-8,-h/2-31,65,16,kind!=='workshop');
    planter(ctx,w/2-62,h/2+15,64,16,kind!=='barn');
    rounded(ctx,-w/2+7,-h/2+7,w-14,h-14,3,palette.floor);
    ctx.save();ctx.beginPath();ctx.rect(-w/2+12,-h/2+12,w-24,h-24);ctx.clip();
    const tile=['clinic','store','workshop'].includes(kind);
    if(tile) {
      for(let x=-w/2;x<w/2;x+=28)for(let y=-h/2;y<h/2;y+=28){
        ctx.fillStyle=(Math.floor(x/28)+Math.floor(y/28))%2?palette.floor:kind==='clinic'?'#e6ecd8':'#c9cbb2';ctx.fillRect(x,y,28,28);
      }
      ctx.strokeStyle='rgba(248,245,220,.35)';ctx.lineWidth=1;
      for(let x=-w/2;x<w/2;x+=28){ctx.beginPath();ctx.moveTo(x,-h/2);ctx.lineTo(x,h/2);ctx.stroke();}
    } else {
      ctx.strokeStyle='rgba(122,98,65,.16)';ctx.lineWidth=1;
      for(let y=-h/2+15;y<h/2;y+=18){ctx.beginPath();ctx.moveTo(-w/2,y);ctx.lineTo(w/2,y);ctx.stroke();}
      for(let x=-w/2+25;x<w/2;x+=57)for(let y=-h/2+15;y<h/2;y+=36){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+18);ctx.stroke();}
    }
    const lx=-w/2+22,rx=w/2-67,ty=-h/2+23,by=h/2-68;
    if(kind==='cottage') {
      bed(ctx,rx,ty,'#91ac95');cabinet(ctx,lx,ty,76,38,'#b6a382');
      rounded(ctx,lx+7,ty+6,25,25,4,'#dbe0c5','#839782',1);rounded(ctx,lx+12,ty+11,15,15,3,'#97b2a3');
      for(const dx of [49,65])circle(ctx,lx+dx,ty+18,6,'#667c6c','#d3d7b7',2);
      rounded(ctx,-38,27,76,43,5,'#bd997e');rounded(ctx,-33,32,66,33,3,null,'#ddc5a0',2);
      for(let k=-27;k<30;k+=9){ctx.strokeStyle='#c8b28c';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(k,36);ctx.lineTo(k,61);ctx.stroke();}
      cabinet(ctx,lx,by+10,42,31,'#b4b58f');circle(ctx,lx+18,by+26,10,'#e5dfb9');
    } else if(kind==='villa') {
      rounded(ctx,-44,-18,88,81,6,'#b9c6aa');rounded(ctx,-38,-12,76,69,4,null,'#e2debd',2);
      rounded(ctx,lx,ty,72,30,8,'#8caa98','#6c8874',1);rounded(ctx,lx+5,ty+4,62,19,5,'#b6c9ac');
      for(const dx of [7,29,51])rounded(ctx,lx+dx,ty+6,17,13,4,dx===29?'#e1caa6':'#cad5b7');
      bed(ctx,rx,ty,'#a4b9a4');cabinet(ctx,rx-5,by+8,48,30,'#c4baa0');
      circle(ctx,0,18,22,'#b4a586','#8c977a',1.5);circle(ctx,-5,14,6,'#dce1c3');circle(ctx,6,23,5,'#d4b38c');
      rounded(ctx,lx,by+5,57,24,7,'#94ae95');rounded(ctx,lx+5,by+9,47,12,4,'#c3d0af');
    } else if(kind==='workshop') {
      cabinet(ctx,lx,ty,88,42,'#aa916a');rounded(ctx,lx+3,ty+3,82,9,2,'#756e55');
      for(let i=0;i<5;i++){ctx.strokeStyle=i%2?'#c0c9aa':'#536f65';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(lx+13+i*14,ty+15);ctx.lineTo(lx+8+i*14,ty+29);ctx.stroke();}
      rounded(ctx,lx+10,ty+28,23,8,2,'#647a70');circle(ctx,lx+65,ty+24,9,null,'#718676',3);
      cabinet(ctx,rx,ty,44,67,'#91a69a');for(let i=0;i<3;i++)rounded(ctx,rx+6,ty+7+i*18,32,12,2,['#bbbd91','#a6baa2','#aabfc0'][i]);
      rounded(ctx,lx,by,68,45,3,'#a7aa8d');ctx.setLineDash([8,6]);rounded(ctx,lx-4,by-4,76,53,3,null,'#d6bc77',2);ctx.setLineDash([]);
      for(let i=0;i<3;i++)circle(ctx,lx+13+i*20,by+23,8,'#778b7b','#9dac91',2);
    } else if(kind==='barn') {
      const hay=(x,y)=>{rounded(ctx,x,y,60,43,7,'#d7bc7b','#ac955e',1.4);ctx.strokeStyle='#ead49b';ctx.lineWidth=1;for(let k=6;k<38;k+=6){ctx.beginPath();ctx.moveTo(x+5,y+k);ctx.lineTo(x+55,y+k-2);ctx.stroke();}rounded(ctx,x+14,y,5,43,1,'#a99568');rounded(ctx,x+42,y,4,43,1,'#a99568');};
      hay(lx,ty);hay(lx+5,by+6);
      for(const [dx,dy] of [[11,12],[37,12],[24,40]]){circle(ctx,rx+dx,ty+dy,13,'#a58d64','#7a7957',2);circle(ctx,rx+dx,ty+dy,9,null,'#c3ad77',1);ctx.strokeStyle='#7c805e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(rx+dx-9,ty+dy);ctx.lineTo(rx+dx+9,ty+dy);ctx.stroke();}
      for(let i=0;i<25;i++){const x=-w*.3+hash(i+17)*w*.6,y=-h*.2+hash(i+53)*h*.55;ctx.strokeStyle='rgba(226,206,147,.65)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+6,y-2);ctx.stroke();}
    } else if(kind==='store') {
      cabinet(ctx,lx,ty,77,43,'#a3b497');
      for(let i=0;i<8;i++)rounded(ctx,lx+6+i%4*17,ty+5+Math.floor(i/4)*18,12,14,2,['#dbb27d','#c7d7ab','#a6c2b7','#d3a696'][i%4]);
      cabinet(ctx,rx-7,ty,52,49,'#bba98a');rounded(ctx,rx+4,ty+8,27,22,3,'#6d8477');rounded(ctx,rx+8,ty+12,19,12,1,'#c2ddbd');
      cabinet(ctx,lx,by+5,69,37,'#b1bd9c');for(let i=0;i<3;i++){circle(ctx,lx+13+i*21,by+23,8,'#d5ba89','#a69c75',1);circle(ctx,lx+13+i*21,by+20,3,'#e6d4a7');}
      rounded(ctx,-28,-8,56,66,3,'rgba(237,228,196,.55)');ctx.strokeStyle='#a3b49a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-15,18);ctx.lineTo(0,32);ctx.lineTo(15,18);ctx.stroke();
    } else {
      bed(ctx,lx+2,ty,'#91b5a2',true);bed(ctx,rx,ty,'#91b5a2',true);
      cabinet(ctx,lx,by+10,58,32,'#b1c8b2');crossMark(ctx,lx+28,by+26,17,'#719e88');
      cabinet(ctx,rx-8,by+12,55,29,'#c6cfb8');rounded(ctx,rx+2,by+17,19,14,2,'#f0eddb');circle(ctx,rx+32,by+25,6,'#91b4a0');
      crossMark(ctx,0,21,31,'rgba(111,160,137,.22)');
    }
    ctx.restore();
    const door=doorway({...b,x:0,y:0}),rotation={north:Math.PI,south:0,east:-Math.PI/2,west:Math.PI/2}[b.doorSide||'south'];
    ctx.save();ctx.translate(door.x,door.y);ctx.rotate(rotation);
    for(let i=2;i>=0;i--)rounded(ctx,-((b.doorWidth||110)+14+i*8)/2,5+i*9,(b.doorWidth||110)+14+i*8,10,2,['#dcd6b5','#c6c5a3','#b7bc99'][i],'rgba(137,149,109,.35)',1);
    rounded(ctx,-36,-10,72,20,2,kind==='clinic'?'#96b7a0':kind==='store'?'#a4b491':'#b4a278');
    for(let x=-29;x<32;x+=8){ctx.strokeStyle='rgba(242,230,189,.45)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,-7);ctx.lineTo(x,7);ctx.stroke();}
    ctx.restore();ctx.restore();
  }

  drawBuildingRoof(ctx,b,opacity) {
    if(opacity<.04)return;
    const p=paletteFor(b),kind=kindFor(b),{w,h}=b,l=-w/2,t=-h/2;
    ctx.save();ctx.translate(b.x,b.y);ctx.globalAlpha=opacity;
    softBoxShadow(ctx,l-9,t-8,w+18,h+20,8);
    // A visible wall fascia, framed windows and eaves give each roof actual depth.
    rounded(ctx,l-3,t-1,w+6,h+16,6,p.wall,'#97a181',1.5);
    rounded(ctx,l-3,h/2+1,w+6,12,3,kind==='barn'?'#b57b62':p.wall);
    for(const x of [-w*.29,w*.28]) {
      if(b.doorSide==='south'&&Math.abs(x)<b.doorWidth/2+20)continue;
      rounded(ctx,x-20,h/2+2,40,8,2,'#789f93','#d9dcc0',2);
      ctx.strokeStyle='#e7e5c8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,h/2+3);ctx.lineTo(x,h/2+9);ctx.stroke();
    }
    const x=l-8,y=t-9,rw=w+16,rh=h+18;
    rounded(ctx,x,y,rw,rh,5,p.dark);
    if(kind==='cottage') {
      // Hipped clay roof: four tapered planes, a dormer and brick chimney.
      const ridgeX=w*.08,ridgeTop=y+rh*.23,ridgeBottom=y+rh*.77;
      path(ctx,[[x,y],[ridgeX,ridgeTop],[ridgeX,ridgeBottom],[x,y+rh]],p.light);
      path(ctx,[[x+rw,y],[ridgeX,ridgeTop],[ridgeX,ridgeBottom],[x+rw,y+rh]],p.roof);
      path(ctx,[[x,y],[x+rw,y],[ridgeX,ridgeTop]],'#e2ae83');
      path(ctx,[[x,y+rh],[x+rw,y+rh],[ridgeX,ridgeBottom]],p.dark);
      ctx.strokeStyle='rgba(119,78,52,.22)';ctx.lineWidth=1.2;
      for(let k=18;k<rh;k+=18){ctx.beginPath();ctx.moveTo(x+4,y+k);ctx.lineTo(ridgeX-3,y+k*.56+rh*.22);ctx.stroke();}
      rounded(ctx,ridgeX-4,ridgeTop-5,8,ridgeBottom-ridgeTop+10,3,'#dfad83');
      softBoxShadow(ctx,-w*.34,-17,58,48,3);rounded(ctx,-w*.34,-17,58,48,3,'#e5d7b7','#987d60',1.5);
      rounded(ctx,-w*.34+8,-8,42,25,2,'#779f97','#f0e5c6',2);ctx.strokeStyle='#d3d9be';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-w*.34+29,-7);ctx.lineTo(-w*.34+29,16);ctx.stroke();
      path(ctx,[[-w*.34-5,-17],[-w*.34+29,-38],[-w*.34+63,-17]],'#c78b67','#a47457',1.5);
      rounded(ctx,w*.25,-h*.28,29,35,2,'#9a7158','#876e54',1);rounded(ctx,w*.25-3,-h*.28-4,35,13,2,'#cfb490');rounded(ctx,w*.25+3,-h*.28,23,6,1,'#6e6953');
    } else if(kind==='villa') {
      // Interlocking roof wings and a raised timber terrace create an asymmetric villa.
      rounded(ctx,x+3,y+3,rw-6,rh-6,3,'#dbd6b7');
      const mainW=rw*.66;
      path(ctx,[[x,y],[x+mainW,y],[x+mainW,y+rh],[x,y+rh]],p.roof);
      path(ctx,[[x,y],[x+mainW*.5,y+25],[x+mainW*.5,y+rh-20],[x,y+rh]],p.light);
      path(ctx,[[x,y],[x+mainW,y],[x+mainW*.5,y+25]],'#a5c0a7');
      path(ctx,[[x,y+rh],[x+mainW,y+rh],[x+mainW*.5,y+rh-20]],p.dark);
      rounded(ctx,x+mainW*.5-4,y+21,8,rh-36,3,'#9cbdab');
      const wingX=x+mainW*.7,wingY=y+13,wingW=rw-mainW*.7;
      softBoxShadow(ctx,wingX,wingY,wingW,rh*.56,2);rounded(ctx,wingX,wingY,wingW,rh*.56,2,p.roof,p.dark,1.5);
      path(ctx,[[wingX,wingY],[wingX+wingW,wingY],[wingX+wingW,wingY+rh*.26],[wingX,wingY+rh*.26]],p.light);
      rounded(ctx,wingX-3,wingY+rh*.26-3,wingW+6,6,2,'#b2c8ac');
      ctx.strokeStyle='rgba(62,102,84,.24)';ctx.lineWidth=1;for(let k=14;k<wingW;k+=14){ctx.beginPath();ctx.moveTo(wingX+k,wingY+4);ctx.lineTo(wingX+k,wingY+rh*.53);ctx.stroke();}
      const tx=x+mainW+7,ty=y+rh*.65,tw=rw-mainW-14,th=rh*.29;
      rounded(ctx,tx,ty,tw,th,3,'#cbb58b');ctx.strokeStyle='#a89572';ctx.lineWidth=1;for(let k=8;k<th;k+=10){ctx.beginPath();ctx.moveTo(tx+3,ty+k);ctx.lineTo(tx+tw-3,ty+k);ctx.stroke();}
      planter(ctx,tx+3,ty+th-19,Math.max(32,tw-6),14);
      circle(ctx,tx+tw/2,ty+th*.36,12,'#eee2ba','#b5aa83',1);circle(ctx,tx+tw/2,ty+th*.36,3,'#b9ba8c');
      for(let k=7;k<tw;k+=15)rounded(ctx,tx+k,ty-3,4,th*.7,1,'#bba67d');
    } else if(kind==='workshop') {
      // Three sawtooth bays have distinct northlight strips rather than a flat slab.
      const band=rh/3;
      for(let i=0;i<3;i++) {
        const by=y+i*band;
        path(ctx,[[x+3,by+3],[x+rw-3,by+3],[x+rw-3,by+band-13],[x+3,by+band-13]],i===1?'#9eaca4':p.light);
        path(ctx,[[x+3,by+band-13],[x+rw-3,by+band-13],[x+rw-3,by+band],[x+3,by+band]],p.dark);
        rounded(ctx,x+12,by+band-18,rw-24,8,1,'#8bb5ad','#c8dac2',1.2);
        ctx.strokeStyle='rgba(88,114,100,.3)';ctx.lineWidth=1;for(let k=20;k<rw-10;k+=19){ctx.beginPath();ctx.moveTo(x+k,by+6);ctx.lineTo(x+k,by+band-21);ctx.stroke();}
        rounded(ctx,x+1,by,4,band,1,'#dce0c7');rounded(ctx,x+rw-5,by,4,band,1,'#c2ccb7');
      }
      for(const [cx,cy] of [[-w*.24,-h*.28],[w*.26,h*.29]]) {softBoxShadow(ctx,cx-16,cy-16,32,32,5);circle(ctx,cx,cy,17,'#718b7e','#d5ddc3',3);circle(ctx,cx,cy,11,'#a2b7a2');ctx.strokeStyle='#698476';ctx.lineWidth=3;for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo(cx-7,cy-5+k*5);ctx.lineTo(cx+7,cy-5+k*5);ctx.stroke();}}
      rounded(ctx,w*.29,-h*.27,25,34,2,'#d2b978','#9c9c72',1);ctx.strokeStyle='#9c986e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(w*.29+5,-h*.27+7);ctx.lineTo(w*.29+20,-h*.27+27);ctx.stroke();
    } else if(kind==='barn') {
      // A steep gambrel roof, central cupola and red timber verge identify the barn.
      const bx=x+rw*.2,cx=x+rw*.5,dx=x+rw*.8;
      path(ctx,[[x,y],[bx,y],[bx,y+rh],[x,y+rh]],p.dark);
      path(ctx,[[bx,y],[cx,y],[cx,y+rh],[bx,y+rh]],p.light);
      path(ctx,[[cx,y],[dx,y],[dx,y+rh],[cx,y+rh]],p.roof);
      path(ctx,[[dx,y],[x+rw,y],[x+rw,y+rh],[dx,y+rh]],'#985e4e');
      ctx.strokeStyle='rgba(106,65,47,.25)';ctx.lineWidth=1.2;for(let k=12;k<rh;k+=16){ctx.beginPath();ctx.moveTo(x+3,y+k);ctx.lineTo(x+rw-3,y+k);ctx.stroke();}
      for(const xx of [bx,cx,dx])rounded(ctx,xx-3,y-2,6,rh+4,2,xx===cx?'#e3ae80':'#c58d6c');
      softBoxShadow(ctx,-22,-32,44,60,3);rounded(ctx,-22,-32,44,60,3,'#e5d7b0','#9d8060',1.5);
      rounded(ctx,-15,-24,30,44,2,'#7b8f7c');ctx.strokeStyle='#c6c7a1';ctx.lineWidth=2;for(let k=-16;k<18;k+=8){ctx.beginPath();ctx.moveTo(-11,k);ctx.lineTo(11,k);ctx.stroke();}
      path(ctx,[[-30,-32],[0,-49],[30,-32],[0,-22]],'#b77a58','#936948',1.5);
      ctx.strokeStyle='#7c8060';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-49);ctx.lineTo(0,-65);ctx.moveTo(-10,-60);ctx.lineTo(13,-60);ctx.stroke();path(ctx,[[13,-60],[5,-65],[5,-55]],'#b7a678');
    } else {
      // Shop and clinic have purposeful rooftop layouts, parapets and roof signage.
      rounded(ctx,x+5,y+5,rw-10,rh-10,3,p.roof);rounded(ctx,x+12,y+12,rw-24,rh-24,3,kind==='clinic'?'#d6e2d1':'#c6c9ae');
      rounded(ctx,x+4,y+4,rw-8,8,2,p.light);rounded(ctx,x+4,y+4,8,rh-8,2,p.light);rounded(ctx,x+4,y+rh-12,rw-8,8,2,p.dark);rounded(ctx,x+rw-12,y+4,8,rh-8,2,p.dark);
      if(kind==='clinic') {
        rounded(ctx,-48,-45,96,88,10,'#f0f1dc','#c0d2ba',2);crossMark(ctx,0,-1,55,'#79a88d');
        rounded(ctx,x+24,y+23,50,28,3,'#9fbeb0','#e7edcf',3);ctx.strokeStyle='#d8e7cb';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+49,y+25);ctx.lineTo(x+49,y+48);ctx.stroke();
        rounded(ctx,x+rw-60,y+rh-59,35,29,3,'#c3d0ba','#96ad9c',1);for(let k=0;k<4;k++)rounded(ctx,x+rw-55,y+rh-53+k*5,25,2,1,'#8fa99b');
      } else {
        rounded(ctx,-48,-37,96,67,6,'#d7ddbd','#b5c3a0',2);ctx.save();ctx.translate(0,-3);ctx.rotate(-.08);
        rounded(ctx,-25,-17,50,37,4,'#92ad8e','#69896c',2);path(ctx,[[-25,-17],[0,-27],[25,-17],[0,-5]],'#bbcca0','#76936f',1);ctx.strokeStyle='#d4dbb4';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(0,19);ctx.stroke();ctx.restore();
        rounded(ctx,x+rw-65,y+22,43,32,4,'#a4b49d','#859b85',1.5);for(let k=0;k<4;k++)rounded(ctx,x+rw-59,y+28+k*5,31,2,1,'#718d78');
        planter(ctx,x+23,y+rh-35,70,14,false);
      }
    }
    // Door-facing portico: opening remains the exact core door width.
    const d=doorway({...b,x:0,y:0}),rotation={north:Math.PI,south:0,east:-Math.PI/2,west:Math.PI/2}[b.doorSide||'south'];
    ctx.save();ctx.translate(d.x,d.y);ctx.rotate(rotation);const dw=b.doorWidth||110;
    if(kind==='store') {
      softBoxShadow(ctx,-dw/2-12,-5,dw+24,36,3);rounded(ctx,-dw/2-12,-5,dw+24,31,3,'#e6e1bd','#9aae8c',1.5);
      for(let i=0;i<7;i++){ctx.fillStyle=i%2?'#eae8c9':'#709b7d';ctx.fillRect(-dw/2-10+i*(dw+20)/7,-4,(dw+20)/7,28);circle(ctx,-dw/2-10+(i+.5)*(dw+20)/7,25,(dw+20)/14,i%2?'#eae8c9':'#709b7d');}
    } else if(kind==='clinic') {
      rounded(ctx,-dw/2-10,-4,dw+20,30,4,'#e8edd6','#9fb79f',1.5);rounded(ctx,-dw/2-8,15,dw+16,9,2,'#82a88c');crossMark(ctx,0,6,17,'#79a08a');
    } else {
      path(ctx,[[-dw/2-13,1],[0,-19],[dw/2+13,1],[dw/2+10,25],[-dw/2-10,25]],kind==='barn'?'#a66951':p.roof,p.dark,1.5);
      path(ctx,[[-dw/2-13,1],[0,-19],[0,18],[-dw/2-10,25]],p.light);
      rounded(ctx,-dw/2-10,23,dw+20,5,2,p.wall);
    }
    ctx.restore();ctx.restore();
  }

  drawObstacle(ctx, o) {
    const w = o.w || 60, h = o.h || w;
    ctx.save(); ctx.translate(o.x, o.y);
    if (o.type === 'tree') {
      const r = w / 2;
      circle(ctx, 8, 13, r * 1.02, 'rgba(42, 76, 44, .17)');
      rounded(ctx, -6, -2, 12, r * .9, 3, '#816c43');
      const variant = hash(o.x + o.y);
      const base = variant > .5 ? '#558c59' : '#648f52';
      circle(ctx, 0, 0, r, '#47764b', '#3f6d47', 2);
      circle(ctx, -r*.3, -r*.24, r*.66, base);
      circle(ctx, r*.3, -r*.2, r*.59, base);
      circle(ctx, 0, r*.32, r*.6, base);
      circle(ctx, -r*.11, -r*.18, r*.6, variant > .5 ? '#76a966' : '#84ab62');
      circle(ctx, -r*.22, -r*.33, r*.26, 'rgba(194, 218, 122, .15)');
    } else if (o.type === 'rock') {
      ctx.save(); ctx.translate(5,8); path(ctx, [[-w*.4,-h*.2],[-w*.15,-h*.47],[w*.3,-h*.3],[w*.48,h*.08],[w*.22,h*.4],[-w*.3,h*.35]], 'rgba(48,65,46,.17)'); ctx.restore();
      path(ctx, [[-w*.4,-h*.2],[-w*.15,-h*.47],[w*.3,-h*.3],[w*.48,h*.08],[w*.22,h*.4],[-w*.3,h*.35]], '#8c9b86', '#798775', 2);
      path(ctx, [[-w*.4,-h*.2],[-w*.15,-h*.47],[w*.3,-h*.3],[w*.12,-h*.03],[-w*.18,h*.12]], '#b9c3a8');
      path(ctx, [[-w*.18,h*.12],[w*.12,-h*.03],[w*.48,h*.08],[w*.22,h*.4]], '#a0ad94');
    } else if (o.type === 'crate') {
      rounded(ctx, -w/2+5, -h/2+7, w, h, 6, 'rgba(50,64,39,.16)');
      rounded(ctx, -w/2, -h/2, w, h, 5, '#b18a51', '#7e6542', 3);
      rounded(ctx, -w/2+5, -h/2+5, w-10, h-10, 2, '#d5b174', '#9b7846', 2);
      ctx.strokeStyle = '#ac864e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-w/2+7,0); ctx.lineTo(w/2-7,0); ctx.stroke();
      rounded(ctx, -w/2+7, -h/2+2, 6, h-4, 1, '#e5c283');
      rounded(ctx, w/2-13, -h/2+2, 6, h-4, 1, '#e5c283');
      rounded(ctx, -5, -7, 10, 14, 2, '#f2d88e', '#b18a51');
      circle(ctx, 0, 0, 2, '#886c41');
    } else if(o.type==='wall') {
      rounded(ctx,-w/2+3,-h/2+5,w,h,2,'rgba(56,70,47,.18)');
      rounded(ctx,-w/2,-h/2,w,h,2,'#dfd9ba','#78866b',2);
      rounded(ctx,-w/2+3,-h/2+2,Math.max(1,w-6),Math.max(1,h-5),1,'#f0e8cd');
      ctx.strokeStyle='#b5baa0';ctx.lineWidth=1;
      if(w>h){for(let x=-w/2+25;x<w/2;x+=31){ctx.beginPath();ctx.moveTo(x,-h/2+2);ctx.lineTo(x,h/2-2);ctx.stroke();}}
      else{for(let y=-h/2+25;y<h/2;y+=31){ctx.beginPath();ctx.moveTo(-w/2+2,y);ctx.lineTo(w/2-2,y);ctx.stroke();}}
    } else {
      const warm = hash(o.x + o.y) > .5;
      rounded(ctx, -w/2+9, -h/2+12, w, h, 9, 'rgba(52,66,41,.2)');
      rounded(ctx, -w/2-5, -h/2-5, w+10, h+10, 7, '#e5d9b2', '#8c956e', 2);
      rounded(ctx, -w/2, -h/2, w, h, 5, warm ? '#bc8065' : '#638e85', '#49685b', 3);
      ctx.save(); ctx.beginPath(); ctx.rect(-w/2+3,-h/2+3,w-6,h-6); ctx.clip();
      ctx.strokeStyle = warm ? '#a16c56' : '#517b73'; ctx.lineWidth = 2;
      for (let y=-h/2+15;y<h/2;y+=15) { ctx.beginPath(); ctx.moveTo(-w/2,y); ctx.lineTo(w/2,y); ctx.stroke(); }
      ctx.restore();
      path(ctx, [[-w/2,-h/2],[0,-h/2],[0,h/2],[-w/2,h/2]], warm ? 'rgba(255,211,156,.15)' : 'rgba(177,219,186,.15)');
      rounded(ctx, -4, -h/2-4, 8, h+8, 2, warm ? '#d29b78' : '#7eaaa0');
      rounded(ctx, w*.16, -h*.25, 18, 23, 3, '#ddd6b6', '#647867', 2);
      rounded(ctx, w*.16+4, -h*.25+4, 10, 15, 1, '#546e61');
      rounded(ctx, -17, h/2, 34, 7, 1, '#9a8b65');
    }
    ctx.restore();
  }

  drawLoot(ctx, item, t) {
    const tint = item.type === 'weapon' ? rarityColor(item.rarity) : item.type === 'shield' ? '#7ad2e1' : item.type === 'medkit' ? '#eaa99a' : '#edcf77';
    const pulse = 1 + Math.sin(t * 2.5 + item.x) * .06;
    ctx.save(); ctx.translate(item.x, item.y); ctx.scale(pulse,pulse);
    circle(ctx, 0, 2, item.type === 'weapon' ? 34 : 20, 'rgba(255,247,205,.13)');
    circle(ctx, 0, 2, item.type === 'weapon' ? 28 : 16, `${tint}35`, `${tint}d9`, 2);
    if (item.type === 'weapon') {
      const beam=ctx.createLinearGradient(0,-64,0,10);beam.addColorStop(0,`${tint}00`);beam.addColorStop(1,`${tint}55`);
      ctx.fillStyle=beam;ctx.fillRect(-12,-64,24,65);
      ctx.save();ctx.rotate(t*.15);ctx.setLineDash([7,18]);circle(ctx,0,2,33,null,`${tint}a0`,1.5);ctx.restore();
      drawWeapon(ctx, item.weapon || 0, item.rarity, {scale:.34,y:-3});
      circle(ctx,0,24,3,tint,'#f9f2d8',1);
    }
    else if (item.type === 'medkit') {
      rounded(ctx,-11,-10,22,19,4,'#f6f1da','#b86e5c',2);
      rounded(ctx,-3,-6,6,12,1,'#cc735f'); rounded(ctx,-6,-3,12,6,1,'#cc735f');
    } else if (item.type === 'shield') {
      path(ctx,[[-9,-10],[9,-10],[8,3],[0,11],[-8,3]],'#99dfdf','#477c80',2);
      path(ctx,[[0,-6],[5,-6],[4,2],[0,6]],'#d9f9e9');
    } else {
      rounded(ctx,-10,-8,20,17,3,'#c69c55','#7c6840',2);
      for(let i=-5;i<=5;i+=5) rounded(ctx,i-1,-5,3,11,1,'#f6d888');
    }
    ctx.restore();
  }

  drawActor(ctx, a, t, lobby) {
    const r = a.radius || 17;
    ctx.save(); ctx.translate(a.x,a.y);
    circle(ctx, 3, 7, r + 2, 'rgba(29,61,42,.2)');
    if (a.isPlayer) {
      circle(ctx,0,0,r+7,'rgba(251,245,205,.16)','#fff2b9',2);
      ctx.save(); ctx.rotate(a.angle || 0);
      path(ctx,[[r+15,0],[r+8,-4],[r+8,4]],'#fff2b9'); ctx.restore();
    }
    ctx.save(); ctx.rotate(a.angle || 0);
    const speed=Math.hypot(a.vx||0,a.vy||0),stride=Math.sin(t*15)*Math.min(3.5,speed/60);
    circle(ctx,-r*.6+stride,-r*.6,r*.34,'#455a49');circle(ctx,-r*.6-stride,r*.6,r*.34,'#455a49');
    rounded(ctx, -r*.45, -r*.82, r*.85, r*1.64, 5, '#63755a', '#314f3c', 2);
    circle(ctx, r*.6, -r*.65, r*.4, '#e7c79a','#6b7553',1.5);
    circle(ctx, r*.8, r*.6, r*.4, '#e7c79a','#6b7553',1.5);
    drawWeapon(ctx, a.weapon || 0, a.rarity, {x:r+9,y:r*.28,scale:.28});
    circle(ctx, 0, 0, r, a.color || (a.isPlayer ? '#f3d27e' : '#d58d75'), '#35533c', 2.5);
    circle(ctx, -2, -2, r*.8, a.isPlayer ? '#f4da91' : (a.color || '#dc9b80'));
    if (a.hitFlash > 0) circle(ctx, 0, 0, r, 'rgba(255,248,218,.6)');
    rounded(ctx, 3, -r*.65, 8, r*1.3, 4, '#38564a');
    rounded(ctx, 5, -r*.45, 3, r*.55, 1, '#acc4a3');
    ctx.restore();
    if (!lobby) {
      if (a.isPlayer || a.hp < 100 || a.shield > 0) {
        rounded(ctx,-20,-r-15,40,4,2,'rgba(38,62,41,.45)');
        if (a.hp > 0) rounded(ctx,-20,-r-15,40*Math.min(1,a.hp/100),4,2,a.isPlayer ? '#f7f0bd' : '#e9b287');
        if (a.shield > 0) rounded(ctx,-20,-r-21,40*Math.min(1,a.shield/100),3,1.5,'#9de7e2');
      }
      if (a.isPlayer) {
        ctx.font='600 11px system-ui, sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#284d3d';
        ctx.fillText(a.name || '旅人',0,r+24);
        if (a.reloading > 0) {
          ctx.beginPath();ctx.arc(0,0,r+11,-Math.PI/2,-Math.PI/2+TAU*(1-Math.min(1,a.reloading/(WEAPONS[a.weapon]?.reloadTime || 2))));
          ctx.strokeStyle='#fff5bf';ctx.lineWidth=3;ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  drawParachutist(ctx,a,t) {
    const altitude=Math.max(0,Math.min(1,a.altitude??1)),lift=altitude*90;
    const wobble=Math.sin(t*2.1+a.x*.008)*.045;
    ctx.save();ctx.translate(a.x,a.y);
    ctx.save();ctx.scale(1,.42);circle(ctx,13+altitude*18,25+altitude*28,33-altitude*9,'rgba(28,57,39,.14)');ctx.restore();
    ctx.translate(0,-lift);ctx.rotate(wobble);
    // Harness and the hanging pilot are visibly separate from the canopy.
    ctx.strokeStyle='#f4eacf';ctx.lineWidth=1.7;
    for(const x of [-52,-27,0,27,52]) {
      ctx.beginPath();ctx.moveTo(x,-39+Math.abs(x)*.10);ctx.lineTo(x<0?-10:10,17);ctx.stroke();
    }
    ctx.save();ctx.translate(Math.sin(t*2)*2,20);
    rounded(ctx,-10,-3,20,24,6,'#4a6b59','#2c4c40',2);
    rounded(ctx,-14,16,9,14,3,'#374f44');rounded(ctx,5,16,9,14,3,'#374f44');
    circle(ctx,-15,1,5,'#e4c294','#637254',1);circle(ctx,15,1,5,'#e4c294','#637254',1);
    circle(ctx,0,-9,13,a.isPlayer?'#f4ce74':(a.color||'#d18d78'),'#355244',2);
    rounded(ctx,-7,-14,14,6,3,'#365a4f');rounded(ctx,-5,-13,7,2,1,'#c7d8b7');
    ctx.strokeStyle='#d1bc87';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-8,-1);ctx.lineTo(6,17);ctx.moveTo(8,-1);ctx.lineTo(-6,17);ctx.stroke();ctx.restore();
    // Five stitched fabric panels, curved leading edge and scalloped lower edge.
    const base=a.isPlayer?'#e7ba60':'#a5c9b1';
    ctx.beginPath();ctx.moveTo(-58,-35);ctx.bezierCurveTo(-54,-94,54,-94,58,-35);
    ctx.quadraticCurveTo(43,-45,30,-35);ctx.quadraticCurveTo(15,-45,0,-35);
    ctx.quadraticCurveTo(-15,-45,-30,-35);ctx.quadraticCurveTo(-43,-45,-58,-35);ctx.closePath();
    ctx.fillStyle=base;ctx.fill();ctx.strokeStyle='#4e7762';ctx.lineWidth=2;ctx.stroke();
    ctx.save();ctx.clip();
    ctx.beginPath();ctx.moveTo(-28,-94);ctx.bezierCurveTo(-43,-72,-42,-50,-30,-35);ctx.lineTo(0,-35);ctx.bezierCurveTo(-10,-59,-11,-77,-4,-94);ctx.closePath();ctx.fillStyle='#f5edca';ctx.fill();
    ctx.beginPath();ctx.moveTo(24,-94);ctx.bezierCurveTo(37,-73,39,-52,30,-35);ctx.lineTo(58,-35);ctx.lineTo(65,-90);ctx.closePath();ctx.fillStyle='#668e70';ctx.fill();
    ctx.strokeStyle='rgba(65,96,72,.4)';ctx.lineWidth=1;
    for(const x of [-30,0,30]){ctx.beginPath();ctx.moveTo(x*.3,-84);ctx.quadraticCurveTo(x*1.1,-61,x,-35);ctx.stroke();}
    ctx.beginPath();ctx.ellipse(0,-65,52,17,0,Math.PI,Math.PI*2);ctx.strokeStyle='rgba(255,251,220,.4)';ctx.lineWidth=3;ctx.stroke();
    ctx.restore();
    if(a.isPlayer) {
      ctx.font='700 12px system-ui,sans-serif';ctx.textAlign='center';ctx.fillStyle='#294f40';ctx.fillText(a.name||'旅人',0,51);
      ctx.fillStyle='rgba(248,242,210,.8)';rounded(ctx,-24,59,48,4,2,'rgba(38,67,49,.2)');rounded(ctx,-24,59,48*(1-altitude),4,2,'#fff0a7');
    }
    ctx.restore();
  }

  drawPlane(ctx,plane,t) {
    if(!Number.isFinite(plane.x)||!Number.isFinite(plane.y))return;
    ctx.save();ctx.translate(plane.x,plane.y-90);ctx.rotate(plane.angle||0);
    // The aircraft silhouette and four propellers stay readable at flight zoom.
    const silhouette=(fill='#e5e9cf')=>{
      path(ctx,[[-139,-21],[-90,-21],[-37,-35],[-10,-153],[33,-153],[27,-27],[132,-22],[169,-10],[178,0],[169,10],[132,22],[27,27],[33,153],[-10,153],[-37,35],[-90,21],[-139,21],[-115,0]],fill,'#31554f',3);
    };
    ctx.save();ctx.translate(-18,145);ctx.globalAlpha=.13;silhouette('#294b3e');ctx.restore();
    for(const y of [-110,-58,58,110]){
      const trail=ctx.createLinearGradient(-180,y,-30,y);trail.addColorStop(0,'rgba(244,250,225,0)');trail.addColorStop(1,'rgba(244,250,225,.32)');
      ctx.fillStyle=trail;ctx.fillRect(-180,y-3,170,6);
    }
    silhouette();
    path(ctx,[[-22,-145],[23,-145],[16,-35],[-30,-35]],'#6d9a88');
    path(ctx,[[-22,145],[23,145],[16,35],[-30,35]],'#6d9a88');
    rounded(ctx,-12,-146,14,112,0,'#d9bb6b');rounded(ctx,-12,34,14,112,0,'#d9bb6b');
    path(ctx,[[-139,-19],[-105,-58],[-77,-58],[-94,-12]],'#769d88','#37594e',2);
    path(ctx,[[-139,19],[-105,58],[-77,58],[-94,12]],'#769d88','#37594e',2);
    rounded(ctx,-125,-17,276,34,15,'#f0efd7','#577b66',2);
    rounded(ctx,-74,-16,40,32,2,'#669782');rounded(ctx,-62,-17,8,34,1,'#dec071');
    path(ctx,[[117,-18],[143,-13],[150,-6],[122,-5]],'#456f68');
    path(ctx,[[117,18],[143,13],[150,6],[122,5]],'#456f68');
    rounded(ctx,146,-5,14,10,4,'#52786c');
    for(let x=-14;x<100;x+=19)rounded(ctx,x,-6,10,12,3,'#71958a');
    for(const y of [-110,-58,58,110]){
      rounded(ctx,-15,y-10,58,20,8,'#f0ecd2','#466d5b',2);rounded(ctx,25,y-10,17,20,5,'#d6b96b');
      circle(ctx,48,y,25,'rgba(234,241,214,.2)');
      ctx.save();ctx.translate(48,y);ctx.rotate(t*32+y);rounded(ctx,-3,-25,6,50,3,'rgba(54,85,73,.65)');ctx.rotate(Math.PI/2);rounded(ctx,-3,-25,6,50,3,'rgba(54,85,73,.65)');ctx.restore();circle(ctx,48,y,5,'#406457');
    }
    ctx.font='700 12px ui-monospace,monospace';ctx.textAlign='center';ctx.fillStyle='#e8eed4';ctx.save();ctx.translate(8,-78);ctx.rotate(-Math.PI/2);ctx.fillText('ISLAND 01',0,0);ctx.restore();
    ctx.restore();
  }

  drawStorm(ctx, zone, size, t) {
    ctx.save();
    ctx.beginPath(); ctx.rect(-size*2,-size*2,size*5,size*5); ctx.arc(zone.x,zone.y,Math.max(0,zone.radius),0,TAU,true);
    ctx.fillStyle='rgba(121,95,163,.32)'; ctx.fill('evenodd');
    circle(ctx,zone.x,zone.y,zone.radius,null,'rgba(225,207,255,.8)',4);
    circle(ctx,zone.x,zone.y,zone.radius+8+Math.sin(t*2)*2,null,'rgba(175,148,218,.45)',10);
    if (zone.nextRadius && zone.nextRadius < zone.radius - 20) {
      ctx.setLineDash([13,13]);circle(ctx,zone.x,zone.y,zone.nextRadius,null,'rgba(249,245,216,.5)',2);ctx.setLineDash([]);
    }
    ctx.restore();
  }

  makeMapBase(state) {
    const size=state.worldSize,resolution=1536;
    const canvas=this.canvas.ownerDocument.createElement('canvas');canvas.width=resolution;canvas.height=resolution;
    const ctx=canvas.getContext('2d');ctx.fillStyle=colors.water;ctx.fillRect(0,0,resolution,resolution);
    ctx.drawImage(this.terrain,0,0,resolution,resolution);ctx.scale(resolution/size,resolution/size);
    for(const o of state.obstacles||[]) {
      if(o.alive===false)continue;
      if(o.type==='tree')circle(ctx,o.x,o.y,Math.max(14,(o.w||50)/2),'#648e59');
      else if(o.type==='rock')circle(ctx,o.x,o.y,Math.max(12,(o.w||40)/2),'#8b9b82');
      else if(o.type==='building'){ctx.fillStyle='#647e6c';ctx.fillRect(o.x-o.w/2,o.y-o.h/2,o.w,o.h);}
    }
    for(const b of state.buildings||[]) {
      this.drawBuildingFloor(ctx,b);this.drawBuildingRoof(ctx,b,1);
    }
    this.mapBase=canvas;this.mapBaseKey=`${this.terrainKey}:${state.buildings?.length||0}:${state.obstacles?.length||0}`;
  }

  renderMap(state,canvas,{expanded=true}={}) {
    if(!canvas||!state?.player)return;
    const ctx=canvas.getContext('2d'),size=state.worldSize||8400;
    const terrainKey=`${size}:${state.seed}:${regionsFor(state).length}`;
    if(!this.terrain||this.terrainKey!==terrainKey)this.makeTerrain(state);
    const mapKey=`${this.terrainKey}:${state.buildings?.length||0}:${state.obstacles?.length||0}`;
    if(!this.mapBase||this.mapBaseKey!==mapKey)this.makeMapBase(state);
    const w=canvas.width,h=canvas.height;
    if(!w||!h)return;
    const rect=canvas.getBoundingClientRect(),dpr=Math.max(1,w/(rect.width||w));
    const padding=expanded?24*dpr:3*dpr,side=Math.max(1,Math.min(w,h)-padding*2),left=(w-side)/2,top=(h-side)/2,scale=side/size;
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);
    rounded(ctx,0,0,w,h,expanded?10*dpr:8*dpr,'#244b3f');
    ctx.save();rounded(ctx,left,top,side,side,expanded?5*dpr:3*dpr,colors.water);ctx.clip();
    ctx.drawImage(this.mapBase,left,top,side,side);
    ctx.translate(left,top);ctx.scale(scale,scale);
    if(expanded) {
      ctx.strokeStyle='rgba(44,77,53,.16)';ctx.lineWidth=dpr/scale;
      for(let i=1;i<8;i++){const k=i*size/8;ctx.beginPath();ctx.moveTo(k,0);ctx.lineTo(k,size);ctx.moveTo(0,k);ctx.lineTo(size,k);ctx.stroke();}
    }
    const z=state.zone;
    if(z) {
      ctx.beginPath();ctx.rect(-50,-50,size+100,size+100);ctx.arc(z.x,z.y,Math.max(0,z.radius),0,TAU,true);
      ctx.fillStyle='rgba(100,75,137,.47)';ctx.fill('evenodd');
      circle(ctx,z.x,z.y,z.radius,null,'#f3eed5',(expanded?2:1.4)*dpr/scale);
      if(z.nextRadius&&z.nextRadius<z.radius-20){ctx.setLineDash([5*dpr/scale,5*dpr/scale]);circle(ctx,z.x,z.y,z.nextRadius,null,'rgba(255,252,223,.75)',dpr/scale);ctx.setLineDash([]);}
    }
    if(expanded) {
      ctx.textAlign='center';ctx.font=`700 ${Math.max(9,Math.min(12,side/dpr/48))*dpr/scale}px system-ui,sans-serif`;
      ctx.lineWidth=3*dpr/scale;ctx.strokeStyle='rgba(236,233,204,.92)';ctx.fillStyle='#2b5141';
      for(const region of this.regions){ctx.strokeText(region.name,region.x,region.y+560);ctx.fillText(region.name,region.x,region.y+560);}
    }
    const route=state.drop?.route;
    if(state.phase==='flight'&&route?.start&&route?.end) {
      ctx.beginPath();ctx.moveTo(route.start.x,route.start.y);ctx.lineTo(route.end.x,route.end.y);
      ctx.setLineDash([7*dpr/scale,5*dpr/scale]);ctx.lineWidth=2*dpr/scale;ctx.strokeStyle='#f5d99a';ctx.stroke();ctx.setLineDash([]);
      circle(ctx,route.start.x,route.start.y,3*dpr/scale,'#f4e5b1','#446956',dpr/scale);
    }
    const player=state.player;
    // The expanded map uses the same short detection radius as the minimap.
    for(const actor of state.actors||[])if(actor.id!==player.id&&actor.alive&&actor.dropState!=='plane'&&Math.hypot(actor.x-player.x,actor.y-player.y)<520) {
      circle(ctx,actor.x,actor.y,(expanded?2.5:1.8)*dpr/scale,'#d07059','#70483e',.5*dpr/scale);
    }
    if(state.phase==='flight'&&state.drop?.plane) {
      const plane=state.drop.plane;
      ctx.save();ctx.translate(plane.x,plane.y);ctx.rotate(plane.angle||0);
      path(ctx,[[9*dpr/scale,0],[-6*dpr/scale,-7*dpr/scale],[-2*dpr/scale,0],[-6*dpr/scale,7*dpr/scale]],'#f7efd2','#365e4f',dpr/scale);ctx.restore();
    }
    circle(ctx,player.x,player.y,(expanded?7:5)*dpr/scale,'rgba(255,247,196,.25)','#fff4c8',dpr/scale);
    circle(ctx,player.x,player.y,(expanded?4:3)*dpr/scale,'#fff6bf','#2e5545',dpr/scale);
    ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.angle||0);
    path(ctx,[[12*dpr/scale,0],[6*dpr/scale,-3*dpr/scale],[6*dpr/scale,3*dpr/scale]],'#fff5c8');ctx.restore();
    if(expanded){ctx.font=`700 ${10*dpr/scale}px system-ui,sans-serif`;ctx.textAlign='center';ctx.strokeStyle='#2c4c3e';ctx.lineWidth=3*dpr/scale;ctx.strokeText('你',player.x,player.y-14*dpr/scale);ctx.fillStyle='#fff4c7';ctx.fillText('你',player.x,player.y-14*dpr/scale);}
    ctx.restore();
    ctx.textAlign='center';ctx.fillStyle='#dce6ca';ctx.font=`700 ${(expanded?10:8)*dpr}px ui-monospace,monospace`;
    if(expanded) {
      for(let i=0;i<8;i++){const k=(i+.5)*side/8;ctx.fillText(String.fromCharCode(65+i),left+k,top-9*dpr);ctx.fillText(String(i+1),left-12*dpr,top+k+3*dpr);}
      ctx.textAlign='left';ctx.fillStyle='#dce6ca';ctx.font=`600 ${9*dpr}px system-ui,sans-serif`;ctx.fillText('北 N ↑',left,top+side+16*dpr);
      ctx.textAlign='right';ctx.fillText(`${size.toLocaleString()} × ${size.toLocaleString()}`,left+side,top+side+16*dpr);
    } else ctx.fillText('N',w/2,12*dpr);
  }

  drawMinimap(state) {
    if(this.minimap)this.renderMap(state,this.minimap,{expanded:false});
  }
}
