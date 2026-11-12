// Authoritative, browser-independent simulation. Every position is a world-space center.
export const WORLD_SIZE = 2800;
export const RARITIES = [
  { id: 'common', name: '普通', color: '#b3bcc0', damageMultiplier: 1 },
  { id: 'uncommon', name: '优秀', color: '#76c98a', damageMultiplier: 1.05 },
  { id: 'rare', name: '稀有', color: '#6eb5ed', damageMultiplier: 1.10 },
  { id: 'epic', name: '史诗', color: '#bb91e5', damageMultiplier: 1.16 },
  { id: 'legendary', name: '传说', color: '#f2be54', damageMultiplier: 1.23 },
  { id: 'mythic', name: '神话', color: '#f27d85', damageMultiplier: 1.31 },
];
export const WEAPONS = [
  { id: 'rifle', name: '突击步枪', skinName: '游骑兵', color: '#f2c45c', damage: 18, magazine: 30, fireRate: 0.135, reloadTime: 1.7, speed: 1060, spread: 0.045, pellets: 1, range: 760 },
  { id: 'smg', name: '冲锋枪', skinName: '潮汐', color: '#6dd5ce', damage: 11, magazine: 36, fireRate: 0.075, reloadTime: 1.45, speed: 920, spread: 0.10, pellets: 1, range: 540 },
  { id: 'shotgun', name: '霰弹枪', skinName: '赤砂', color: '#df9a74', damage: 11, magazine: 6, fireRate: 0.72, reloadTime: 2, speed: 930, spread: 0.24, pellets: 7, range: 360 },
  { id: 'marksman', name: '精确步枪', skinName: '夜莺', color: '#bca0e9', damage: 46, magazine: 8, fireRate: 0.68, reloadTime: 2, speed: 1450, spread: 0.016, pellets: 1, range: 1050 },
  { id: 'pistol', name: '手枪', skinName: '信使', color: '#b5c2c2', damage: 22, magazine: 12, fireRate: 0.27, reloadTime: 1.1, speed: 1000, spread: 0.035, pellets: 1, range: 620 },
];

const BOT_NAMES = ['山雀', '北风', '青柠', '野火', '渡鸦', '猎户', '杉木', '夜航', '游隼', '小满', '拾光', '薄荷', '星尘', '木槿', '海盐', '晚风', '松果', '霜叶', '远山', '流萤', '白鲨', '云雀', '飞鱼', '石榴', '极光', '岩鹿', '海鸥', '火花', '月白', '栗子', '乌桕', '白露', '苍耳', '海棠', '归雁', '新月', '落雪', '寒江', '阿橙', '青川', '海风', '晨星', '雪貂', '泡芙', '鲸落', '胡桃', '银杏', '山茶', '纸鸢'];
const COLORS = ['#de8a72', '#ba9cce', '#7ac0c3', '#ddb767', '#a6c87e', '#de98bc'];
const FLIGHT_DURATION = 14;
const LAST_JUMP = 10;
const DESCENT_DURATION = 4;
const PHASES = [
  { duration: 35, start: 1780, end: 1780, damage: 2 },
  { duration: 42, start: 1780, end: 1100, damage: 3 },
  { duration: 35, start: 1100, end: 720, damage: 5 },
  { duration: 32, start: 720, end: 410, damage: 8 },
  { duration: 28, start: 410, end: 180, damage: 12 },
  { duration: 24, start: 180, end: 45, damage: 18 },
  { duration: 18, start: 45, end: 0, damage: 32 },
];
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
const finite = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rarityInfo = id => RARITIES.find(rarity => rarity.id === id) || RARITIES[0];
const rarityIndex = id => Math.max(0, RARITIES.findIndex(rarity => rarity.id === id));
const angleDifference = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const combatReady = (state, actor) => state.status === 'playing' && state.phase === 'combat' && actor?.alive && actor.dropState === 'ground';

function randomGenerator(seed) {
  let value = (Number(seed) || 1) >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = Math.imul(value ^ value >>> 15, 1 | value);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function randomRarity(state) {
  const roll = state.random();
  return RARITIES[roll < 0.38 ? 0 : roll < 0.67 ? 1 : roll < 0.85 ? 2 : roll < 0.95 ? 3 : roll < 0.99 ? 4 : 5].id;
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
  if (!collides(state, x, y, radius)) return { x, y };
  // Resolve landing and loot collisions locally instead of teleporting across the map.
  for (let ring = 1; ring <= 12; ring++) {
    for (let spoke = 0; spoke < 16; spoke++) {
      const angle = spoke * Math.PI / 8;
      const px = clamp(x + Math.cos(angle) * ring * 22, 65, WORLD_SIZE - 65);
      const py = clamp(y + Math.sin(angle) * ring * 22, 65, WORLD_SIZE - 65);
      if (!collides(state, px, py, radius)) return { x: px, y: py };
    }
  }
  return { x: 1400, y: 1400 };
}

function event(state, text, type = 'info') {
  state.events.unshift({ text, time: state.time, type });
  if (state.events.length > 8) state.events.length = 8;
}

function itemLoadout(weapon, rarity = 'common', ammo = WEAPONS[weapon].magazine, reserve = 90) {
  return { weapon, rarity: rarityInfo(rarity).id, ammo, reserve };
}

function addLoot(state, x, y, type, weapon, rarity, loadout) {
  const item = { id: `loot-${state.nextId++}`, ...safePosition(state, x, y, 10), type, alive: true };
  if (type === 'weapon') {
    item.weapon = Number.isInteger(weapon) ? weapon : Math.floor(state.random() * WEAPONS.length);
    item.rarity = rarityInfo(rarity || randomRarity(state)).id;
    item.ammo = loadout?.ammo ?? WEAPONS[item.weapon].magazine;
    item.reserve = loadout?.reserve ?? 75;
  }
  state.loot.push(item);
  return item;
}

function setActiveSlot(actor, slot) {
  actor.slot = slot;
  const item = actor.inventory[slot];
  actor.weapon = item.weapon;
  actor.rarity = item.rarity;
  actor.ammo = item.ammo;
  actor.reserve = item.reserve;
}

function syncInventory(actor) {
  const item = actor.inventory[actor.slot];
  if (item) Object.assign(item, { weapon: actor.weapon, rarity: actor.rarity, ammo: actor.ammo, reserve: actor.reserve });
}

function makeActor(state, spec, position, isBot, index) {
  const weapon = isBot ? (index % 9 === 0 ? 3 : index % 5) : 0;
  const rarity = isBot ? (state.random() < 0.24 ? 'uncommon' : 'common') : 'common';
  const item = itemLoadout(weapon, rarity, WEAPONS[weapon].magazine, isBot ? 150 : 150);
  const actor = {
    id: String(spec.id), name: String(spec.name || '旅人').slice(0, 16), ...position,
    vx: 0, vy: 0, radius: 17, angle: 0, hp: 100, shield: isBot ? 25 : 50,
    alive: true, color: spec.color || (isBot ? COLORS[index % COLORS.length] : '#f3c65c'),
    isPlayer: !isBot, isBot, weapon, rarity, ammo: item.ammo, reserve: item.reserve,
    inventory: [item], slot: 0, reloading: 0, cooldown: 0, medkits: isBot ? 1 : 2,
    kills: 0, placement: 0, hitFlash: 0, muzzleFlash: 0, healCooldown: 0,
    spawnProtection: state.phase === 'flight' ? 0 : isBot ? 0 : 6,
    dropState: state.phase === 'flight' ? 'plane' : 'ground', altitude: state.phase === 'flight' ? 1 : 0,
    dropTarget: { ...position }, dropElapsed: 0, jumpAt: 0.8 + state.random() * 8.7,
    aiTimer: state.random() * 0.5, aiTarget: null, aiReaction: 0, aiBurst: 0, aiPause: 0,
    aiAccuracyPhase: state.random() * Math.PI * 2, aiStrafe: index % 2 ? 1 : -1,
    wanderAngle: state.random() * Math.PI * 2, wanderTimer: 1 + state.random() * 2,
    aimSpeed: 2.3 + state.random() * 1.2, dodgeAngle: 0, dodgeTime: 0, lootTarget: null,
  };
  return actor;
}

export function createGame({ seed = Date.now(), botCount = 49, name = '旅人', difficulty = 'normal', players, multiplayer = false, drop = true } = {}) {
  const state = {
    worldSize: WORLD_SIZE, seed, random: randomGenerator(seed), nextId: 1, time: 0, combatTime: 0,
    status: 'playing', phase: drop ? 'flight' : 'combat', phaseRemaining: drop ? FLIGHT_DURATION : 35,
    multiplayer: Boolean(multiplayer), winnerId: null, difficulty,
    actors: [], obstacles: [], loot: [], bullets: [], particles: [],
    zone: { x: 1400, y: 1400, radius: 1780, nextRadius: 1100, phase: 0, remaining: 35 },
    drop: { remaining: drop ? FLIGHT_DURATION : 0, duration: FLIGHT_DURATION, plane: { x: 180, y: 800, angle: Math.atan2(1200, 2440) } },
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
  for (let i = 0; i < 180; i++) {
    const x = 100 + state.random() * 2600, y = 100 + state.random() * 2600;
    if (Math.abs(x - 1400) < 65 || Math.abs(y - 1400) < 65 || collides(state, x, y, 65)) continue;
    const type = i % 6 === 0 ? 'rock' : 'tree';
    const size = type === 'tree' ? 48 + state.random() * 22 : 36 + state.random() * 28;
    addObstacle(x, y, size, size, type);
  }
  for (let i = 0; i < 52; i++) {
    const p = safePosition(state, 110 + state.random() * 2580, 110 + state.random() * 2580, 36);
    if (Math.hypot(p.x - 1400, p.y - 1400) > 170) addObstacle(p.x, p.y, 40, 40, 'crate');
  }
  const supplied = Array.isArray(players) && players.length ? players : [{ id: 'player', name }];
  const ids = new Set();
  for (const spec of supplied.slice(0, 50)) {
    const id = String(spec.id ?? `player-${ids.size + 1}`);
    if (ids.has(id)) continue;
    ids.add(id);
    const index = state.actors.length;
    const angle = index * 2.4, radius = index === 0 ? 0 : 350 + index * 23;
    const position = safePosition(state, 1400 + Math.cos(angle) * radius, 1400 + Math.sin(angle) * radius);
    state.actors.push(makeActor(state, { ...spec, id }, position, false, index));
  }
  state.player = state.actors[0];
  const count = clamp(Math.floor(finite(botCount)), 0, 50 - state.actors.length);
  for (let i = 0; i < count; i++) {
    let id = `bot-${i + 1}`;
    while (ids.has(id)) id = `_${id}`;
    ids.add(id);
    const angle = state.random() * Math.PI * 2, radius = 400 + state.random() * 1000;
    const p = safePosition(state, 1400 + Math.cos(angle) * radius, 1400 + Math.sin(angle) * radius);
    const actor = makeActor(state, { id, name: BOT_NAMES[i % BOT_NAMES.length] }, p, true, i);
    const planeX = 180 + actor.jumpAt / LAST_JUMP * 2440;
    const planeY = 800 + actor.jumpAt / LAST_JUMP * 1200;
    actor.dropTarget = safePosition(state, planeX + (state.random() - 0.5) * 700, planeY + (state.random() - 0.5) * 1050);
    state.actors.push(actor);
  }
  if (drop) for (const actor of state.actors) { actor.x = state.drop.plane.x; actor.y = state.drop.plane.y; }
  for (let i = 0; i < 160; i++) addLoot(state, 110 + state.random() * 2580, 110 + state.random() * 2580, ['weapon', 'ammo', 'shield', 'medkit'][i % 4]);
  // One hidden cache of each quality guarantees all six tiers are discoverable each match.
  for (let i = 0; i < RARITIES.length; i++) addLoot(state, 280 + state.random() * 2240, 280 + state.random() * 2240, 'weapon', i % WEAPONS.length, RARITIES[i].id);
  addLoot(state, 1490, 1430, 'weapon', 1, 'uncommon');
  addLoot(state, 1330, 1460, 'shield');
  addLoot(state, 1470, 1320, 'ammo');
  event(state, drop ? '运输机已抵达荒岛。按空格跳伞，移动选择落点。' : '已抵达荒岛。收集物资，成为最后的幸存者。');
  return state;
}

export const aliveCount = state => state.actors.reduce((count, actor) => count + Number(actor.alive), 0);

export function reload(state, actor = state.player) {
  if (!combatReady(state, actor) || actor.reloading > 0 || actor.ammo >= WEAPONS[actor.weapon].magazine || actor.reserve <= 0) return false;
  actor.reloading = WEAPONS[actor.weapon].reloadTime;
  return true;
}

export function switchWeapon(state, slot, actor = state.player) {
  if (!combatReady(state, actor) || !Number.isInteger(slot) || slot < 0 || slot >= actor.inventory.length || slot === actor.slot) return false;
  syncInventory(actor);
  setActiveSlot(actor, slot);
  actor.reloading = 0;
  actor.cooldown = Math.max(actor.cooldown, 0.16);
  return true;
}

export function heal(state, actor = state.player) {
  if (!combatReady(state, actor) || actor.medkits <= 0 || actor.hp >= 100 || actor.healCooldown > 0) return false;
  actor.medkits--;
  actor.hp = Math.min(100, actor.hp + 55);
  actor.healCooldown = 4;
  if (actor.isPlayer) event(state, `${actor.name} 使用急救包`, 'heal');
  return true;
}

function canUseLoot(actor, item) {
  if (!item.alive) return false;
  if (item.type === 'ammo') return actor.reserve < 360;
  if (item.type === 'shield') return actor.shield < 100;
  if (item.type === 'medkit') return actor.medkits < 5;
  if (item.type === 'weapon') {
    const same = actor.inventory.find(slot => slot.weapon === item.weapon);
    return !same || rarityIndex(item.rarity) > rarityIndex(same.rarity) || same.reserve < 360;
  }
  return true;
}

export function describeNearby(state, actor = state.player) {
  if (!actor?.alive || actor.dropState !== 'ground') return null;
  let nearest = null, best = 88;
  for (const item of state.loot) {
    if (!canUseLoot(actor, item)) continue;
    const d = distance(actor, item);
    if (d < best) { nearest = item; best = d; }
  }
  for (const item of state.obstacles) {
    if (item.type !== 'crate' || !item.alive) continue;
    const d = distance(actor, item);
    if (d < best) { nearest = item; best = d; }
  }
  if (!nearest) return null;
  const labels = { ammo: '弹药补给', shield: '护盾补给', medkit: '急救包', crate: '物资箱' };
  return { ...nearest, label: nearest.type === 'weapon' ? `${rarityInfo(nearest.rarity).name} · ${WEAPONS[nearest.weapon].name}` : labels[nearest.type], distance: best };
}

function collectLoot(state, actor, item) {
  if (!canUseLoot(actor, item)) return false;
  syncInventory(actor);
  if (item.type === 'ammo') actor.reserve = Math.min(360, actor.reserve + 60);
  else if (item.type === 'shield') actor.shield = Math.min(100, actor.shield + 40);
  else if (item.type === 'medkit') actor.medkits++;
  else if (item.type === 'weapon') {
    const sameIndex = actor.inventory.findIndex(slot => slot.weapon === item.weapon);
    const same = actor.inventory[sameIndex];
    const candidate = itemLoadout(item.weapon, item.rarity, item.ammo ?? WEAPONS[item.weapon].magazine, item.reserve ?? 75);
    if (same && rarityIndex(candidate.rarity) <= rarityIndex(same.rarity)) {
      same.reserve = Math.min(360, same.reserve + Math.max(30, candidate.reserve));
      if (actor.slot === sameIndex) actor.reserve = same.reserve;
    } else {
      let slot = same ? sameIndex : actor.inventory.length < 3 ? actor.inventory.length : actor.slot;
      const previous = actor.inventory[slot];
      if (previous) addLoot(state, actor.x + 34, actor.y + 34, 'weapon', previous.weapon, previous.rarity, previous);
      actor.inventory[slot] = candidate;
      setActiveSlot(actor, slot);
      actor.reloading = 0;
      actor.cooldown = 0.18;
    }
  }
  item.alive = false;
  syncInventory(actor);
  if (actor.isPlayer) event(state, `拾取 ${item.type === 'weapon' ? `${rarityInfo(item.rarity).name} · ${WEAPONS[item.weapon].name}` : { ammo: '弹药 +60', shield: '护盾 +40', medkit: '急救包 +1' }[item.type]}`, 'loot');
  return true;
}

function burst(state, x, y, color, count = 6) {
  for (let i = 0; i < count; i++) {
    const angle = state.random() * Math.PI * 2, speed = 45 + state.random() * 140, life = 0.18 + state.random() * 0.28;
    state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, maxLife: life, color, size: 2 + state.random() * 3 });
  }
}

function openCrate(state, crate) {
  if (!crate?.alive) return;
  crate.alive = false;
  burst(state, crate.x, crate.y, '#dcb477', 12);
  addLoot(state, crate.x, crate.y, 'weapon');
  addLoot(state, crate.x + 32, crate.y + 25, 'ammo');
  if (state.random() > 0.45) addLoot(state, crate.x - 32, crate.y + 25, 'shield');
}

export function pickup(state, actor = state.player) {
  if (!combatReady(state, actor)) return false;
  const nearby = describeNearby(state, actor);
  if (!nearby) return false;
  if (nearby.type === 'crate') { openCrate(state, state.obstacles.find(o => o.id === nearby.id)); return true; }
  return collectLoot(state, actor, state.loot.find(item => item.id === nearby.id));
}

function finishMatch(state) {
  const survivors = state.actors.filter(actor => actor.alive);
  if (survivors.length > 1) return;
  const winner = survivors[0];
  state.winnerId = winner?.id ?? null;
  if (winner) { winner.placement = 1; winner.vx = 0; winner.vy = 0; }
  state.phase = 'finished';
  state.phaseRemaining = 0;
  if (state.multiplayer) state.status = 'finished';
  else { state.status = winner?.id === state.player.id ? 'won' : 'lost'; state.placement = state.player.placement; }
  event(state, winner ? `${winner.name} 成为最后的幸存者！` : '风暴吞没了荒岛', 'win');
}

function eliminate(state, actor, owner) {
  if (!actor.alive) return;
  actor.placement = aliveCount(state);
  actor.alive = false;
  actor.hp = 0;
  actor.vx = 0; actor.vy = 0;
  syncInventory(actor);
  burst(state, actor.x, actor.y, actor.color, 14);
  for (const [index, item] of actor.inventory.entries()) addLoot(state, actor.x + index * 30, actor.y, 'weapon', item.weapon, item.rarity, item);
  addLoot(state, actor.x + 22, actor.y - 20, 'ammo');
  if (actor.medkits > 0) addLoot(state, actor.x - 25, actor.y + 25, 'medkit');
  if (owner && owner.id !== actor.id) {
    owner.kills++;
    if (owner.id === state.player.id) state.kills = owner.kills;
    event(state, `${owner.name}  淘汰了  ${actor.name}`, owner.isPlayer ? 'kill' : 'combat');
  } else event(state, `${actor.name} 未能撤离风暴`, 'storm');
  if (actor.id === state.player.id) state.placement = actor.placement;
  if (!state.multiplayer && actor.id === state.player.id) { state.status = 'lost'; state.phase = 'finished'; state.phaseRemaining = 0; }
}

function damageActor(state, actor, damage, owner, bypassShield = false) {
  if (!combatReady(state, actor) || actor.spawnProtection > 0 && owner) return;
  actor.hitFlash = 0.12;
  if (!bypassShield) { const absorbed = Math.min(actor.shield, damage); actor.shield -= absorbed; damage -= absorbed; }
  actor.hp -= damage;
  if (actor.hp <= 0) eliminate(state, actor, owner);
}

function shoot(state, actor) {
  if (!combatReady(state, actor) || actor.cooldown > 0 || actor.reloading > 0) return;
  if (actor.ammo <= 0) { reload(state, actor); return; }
  const weapon = WEAPONS[actor.weapon], quality = rarityInfo(actor.rarity);
  actor.ammo--;
  actor.cooldown = weapon.fireRate;
  const x = actor.x + Math.cos(actor.angle) * 26, y = actor.y + Math.sin(actor.angle) * 26;
  for (let i = 0; i < weapon.pellets; i++) {
    const angle = actor.angle + (state.random() - 0.5) * weapon.spread * 2;
    state.bullets.push({ x, y, px: x, py: y, vx: Math.cos(angle) * weapon.speed, vy: Math.sin(angle) * weapon.speed, owner: actor.id, damage: weapon.damage * quality.damageMultiplier, life: weapon.range / weapon.speed, color: quality.color });
  }
  actor.muzzleFlash = 0.05;
  syncInventory(actor);
}

function segmentCircle(x1, y1, x2, y2, cx, cy, radius) {
  const dx = x2 - x1, dy = y2 - y1, ox = x1 - cx, oy = y1 - cy, a = dx * dx + dy * dy, c = ox * ox + oy * oy - radius * radius;
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
    else { let a = (low - start) / delta, b = (high - start) / delta; if (a > b) [a, b] = [b, a]; min = Math.max(min, a); max = Math.min(max, b); if (min > max) return Infinity; }
  }
  return min >= 0 && min <= 1 ? min : Infinity;
}

function obstacleHit(x1, y1, x2, y2, obstacle) {
  return obstacle.type === 'tree' || obstacle.type === 'rock'
    ? segmentCircle(x1, y1, x2, y2, obstacle.x, obstacle.y, obstacle.w / 2)
    : segmentRect(x1, y1, x2, y2, obstacle);
}

function lineOfSight(state, a, b) {
  return !state.obstacles.some(o => o.alive && obstacleHit(a.x, a.y, b.x, b.y, o) !== Infinity);
}

function moveActor(state, actor, moveX, moveY, speed, dt) {
  const length = Math.hypot(moveX, moveY), targetX = moveX / Math.max(1, length) * speed, targetY = moveY / Math.max(1, length) * speed;
  const acceleration = actor.isBot ? 660 : 2000;
  const dx = targetX - actor.vx, dy = targetY - actor.vy, change = Math.hypot(dx, dy), factor = change ? Math.min(1, acceleration * dt / change) : 0;
  actor.vx += dx * factor; actor.vy += dy * factor;
  const nextX = clamp(actor.x + actor.vx * dt, actor.radius + 24, WORLD_SIZE - actor.radius - 24);
  const nextY = clamp(actor.y + actor.vy * dt, actor.radius + 24, WORLD_SIZE - actor.radius - 24);
  const oldX = actor.x, oldY = actor.y;
  if (!collides(state, nextX, actor.y, actor.radius)) actor.x = nextX; else actor.vx = 0;
  if (!collides(state, actor.x, nextY, actor.radius)) actor.y = nextY; else actor.vy = 0;
  return Math.hypot(actor.x - oldX, actor.y - oldY);
}

function turnToward(actor, desired, dt) {
  actor.angle += clamp(angleDifference(desired, actor.angle), -actor.aimSpeed * dt, actor.aimSpeed * dt);
  actor.angle = Math.atan2(Math.sin(actor.angle), Math.cos(actor.angle));
}

function botThink(state, actor) {
  const prior = actor.aiTarget;
  let target = state.actors.find(other => other.id === prior && other.alive && other.dropState === 'ground');
  let best = target && distance(actor, target) < 710 && lineOfSight(state, actor, target) ? distance(actor, target) * 0.77 : Infinity;
  if (best === Infinity) target = null;
  for (const other of state.actors) {
    if (!other.alive || other.id === actor.id || other.dropState !== 'ground' || other.spawnProtection > 0) continue;
    const d = distance(actor, other);
    if (d < 610 && d < best && lineOfSight(state, actor, other)) { target = other; best = d; }
  }
  actor.aiTarget = target?.id ?? null;
  if (actor.aiTarget !== prior) { actor.aiReaction = state.difficulty === 'hard' ? 0.22 : state.difficulty === 'easy' ? 0.8 : 0.48; actor.aiBurst = 0; }
  actor.lootTarget = null;
  if (!target || actor.hp < 40 || actor.shield < 30) {
    let score = 340;
    for (const item of state.loot) {
      if (!canUseLoot(actor, item)) continue;
      if (item.type === 'weapon') {
        const same = actor.inventory.find(slot => slot.weapon === item.weapon);
        if (same && rarityIndex(item.rarity) <= rarityIndex(same.rarity)) continue;
        if (!same && actor.inventory.length >= 3 && rarityIndex(item.rarity) <= rarityIndex(actor.rarity)) continue;
      }
      const d = distance(actor, item);
      const value = item.type === 'shield' && actor.shield < 30 ? d * 0.65 : d;
      if (value < score && lineOfSight(state, actor, item)) { score = value; actor.lootTarget = item.id; }
    }
  }
}

function botUpdate(state, actor, dt) {
  actor.aiTimer -= dt;
  actor.aiReaction = Math.max(0, actor.aiReaction - dt);
  actor.aiPause = Math.max(0, actor.aiPause - dt);
  actor.wanderTimer -= dt;
  actor.dodgeTime = Math.max(0, actor.dodgeTime - dt);
  if (actor.aiTimer <= 0) { actor.aiTimer = 0.35 + state.random() * 0.25; botThink(state, actor); }
  if (actor.wanderTimer <= 0) { actor.wanderAngle += (state.random() - 0.5) * 1.3; actor.wanderTimer = 1.5 + state.random() * 2.5; }
  const target = state.actors.find(other => other.id === actor.aiTarget && other.alive);
  const loot = state.loot.find(item => item.id === actor.lootTarget && item.alive);
  const zoneDistance = Math.hypot(actor.x - state.zone.x, actor.y - state.zone.y);
  let direction = actor.wanderAngle, pace = 0.55, aim = direction;
  if (target) {
    const d = distance(actor, target), direct = Math.atan2(target.y - actor.y, target.x - actor.x);
    const error = state.difficulty === 'hard' ? 0.055 : state.difficulty === 'easy' ? 0.21 : 0.12;
    aim = direct + Math.sin(state.time * 1.4 + actor.aiAccuracyPhase) * error;
    direction = direct + (d < 170 ? Math.PI * 0.8 * actor.aiStrafe : d < 370 ? Math.PI * 0.43 * actor.aiStrafe : 0);
    pace = d < 370 ? 0.6 : 0.85;
    if (actor.aiReaction <= 0 && actor.aiPause <= 0 && Math.abs(angleDifference(aim, actor.angle)) < 0.16 && d < WEAPONS[actor.weapon].range * 0.88 && lineOfSight(state, actor, target)) {
      if (actor.aiBurst <= 0) actor.aiBurst = state.difficulty === 'easy' ? 2 : 3 + Math.floor(state.random() * 4);
      if (actor.cooldown <= 0 && actor.reloading <= 0) {
        const ammoBefore = actor.ammo;
        shoot(state, actor);
        if (actor.ammo < ammoBefore && --actor.aiBurst <= 0) actor.aiPause = state.difficulty === 'hard' ? 0.22 + state.random() * 0.3 : 0.55 + state.random() * 0.7;
      }
    }
  }
  if (zoneDistance > Math.max(8, state.zone.radius - 100)) { direction = Math.atan2(state.zone.y - actor.y, state.zone.x - actor.x); pace = 1; }
  else if (loot && (!target || actor.hp < 40 || actor.shield < 30)) {
    direction = Math.atan2(loot.y - actor.y, loot.x - actor.x); pace = 0.8;
    if (distance(actor, loot) < 42) collectLoot(state, actor, loot);
  }
  if (!target) aim = direction;
  turnToward(actor, aim, dt);
  // Keep a chosen avoidance side for a moment; repeated collision checks never flip directions each frame.
  const aheadX = actor.x + Math.cos(direction) * 65, aheadY = actor.y + Math.sin(direction) * 65;
  if (actor.dodgeTime <= 0 && collides(state, aheadX, aheadY, actor.radius + 4)) {
    const side = actor.aiStrafe;
    actor.dodgeAngle = direction + side * 1.15;
    if (collides(state, actor.x + Math.cos(actor.dodgeAngle) * 65, actor.y + Math.sin(actor.dodgeAngle) * 65, actor.radius + 4)) actor.dodgeAngle = direction - side * 1.15;
    actor.dodgeTime = 0.7;
  }
  if (actor.dodgeTime > 0) direction = actor.dodgeAngle;
  const moved = moveActor(state, actor, Math.cos(direction) * pace, Math.sin(direction) * pace, 184, dt);
  if (moved < 0.05 && actor.dodgeTime <= 0) { actor.wanderAngle += actor.aiStrafe * 1.1; actor.dodgeAngle = direction + actor.aiStrafe * 1.6; actor.dodgeTime = 0.9; }
  if (actor.ammo < 1 || !target && actor.ammo < WEAPONS[actor.weapon].magazine * 0.4) reload(state, actor);
  if (actor.hp < 45 && (!target || distance(actor, target) > 280)) heal(state, actor);
}

function jumpActor(state, actor) {
  actor.dropState = 'falling'; actor.altitude = 1; actor.dropElapsed = 0;
  actor.x = clamp(state.drop.plane.x, 65, WORLD_SIZE - 65); actor.y = clamp(state.drop.plane.y, 65, WORLD_SIZE - 65);
  if (!actor.isBot) actor.dropTarget = { x: actor.x + 100, y: actor.y + 45 };
  actor.vx = Math.cos(state.drop.plane.angle) * 50; actor.vy = Math.sin(state.drop.plane.angle) * 50;
  actor.angle = state.drop.plane.angle;
}

function updateFlight(state, dt, inputs) {
  const progress = state.time / LAST_JUMP;
  state.drop.plane.x = 180 + progress * 2440;
  state.drop.plane.y = 800 + progress * 1200;
  state.drop.remaining = Math.max(0, FLIGHT_DURATION - state.time);
  state.phaseRemaining = state.drop.remaining;
  for (const actor of state.actors) {
    const input = inputs[actor.id] || {};
    if (actor.dropState === 'plane') {
      actor.x = state.drop.plane.x; actor.y = state.drop.plane.y; actor.angle = state.drop.plane.angle;
      if (state.time >= LAST_JUMP || actor.isBot && state.time >= actor.jumpAt || !actor.isBot && input.jump) jumpActor(state, actor);
    }
    if (actor.dropState === 'falling') {
      actor.dropElapsed += dt;
      actor.altitude = clamp(1 - actor.dropElapsed / DESCENT_DURATION, 0, 1);
      let dx = finite(input.moveX), dy = finite(input.moveY);
      if (actor.isBot) { dx = actor.dropTarget.x - actor.x; dy = actor.dropTarget.y - actor.y; const d = Math.hypot(dx, dy); if (d > 1) { dx /= d; dy /= d; } }
      const length = Math.max(1, Math.hypot(dx, dy));
      const targetX = dx / length * 195, targetY = dy / length * 195;
      const smoothing = Math.min(1, dt * 5);
      actor.vx += (targetX - actor.vx) * smoothing; actor.vy += (targetY - actor.vy) * smoothing;
      actor.x = clamp(actor.x + actor.vx * dt, 65, WORLD_SIZE - 65); actor.y = clamp(actor.y + actor.vy * dt, 65, WORLD_SIZE - 65);
      if (Math.hypot(actor.vx, actor.vy) > 10) turnToward(actor, Math.atan2(actor.vy, actor.vx), dt);
      if (actor.altitude <= 0 || state.time >= FLIGHT_DURATION) {
        Object.assign(actor, safePosition(state, actor.x, actor.y));
        actor.dropState = 'ground'; actor.altitude = 0; actor.vx = 0; actor.vy = 0;
      }
    } else if (actor.dropState === 'ground' && !actor.isBot) {
      if (Number.isFinite(input.angle)) actor.angle = input.angle;
      moveActor(state, actor, finite(input.moveX), finite(input.moveY), 225, dt);
    }
  }
  if (state.time >= FLIGHT_DURATION - 1e-8) {
    for (const actor of state.actors) {
      if (actor.dropState !== 'ground') Object.assign(actor, safePosition(state, actor.x, actor.y), { dropState: 'ground', altitude: 0, vx: 0, vy: 0 });
      actor.spawnProtection = actor.isBot ? 0 : 2;
    }
    state.phase = 'combat'; state.phaseRemaining = 35; state.drop.remaining = 0;
    event(state, '全员着陆，战斗开始！', 'info');
  }
}

function updateZone(state, dt) {
  let elapsed = state.combatTime, phase = 0;
  while (phase < PHASES.length - 1 && elapsed > PHASES[phase].duration) elapsed -= PHASES[phase++].duration;
  const settings = PHASES[phase];
  if (state.zone.phase !== phase) event(state, `风暴阶段 ${phase}：向安全区移动`, 'storm');
  state.zone.phase = phase;
  state.zone.radius = settings.start + (settings.end - settings.start) * clamp(elapsed / settings.duration, 0, 1);
  state.zone.nextRadius = PHASES[Math.min(phase + 1, PHASES.length - 1)].end;
  state.zone.remaining = Math.max(0, settings.duration - elapsed);
  state.phaseRemaining = state.zone.remaining;
  for (const actor of state.actors) if (actor.alive && distance(actor, state.zone) > state.zone.radius) damageActor(state, actor, settings.damage * dt, null, true);
}

function updateBullets(state, dt) {
  for (const bullet of state.bullets) {
    if (bullet.life <= 0) continue;
    bullet.px = bullet.x; bullet.py = bullet.y;
    const travelTime = Math.min(dt, bullet.life), nx = bullet.x + bullet.vx * travelTime, ny = bullet.y + bullet.vy * travelTime;
    let hit = null, first = Infinity, kind = '';
    for (const obstacle of state.obstacles) {
      if (!obstacle.alive) continue;
      const t = obstacleHit(bullet.x, bullet.y, nx, ny, obstacle);
      if (t < first) { first = t; hit = obstacle; kind = 'obstacle'; }
    }
    for (const actor of state.actors) {
      if (!actor.alive || actor.id === bullet.owner || actor.dropState !== 'ground') continue;
      const t = segmentCircle(bullet.x, bullet.y, nx, ny, actor.x, actor.y, actor.radius);
      if (t < first) { first = t; hit = actor; kind = 'actor'; }
    }
    bullet.x = first === Infinity ? nx : bullet.x + (nx - bullet.x) * first;
    bullet.y = first === Infinity ? ny : bullet.y + (ny - bullet.y) * first;
    bullet.life -= dt;
    if (hit) {
      bullet.life = 0;
      if (kind === 'actor') { damageActor(state, hit, bullet.damage, state.actors.find(actor => actor.id === bullet.owner)); burst(state, bullet.x, bullet.y, hit.shield > 0 ? '#92e0ed' : '#f5d39b', 4); }
      else { hit.hp -= bullet.damage; burst(state, bullet.x, bullet.y, '#d0c2a3', 3); if (hit.hp <= 0) { if (hit.type === 'crate') openCrate(state, hit); else hit.alive = false; } }
    }
  }
  state.bullets = state.bullets.filter(bullet => bullet.life > 0);
}

function stepFrame(state, dt, inputs) {
  state.time += dt;
  if (state.phase === 'flight') { updateFlight(state, dt, inputs); return; }
  state.combatTime += dt;
  for (const actor of state.actors) {
    if (!actor.alive || actor.dropState !== 'ground') continue;
    for (const key of ['cooldown', 'hitFlash', 'muzzleFlash', 'spawnProtection', 'healCooldown']) actor[key] = Math.max(0, actor[key] - dt);
    if (actor.reloading > 0) {
      actor.reloading = Math.max(0, actor.reloading - dt);
      if (actor.reloading === 0) { const amount = Math.min(WEAPONS[actor.weapon].magazine - actor.ammo, actor.reserve); actor.ammo += amount; actor.reserve -= amount; syncInventory(actor); }
    }
    if (actor.isBot) botUpdate(state, actor, dt);
    else {
      const input = inputs[actor.id] || {};
      if (Number.isFinite(input.angle)) actor.angle = input.angle;
      moveActor(state, actor, finite(input.moveX), finite(input.moveY), input.sprint && !input.shoot ? 295 : 225, dt);
      if (input.shoot) shoot(state, actor);
    }
  }
  updateBullets(state, dt);
  for (const particle of state.particles) { particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.life -= dt; }
  state.particles = state.particles.filter(particle => particle.life > 0).slice(-300);
  updateZone(state, dt);
  if (state.status === 'playing') finishMatch(state);
}

export function stepGame(state, dt, inputs = {}) {
  if (state.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return state;
  let remaining = Math.min(dt, 0.2);
  while (remaining > 1e-8 && state.status === 'playing') {
    const delta = Math.min(0.05, remaining);
    stepFrame(state, delta, inputs || {});
    remaining -= delta;
  }
  return state;
}

export function updateGame(state, dt, input = {}) {
  return stepGame(state, dt, { [state.player.id]: input });
}
