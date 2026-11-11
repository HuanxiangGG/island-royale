import { WEAPONS } from './game.js';

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

function drawWeapon(ctx, index, x, y, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  const tint = WEAPONS[index]?.color || '#e9bb68';
  if (index === 2) {
    rounded(ctx, -15, -4, 40, 7, 2, '#31453d');
    rounded(ctx, -8, -5, 18, 9, 2, tint);
    rounded(ctx, 0, 3, 6, 8, 1, '#31453d');
    rounded(ctx, -20, -5, 9, 10, 2, '#b08453');
  } else if (index === 3) {
    rounded(ctx, -18, -3, 48, 6, 2, '#31453d');
    rounded(ctx, -10, -5, 24, 10, 2, tint);
    rounded(ctx, -4, -8, 14, 3, 1, '#263b33');
    rounded(ctx, -20, -5, 8, 10, 2, '#9e7652');
    rounded(ctx, -2, 4, 5, 7, 1, '#31453d');
  } else {
    rounded(ctx, -18, -4, 42 - (index === 4 ? 10 : 0), 8, 2, '#2f443b');
    rounded(ctx, -12, -6, 21, 12, 3, tint);
    rounded(ctx, -3, 5, 8, 9, 2, '#2f443b');
    rounded(ctx, -24, -5, 9, 10, 2, '#a8b6a1');
    rounded(ctx, 4, -5, 7, 2, 1, '#e9ecdc');
  }
  ctx.restore();
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

  makeTerrain(size) {
    const c = this.canvas.ownerDocument.createElement('canvas'); c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    rounded(ctx, 0, 0, size, size, 150, colors.sand);
    rounded(ctx, 35, 35, size - 70, size - 70, 150, '#c1cf87');
    rounded(ctx, 65, 65, size - 130, size - 130, 140, colors.grass);
    // Soft meadow patches keep large stretches readable in the battle camera.
    for (let i = 0; i < 80; i++) {
      const x = 100 + hash(i + 40) * (size - 200), y = 100 + hash(i + 719) * (size - 200);
      ctx.save(); ctx.translate(x, y); ctx.rotate(hash(i + 340) * TAU); ctx.scale(1, .65);
      circle(ctx, 0, 0, 50 + hash(i + 420) * 100, i % 3 ? '#a3c575' : '#afd081'); ctx.restore();
    }
    // Cross-island trails join the four settlements.
    const mid = size / 2;
    ctx.lineCap = 'round';
    for (const road of [0, 1]) {
      ctx.beginPath();
      if (!road) { ctx.moveTo(55, mid + 80); ctx.bezierCurveTo(650, mid - 100, 1950, mid + 100, size - 55, mid - 70); }
      else { ctx.moveTo(mid - 50, 55); ctx.bezierCurveTo(mid + 110, 700, mid - 120, 2100, mid + 35, size - 55); }
      ctx.strokeStyle = '#94b96d'; ctx.lineWidth = 125; ctx.stroke();
      ctx.strokeStyle = '#cec992'; ctx.lineWidth = 96; ctx.stroke();
      ctx.strokeStyle = '#d8ce9b'; ctx.lineWidth = 66; ctx.stroke();
      ctx.strokeStyle = '#c7bd8e'; ctx.lineWidth = 2; ctx.setLineDash([11, 28]); ctx.stroke(); ctx.setLineDash([]);
    }
    for (const [x, y] of [[680,650],[2050,670],[630,2050],[2050,2010]]) {
      ctx.save(); ctx.translate(x, y);
      rounded(ctx, -230, -180, 460, 360, 60, '#bfc38a');
      for (let i = 0; i < 20; i++) circle(ctx, hash(i+x)*420-210, hash(i+y)*320-160, 2, '#a3ae7c');
      ctx.restore();
    }
    for (let i = 0; i < 1300; i++) {
      const x = 90 + hash(i + 1000) * (size - 180), y = 90 + hash(i + 6000) * (size - 180);
      if (Math.abs(x - mid) < 90 || Math.abs(y - mid) < 90) continue;
      ctx.strokeStyle = i % 3 ? '#91b668' : '#b8d88a'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(x - 4, y - 3); ctx.lineTo(x, y + 3); ctx.lineTo(x + 4, y - 4); ctx.stroke();
      if (i % 17 === 0) {
        circle(ctx, x + 8, y, 2.4, '#f4e5aa'); circle(ctx, x + 12, y + 5, 2, '#f4e5aa');
      }
    }
    this.terrain = c; this.terrainSize = size;
  }

  render(state, { lobby = false, mouseX = 0, mouseY = 0 } = {}) {
    if (!state?.player) return;
    const ctx = this.ctx, now = performance.now() / 1000;
    const dt = Math.min(.08, this.lastFrame ? now - this.lastFrame : .016); this.lastFrame = now;
    const size = state.worldSize || 2800;
    if (!this.terrain || this.terrainSize !== size) this.makeTerrain(size);
    const targetZoom = lobby ? Math.max(.32, Math.min(.56, this.width / 2600)) : Math.max(.65, Math.min(1.08, this.width / 1150));
    const targetX = lobby ? size / 2 + Math.sin(now * .045) * 70 : state.player.x;
    const targetY = lobby ? size / 2 - 110 + Math.cos(now * .04) * 50 : state.player.y;
    if (this.lastMode !== lobby) { this._camera = { x: targetX, y: targetY, zoom: targetZoom }; this.lastMode = lobby; }
    const ease = 1 - Math.exp(-9 * dt);
    this._camera.x += (targetX - this._camera.x) * ease;
    this._camera.y += (targetY - this._camera.y) * ease;
    this._camera.zoom += (targetZoom - this._camera.zoom) * ease;
    const { x, y, zoom } = this._camera;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = colors.water; ctx.fillRect(0, 0, this.width, this.height);
    ctx.save(); ctx.translate(this.width / 2, this.height / 2); ctx.scale(zoom, zoom); ctx.translate(-x, -y);
    this.view = { left: x - this.width / 2 / zoom - 160, top: y - this.height / 2 / zoom - 160,
      right: x + this.width / 2 / zoom + 160, bottom: y + this.height / 2 / zoom + 160 };
    this.drawWater(ctx, size, now);
    ctx.drawImage(this.terrain, 0, 0);
    this.drawLocations(ctx, lobby);
    for (const item of state.loot || []) if (item.alive !== false && this.visible(item)) this.drawLoot(ctx, item, now);
    const solid = (state.obstacles || []).filter(o => o.alive !== false && this.visible(o));
    for (const o of solid) if (o.type !== 'tree') this.drawObstacle(ctx, o);
    for (const a of state.actors || [state.player]) if (a.alive && this.visible(a)) this.drawActor(ctx, a, now, lobby);
    for (const b of state.bullets || []) {
      ctx.beginPath(); ctx.moveTo(b.px ?? b.x - b.vx * .016, b.py ?? b.y - b.vy * .016); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = b.owner === state.player.id ? '#fff6b6' : '#ffd49c'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
      circle(ctx, b.x, b.y, 2, '#fffde1');
    }
    for (const o of solid) if (o.type === 'tree') {
      ctx.save(); if (Math.hypot(o.x - state.player.x, o.y - state.player.y) < (o.w || 70) * .75) ctx.globalAlpha = .45;
      this.drawObstacle(ctx, o); ctx.restore();
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

  visible(o) { return o.x > this.view.left && o.x < this.view.right && o.y > this.view.top && o.y < this.view.bottom; }

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
    ctx.save(); ctx.textAlign = 'center'; ctx.font = '600 18px ui-monospace, monospace'; ctx.fillStyle = 'rgba(55, 84, 51, .28)';
    for (const [x,y,text] of [[680,410,'松 林 营 地'],[2050,430,'晨 光 小 镇'],[630,1790,'风 车 农 场'],[2050,1760,'落 日 哨 站']]) ctx.fillText(text, x, y);
    if (lobby) { ctx.font = '500 15px ui-monospace, monospace'; ctx.fillText('— THE GREEN ISLAND —', 1400, 1100); }
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
    const tint = item.type === 'weapon' ? (WEAPONS[item.weapon]?.color || '#ecd27c') : item.type === 'shield' ? '#7ad2e1' : item.type === 'medkit' ? '#eaa99a' : '#edcf77';
    const pulse = 1 + Math.sin(t * 2.5 + item.x) * .06;
    ctx.save(); ctx.translate(item.x, item.y); ctx.scale(pulse,pulse);
    circle(ctx, 0, 2, item.type === 'weapon' ? 29 : 20, 'rgba(255,247,205,.13)');
    circle(ctx, 0, 2, item.type === 'weapon' ? 23 : 16, `${tint}35`, `${tint}b0`, 1.5);
    if (item.type === 'weapon') drawWeapon(ctx, item.weapon || 0, 0, 0, .85);
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
    rounded(ctx, -r*.45, -r*.82, r*.85, r*1.64, 5, '#63755a', '#314f3c', 2);
    circle(ctx, r*.6, -r*.65, r*.4, '#e7c79a','#6b7553',1.5);
    circle(ctx, r*.8, r*.6, r*.4, '#e7c79a','#6b7553',1.5);
    drawWeapon(ctx, a.weapon || 0, r + 7, r*.28, .8);
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

  drawMinimap(state) {
    if (!this.mctx || !this.minimap) return;
    const ctx=this.mctx, w=this.miniWidth || 150, h=this.miniHeight || 150, size=state.worldSize;
    const sx=w/size,sy=h/size;
    ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,w,h);
    ctx.save();rounded(ctx,0,0,w,h,12,colors.water);ctx.clip();ctx.drawImage(this.terrain,3,3,w-6,h-6);
    ctx.scale(sx,sy);
    for(const o of state.obstacles || []) if(o.alive !== false) {
      if(o.type==='tree')circle(ctx,o.x,o.y,(o.w||50)/2,'#618e55');
      else if(o.type==='building'){ctx.fillStyle='#557c6c';ctx.fillRect(o.x-o.w/2,o.y-o.h/2,o.w,o.h);}
    }
    const z=state.zone;
    if(z) {
      ctx.beginPath();ctx.rect(-50,-50,size+100,size+100);ctx.arc(z.x,z.y,Math.max(0,z.radius),0,TAU,true);
      ctx.fillStyle='rgba(100,75,137,.5)';ctx.fill('evenodd');
      circle(ctx,z.x,z.y,z.radius,null,'#ece7d2',1.5/sx);
      if(z.nextRadius && z.nextRadius<z.radius-20){ctx.setLineDash([3/sx,3/sx]);circle(ctx,z.x,z.y,z.nextRadius,null,'rgba(255,252,223,.5)',1/sx);ctx.setLineDash([]);}
    }
    const p=state.player;
    for(const a of state.actors||[]) if(!a.isPlayer&&a.alive&&Math.hypot(a.x-p.x,a.y-p.y)<520)circle(ctx,a.x,a.y,2/sx,'#c86b55');
    circle(ctx,p.x,p.y,5/sx,'#fff8cc','#315b48',1.5/sx);
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle||0);path(ctx,[[9/sx,0],[5/sx,-3/sx],[5/sx,3/sx]],'#fff8cc');ctx.restore();
    ctx.restore();
    ctx.font='700 9px ui-monospace, monospace';ctx.textAlign='center';ctx.fillStyle='#f7f2d9';ctx.fillText('N',w/2,13);
  }
}
