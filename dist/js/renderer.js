import { WEAPONS } from './game.js';
import { drawWeapon, rarityColor } from './weapon-art.js';

const TAU = Math.PI * 2;
const colors = { grass: '#a8c977', grassDark: '#83ad65', sand: '#e6d6a2', ink: '#233e36', water: '#76b9b0' };

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
const REGION_PALETTES = ['#95b878','#b9c77d','#a7bd81','#89b17b','#a8c977','#beb980','#9cbd89','#b9ca84','#b1bf7e'];
const BUILDING_PALETTES = [
  {roof:'#6c9588',light:'#8aafa0',dark:'#52776a',floor:'#c9ba91',wall:'#e1d9b8'},
  {roof:'#be8668',light:'#d7a27c',dark:'#9c6e55',floor:'#d5c39b',wall:'#e9dbbb'},
  {roof:'#8b91a0',light:'#acafbb',dark:'#6a7586',floor:'#bfc3ae',wall:'#dedfcb'},
];

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
      ctx.save();ctx.translate(region.x,region.y);ctx.scale(1.12,.92);
      circle(ctx,0,0,size*.17,REGION_PALETTES[i%REGION_PALETTES.length]);ctx.restore();
    }
    for(let i=0;i<390;i++) {
      const x=140+hash(i+40)*(size-280),y=140+hash(i+719)*(size-280);
      ctx.save();ctx.translate(x,y);ctx.rotate(hash(i+340)*TAU);ctx.scale(1,.65);
      circle(ctx,0,0,40+hash(i+420)*145,i%3?'rgba(91,143,78,.09)':'rgba(224,226,159,.16)');ctx.restore();
    }
    this.drawRoads(ctx,size,false);
    for(const region of this.regions)rounded(ctx,region.x-540,region.y-400,1080,940,100,'rgba(194,192,139,.38)');
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
      ctx.strokeStyle='#93ad6c';ctx.lineWidth=114;ctx.stroke();ctx.strokeStyle='#cec58f';ctx.lineWidth=92;ctx.stroke();ctx.strokeStyle='#dbce9b';ctx.lineWidth=64;ctx.stroke();
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
    const palette=BUILDING_PALETTES[(b.style||0)%3],{w,h}=b;
    ctx.save();ctx.translate(b.x,b.y);
    rounded(ctx,-w/2-5,-h/2-5,w+10,h+10,5,'#aea77f','#8d9471',2);
    rounded(ctx,-w/2+9,-h/2+9,w-18,h-18,1,palette.floor);
    ctx.save();ctx.beginPath();ctx.rect(-w/2+12,-h/2+12,w-24,h-24);ctx.clip();
    ctx.strokeStyle='rgba(111,92,61,.18)';ctx.lineWidth=1;
    if((b.style||0)===2) {
      for(let x=-w/2;x<w/2;x+=35)for(let y=-h/2;y<h/2;y+=35){ctx.fillStyle=(Math.floor(x/35)+Math.floor(y/35))%2?'#c7c9b7':'#b9c0ac';ctx.fillRect(x,y,35,35);}
    } else {
      for(let y=-h/2+20;y<h/2;y+=22){ctx.beginPath();ctx.moveTo(-w/2,y);ctx.lineTo(w/2,y);ctx.stroke();}
      for(let x=-w/2+30;x<w/2;x+=64)for(let y=-h/2+20;y<h/2;y+=44){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+22);ctx.stroke();}
    }
    // Low furnishings and woven mats leave the navigable middle and door clear.
    const left=-w/2+25,top=-h/2+25;
    rounded(ctx,left,top,74,45,4,'#9f9d79','#777e60',2);rounded(ctx,left+4,top+4,66,37,2,'#c1b994');
    for(let i=0;i<3;i++)rounded(ctx,left+9+i*20,top+9,14,27,2,['#8da28b','#bd986c','#8d9c9b'][i]);
    const rugColor=(b.style||0)===1?'#b7977c':(b.style||0)===2?'#a0ad9e':'#a8b194';
    rounded(ctx,-w*.26,h*.04,w*.52,h*.26,3,rugColor,'rgba(95,111,79,.25)',2);
    ctx.strokeStyle='rgba(239,229,190,.45)';ctx.lineWidth=2;
    for(let x=-w*.22;x<w*.23;x+=14){ctx.beginPath();ctx.moveTo(x,h*.07);ctx.lineTo(x,h*.27);ctx.stroke();}
    rounded(ctx,w/2-65,-h/2+25,40,68,5,'#8b9c80','#65795f',2);rounded(ctx,w/2-61,-h/2+29,32,60,4,'#c7d1af');
    rounded(ctx,w/2-59,-h/2+31,28,16,3,'#eeebcf');rounded(ctx,w/2-59,-h/2+53,28,34,2,palette.light);
    ctx.restore();
    const door=doorway({...b,x:0,y:0}),horizontal=b.doorSide==='north'||b.doorSide==='south';
    const dw=Math.max(65,(b.doorWidth||110)-8);
    rounded(ctx,door.x-(horizontal?dw/2:20),door.y-(horizontal?20:dw/2),horizontal?dw:40,horizontal?40:dw,3,'#bdb38a');
    ctx.strokeStyle='rgba(241,232,193,.6)';ctx.lineWidth=2;
    if(horizontal){ctx.beginPath();ctx.moveTo(door.x-dw/2+6,door.y);ctx.lineTo(door.x+dw/2-6,door.y);ctx.stroke();}
    else{ctx.beginPath();ctx.moveTo(door.x,door.y-dw/2+6);ctx.lineTo(door.x,door.y+dw/2-6);ctx.stroke();}
    ctx.restore();
  }

  drawBuildingRoof(ctx,b,opacity) {
    if(opacity<.04)return;
    const palette=BUILDING_PALETTES[(b.style||0)%3],{w,h}=b;
    ctx.save();ctx.translate(b.x,b.y);ctx.globalAlpha=opacity;
    rounded(ctx,-w/2+10,-h/2+13,w+8,h+8,8,'rgba(49,68,42,.2)');
    rounded(ctx,-w/2-7,-h/2-7,w+14,h+14,5,palette.roof,palette.dark,3);
    ctx.save();ctx.beginPath();ctx.rect(-w/2-5,-h/2-5,w+10,h+10);ctx.clip();
    ctx.fillStyle=palette.light;ctx.fillRect(-w/2-5,-h/2-5,w/2+5,h+10);
    ctx.strokeStyle=palette.dark;ctx.lineWidth=2;
    for(let y=-h/2+9;y<h/2;y+=16){ctx.beginPath();ctx.moveTo(-w/2-5,y);ctx.lineTo(w/2+5,y);ctx.stroke();}
    ctx.restore();
    rounded(ctx,-5,-h/2-10,10,h+20,2,palette.light,palette.dark,1.5);
    rounded(ctx,w*.22,-h*.24,27,35,3,'#bfc6b0','#5b7463',2);rounded(ctx,w*.22+5,-h*.24+5,17,25,1,'#557466');
    const d=doorway({...b,x:0,y:0});ctx.save();ctx.translate(d.x,d.y);
    const rotation={north:Math.PI,south:0,east:-Math.PI/2,west:Math.PI/2}[b.doorSide||'south'];ctx.rotate(rotation);
    rounded(ctx,-(b.doorWidth||110)/2,3,b.doorWidth||110,18,3,'#ddcda2',palette.dark,2);
    ctx.beginPath();ctx.moveTo(-7,31);ctx.lineTo(0,25);ctx.lineTo(7,31);ctx.strokeStyle='#f4e6b2';ctx.lineWidth=3;ctx.stroke();ctx.restore();
    ctx.restore();
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
      const palette=BUILDING_PALETTES[(b.style||0)%3];
      rounded(ctx,b.x-b.w/2-8,b.y-b.h/2-8,b.w+16,b.h+16,8,'#e2d7b0');
      rounded(ctx,b.x-b.w/2,b.y-b.h/2,b.w,b.h,4,palette.roof,palette.dark,5);
      const d=doorway(b);circle(ctx,d.x,d.y,18,'#f0d99e');
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
