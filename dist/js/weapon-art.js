import * as Game from './game.js';

// One set of original vector parts powers both the inventory SVGs and the world.
// Coordinates are in a 200 × 92 viewBox, with the muzzle pointing right.
const C = { ink: '#26383b', dark: '#34474a', steel: '#62797b', light: '#afc3bd', gold: '#e9bd70' };
const rect = (x,y,w,h,fill,r=0,stroke=null) => ({type:'rect',x,y,w,h,fill,r,stroke});
const poly = (points,fill,stroke=null) => ({type:'poly',points,fill,stroke});
const line = (x1,y1,x2,y2,stroke,width=1) => ({type:'line',x1,y1,x2,y2,stroke,width});
const dot = (x,y,r,fill,stroke=null) => ({type:'circle',x,y,r,fill,stroke});
const text = (x,y,value,fill,size=5) => ({type:'text',x,y,value,fill,size});

export const WEAPON_SKINS = Object.freeze([
  {name:'沙丘游骑',subtitle:'DESERT RANGER',finish:'沙漠迷彩 · 战术步枪'},
  {name:'潮汐脉冲',subtitle:'TIDAL PULSE',finish:'海盐青绿 · 紧凑冲锋枪'},
  {name:'赤铜猎手',subtitle:'COPPER HUNTER',finish:'胡桃木托 · 泵动霰弹枪'},
  {name:'暮光远征',subtitle:'DUSK EXPLORER',finish:'紫晶涂装 · 精确步枪'},
  {name:'白隼信号',subtitle:'WHITE FALCON',finish:'象牙陶瓷 · 红色竞赛手枪'},
]);

const FALLBACK_RARITIES = [
  {id:'common',color:'#aebbb2'},{id:'uncommon',color:'#77c982'},
  {id:'rare',color:'#6cbcf0'},{id:'epic',color:'#b58bea'},
  {id:'legendary',color:'#edb856'},{id:'mythic',color:'#f17f91'},
];

export function rarityColor(rarity='common') {
  return (Game.RARITIES || FALLBACK_RARITIES).find(r=>r.id===rarity)?.color || '#aebbb2';
}

function rifle(accent) {
  return [
    // Adjustable buttstock, grip and curved magazine form the rifle silhouette.
    poly([[-91,-13],[-65,-13],[-52,-5],[-52,7],[-71,10],[-81,19],[-93,18]],'#8f8969',C.ink),
    poly([[-87,-8],[-68,-8],[-58,-3],[-73,2],[-80,12],[-87,12]],'#c7b583'),
    rect(-94,-13,5,32,C.ink,2),rect(-66,-7,21,8,C.dark,1),
    poly([[-33,5],[-17,6],[-24,34],[-38,31]],'#6e7260',C.ink),
    line(-31,12,-35,26,'#b4af85',2),
    poly([[-7,7],[12,7],[14,23],[7,36],[-11,32],[-7,22]],C.dark,C.ink),
    poly([[-3,10],[8,10],[9,22],[5,30],[-5,28]],'#798977'),
    line(0,14,8,15,'#3e5650',2),line(-1,21,8,22,'#3e5650',2),
    rect(-45,-15,89,24,'#b6a177',4,C.ink),
    poly([[-42,-13],[-24,-13],[-17,-3],[-25,6],[-43,6]],'#d9c294'),
    poly([[-12,-13],[5,-13],[11,-6],[1,0],[-9,-4]],'#8e916a'),
    poly([[16,-11],[36,-11],[40,-3],[30,2],[21,-1]],'#ded1a3'),
    poly([[-16,1],[-2,-4],[9,3],[5,8],[-15,8]],'#79836a'),
    rect(-42,-19,85,5,C.dark,1),rect(-35,-21,6,2,C.light),
    rect(-11,-22,17,3,C.dark,1),rect(-7,-30,10,8,C.dark,2),rect(-5,-28,6,4,'#e5a970',1),
    rect(38,-10,35,10,C.steel,1,C.ink),rect(54,-12,5,14,C.dark,1),
    rect(74,-12,18,14,C.dark,2,C.ink),rect(86,-9,8,8,'#142d32',1),
    line(42,-7,72,-7,'#a1b2a5',1.5),
    ...[17,25,33].map(x=>rect(x,-7,5,5,'#475e53',1)),
    rect(-38,-10,18,3,accent,1),rect(-30,-6,7,2,'#ece3c4',1),
    dot(-37,3,2,C.ink),dot(11,4,1.5,C.ink),text(-12,-7,'D-07','#3c5148',4),
  ];
}

function smg(accent) {
  return [
    poly([[-77,-10],[-67,-10],[-61,11],[-72,20],[-80,18]],'#283e40',C.ink),
    rect(-74,-8,35,4,'#8ba9a3',1),rect(-69,5,30,4,C.steel,1),
    poly([[-35,6],[-17,7],[-24,33],[-40,28]],'#2e4e4c',C.ink),
    poly([[-6,4],[10,7],[3,36],[-11,33]],C.dark,C.ink),
    poly([[-2,10],[5,12],[0,29],[-6,28]],'#5c9088'),
    rect(-42,-16,82,26,'#4ba59d',5,C.ink),
    poly([[-39,-12],[-7,-12],[-14,-1],[-39,0]],'#8bcfc0'),
    poly([[0,-12],[36,-12],[36,0],[21,4],[7,-2]],'#35857e'),
    rect(-43,-21,66,6,C.dark,2),rect(-17,-30,16,10,C.dark,2),
    rect(-13,-27,8,4,'#cc8d72',1),
    rect(38,-9,21,12,C.steel,1,C.ink),
    rect(53,-12,20,18,C.dark,3,C.ink),line(60,-9,60,3,'#8faaa3',1.5),
    rect(-34,-8,16,4,accent,1),rect(5,-10,5,18,'#edb470',1),
    ...[17,25,33].map(x=>rect(x,-7,4,10,'#214e4e',1)),
    line(-33,15,-37,25,'#6d9991',1.5),line(-30,15,-34,25,'#6d9991',1.5),
    text(-15,3,'T / 9','#d0e8d5',5),dot(-35,5,2,'#d8d7aa'),
  ];
}

function shotgun(accent) {
  return [
    poly([[-94,-6],[-73,-9],[-51,-4],[-33,1],[-27,10],[-39,16],[-57,8],[-72,18],[-92,22]],'#86573e',C.ink),
    poly([[-87,-2],[-73,-5],[-51,1],[-44,9],[-61,5],[-76,13],[-86,15]],'#bd8658'),
    line(-82,3,-63,2,'#73503b',1.5),line(-79,8,-65,6,'#d7a46d',1.5),
    rect(-96,-6,6,29,C.dark,2),
    rect(-38,-10,47,19,'#a36f4c',3,C.ink),rect(-35,-8,40,5,'#d19b68',2),
    poly([[-31,7],[-21,8],[-13,24],[-24,27],[-35,12]],'#815a43',C.ink),
    rect(-16,9,20,12,C.dark,5),rect(-13,11,13,7,'#a5bd8e',3),
    rect(5,-9,87,7,C.dark,1,C.ink),rect(12,1,74,7,'#536a66',2,C.ink),
    line(10,-7,89,-7,'#a8bab0',1.2),rect(87,-12,5,5,'#bf7854',1),
    rect(11,-5,36,16,'#bd8050',4,C.ink),rect(14,-3,30,3,'#e4ad72',1),
    ...[17,23,29,35,41].map(x=>line(x,1,x,8,'#805a3d',2)),
    rect(-31,-4,15,3,accent,1),text(-10,4,'12','#ead4a7',5),
    dot(-32,4,1.5,C.ink),rect(59,-12,3,4,C.dark),
  ];
}

function marksman(accent) {
  return [
    poly([[-96,-9],[-68,-13],[-46,-6],[-37,4],[-51,12],[-70,7],[-86,22],[-97,19]],'#584e70',C.ink),
    poly([[-90,-5],[-69,-9],[-53,-5],[-62,1],[-81,3],[-89,15]],'#9f8eb6'),
    rect(-97,-8,4,28,C.dark,1),rect(-85,-15,24,8,'#b4a6c7',2,C.ink),
    poly([[-40,4],[-26,6],[-34,29],[-47,25]],'#665c7b',C.ink),
    poly([[-17,4],[-3,5],[-5,24],[-21,24]],C.dark,C.ink),rect(-17,10,10,10,'#7a7690',1),
    rect(-46,-12,83,18,'#8a7b9f',3,C.ink),
    poly([[-42,-9],[-12,-9],[-20,2],[-43,2]],'#b9a5cf'),
    poly([[-8,-10],[30,-10],[35,-2],[19,4],[5,0]],'#6e6185'),
    rect(-45,-16,80,4,C.dark,1),
    rect(-27,-22,5,7,C.dark),rect(0,-22,5,7,C.dark),
    rect(-36,-31,49,12,C.dark,3,C.ink),rect(-40,-33,9,16,'#7b8b8d',2,C.ink),
    rect(9,-34,12,18,'#667778',2,C.ink),rect(16,-31,3,12,'#a7d9cd',1),
    rect(-22,-34,8,3,'#879894',1),line(-27,-28,5,-28,'#abb8af',1.5),
    rect(34,-8,48,6,C.steel,1,C.ink),line(38,-6,79,-6,'#bacbc0',1),
    rect(78,-11,19,12,C.dark,2,C.ink),rect(83,-9,3,8,'#607b75',1),rect(90,-9,3,8,'#607b75',1),
    line(29,4,20,24,C.dark,3),line(30,4,40,24,C.dark,3),
    rect(-40,-7,16,3,accent,1),text(-10,-3,'M-24','#e3d7e7',4),dot(19,-4,2,'#cbafdb'),
  ];
}

function pistol(accent) {
  return [
    poly([[-36,-4],[-9,-4],[0,10],[-12,36],[-37,31],[-27,6]],'#a84945',C.ink),
    poly([[-26,6],[-11,9],[-18,29],[-30,26]],'#d87563'),
    ...[11,16,21].map(y=>line(-25,y,-15,y+3,'#8e4441',1.3)),
    rect(-12,3,25,17,C.dark,6,C.ink),rect(-8,7,17,9,'#9db68b',4),
    rect(-4,4,5,8,'#cbb79b',2),
    rect(-41,-21,81,23,'#e7e4cc',4,C.ink),
    poly([[-37,-17],[36,-17],[36,-10],[-37,-8]],'#fff4d9'),
    rect(-38,-20,11,21,'#ba5b50',2),
    rect(22,-21,16,23,'#a6504a',2),rect(31,-17,12,15,C.dark,1),
    rect(-25,-26,9,6,C.dark,1),rect(23,-26,6,5,C.dark,1),rect(25,-27,2,3,'#f1b572',1),
    ...[-22,-17,-12].map(x=>line(x,-6,x+3,-16,'#adab95',1.5)),
    rect(-5,-15,20,5,C.dark,1),rect(-2,-14,11,3,'#8e9f94',1),
    rect(-36,-4,15,3,accent,1),text(0,-4,'F-5','#9b5c50',4),dot(-19,29,2,'#edc39a'),
  ];
}

const models=[rifle,smg,shotgun,marksman,pistol];
const cache=new Map();
const svgCache=new Map();
function partsFor(index,rarity) {
  const i=Number.isInteger(index)&&index>=0&&index<models.length?index:0;
  const color=rarityColor(rarity),key=`${i}:${color}`;
  if(!cache.has(key))cache.set(key,models[i](color));
  return cache.get(key);
}

function svgPart(p) {
  const outline=p.stroke?` stroke="${p.stroke}" stroke-width="1.5" stroke-linejoin="round"`:'';
  if(p.type==='rect')return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.r}" fill="${p.fill}"${outline}/>`;
  if(p.type==='poly')return `<polygon points="${p.points.map(a=>a.join(',')).join(' ')}" fill="${p.fill}"${outline}/>`;
  if(p.type==='circle')return `<circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="${p.fill}"${outline}/>`;
  if(p.type==='line')return `<line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" stroke="${p.stroke}" stroke-width="${p.width}" stroke-linecap="round"/>`;
  return `<text x="${p.x}" y="${p.y}" fill="${p.fill}" font-family="monospace" font-size="${p.size}" font-weight="700">${p.value}</text>`;
}

export function weaponSVG(weaponIndex,rarity='common') {
  const index=Number.isInteger(weaponIndex)&&weaponIndex>=0&&weaponIndex<models.length?weaponIndex:0;
  const key=`${index}:${rarityColor(rarity)}`;
  if(!svgCache.has(key))svgCache.set(key,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-102 -43 204 86" role="img" aria-label="${WEAPON_SKINS[index].name}" class="weapon-art"><ellipse cx="0" cy="32" rx="79" ry="5" fill="#102e28" opacity=".12"/>${partsFor(index,rarity).map(svgPart).join('')}</svg>`);
  return svgCache.get(key);
}

function canvasPart(ctx,p) {
  ctx.beginPath();
  if(p.type==='rect') {
    const {x,y,w,h,r}=p;ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
  } else if(p.type==='poly') {
    p.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
  } else if(p.type==='circle')ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
  else if(p.type==='line'){ctx.moveTo(p.x1,p.y1);ctx.lineTo(p.x2,p.y2);ctx.lineWidth=p.width;ctx.strokeStyle=p.stroke;ctx.stroke();return;}
  else {ctx.fillStyle=p.fill;ctx.font=`700 ${p.size}px monospace`;ctx.fillText(p.value,p.x,p.y);return;}
  ctx.fillStyle=p.fill;ctx.fill();
  if(p.stroke){ctx.strokeStyle=p.stroke;ctx.lineWidth=1.5;ctx.stroke();}
}

export function drawWeapon(ctx,weaponIndex,rarity='common',{x=0,y=0,scale=1,angle=0}={}) {
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
  ctx.lineJoin='round';ctx.lineCap='round';
  for(const part of partsFor(weaponIndex,rarity))canvasPart(ctx,part);
  ctx.restore();
}
