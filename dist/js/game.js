// Authoritative, browser-independent simulation. Every position is a world-space center.
export const WORLD_SIZE = 8400;
export const REGIONS = [
  { id: 'pine', name: '杉林哨站', x: 1800, y: 2000, style: 0 },
  { id: 'north', name: '北岸农场', x: 4200, y: 2000, style: 1 },
  { id: 'mist', name: '晨雾山庄', x: 6600, y: 2000, style: 2 },
  { id: 'west', name: '西风营地', x: 1800, y: 4200, style: 1 },
  { id: 'oasis', name: '绿洲小镇', x: 4200, y: 4200, style: 0 },
  { id: 'redrock', name: '红岩工坊', x: 6600, y: 4200, style: 2 },
  { id: 'tide', name: '潮汐码头', x: 1800, y: 6400, style: 2 },
  { id: 'south', name: '南野牧场', x: 4200, y: 6400, style: 1 },
  { id: 'sunset', name: '落日别院', x: 6600, y: 6400, style: 0 },
];
export const RARITIES = [
  { id: 'common', name: '普通', color: '#b3bcc0', damageMultiplier: 1 },
  { id: 'uncommon', name: '优秀', color: '#76c98a', damageMultiplier: 1.05 },
  { id: 'rare', name: '稀有', color: '#6eb5ed', damageMultiplier: 1.10 },
  { id: 'epic', name: '史诗', color: '#bb91e5', damageMultiplier: 1.16 },
  { id: 'legendary', name: '传说', color: '#f2be54', damageMultiplier: 1.23 },
  { id: 'mythic', name: '神话', color: '#f27d85', damageMultiplier: 1.31 },
];
export const WEAPONS = [
  { id: 'rifle', name: '突击步枪', skinName: '游骑兵', category: '步枪', role: '中距离均衡连射', color: '#f2c45c', damage: 18, magazine: 30, fireRate: 0.135, reloadTime: 1.7, speed: 1060, spread: 0.045, pellets: 1, range: 760 },
  { id: 'smg', name: '冲锋枪', skinName: '潮汐', category: '冲锋枪', role: '近距离快速追击', color: '#6dd5ce', damage: 11, magazine: 36, fireRate: 0.075, reloadTime: 1.45, speed: 920, spread: 0.10, pellets: 1, range: 540 },
  { id: 'shotgun', name: '霰弹枪', skinName: '赤砂', category: '霰弹枪', role: '近身高伤散射', color: '#df9a74', damage: 11, magazine: 6, fireRate: 0.72, reloadTime: 2, speed: 930, spread: 0.24, pellets: 7, range: 360 },
  { id: 'marksman', name: '精确步枪', skinName: '夜莺', category: '狙击枪', role: '远距离精准追射', color: '#bca0e9', damage: 46, magazine: 8, fireRate: 0.68, reloadTime: 2, speed: 1450, spread: 0.016, pellets: 1, range: 1050 },
  { id: 'pistol', name: '手枪', skinName: '信使', category: '手枪', role: '轻便可靠的副武器', color: '#b5c2c2', damage: 22, magazine: 12, fireRate: 0.27, reloadTime: 1.1, speed: 1000, spread: 0.035, pellets: 1, range: 620 },
  { id: 'carbine', name: '卡宾步枪', skinName: '青锋', category: '步枪', role: '轻快点杀与快速换弹', color: '#9fcbb8', damage: 15, magazine: 24, fireRate: 0.105, reloadTime: 1.25, speed: 1180, spread: 0.028, pellets: 1, range: 700 },
  { id: 'burst', name: '三连发步枪', skinName: '脉冲', category: '步枪', role: '三发短点射后重新瞄准', color: '#83afd7', damage: 20, magazine: 27, fireRate: 0.60, burstCount: 3, burstInterval: 0.085, reloadTime: 1.85, speed: 1250, spread: 0.028, pellets: 1, range: 860 },
  { id: 'lmg', name: '轻机枪', skinName: '壁垒', category: '机枪', role: '大弹匣持续压制，持枪较慢', color: '#c3b078', damage: 16, magazine: 70, fireRate: 0.105, reloadTime: 3.8, speed: 1030, spread: 0.095, pellets: 1, range: 820, moveMultiplier: 0.85 },
  { id: 'sniper', name: '重型狙击枪', skinName: '远星', category: '狙击枪', role: '超远程重击，射击间隔长', color: '#afa3d8', damage: 84, magazine: 5, fireRate: 1.38, reloadTime: 2.9, speed: 1750, spread: 0.006, pellets: 1, range: 1380, moveMultiplier: 0.92 },
  { id: 'autoshotgun', name: '连发霰弹枪', skinName: '燎原', category: '霰弹枪', role: '贴身连续散射，远距衰弱', color: '#d79e83', damage: 9, magazine: 8, fireRate: 0.36, reloadTime: 2.75, speed: 880, spread: 0.30, pellets: 6, range: 260 },
  { id: 'revolver', name: '大口径左轮', skinName: '黄昏', category: '手枪', role: '六发精准重弹', color: '#bd9b77', damage: 40, magazine: 6, fireRate: 0.48, reloadTime: 1.85, speed: 1180, spread: 0.018, pellets: 1, range: 740 },
  { id: 'vector', name: '高速冲锋枪', skinName: '萤火', category: '冲锋枪', role: '极快射速，短弹匣近战', color: '#a6d586', damage: 8, magazine: 24, fireRate: 0.045, reloadTime: 1.35, speed: 860, spread: 0.16, pellets: 1, range: 400 },
  { id: 'suppressed', name: '消音步枪', skinName: '雾隐', category: '步枪', role: '低枪口焰的稳定中程连射', color: '#94b0ac', damage: 17, magazine: 25, fireRate: 0.15, reloadTime: 1.65, speed: 1120, spread: 0.022, pellets: 1, range: 810, suppressed: true },
  { id: 'doublebarrel', name: '双管霰弹枪', skinName: '荒原', category: '霰弹枪', role: '两次猛烈散射后整枪装填', color: '#d9b49b', damage: 10, magazine: 2, fireRate: 0.28, reloadTime: 2.3, speed: 970, spread: 0.22, pellets: 10, range: 300 },
];
const BUILDING_KINDS = ['cottage', 'villa', 'workshop', 'barn', 'store', 'clinic'];

const BOT_NAMES = ['山雀', '北风', '青柠', '野火', '渡鸦', '猎户', '杉木', '夜航', '游隼', '小满', '拾光', '薄荷', '星尘', '木槿', '海盐', '晚风', '松果', '霜叶', '远山', '流萤', '白鲨', '云雀', '飞鱼', '石榴', '极光', '岩鹿', '海鸥', '火花', '月白', '栗子', '乌桕', '白露', '苍耳', '海棠', '归雁', '新月', '落雪', '寒江', '阿橙', '青川', '海风', '晨星', '雪貂', '泡芙', '鲸落', '胡桃', '银杏', '山茶', '纸鸢'];
const COLORS = ['#de8a72', '#ba9cce', '#7ac0c3', '#ddb767', '#a6c87e', '#de98bc'];
const FLIGHT_DURATION = 14;
const LAST_JUMP = 10;
const DESCENT_DURATION = 4;
const PHASES = [
  { duration: 90, start: 6000, end: 6000, damage: 2 },
  { duration: 60, start: 6000, end: 3800, damage: 3 },
  { duration: 55, start: 3800, end: 2500, damage: 5 },
  { duration: 50, start: 2500, end: 1400, damage: 7 },
  { duration: 40, start: 1400, end: 700, damage: 10 },
  { duration: 32, start: 700, end: 280, damage: 14 },
  { duration: 26, start: 280, end: 70, damage: 20 },
  { duration: 20, start: 70, end: 0, damage: 32 },
];
const WALL_WIDTH = 14;
const OBSTACLE_CELL = 256;
const obstacleIndexes = new WeakMap();
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
const finite = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rarityInfo = id => RARITIES.find(rarity => rarity.id === id) || RARITIES[0];
const rarityIndex = id => Math.max(0, RARITIES.findIndex(rarity => rarity.id === id));
const angleDifference = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const combatReady = (state, actor) => state.status === 'playing' && state.phase !== 'finished' && actor?.alive && actor.dropState === 'ground';

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

function obstacleCandidates(state, minX, minY, maxX, maxY) {
  if (state.generating) return state.obstacles;
  let cached = obstacleIndexes.get(state);
  if (!cached || cached.source !== state.obstacles || cached.length !== state.obstacles.length) {
    const cells = new Map();
    for (const item of state.obstacles) {
      for (let x = Math.floor((item.x - item.w / 2) / OBSTACLE_CELL); x <= Math.floor((item.x + item.w / 2) / OBSTACLE_CELL); x++) {
        for (let y = Math.floor((item.y - item.h / 2) / OBSTACLE_CELL); y <= Math.floor((item.y + item.h / 2) / OBSTACLE_CELL); y++) {
          const key = `${x},${y}`;
          if (!cells.has(key)) cells.set(key, []);
          cells.get(key).push(item);
        }
      }
    }
    cached = { source: state.obstacles, length: state.obstacles.length, cells };
    obstacleIndexes.set(state, cached);
  }
  const candidates = new Set();
  for (let x = Math.floor(minX / OBSTACLE_CELL); x <= Math.floor(maxX / OBSTACLE_CELL); x++) {
    for (let y = Math.floor(minY / OBSTACLE_CELL); y <= Math.floor(maxY / OBSTACLE_CELL); y++) {
      for (const item of cached.cells.get(`${x},${y}`) || []) candidates.add(item);
    }
  }
  return candidates;
}

function collides(state, x, y, radius) {
  for (const obstacle of obstacleCandidates(state, x - radius, y - radius, x + radius, y + radius)) {
    if (!obstacle.alive) continue;
    if (obstacle.type === 'tree' || obstacle.type === 'rock') {
      if (Math.hypot(x - obstacle.x, y - obstacle.y) < radius + obstacle.w / 2) return true;
    } else if (rectangleCircleCollision(x, y, radius, obstacle)) return true;
  }
  return false;
}

function withinBuilding(building, point, margin = 0) {
  return Math.abs(point.x - building.x) < building.w / 2 + margin && Math.abs(point.y - building.y) < building.h / 2 + margin;
}

function doorway(building) {
  const normal = { north: { x: 0, y: -1 }, south: { x: 0, y: 1 }, east: { x: 1, y: 0 }, west: { x: -1, y: 0 } }[building.doorSide];
  const x = building.x + normal.x * building.w / 2, y = building.y + normal.y * building.h / 2;
  return { inner: { x: x - normal.x * 60, y: y - normal.y * 60 }, outer: { x: x + normal.x * 65, y: y + normal.y * 65 } };
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
  return { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
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
  const building = state.buildings.find(building => withinBuilding(building, item, -WALL_WIDTH));
  if (building) item.buildingId = building.id;
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
  const weapon = isBot ? index % WEAPONS.length : 0;
  const rarity = isBot ? (state.random() < 0.24 ? 'uncommon' : 'common') : 'common';
  const item = itemLoadout(weapon, rarity, WEAPONS[weapon].magazine, isBot ? 150 : 150);
  const actor = {
    id: String(spec.id), name: String(spec.name || '旅人').slice(0, 16), ...position,
    vx: 0, vy: 0, radius: 17, angle: 0, hp: 100, shield: isBot ? 25 : 50,
    alive: true, color: spec.color || (isBot ? COLORS[index % COLORS.length] : '#f3c65c'),
    isPlayer: !isBot, isBot, weapon, rarity, ammo: item.ammo, reserve: item.reserve,
    inventory: [item], slot: 0, reloading: 0, cooldown: 0, burstRemaining: 0, burstCooldown: 0, burstWeapon: null, lastShotAt: -1000, lastTriggerAt: -1000, medkits: isBot ? 1 : 2,
    kills: 0, placement: 0, hitFlash: 0, muzzleFlash: 0, healCooldown: 0,
    spawnProtection: state.phase === 'flight' ? 0 : isBot ? 0 : 6,
    dropState: state.phase === 'flight' ? 'plane' : 'ground', altitude: state.phase === 'flight' ? 1 : 0,
    dropTarget: { ...position }, dropElapsed: 0, jumpAt: 0.8 + state.random() * 8.7,
    aiTimer: state.random() * 0.5, aiTarget: null, aiReaction: 0, aiBurst: 0, aiPause: 0,
    aiAccuracyPhase: state.random() * Math.PI * 2, aiStrafe: index % 2 ? 1 : -1,
    wanderAngle: state.random() * Math.PI * 2, wanderTimer: 1 + state.random() * 2,
    aimSpeed: 2.3 + state.random() * 1.2, dodgeAngle: 0, dodgeTime: 0, lootTarget: null, crateTarget: null,
    navPath: [], navGoal: null, navTimer: 0, patrolRegion: index % REGIONS.length,
  };
  return actor;
}

export function createGame({ seed = Date.now(), botCount = 49, name = '旅人', difficulty = 'normal', players, multiplayer = false, drop = true } = {}) {
  const state = {
    worldSize: WORLD_SIZE, seed, random: randomGenerator(seed), nextId: 1, time: 0, combatTime: 0,
    status: 'playing', phase: drop ? 'flight' : 'combat', phaseRemaining: drop ? FLIGHT_DURATION : PHASES[0].duration,
    multiplayer: Boolean(multiplayer), winnerId: null, difficulty, generating: true,
    actors: [], obstacles: [], buildings: [], regions: REGIONS.map(region => ({ ...region })), loot: [], bullets: [], particles: [],
    zone: { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2, radius: PHASES[0].start, nextRadius: PHASES[1].end, phase: 0, remaining: PHASES[0].duration },
    drop: { remaining: drop ? FLIGHT_DURATION : 0, duration: FLIGHT_DURATION, route: { start: { x: 600, y: 4200 }, end: { x: 7800, y: 4200 } }, plane: { x: 600, y: 4200, angle: 0 } },
    kills: 0, events: [], placement: 0,
  };
  const addObstacle = (x, y, w, h, type, buildingId) => {
    const hp = type === 'crate' ? 42 : type === 'tree' ? 120 : Infinity;
    const obstacle = { id: `obstacle-${state.nextId++}`, x, y, w, h, type, hp, maxHp: hp, alive: true };
    if (buildingId) obstacle.buildingId = buildingId;
    state.obstacles.push(obstacle);
  };
  const addBuilding = (region, index, dx, dy, w, h) => {
    const building = { id: `${region.id}-house-${index + 1}`, x: region.x + dx, y: region.y + dy, w, h, doorSide: index === 0 ? 'east' : index === 1 ? 'west' : 'north', doorWidth: 110, style: (region.style + index) % 3, kind: BUILDING_KINDS[(state.regions.indexOf(region) + index * 2) % BUILDING_KINDS.length], name: region.name };
    state.buildings.push(building);
    for (const side of ['north', 'south', 'west', 'east']) {
      const horizontal = side === 'north' || side === 'south';
      const length = horizontal ? w : h;
      const fixed = horizontal ? building.y + (side === 'north' ? -h / 2 : h / 2) : building.x + (side === 'west' ? -w / 2 : w / 2);
      if (side === building.doorSide) {
        const segment = (length - building.doorWidth) / 2;
        const offset = building.doorWidth / 2 + segment / 2;
        for (const sign of [-1, 1]) addObstacle(horizontal ? building.x + sign * offset : fixed, horizontal ? fixed : building.y + sign * offset, horizontal ? segment : WALL_WIDTH, horizontal ? WALL_WIDTH : segment, 'wall', building.id);
      } else addObstacle(horizontal ? building.x : fixed, horizontal ? fixed : building.y, horizontal ? length + WALL_WIDTH : WALL_WIDTH, horizontal ? WALL_WIDTH : length + WALL_WIDTH, 'wall', building.id);
    }
  };
  for (const region of state.regions) {
    addBuilding(region, 0, -300, -180, 280, 230);
    addBuilding(region, 1, 300, -180, 320, 250);
    addBuilding(region, 2, 0, 320, 240, 300);
  }
  const freeTerrain = (x, y, margin = 75) => !state.buildings.some(building => withinBuilding(building, { x, y }, margin)) && Math.hypot(x - WORLD_SIZE / 2, y - WORLD_SIZE / 2) > 150;
  // Cover clusters around destinations; sparse wilderness does not multiply collision work by nine.
  for (let i = 0; i < 450; i++) {
    const region = state.regions[i % state.regions.length];
    const x = i < 330 ? region.x + (state.random() - 0.5) * 2100 : 180 + state.random() * (WORLD_SIZE - 360);
    const y = i < 330 ? region.y + (state.random() - 0.5) * 1900 : 180 + state.random() * (WORLD_SIZE - 360);
    if (!freeTerrain(x, y, 85) || collides(state, x, y, 60)) continue;
    const type = i % 6 === 0 ? 'rock' : 'tree';
    const size = type === 'tree' ? 48 + state.random() * 22 : 36 + state.random() * 28;
    addObstacle(x, y, size, size, type);
  }
  for (const region of state.regions) {
    for (let i = 0; i < 7; i++) {
      const x = region.x + (state.random() - 0.5) * 1300, y = region.y + (state.random() - 0.5) * 1100;
      if (!freeTerrain(x, y, 85) || collides(state, x, y, 40)) continue;
      addObstacle(x, y, 40, 40, 'crate');
    }
  }
  delete state.generating;
  const supplied = Array.isArray(players) && players.length ? players : [{ id: 'player', name }];
  const ids = new Set();
  for (const spec of supplied.slice(0, 50)) {
    const id = String(spec.id ?? `player-${ids.size + 1}`);
    if (ids.has(id)) continue;
    ids.add(id);
    const index = state.actors.length;
    const angle = index * 2.4, radius = index === 0 ? 0 : 350 + index * 23;
    const position = safePosition(state, WORLD_SIZE / 2 + Math.cos(angle) * radius, WORLD_SIZE / 2 + Math.sin(angle) * radius);
    state.actors.push(makeActor(state, { ...spec, id }, position, false, index));
  }
  state.player = state.actors[0];
  const count = clamp(Math.floor(finite(botCount)), 0, 50 - state.actors.length);
  for (let i = 0; i < count; i++) {
    let id = `bot-${i + 1}`;
    while (ids.has(id)) id = `_${id}`;
    ids.add(id);
    const region = state.regions[(i + 4) % state.regions.length];
    const angle = state.random() * Math.PI * 2, radius = 100 + state.random() * 570;
    const p = safePosition(state, region.x + Math.cos(angle) * radius, region.y + Math.sin(angle) * radius);
    const actor = makeActor(state, { id, name: BOT_NAMES[i % BOT_NAMES.length] }, p, true, i);
    actor.patrolRegion = (i + 4) % state.regions.length;
    actor.jumpAt = clamp((region.x - state.drop.route.start.x) / (state.drop.route.end.x - state.drop.route.start.x) * LAST_JUMP + (state.random() - 0.5) * 1.0, 0.5, 9.5);
    actor.dropTarget = safePosition(state, region.x + (state.random() - 0.5) * 650, region.y + (state.random() - 0.5) * 550);
    state.actors.push(actor);
  }
  if (drop) for (const actor of state.actors) { actor.x = state.drop.plane.x; actor.y = state.drop.plane.y; }
  for (const building of state.buildings) {
    const offsets = [[-62, -48], [62, -48], [-62, 48], [62, 48]];
    for (let i = 0; i < offsets.length; i++) addLoot(state, building.x + offsets[i][0], building.y + offsets[i][1], ['weapon', 'ammo', 'shield', 'medkit'][i]);
  }
  for (let i = 0; i < 170; i++) {
    const region = state.regions[i % state.regions.length];
    addLoot(state, region.x + (state.random() - 0.5) * 1700, region.y + (state.random() - 0.5) * 1500, ['weapon', 'ammo', 'shield', 'medkit'][i % 4]);
  }
  // A fixed arsenal cache distribution makes every gun searchable in every match.
  // Quality remains independent of weapon identity, including random crates and loose drops.
  for (let i = 0; i < WEAPONS.length; i++) {
    const building = state.buildings[(i * 2) % state.buildings.length];
    addLoot(state, building.x, building.y + 8, 'weapon', i, RARITIES[i % RARITIES.length].id);
  }
  addLoot(state, WORLD_SIZE / 2 + 90, WORLD_SIZE / 2 + 30, 'weapon', 1, 'uncommon');
  addLoot(state, WORLD_SIZE / 2 - 70, WORLD_SIZE / 2 + 60, 'shield');
  addLoot(state, WORLD_SIZE / 2 + 70, WORLD_SIZE / 2 - 80, 'ammo');
  event(state, drop ? '运输机已抵达荒岛。按空格跳伞，移动选择落点。' : '已抵达荒岛。收集物资，成为最后的幸存者。');
  return state;
}

export const aliveCount = state => state.actors.reduce((count, actor) => count + Number(actor.alive), 0);

export function reload(state, actor = state.player) {
  if (!combatReady(state, actor) || actor.reloading > 0 || actor.ammo >= WEAPONS[actor.weapon].magazine || actor.reserve <= 0) return false;
  cancelBurst(actor);
  actor.reloading = WEAPONS[actor.weapon].reloadTime;
  return true;
}

export function switchWeapon(state, slot, actor = state.player) {
  if (!combatReady(state, actor) || !Number.isInteger(slot) || slot < 0 || slot >= actor.inventory.length || slot === actor.slot) return false;
  syncInventory(actor);
  cancelBurst(actor);
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
    if (d < best && lineOfSight(state, actor, item, item.type === 'crate' ? item.id : null)) { nearest = item; best = d; }
  }
  for (const item of state.obstacles) {
    if (item.type !== 'crate' || !item.alive) continue;
    const d = distance(actor, item);
    if (d < best && lineOfSight(state, actor, item, item.type === 'crate' ? item.id : null)) { nearest = item; best = d; }
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
      cancelBurst(actor);
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
  cancelBurst(actor);
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

function cancelBurst(actor) {
  actor.burstRemaining = 0;
  actor.burstCooldown = 0;
  actor.burstWeapon = null;
}

function emitRound(state, actor) {
  const weapon = WEAPONS[actor.weapon], quality = rarityInfo(actor.rarity);
  actor.ammo--;
  actor.lastShotAt = state.time;
  const x = actor.x + Math.cos(actor.angle) * 26, y = actor.y + Math.sin(actor.angle) * 26;
  for (let i = 0; i < weapon.pellets; i++) {
    const angle = actor.angle + (state.random() - 0.5) * weapon.spread * 2;
    state.bullets.push({ x, y, px: x, py: y, vx: Math.cos(angle) * weapon.speed, vy: Math.sin(angle) * weapon.speed, owner: actor.id, damage: weapon.damage * quality.damageMultiplier, life: weapon.range / weapon.speed, color: quality.color });
  }
  actor.muzzleFlash = weapon.suppressed ? 0.018 : 0.05;
  syncInventory(actor);
}

function shoot(state, actor) {
  const continuousTrigger = state.time - actor.lastTriggerAt <= 0.06;
  actor.lastTriggerAt = state.time;
  if (!combatReady(state, actor) || actor.cooldown > 1e-8 || actor.reloading > 0 || actor.burstRemaining > 0) return;
  if (actor.ammo <= 0) { reload(state, actor); return; }
  const weapon = WEAPONS[actor.weapon];
  // Carry fractional cadence across ticks. A fast gun must not become an ordinary
  // SMG merely because the server runs at thirty updates per second.
  if (!continuousTrigger) actor.cooldown = 0;
  if (weapon.burstCount) {
    emitRound(state, actor);
    actor.cooldown += weapon.fireRate;
    actor.burstRemaining = Math.min(weapon.burstCount - 1, actor.ammo);
    actor.burstCooldown = weapon.burstInterval;
    actor.burstWeapon = actor.weapon;
    return;
  }
  let rounds = 0;
  do {
    emitRound(state, actor);
    actor.cooldown += weapon.fireRate;
  } while (actor.cooldown <= 1e-8 && actor.ammo > 0 && ++rounds < 3);
}

function continueBurst(state, actor) {
  if (actor.burstRemaining <= 0) return;
  if (!combatReady(state, actor) || actor.reloading > 0 || actor.burstWeapon !== actor.weapon || actor.ammo <= 0) { cancelBurst(actor); return; }
  const weapon = WEAPONS[actor.weapon];
  while (actor.burstRemaining > 0 && actor.burstCooldown <= 1e-8) {
    emitRound(state, actor);
    actor.burstRemaining--;
    actor.burstCooldown += weapon.burstInterval;
    if (actor.ammo <= 0) { cancelBurst(actor); break; }
  }
  if (actor.burstRemaining === 0) actor.burstWeapon = null;
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

function lineOfSight(state, a, b, ignoreId = null) {
  for (const obstacle of obstacleCandidates(state, Math.min(a.x, b.x), Math.min(a.y, b.y), Math.max(a.x, b.x), Math.max(a.y, b.y))) {
    if (obstacle.alive && obstacle.id !== ignoreId && obstacleHit(a.x, a.y, b.x, b.y, obstacle) !== Infinity) return false;
  }
  return true;
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

function routeAroundBuilding(actor, goal, building) {
  const clearance = actor.radius + 6;
  const blocked = { x: building.x, y: building.y, w: building.w + clearance * 2, h: building.h + clearance * 2 };
  const margin = actor.radius + 34;
  const nodes = [actor, goal,
    { x: building.x - building.w / 2 - margin, y: building.y - building.h / 2 - margin },
    { x: building.x + building.w / 2 + margin, y: building.y - building.h / 2 - margin },
    { x: building.x + building.w / 2 + margin, y: building.y + building.h / 2 + margin },
    { x: building.x - building.w / 2 - margin, y: building.y + building.h / 2 + margin }];
  const cost = nodes.map(() => Infinity), previous = nodes.map(() => -1), visited = new Set();
  cost[0] = 0;
  for (let step = 0; step < nodes.length; step++) {
    let current = -1;
    for (let i = 0; i < nodes.length; i++) if (!visited.has(i) && (current === -1 || cost[i] < cost[current])) current = i;
    if (current === -1 || cost[current] === Infinity || current === 1) break;
    visited.add(current);
    for (let i = 0; i < nodes.length; i++) {
      if (i === current || visited.has(i) || segmentRect(nodes[current].x, nodes[current].y, nodes[i].x, nodes[i].y, blocked) !== Infinity) continue;
      const candidate = cost[current] + distance(nodes[current], nodes[i]);
      if (candidate < cost[i]) { cost[i] = candidate; previous[i] = current; }
    }
  }
  if (cost[1] === Infinity) return [goal];
  const route = [];
  for (let index = 1; index > 0; index = previous[index]) route.unshift({ x: nodes[index].x, y: nodes[index].y });
  return route;
}

function planNavigation(state, actor, goal) {
  const inside = state.buildings.find(building => withinBuilding(building, actor, -WALL_WIDTH / 2));
  const destination = state.buildings.find(building => withinBuilding(building, goal, -WALL_WIDTH / 2));
  if (inside && inside.id === destination?.id) return [{ ...goal }];
  if (inside) {
    const door = doorway(inside);
    return [{ ...door.inner }, { ...door.outer, replan: true }];
  }
  const entrance = destination ? doorway(destination) : null;
  const outsideGoal = entrance?.outer || goal;
  let blocking = null, earliest = Infinity;
  for (const building of state.buildings) {
    const expanded = { ...building, w: building.w + (actor.radius + 6) * 2, h: building.h + (actor.radius + 6) * 2 };
    const t = segmentRect(actor.x, actor.y, outsideGoal.x, outsideGoal.y, expanded);
    if (t < earliest) { earliest = t; blocking = building; }
  }
  if (blocking) {
    const route = routeAroundBuilding(actor, outsideGoal, blocking);
    if (blocking.id !== destination?.id && route.length > 1) {
      route.pop(); route[route.length - 1].replan = true; return route;
    }
    if (entrance) route.push({ ...entrance.inner }, { ...goal });
    return route;
  }
  return entrance ? [{ ...entrance.outer }, { ...entrance.inner }, { ...goal }] : [{ ...goal }];
}

function navigate(state, actor, goal) {
  if (!actor.navGoal || distance(actor.navGoal, goal) > 110 || !actor.navPath.length) {
    actor.navGoal = { x: goal.x, y: goal.y };
    actor.navPath = planNavigation(state, actor, goal);
  }
  while (actor.navPath.length && distance(actor, actor.navPath[0]) < 24) {
    const reached = actor.navPath.shift();
    if (reached.replan) { actor.navGoal = null; actor.navPath = planNavigation(state, actor, goal); break; }
  }
  const waypoint = actor.navPath[0] || goal;
  const d = distance(actor, waypoint);
  return { angle: Math.atan2(waypoint.y - actor.y, waypoint.x - actor.x), pace: Math.min(1, d / 55), doorway: actor.navPath.length > 1 };
}

function botThink(state, actor) {
  const prior = actor.aiTarget;
  let target = state.actors.find(other => other.id === prior && other.alive && other.dropState === 'ground');
  let best = target && distance(actor, target) < 760 && lineOfSight(state, actor, target) ? distance(actor, target) * 0.77 : Infinity;
  if (best === Infinity) target = null;
  for (const other of state.actors) {
    if (!other.alive || other.id === actor.id || other.dropState !== 'ground' || other.spawnProtection > 0) continue;
    const d = distance(actor, other);
    if (d < 650 && d < best && lineOfSight(state, actor, other)) { target = other; best = d; }
  }
  actor.aiTarget = target?.id ?? null;
  if (actor.aiTarget !== prior) { actor.aiReaction = state.difficulty === 'hard' ? 0.22 : state.difficulty === 'easy' ? 0.8 : 0.48; actor.aiBurst = 0; }
  actor.lootTarget = null; actor.crateTarget = null;
  if (!target || actor.hp < 40 || actor.shield < 30) {
    let score = 650;
    for (const item of state.loot) {
      if (!canUseLoot(actor, item)) continue;
      if (item.type === 'weapon') {
        const same = actor.inventory.find(slot => slot.weapon === item.weapon);
        if (same && rarityIndex(item.rarity) <= rarityIndex(same.rarity)) continue;
        if (!same && actor.inventory.length >= 3 && rarityIndex(item.rarity) <= rarityIndex(actor.rarity)) continue;
      }
      const d = distance(actor, item);
      const value = item.type === 'shield' && actor.shield < 30 ? d * 0.65 : d;
      if (value < score && (item.buildingId || lineOfSight(state, actor, item))) { score = value; actor.lootTarget = item.id; }
    }
    if (!actor.lootTarget) {
      let nearest = 450;
      for (const item of obstacleCandidates(state, actor.x - 450, actor.y - 450, actor.x + 450, actor.y + 450)) {
        if (item.type === 'crate' && item.alive && distance(actor, item) < nearest) { nearest = distance(actor, item); actor.crateTarget = item.id; }
      }
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
  const crate = actor.crateTarget ? state.obstacles.find(item => item.id === actor.crateTarget && item.alive) : null;
  const zoneDistance = distance(actor, state.zone);
  let direction = actor.wanderAngle, pace = 0.7, aim = direction;
  let goal = { x: actor.x + Math.cos(direction) * 320, y: actor.y + Math.sin(direction) * 320 };
  if (target) {
    const d = distance(actor, target), direct = Math.atan2(target.y - actor.y, target.x - actor.x);
    const error = state.difficulty === 'hard' ? 0.055 : state.difficulty === 'easy' ? 0.21 : 0.12;
    aim = direct + Math.sin(state.time * 1.4 + actor.aiAccuracyPhase) * error;
    direction = direct + (d < 170 ? Math.PI * 0.8 * actor.aiStrafe : d < 370 ? Math.PI * 0.43 * actor.aiStrafe : 0);
    pace = d < 370 ? 0.6 : 0.85;
    goal = { x: actor.x + Math.cos(direction) * 230, y: actor.y + Math.sin(direction) * 230 };
    if (actor.aiReaction <= 0 && actor.aiPause <= 0 && Math.abs(angleDifference(aim, actor.angle)) < 0.16 && d < WEAPONS[actor.weapon].range * 0.88 && lineOfSight(state, actor, target)) {
      if (actor.aiBurst <= 0) actor.aiBurst = state.difficulty === 'easy' ? 2 : 3 + Math.floor(state.random() * 4);
      if (actor.reloading <= 0) {
        const ammoBefore = actor.ammo;
        shoot(state, actor);
        if (actor.ammo < ammoBefore && (actor.aiBurst -= ammoBefore - actor.ammo) <= 0) actor.aiPause = state.difficulty === 'hard' ? 0.22 + state.random() * 0.3 : 0.55 + state.random() * 0.7;
      }
    }
  }
  if (zoneDistance > Math.max(8, state.zone.radius - 130)) { goal = state.zone; pace = 1; }
  else if (loot && (!target || actor.hp < 40 || actor.shield < 30)) {
    goal = loot; pace = 0.9;
    if (distance(actor, loot) < 42 && lineOfSight(state, actor, loot)) collectLoot(state, actor, loot);
  } else if (!target && crate) {
    goal = crate; pace = 0.9;
    if (distance(actor, crate) < 70 && lineOfSight(state, actor, crate, crate.id)) openCrate(state, crate);
  } else if (!target && state.regions.length) {
    let region = state.regions[actor.patrolRegion % state.regions.length];
    if (distance(actor, region) < 260) { actor.patrolRegion = (actor.patrolRegion + 1 + Math.floor(state.random() * (state.regions.length - 1))) % state.regions.length; region = state.regions[actor.patrolRegion]; }
    goal = region; pace = 0.9;
  }
  const navigation = navigate(state, actor, goal);
  direction = navigation.angle; pace *= navigation.pace;
  if (!target) aim = direction;
  turnToward(actor, aim, dt);
  const aheadX = actor.x + Math.cos(direction) * 60, aheadY = actor.y + Math.sin(direction) * 60;
  if (!navigation.doorway && actor.dodgeTime <= 0 && collides(state, aheadX, aheadY, actor.radius + 3)) {
    const side = actor.aiStrafe;
    actor.dodgeAngle = direction + side * 1.15;
    if (collides(state, actor.x + Math.cos(actor.dodgeAngle) * 65, actor.y + Math.sin(actor.dodgeAngle) * 65, actor.radius + 3)) actor.dodgeAngle = direction - side * 1.15;
    actor.dodgeTime = 0.7;
  }
  if (actor.dodgeTime > 0 && !navigation.doorway) direction = actor.dodgeAngle;
  moveActor(state, actor, Math.cos(direction) * pace, Math.sin(direction) * pace, 205 * (WEAPONS[actor.weapon].moveMultiplier || 1), dt);
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
  const { start, end } = state.drop.route;
  state.drop.plane.x = start.x + progress * (end.x - start.x);
  state.drop.plane.y = start.y + progress * (end.y - start.y);
  state.drop.remaining = Math.max(0, FLIGHT_DURATION - state.time);
  state.phaseRemaining = state.drop.remaining;
  for (const actor of state.actors) {
    if (!actor.alive) continue;
    const input = inputs[actor.id] || {};
    if (actor.dropState === 'plane') {
      actor.x = state.drop.plane.x; actor.y = state.drop.plane.y; actor.angle = state.drop.plane.angle;
      if (state.time >= LAST_JUMP || actor.isBot && state.time >= actor.jumpAt || !actor.isBot && input.jump) jumpActor(state, actor);
    }
    if (actor.dropState === 'falling') {
      actor.dropElapsed += dt;
      actor.altitude = clamp(1 - actor.dropElapsed / DESCENT_DURATION, 0, 1);
      let dx = finite(input.moveX), dy = finite(input.moveY);
      if (actor.isBot) { dx = actor.dropTarget.x - actor.x; dy = actor.dropTarget.y - actor.y; const d = Math.hypot(dx, dy); const taper = Math.min(1, d / 130); if (d > 0) { dx = dx / d * taper; dy = dy / d * taper; } }
      const length = Math.max(1, Math.hypot(dx, dy));
      const targetX = dx / length * 620, targetY = dy / length * 620;
      const smoothing = Math.min(1, dt * 5);
      actor.vx += (targetX - actor.vx) * smoothing; actor.vy += (targetY - actor.vy) * smoothing;
      actor.x = clamp(actor.x + actor.vx * dt, 65, WORLD_SIZE - 65); actor.y = clamp(actor.y + actor.vy * dt, 65, WORLD_SIZE - 65);
      if (Math.hypot(actor.vx, actor.vy) > 10) turnToward(actor, Math.atan2(actor.vy, actor.vx), dt);
      if (actor.altitude <= 0 || state.time >= FLIGHT_DURATION) {
        Object.assign(actor, safePosition(state, actor.x, actor.y));
        actor.dropState = 'ground'; actor.altitude = 0; actor.vx = 0; actor.vy = 0; actor.spawnProtection = 0;
      }
    }
  }
  if (state.time >= FLIGHT_DURATION - 1e-8) {
    for (const actor of state.actors) {
      if (actor.alive && actor.dropState !== 'ground') Object.assign(actor, safePosition(state, actor.x, actor.y), { dropState: 'ground', altitude: 0, vx: 0, vy: 0, spawnProtection: 0 });
    }
    state.phase = 'combat'; state.phaseRemaining = PHASES[0].duration; state.drop.remaining = 0;
    event(state, '空降结束，风暴倒计时已启动。', 'info');
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
    for (const obstacle of obstacleCandidates(state, Math.min(bullet.x, nx), Math.min(bullet.y, ny), Math.max(bullet.x, nx), Math.max(bullet.y, ny))) {
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
  if (state.phase === 'flight') updateFlight(state, dt, inputs);
  if (state.phase === 'combat') state.combatTime += dt;
  for (const actor of state.actors) {
    if (!actor.alive || actor.dropState !== 'ground') continue;
    actor.cooldown = Math.max(-dt, actor.cooldown - dt);
    if (actor.burstRemaining > 0) actor.burstCooldown -= dt;
    for (const key of ['hitFlash', 'muzzleFlash', 'spawnProtection', 'healCooldown']) actor[key] = Math.max(0, actor[key] - dt);
    if (actor.reloading > 0) {
      actor.reloading = Math.max(0, actor.reloading - dt);
      if (actor.reloading === 0) { const amount = Math.min(WEAPONS[actor.weapon].magazine - actor.ammo, actor.reserve); actor.ammo += amount; actor.reserve -= amount; syncInventory(actor); }
    }
    if (actor.isBot) botUpdate(state, actor, dt);
    else {
      const input = inputs[actor.id] || {};
      if (Number.isFinite(input.angle)) actor.angle = input.angle;
      moveActor(state, actor, finite(input.moveX), finite(input.moveY), (input.sprint && !input.shoot ? 295 : 225) * (WEAPONS[actor.weapon].moveMultiplier || 1), dt);
      if (input.shoot) shoot(state, actor);
    }
    continueBurst(state, actor);
  }
  updateBullets(state, dt);
  for (const particle of state.particles) { particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.life -= dt; }
  state.particles = state.particles.filter(particle => particle.life > 0).slice(-300);
  if (state.phase === 'combat') updateZone(state, dt);
  if (state.status === 'playing' && state.actors.some(actor => actor.alive && actor.dropState === 'ground')) finishMatch(state);
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
