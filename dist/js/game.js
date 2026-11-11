// Browser-independent battle simulation. All positions are world-space centers.
export const WORLD_SIZE = 2800;
export const WEAPONS = [
  { id: 'rifle', name: '突击步枪', color: '#f2c45c', damage: 19, magazine: 30, fireRate: 0.135, reloadTime: 1.7, speed: 1060, spread: 0.045, pellets: 1, range: 760 },
  { id: 'smg', name: '冲锋枪', color: '#6dd5ce', damage: 12, magazine: 36, fireRate: 0.075, reloadTime: 1.45, speed: 920, spread: 0.10, pellets: 1, range: 540 },
  { id: 'shotgun', name: '霰弹枪', color: '#df9a74', damage: 12, magazine: 6, fireRate: 0.72, reloadTime: 2.0, speed: 930, spread: 0.24, pellets: 7, range: 360 },
  { id: 'marksman', name: '精确步枪', color: '#bca0e9', damage: 49, magazine: 8, fireRate: 0.68, reloadTime: 2.0, speed: 1450, spread: 0.016, pellets: 1, range: 1050 },
  { id: 'pistol', name: '手枪', color: '#b5c2c2', damage: 23, magazine: 12, fireRate: 0.27, reloadTime: 1.1, speed: 1000, spread: 0.035, pellets: 1, range: 620 },
];

const BOT_NAMES = ['山雀', '北风', '青柠', '野火', '渡鸦', '猎户', '杉木', '夜航', '游隼', '小满', '拾光', '薄荷', '星尘', '木槿', '海盐', '晚风', '松果', '霜叶', '远山', '流萤', '白鲨', '云雀', '飞鱼', '石榴', '极光', '岩鹿', '海鸥', '火花', '月白', '栗子', '乌桕'];
const COLORS = ['#de8a72', '#ba9cce', '#7ac0c3', '#ddb767', '#a6c87e', '#de98bc'];
const PHASES = [
  { duration: 35, start: 1780, end: 1780, damage: 2 },
  { duration: 42, start: 1780, end: 1100, damage: 3 },
  { duration: 35, start: 1100, end: 720, damage: 5 },
  { duration: 32, start: 720, end: 410, damage: 8 },
  { duration: 28, start: 410, end: 180, damage: 12 },
  { duration: 24, start: 180, end: 45, damage: 18 },
  { duration: 18, start: 45, end: 0, damage: 32 },
];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function randomGenerator(seed) {
  let value = (Number(seed) || 1) >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = Math.imul(value ^ value >>> 15, 1 | value);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function rectangleCircleCollision(x, y, radius, obstacle) {
  const cx = clamp(x, obstacle.x - obstacle.w / 2, obstacle.x + obstacle.w / 2);
  const cy = clamp(y, obstacle.y - obstacle.h / 2, obstacle.y + obstacle.h / 2);
  return Math.hypot(x - cx, y - cy) < radius;
}

function collides(state, x, y, radius) {
  return state.obstacles.some(o => o.alive && ((o.type === 'tree' || o.type === 'rock')
    ? Math.hypot(x - o.x, y - o.y) < radius + o.w / 2
    : rectangleCircleCollision(x, y, radius, o)));
}

function safePosition(state, x, y, radius = 22) {
  x = clamp(x, 65, WORLD_SIZE - 65);
  y = clamp(y, 65, WORLD_SIZE - 65);
  for (let attempt = 0; attempt < 90; attempt++) {
    if (!collides(state, x, y, radius)) return { x, y };
    x = 80 + state.random() * (WORLD_SIZE - 160);
    y = 80 + state.random() * (WORLD_SIZE - 160);
  }
  return { x: 1400, y: 1400 };
}

function event(state, text, type = 'info') {
  state.events.unshift({ text, time: state.time, type });
  if (state.events.length > 8) state.events.length = 8;
}

function addLoot(state, x, y, type, weapon) {
  const pos = safePosition(state, x, y, 10);
  const loot = { id: `loot-${state.nextId++}`, ...pos, type, alive: true };
  if (type === 'weapon') {
    loot.weapon = weapon ?? Math.floor(state.random() * 4);
    loot.rarity = loot.weapon === 3 ? 'epic' : loot.weapon === 0 ? 'rare' : 'uncommon';
  }
  state.loot.push(loot);
  return loot;
}

function makeActor(state, id, name, x, y, isPlayer, weapon) {
  const loadouts = {};
  loadouts[weapon] = { ammo: WEAPONS[weapon].magazine, reserve: isPlayer ? 150 : 180 };
  return {
    id, name, x, y, radius: 17, angle: 0, hp: 100, shield: isPlayer ? 50 : 25,
    alive: true, color: isPlayer ? '#f3c65c' : COLORS[id % COLORS.length], isPlayer,
    weapon, ammo: loadouts[weapon].ammo, reserve: loadouts[weapon].reserve,
    reloading: 0, cooldown: 0, inventory: [weapon], slot: 0, medkits: isPlayer ? 2 : 1,
    kills: 0, loadouts, hitFlash: 0, aiTimer: 0, aiTarget: null, wanderAngle: state.random() * Math.PI * 2,
    spawnProtection: isPlayer ? 6 : 0, healCooldown: 0,
  };
}

export function createGame({ seed = Date.now(), botCount = 23, name = '旅人', difficulty = 'normal' } = {}) {
  const state = {
    worldSize: WORLD_SIZE, seed, random: randomGenerator(seed), nextId: 1, time: 0,
    status: 'playing', difficulty, actors: [], obstacles: [], loot: [], bullets: [], particles: [],
    zone: { x: 1400, y: 1400, radius: 1780, nextRadius: 1100, phase: 0, remaining: 35 },
    kills: 0, events: [], placement: 0,
  };
  const addObstacle = (x, y, w, h, type) => {
    if (Math.hypot(x - 1400, y - 1400) < 160) return;
    const hp = type === 'crate' ? 42 : type === 'tree' ? 120 : Infinity;
    state.obstacles.push({ id: `obstacle-${state.nextId++}`, x, y, w, h, type, hp, maxHp: hp, alive: true });
  };
  for (const [x, y] of [[680, 650], [2050, 670], [630, 2050], [2050, 2010]]) {
    addObstacle(x - 120, y - 95, 150, 120, 'building');
    addObstacle(x + 155, y + 65, 110, 155, 'building');
    addObstacle(x - 55, y + 190, 135, 85, 'building');
  }
  for (let i = 0; i < 170; i++) {
    const x = 100 + state.random() * 2600, y = 100 + state.random() * 2600;
    // Keep the center paths clear and leave room between individual cover pieces.
    if (Math.abs(x - 1400) < 65 || Math.abs(y - 1400) < 65 || collides(state, x, y, 65)) continue;
    const type = i % 6 === 0 ? 'rock' : 'tree';
    const size = type === 'tree' ? 48 + state.random() * 22 : 36 + state.random() * 28;
    addObstacle(x, y, size, size, type);
  }
  for (let i = 0; i < 40; i++) {
    const p = safePosition(state, 110 + state.random() * 2580, 110 + state.random() * 2580, 36);
    if (Math.hypot(p.x - 1400, p.y - 1400) > 170) addObstacle(p.x, p.y, 40, 40, 'crate');
  }
  state.player = makeActor(state, 0, String(name).slice(0, 16) || '旅人', 1400, 1400, true, 0);
  state.actors.push(state.player);
  for (let i = 0; i < clamp(Math.floor(botCount), 0, 59); i++) {
    const angle = state.random() * Math.PI * 2;
    const radius = 420 + state.random() * 1030;
    let p = safePosition(state, 1400 + Math.cos(angle) * radius, 1400 + Math.sin(angle) * radius);
    if (Math.hypot(p.x - 1400, p.y - 1400) < 300) p = safePosition(state, 300 + i * 31, 260);
    const weapon = i % 6 === 0 ? 3 : i % 4;
    state.actors.push(makeActor(state, i + 1, BOT_NAMES[i % BOT_NAMES.length], p.x, p.y, false, weapon));
  }
  for (let i = 0; i < 88; i++) {
    const types = ['weapon', 'ammo', 'shield', 'medkit'];
    addLoot(state, 110 + state.random() * 2580, 110 + state.random() * 2580, types[i % 4]);
  }
  addLoot(state, 1490, 1430, 'weapon', 1);
  addLoot(state, 1330, 1460, 'shield');
  addLoot(state, 1470, 1320, 'ammo');
  event(state, '已抵达荒岛。收集物资，成为最后的幸存者。', 'info');
  return state;
}

export const aliveCount = state => state.actors.reduce((count, actor) => count + Number(actor.alive), 0);

function currentLoadout(actor) {
  return actor.loadouts[actor.weapon] ?? (actor.loadouts[actor.weapon] = { ammo: actor.ammo, reserve: actor.reserve });
}

function saveLoadout(actor) {
  Object.assign(currentLoadout(actor), { ammo: actor.ammo, reserve: actor.reserve });
}

export function reload(state, actor = state.player) {
  if (state.status !== 'playing' || !actor.alive || actor.reloading > 0 || actor.ammo >= WEAPONS[actor.weapon].magazine || actor.reserve <= 0) return false;
  actor.reloading = WEAPONS[actor.weapon].reloadTime;
  return true;
}

export function switchWeapon(state, slot) {
  const actor = state.player;
  if (!actor.alive || state.status !== 'playing' || !Number.isInteger(slot) || slot < 0 || slot >= actor.inventory.length || slot === actor.slot) return false;
  saveLoadout(actor);
  actor.slot = slot;
  actor.weapon = actor.inventory[slot];
  const weapon = currentLoadout(actor);
  actor.ammo = weapon.ammo;
  actor.reserve = weapon.reserve;
  actor.reloading = 0;
  actor.cooldown = Math.max(actor.cooldown, 0.16);
  return true;
}

export function heal(state, actor = state.player) {
  if (state.status !== 'playing' || !actor.alive || actor.medkits <= 0 || actor.hp >= 100 || actor.healCooldown > 0) return false;
  actor.medkits--;
  actor.hp = Math.min(100, actor.hp + 55);
  actor.healCooldown = 4;
  if (actor.isPlayer) event(state, '使用急救包，恢复生命值', 'heal');
  return true;
}

export function describeNearby(state) {
  const p = state.player;
  let nearest = null, best = 88;
  for (const item of [...state.loot, ...state.obstacles.filter(o => o.type === 'crate')]) {
    if (!item.alive) continue;
    if (item.type === 'shield' && p.shield >= 100 || item.type === 'medkit' && p.medkits >= 5 || item.type === 'ammo' && p.reserve >= 360) continue;
    const d = distance(p, item);
    if (d < best) { nearest = item; best = d; }
  }
  if (!nearest) return null;
  const names = { ammo: '弹药补给', shield: '护盾补给', medkit: '急救包', crate: '物资箱' };
  return { ...nearest, label: nearest.type === 'weapon' ? WEAPONS[nearest.weapon].name : names[nearest.type], distance: best };
}

function collectLoot(state, actor, item) {
  if (!item.alive) return false;
  if (item.type === 'ammo') {
    if (actor.reserve >= 360) return false;
    actor.reserve = Math.min(360, actor.reserve + 60);
  } else if (item.type === 'shield') {
    if (actor.shield >= 100) return false;
    actor.shield = Math.min(100, actor.shield + 40);
  } else if (item.type === 'medkit') {
    if (actor.medkits >= 5) return false;
    actor.medkits++;
  } else if (item.type === 'weapon') {
    const weapon = item.weapon;
    if (actor.inventory.includes(weapon)) {
      if (actor.weapon === weapon) actor.reserve = Math.min(360, actor.reserve + 45);
      else actor.loadouts[weapon].reserve = Math.min(360, actor.loadouts[weapon].reserve + 45);
    } else {
      saveLoadout(actor);
      if (actor.inventory.length < 3) { actor.inventory.push(weapon); actor.slot = actor.inventory.length - 1; }
      else {
        const oldWeapon = actor.weapon;
        actor.inventory[actor.slot] = weapon;
        addLoot(state, actor.x + 26, actor.y + 26, 'weapon', oldWeapon);
      }
      actor.weapon = weapon;
      actor.loadouts[weapon] = { ammo: WEAPONS[weapon].magazine, reserve: 90 };
      actor.ammo = WEAPONS[weapon].magazine;
      actor.reserve = 90;
      actor.reloading = 0;
      actor.cooldown = 0.18;
    }
  }
  item.alive = false;
  saveLoadout(actor);
  if (actor.isPlayer) {
    const label = item.type === 'weapon' ? WEAPONS[item.weapon].name : { ammo: '弹药 +60', shield: '护盾 +40', medkit: '急救包 +1' }[item.type];
    event(state, `拾取 ${label}`, 'loot');
  }
  return true;
}

function openCrate(state, crate) {
  if (!crate.alive) return;
  crate.alive = false;
  burst(state, crate.x, crate.y, '#dcb477', 12);
  addLoot(state, crate.x, crate.y, 'weapon');
  addLoot(state, crate.x + 32, crate.y + 25, 'ammo');
  if (state.random() > 0.45) addLoot(state, crate.x - 32, crate.y + 25, 'shield');
}

export function pickup(state) {
  if (state.status !== 'playing' || !state.player.alive) return false;
  const nearby = describeNearby(state);
  if (!nearby) return false;
  if (nearby.type === 'crate') {
    openCrate(state, state.obstacles.find(o => o.id === nearby.id));
    event(state, '物资箱已打开', 'loot');
    return true;
  }
  return collectLoot(state, state.player, state.loot.find(item => item.id === nearby.id));
}

function burst(state, x, y, color, count = 6) {
  for (let i = 0; i < count; i++) {
    const angle = state.random() * Math.PI * 2, speed = 45 + state.random() * 140;
    const life = 0.18 + state.random() * 0.28;
    state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, maxLife: life, color, size: 2 + state.random() * 3 });
  }
}

function eliminate(state, actor, owner) {
  if (!actor.alive) return;
  actor.alive = false;
  actor.hp = 0;
  burst(state, actor.x, actor.y, actor.color, 16);
  addLoot(state, actor.x, actor.y, 'weapon', actor.weapon);
  addLoot(state, actor.x + 22, actor.y - 20, 'ammo');
  if (actor.medkits > 0) addLoot(state, actor.x - 25, actor.y + 25, 'medkit');
  if (owner) {
    owner.kills++;
    if (owner.isPlayer) state.kills = owner.kills;
    event(state, `${owner.name}  淘汰了  ${actor.name}`, owner.isPlayer ? 'kill' : 'combat');
  } else event(state, `${actor.name} 未能撤离风暴`, 'storm');
  if (actor.isPlayer) {
    state.placement = aliveCount(state) + 1;
    state.status = 'lost';
  }
}

function damageActor(state, actor, damage, owner, bypassShield = false) {
  if (!actor.alive || actor.spawnProtection > 0 && owner) return;
  actor.hitFlash = 0.12;
  if (!bypassShield) {
    const absorbed = Math.min(actor.shield, damage);
    actor.shield -= absorbed;
    damage -= absorbed;
  }
  actor.hp -= damage;
  if (actor.hp <= 0) eliminate(state, actor, owner);
}

function shoot(state, actor) {
  if (!actor.alive || actor.cooldown > 0 || actor.reloading > 0) return;
  if (actor.ammo <= 0) { reload(state, actor); return; }
  const weapon = WEAPONS[actor.weapon];
  actor.ammo--;
  actor.cooldown = weapon.fireRate;
  if (!actor.isPlayer) actor.cooldown *= state.difficulty === 'easy' ? 2.3 : state.difficulty === 'hard' ? 1.15 : 1.65;
  const x = actor.x + Math.cos(actor.angle) * 26, y = actor.y + Math.sin(actor.angle) * 26;
  for (let i = 0; i < weapon.pellets; i++) {
    const angle = actor.angle + (state.random() - 0.5) * weapon.spread * 2;
    state.bullets.push({ x, y, px: x, py: y, vx: Math.cos(angle) * weapon.speed, vy: Math.sin(angle) * weapon.speed, owner: actor.id, damage: weapon.damage, life: weapon.range / weapon.speed, color: weapon.color });
  }
  actor.muzzleFlash = 0.05;
}

function segmentCircle(x1, y1, x2, y2, cx, cy, radius) {
  const dx = x2 - x1, dy = y2 - y1, ox = x1 - cx, oy = y1 - cy;
  const a = dx * dx + dy * dy;
  const c = ox * ox + oy * oy - radius * radius;
  if (c <= 0) return 0;
  if (a < 1e-10) return Infinity;
  const b = 2 * (ox * dx + oy * dy), disc = b * b - 4 * a * c;
  if (disc < 0) return Infinity;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  return t >= 0 && t <= 1 ? t : Infinity;
}

function segmentRect(x1, y1, x2, y2, o) {
  let min = 0, max = 1;
  for (const [start, delta, low, high] of [[x1, x2 - x1, o.x - o.w / 2, o.x + o.w / 2], [y1, y2 - y1, o.y - o.h / 2, o.y + o.h / 2]]) {
    if (Math.abs(delta) < 1e-9) { if (start < low || start > high) return Infinity; }
    else {
      let a = (low - start) / delta, b = (high - start) / delta;
      if (a > b) [a, b] = [b, a];
      min = Math.max(min, a); max = Math.min(max, b);
      if (min > max) return Infinity;
    }
  }
  return min >= 0 && min <= 1 ? min : Infinity;
}

function obstacleHit(x1, y1, x2, y2, o) {
  return o.type === 'tree' || o.type === 'rock'
    ? segmentCircle(x1, y1, x2, y2, o.x, o.y, o.w / 2)
    : segmentRect(x1, y1, x2, y2, o);
}

function lineOfSight(state, a, b) {
  return !state.obstacles.some(o => o.alive && obstacleHit(a.x, a.y, b.x, b.y, o) !== Infinity);
}

function moveActor(state, actor, moveX, moveY, speed, dt) {
  const length = Math.hypot(moveX, moveY);
  if (length < 0.01) return false;
  const scale = speed * dt / Math.max(1, length);
  const nextX = clamp(actor.x + moveX * scale, actor.radius + 24, WORLD_SIZE - actor.radius - 24);
  const nextY = clamp(actor.y + moveY * scale, actor.radius + 24, WORLD_SIZE - actor.radius - 24);
  const oldX = actor.x, oldY = actor.y;
  if (!collides(state, nextX, actor.y, actor.radius)) actor.x = nextX;
  if (!collides(state, actor.x, nextY, actor.radius)) actor.y = nextY;
  return Math.hypot(actor.x - oldX, actor.y - oldY) > 0.01;
}

function botUpdate(state, actor, dt) {
  actor.aiTimer -= dt;
  if (actor.aiTimer <= 0) {
    actor.aiTimer = 0.3 + state.random() * 0.25;
    let target = null, best = 650;
    for (const candidate of state.actors) {
      if (!candidate.alive || candidate.id === actor.id || candidate.spawnProtection > 0) continue;
      const d = distance(actor, candidate);
      if (d < best && lineOfSight(state, actor, candidate)) { target = candidate; best = d; }
    }
    actor.aiTarget = target?.id ?? null;
    actor.wanderAngle += (state.random() - 0.5) * 1.7;
  }
  const target = state.actors.find(a => a.id === actor.aiTarget && a.alive);
  const zoneDistance = Math.hypot(actor.x - state.zone.x, actor.y - state.zone.y);
  let direction = actor.wanderAngle, moving = 0.55;
  if (target) {
    const aim = Math.atan2(target.y - actor.y, target.x - actor.x);
    const aimError = state.difficulty === 'easy' ? 0.22 : state.difficulty === 'hard' ? 0.05 : 0.13;
    actor.angle = aim + Math.sin(state.time * 3.1 + actor.id * 2) * aimError;
    if (distance(actor, target) < WEAPONS[actor.weapon].range * 0.88 && lineOfSight(state, actor, target)) shoot(state, actor);
  }
  if (zoneDistance > state.zone.radius - 85) {
    direction = Math.atan2(state.zone.y - actor.y, state.zone.x - actor.x);
    moving = 1;
  } else if (target) {
    const d = distance(actor, target);
    const aim = Math.atan2(target.y - actor.y, target.x - actor.x);
    direction = aim + (d < 170 ? Math.PI : d < 330 ? Math.PI / 2 * (actor.id % 2 ? 1 : -1) : 0);
    moving = d < 170 ? 0.8 : 0.6;
  } else {
    actor.angle = direction;
    let closest = null, best = 300;
    for (const item of state.loot) {
      if (!item.alive || item.type === 'weapon' || item.type === 'shield' && actor.shield >= 100 || item.type === 'medkit' && actor.medkits >= 3 || item.type === 'ammo' && actor.reserve > 180) continue;
      const d = distance(actor, item);
      if (d < best) { closest = item; best = d; }
    }
    if (closest) {
      direction = Math.atan2(closest.y - actor.y, closest.x - actor.x);
      if (best < 34) collectLoot(state, actor, closest);
    }
  }
  if (!moveActor(state, actor, Math.cos(direction) * moving, Math.sin(direction) * moving, 172, dt)) {
    actor.wanderAngle += 1.4;
    moveActor(state, actor, Math.cos(direction + 1.4), Math.sin(direction + 1.4), 172, dt);
  }
  if (actor.ammo < 1 || !target && actor.ammo < WEAPONS[actor.weapon].magazine * 0.4) reload(state, actor);
  if (actor.hp < 45 && (!target || distance(actor, target) > 280)) heal(state, actor);
}

function updateZone(state, dt) {
  let elapsed = state.time;
  let phase = 0;
  while (phase < PHASES.length - 1 && elapsed > PHASES[phase].duration) elapsed -= PHASES[phase++].duration;
  const settings = PHASES[phase];
  if (state.zone.phase !== phase) event(state, `风暴阶段 ${phase}：向安全区移动`, 'storm');
  state.zone.phase = phase;
  state.zone.radius = settings.start + (settings.end - settings.start) * clamp(elapsed / settings.duration, 0, 1);
  state.zone.nextRadius = PHASES[Math.min(phase + 1, PHASES.length - 1)].end;
  state.zone.remaining = Math.max(0, settings.duration - elapsed);
  for (const actor of state.actors) {
    if (actor.alive && Math.hypot(actor.x - state.zone.x, actor.y - state.zone.y) > state.zone.radius) damageActor(state, actor, settings.damage * dt, null, true);
  }
}

export function updateGame(state, dt, input = {}) {
  if (state.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return state;
  dt = Math.min(dt, 0.05);
  state.time += dt;
  for (const actor of state.actors) {
    if (!actor.alive) continue;
    actor.cooldown = Math.max(0, actor.cooldown - dt);
    actor.hitFlash = Math.max(0, actor.hitFlash - dt);
    actor.muzzleFlash = Math.max(0, (actor.muzzleFlash || 0) - dt);
    actor.spawnProtection = Math.max(0, actor.spawnProtection - dt);
    actor.healCooldown = Math.max(0, actor.healCooldown - dt);
    if (actor.reloading > 0) {
      actor.reloading = Math.max(0, actor.reloading - dt);
      if (actor.reloading === 0) {
        const amount = Math.min(WEAPONS[actor.weapon].magazine - actor.ammo, actor.reserve);
        actor.ammo += amount; actor.reserve -= amount; saveLoadout(actor);
      }
    }
    if (actor.isPlayer) {
      if (Number.isFinite(input.angle)) actor.angle = input.angle;
      const speed = input.sprint && !input.shoot ? 295 : 225;
      moveActor(state, actor, Number(input.moveX) || 0, Number(input.moveY) || 0, speed, dt);
      if (input.shoot) shoot(state, actor);
    } else botUpdate(state, actor, dt);
  }
  for (const bullet of state.bullets) {
    if (bullet.life <= 0) continue;
    bullet.px = bullet.x; bullet.py = bullet.y;
    const travelTime = Math.min(dt, bullet.life);
    const nx = bullet.x + bullet.vx * travelTime, ny = bullet.y + bullet.vy * travelTime;
    let hit = null, first = Infinity, kind = '';
    for (const o of state.obstacles) {
      if (!o.alive) continue;
      const t = obstacleHit(bullet.x, bullet.y, nx, ny, o);
      if (t < first) { first = t; hit = o; kind = 'obstacle'; }
    }
    for (const actor of state.actors) {
      if (!actor.alive || actor.id === bullet.owner) continue;
      const t = segmentCircle(bullet.x, bullet.y, nx, ny, actor.x, actor.y, actor.radius);
      if (t < first) { first = t; hit = actor; kind = 'actor'; }
    }
    bullet.x = first === Infinity ? nx : bullet.x + (nx - bullet.x) * first;
    bullet.y = first === Infinity ? ny : bullet.y + (ny - bullet.y) * first;
    bullet.life -= dt;
    if (hit) {
      bullet.life = 0;
      if (kind === 'actor') {
        damageActor(state, hit, bullet.damage, state.actors.find(a => a.id === bullet.owner));
        burst(state, bullet.x, bullet.y, hit.shield > 0 ? '#92e0ed' : '#f5d39b', 5);
      } else {
        hit.hp -= bullet.damage;
        burst(state, bullet.x, bullet.y, '#d0c2a3', 4);
        if (hit.hp <= 0) {
          if (hit.type === 'crate') openCrate(state, hit);
          else hit.alive = false;
        }
      }
    }
  }
  state.bullets = state.bullets.filter(b => b.life > 0);
  for (const p of state.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
  state.particles = state.particles.filter(p => p.life > 0).slice(-250);
  updateZone(state, dt);
  if (state.player.alive && aliveCount(state) === 1) {
    state.status = 'won'; state.placement = 1;
    event(state, '胜利！你是最后的幸存者。', 'win');
  }
  return state;
}
