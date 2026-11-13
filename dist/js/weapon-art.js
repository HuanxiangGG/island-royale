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
  {name:'橙湾折翼',subtitle:'AMBER WING',finish:'琥珀橙装甲 · 折叠托短卡宾'},
  {name:'苔原三拍',subtitle:'MOSS TRIPLET',finish:'苔绿米白 · 提把式三连发'},
  {name:'雨林重鼓',subtitle:'JUNGLE DRUM',finish:'墨绿钢壳 · 黄铜弹链轻机枪'},
  {name:'极夜长星',subtitle:'POLAR LONGBOW',finish:'深蓝枪架 · 重型浮置长枪管'},
  {name:'熔岩锻炉',subtitle:'CINDER FORGE',finish:'珊瑚橙散热罩 · 加宽盒式弹匣'},
  {name:'黄昏六响',subtitle:'DUSK SIX',finish:'古铜转轮 · 弧形胡桃木握把'},
  {name:'霓虹折线',subtitle:'NEON VECTOR',finish:'荧光青柠 · 垂直缓冲机匣'},
  {name:'深海无声',subtitle:'ABYSS WHISPER',finish:'深海蓝涂层 · 一体式长消音器'},
  {name:'枫林双响',subtitle:'MAPLE DUET',finish:'枫木肩托 · 黄铜并列双管'},
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

// Short carbine: an open triangular folding stock, compact orange handguard,
// swept grip and a short, sharply forward-curved magazine.
function carbine(accent) {
  return [
    poly([[-89,-12],[-79,-12],[-52,-3],[-52,2],[-80,-3],[-80,17],[-89,17]],'#546b70',C.ink),
    poly([[-81,12],[-55,4],[-50,10],[-81,20]],'#879b99',C.ink),
    rect(-92,-14,6,35,'#263e43',2),rect(-60,-6,18,11,'#334d51',2),
    poly([[-36,7],[-20,8],[-31,33],[-45,28]],'#355357',C.ink),
    line(-35,14,-40,25,'#86a8a3',2),
    poly([[-5,5],[12,6],[17,18],[28,27],[21,36],[6,29],[-2,18]],'#48646a',C.ink),
    poly([[1,11],[8,11],[12,20],[22,28],[19,30],[9,24]],'#a8b5a5'),
    rect(-44,-14,64,25,'#d68a4d',3,C.ink),
    poly([[-40,-11],[-17,-11],[-9,-3],[-18,5],[-40,5]],'#efb76b'),
    rect(18,-14,35,23,'#e0a661',4,C.ink),
    ...[24,33,42].map(x=>poly([[x,-9],[x+5,-9],[x+2,1],[x-3,1]],'#5e756b')),
    rect(-39,-19,91,5,'#395258',1),rect(-17,-28,20,10,'#3c575b',3,C.ink),
    rect(-12,-25,10,4,'#a5d7d2',1),dot(-5,-22,1.3,'#e5a45d'),
    rect(50,-8,18,9,'#8a9d98',1,C.ink),rect(67,-11,15,15,'#304b50',2,C.ink),
    rect(77,-8,7,9,'#162f36',1),line(55,-5,66,-5,'#d4ded1',1.2),
    rect(-39,-8,17,3,accent,1),rect(8,3,9,4,'#ddceaa',1),
    dot(-39,5,1.7,C.ink),dot(15,-8,1.5,C.ink),text(-16,-4,'AW-6','#f5d5a0',4),
  ];
}

// Raised carry-handle bullpup: the magazine sits behind the grip, and a
// three-bar selector mark is part of the skin rather than its quality tint.
function burstRifle(accent) {
  return [
    poly([[-90,-14],[-54,-14],[-40,-6],[-40,16],[-67,16],[-89,21]],'#667c58',C.ink),
    rect(-94,-13,6,35,'#2e443d',2),poly([[-85,-10],[-59,-10],[-49,-3],[-69,5],[-85,3]],'#adb88a'),
    poly([[-61,12],[-42,12],[-39,34],[-58,35]],'#344c44',C.ink),rect(-55,17,10,14,'#8c9b77',1),
    poly([[-15,5],[1,7],[-7,33],[-22,28]],'#536948',C.ink),
    rect(-14,10,30,12,'#344e44',5,C.ink),rect(-10,12,21,6,'#a8bf83',3),
    poly([[-52,-14],[18,-14],[55,-7],[58,8],[12,12],[-53,7]],'#d5d3af',C.ink),
    poly([[-48,-10],[3,-10],[-5,0],[-48,2]],'#eef0cd'),
    poly([[8,-10],[49,-4],[52,4],[16,7]],'#7e9161'),
    // Solid bridge and narrow legs preserve the open carry-handle silhouette.
    poly([[-42,-15],[-38,-34],[20,-34],[34,-14],[26,-14],[16,-26],[-31,-26],[-33,-15]],'#354e45',C.ink),
    line(-31,-31,15,-31,'#a5b99d',2),rect(-11,-37,9,4,'#61785e',1),
    rect(55,-5,27,7,C.steel,1,C.ink),rect(80,-8,12,13,'#334e47',2,C.ink),
    line(59,-3,78,-3,'#ccd8be',1),rect(48,-13,5,7,'#344d42',1),
    ...[20,29,38].map(x=>rect(x,-3,4,7,'#304f42',1)),
    ...[-32,-25,-18].map(x=>rect(x,-7,3,6,'#d9aa62',.7)),
    rect(-48,2,13,3,accent,1),rect(5,-6,8,3,accent,1),
    line(-14,17,-18,25,'#a0af85',1.4),dot(-66,9,2,'#d2c59c'),text(-6,6,'III','#3e5c46',4),
  ];
}

// Belt-fed LMG: a large drum, visible cartridges, broad receiver, carrying
// handle and deployed bipod make it unmistakably heavier than the rifles.
function lmg(accent) {
  return [
    poly([[-96,-14],[-71,-14],[-48,-4],[-48,10],[-72,6],[-94,20]],'#4f6551',C.ink),
    poly([[-90,-9],[-73,-9],[-57,-2],[-72,0],[-87,10]],'#a3a76c'),rect(-98,-14,5,35,C.ink,2),
    poly([[-45,8],[-28,9],[-32,34],[-49,30]],'#4a5946',C.ink),
    dot(-5,18,21,'#354d43',C.ink),dot(-5,18,15,'#728167',C.ink),dot(-5,18,8,'#3d5a4d',C.ink),dot(-5,18,3,'#d8bc70'),
    ...[0,1,2,3,4,5].map(i=>{const a=i*Math.PI/3;return line(-5+Math.cos(a)*9,18+Math.sin(a)*9,-5+Math.cos(a)*13,18+Math.sin(a)*13,'#a0ae81',1.5);}),
    rect(-51,-18,89,30,'#687d50',4,C.ink),rect(-45,-14,55,9,'#a0ad71',2),
    poly([[11,-14],[34,-14],[34,7],[20,10],[11,1]],'#3e5c45'),
    rect(-44,-22,78,5,'#334a3f',1),
    poly([[-17,-22],[-17,-34],[16,-34],[21,-22],[14,-22],[11,-28],[-10,-28],[-10,-22]],'#3b5144',C.ink),
    ...[-34,-26,-18].map(x=>rect(x,-9,6,16,'#c6a15c',2,C.ink)),
    ...[-34,-26,-18].map(x=>rect(x,-10,6,4,'#ead28b',1)),
    rect(36,-12,39,17,'#536b5a',2,C.ink),
    ...[41,50,59,68].map(x=>rect(x,-8,5,10,'#2b433b',1)),
    rect(74,-7,17,7,C.steel,1,C.ink),rect(88,-10,11,13,'#2b443e',2,C.ink),
    line(60,5,48,33,C.ink,3.5),line(61,5,77,33,C.ink,3.5),
    rect(43,31,10,3,'#82917a',1),rect(73,31,10,3,'#82917a',1),
    rect(17,-9,13,3,accent,1),rect(-45,2,7,4,accent,1),text(-6,-8,'R-80','#d4ddae',4),
    dot(30,4,2,C.ink),line(-41,16,-44,27,'#9ca67d',2),
  ];
}

// Heavy bolt-action sniper: tiny receiver, very long free-floating barrel,
// large optic, slotted brake and an angular open competition stock.
function sniper(accent) {
  return [
    poly([[-99,-16],[-81,-16],[-57,-6],[-44,-4],[-44,5],[-65,7],[-84,26],[-97,25],[-97,17],[-84,17],[-72,3],[-89,-5]],'#344959',C.ink),
    rect(-100,-14,5,40,'#24343d',1),rect(-91,-20,25,8,'#79939f',2,C.ink),
    line(-88,-11,-68,-4,'#b7c6bd',2),line(-80,18,-63,5,'#6e8b97',3),
    poly([[-43,4],[-30,5],[-36,29],[-49,25]],'#566f7b',C.ink),
    rect(-21,4,16,18,'#3b4e56',2,C.ink),rect(-18,8,10,8,'#af9b70',1),
    rect(-48,-12,67,18,'#5e7b8b',3,C.ink),rect(-44,-9,37,5,'#abc0c7',2),
    rect(14,-10,70,6,'#82969a',1,C.ink),line(20,-8,81,-8,'#cad5cf',1.2),
    rect(26,-11,5,9,'#435e69',1),rect(65,-11,4,9,'#435e69',1),
    rect(82,-15,17,16,'#384c57',2,C.ink),
    ...[85,90,95].map(x=>rect(x,-12,2,10,'#111f2a',.5)),
    rect(-33,-20,5,9,C.ink),rect(-3,-20,5,9,C.ink),
    rect(-40,-33,49,13,'#334b5a',3,C.ink),rect(-45,-35,10,17,'#7c919a',2,C.ink),
    rect(6,-38,17,23,'#526f7d',3,C.ink),rect(18,-35,4,17,'#e7b16e',1),
    rect(-15,-37,9,5,'#859ba4',1,C.ink),line(-32,-29,2,-29,'#b8c8c9',1.5),
    line(-2,-6,5,8,'#263b47',3),dot(7,11,4,'#ab8e62',C.ink),
    line(20,6,29,30,'#344f5b',2.5),rect(26,29,9,3,'#aab9b2',1),
    rect(-39,-4,17,3,accent,1),text(-19,-4,'N-90','#d5e0d8',4),dot(11,2,1.5,C.ink),
  ];
}

// Automatic shotgun: oversized straight box magazine, square heat shield,
// long charging handle and an orange/ivory body around a wide barrel.
function autoShotgun(accent) {
  return [
    poly([[-92,-14],[-67,-14],[-49,-5],[-49,9],[-67,8],[-85,22],[-94,17]],'#a95940',C.ink),
    poly([[-87,-9],[-70,-9],[-59,-4],[-74,0],[-86,13]],'#f0d4ad'),rect(-97,-12,5,30,C.ink,2),
    poly([[-45,6],[-27,8],[-36,35],[-51,29]],'#9d5140',C.ink),
    poly([[-11,5],[17,5],[19,36],[-9,38]],'#495259',C.ink),
    rect(-6,13,20,19,'#8f9a91',2),line(0,15,0,30,'#3a5154',2),line(8,15,8,30,'#3a5154',2),
    rect(-49,-17,83,28,'#d96b48',4,C.ink),
    poly([[-44,-13],[-20,-13],[-13,-7],[-23,4],[-44,4]],'#f4d8b0'),
    rect(-14,-13,43,11,'#ec9564',2),rect(-6,-10,25,6,'#3c5355',2),
    rect(-12,-21,52,5,'#354b4d',1),rect(-36,-23,13,7,'#3c5454',2),
    rect(32,-15,41,24,'#e2d8be',3,C.ink),rect(36,-11,32,4,'#fbecd0',1),
    ...[38,47,56,65].map(x=>rect(x,-5,4,9,'#5b615a',1)),
    rect(71,-9,22,13,'#647b7b',2,C.ink),rect(89,-12,10,19,'#344c51',2,C.ink),rect(95,-8,5,11,'#1b313a',1),
    line(37,11,51,18,'#7a5c43',4),rect(46,15,10,4,'#b98d5f',1),
    rect(-41,-8,13,3,accent,1),rect(22,2,7,5,accent,1),text(-13,5,'CF-8','#ffe5c2',4),
    dot(-42,7,2,C.ink),dot(28,-10,1.8,C.ink),line(-41,15,-45,25,'#dea77a',2),
  ];
}

// Oversized six-shot revolver: fluted circular cylinder, stepped octagonal
// barrel, exposed hammer and a curved wooden grip; no magazine or shoulder stock.
function revolver(accent) {
  return [
    poly([[-39,-2],[-18,-2],[-11,13],[-16,29],[-10,36],[-17,40],[-40,36],[-43,25],[-35,9]],'#86533b',C.ink),
    poly([[-32,8],[-21,8],[-20,24],[-16,33],[-22,35],[-34,31],[-35,23]],'#bf8556'),
    line(-29,13,-31,25,'#754832',1.5),line(-25,15,-26,29,'#dfab70',1),dot(-27,29,2,'#e2b76a',C.ink),
    rect(-17,0,33,21,'#8f724e',8,C.ink),rect(-10,4,20,11,'#b6c28e',5),
    poly([[-4,2],[1,3],[-2,12],[-6,11]],'#e1b978',C.ink),
    poly([[-44,-20],[-30,-23],[-23,-15],[-14,-14],[-12,-2],[-39,1],[-47,-5]],'#ae8751',C.ink),
    poly([[-39,-20],[-45,-30],[-39,-32],[-29,-20]],'#5f6c67',C.ink),
    rect(-21,-22,44,23,'#c49a60',4,C.ink),
    dot(-6,-11,15,'#9a7849',C.ink),dot(-6,-11,10,'#d6b577',C.ink),
    ...[-14,-6,2].map(x=>rect(x,-19,4,16,'#795c3e',2)),
    line(-17,-21,4,-21,'#f3d495',1.5),dot(-6,-11,2.4,'#4f5f5a',C.ink),
    poly([[17,-21],[60,-21],[71,-15],[71,-6],[61,0],[17,0]],'#b79b6b',C.ink),
    rect(23,-17,39,4,'#e9d5a0',1),rect(21,-5,41,7,'#697c75',2,C.ink),
    rect(65,-19,8,18,'#354c4c',2,C.ink),rect(69,-15,5,9,'#162f35',1),
    rect(54,-26,6,6,'#54675f',1),dot(57,-26,1.3,'#e9bb67'),
    rect(-37,-10,12,3,accent,1),rect(28,-10,17,3,accent,1),text(47,-9,'6','#5e654f',5),
  ];
}

// High-rate SMG: a tall angular lower receiver, straight vertical magazine,
// wire stock and tiny forward barrel give a radically compact silhouette.
function vector(accent) {
  return [
    poly([[-86,-16],[-77,-16],[-77,6],[-47,-3],[-43,3],[-78,16],[-86,14]],'#445653',C.ink),
    rect(-89,-18,5,35,'#263d3f',1),line(-77,-12,-48,-10,'#9eb6a0',3),
    poly([[-38,0],[-19,2],[-12,17],[-21,32],[-38,25]],'#354d46',C.ink),
    poly([[-31,7],[-22,9],[-19,18],[-24,25],[-31,22]],'#8baf64'),
    rect(4,4,16,35,'#2e4844',2,C.ink),rect(8,9,8,25,'#72816b',1),rect(2,35,20,5,'#a3c579',1,C.ink),
    poly([[-45,-20],[8,-20],[20,-12],[35,-8],[35,10],[16,24],[-3,22],[-18,4],[-45,0]],'#a9c962',C.ink),
    poly([[-41,-16],[-1,-16],[8,-8],[-8,-1],[-40,-4]],'#d0e79a'),
    poly([[2,-3],[15,0],[27,1],[27,8],[13,17],[1,15]],'#5b7855'),
    rect(-41,-24,49,5,'#3b554b',1),rect(-22,-32,18,9,'#344e49',2,C.ink),
    rect(-18,-29,10,4,'#d7946f',1),
    rect(33,-7,17,10,'#82968a',1,C.ink),rect(47,-10,18,16,'#334e4b',2,C.ink),
    ...[51,57].map(x=>line(x,-7,x,3,'#a3ba9c',1.5)),
    rect(-36,-12,14,3,accent,1),rect(20,4,6,3,accent,1),
    rect(-13,-13,12,4,'#476c52',1),text(-12,-6,'V / 11','#f2f5cb',4),
    dot(-38,-2,2,C.ink),dot(4,10,1.5,'#d7de9d'),line(-28,12,-29,20,'#3d5d43',1.5),
  ];
}

// Suppressed precision rifle: a long integral can dominates the front half;
// navy chassis, wrapped fore-end, low scope and skeletonized stock stay visible.
function suppressed(accent) {
  return [
    poly([[-97,-15],[-73,-15],[-51,-4],[-51,9],[-72,9],[-93,25],[-98,21]],'#344f61',C.ink),
    poly([[-91,-10],[-75,-10],[-61,-3],[-74,1],[-88,13],[-91,9]],'#91a9ad'),
    poly([[-88,0],[-75,-4],[-63,0],[-75,5],[-87,15]],'#223b48'),rect(-99,-14,5,37,'#213642',1),
    poly([[-44,5],[-29,7],[-34,30],[-48,27]],'#38596b',C.ink),
    poly([[-17,5],[-1,6],[3,25],[-10,32],[-23,27]],'#314c5a',C.ink),
    line(-13,12,-7,25,'#8da4a4',2),line(-18,14,-13,27,'#8da4a4',1),
    rect(-50,-15,68,23,'#55788c',3,C.ink),rect(-45,-12,35,6,'#8faeb8',2),
    rect(13,-13,27,19,'#4c6d7b',3,C.ink),
    ...[18,25,32].map(x=>line(x,-10,x-3,3,'#9eb7ad',2)),
    rect(37,-15,61,23,'#344d5b',5,C.ink),rect(42,-12,50,5,'#617f8b',2),
    ...[44,51,58,65,72,79,86].map(x=>line(x,-4,x,5,'#203d4b',1.2)),
    rect(93,-13,7,19,'#223744',3,C.ink),line(95,-10,95,3,'#849c9c',1.3),
    rect(-43,-20,60,5,'#2c4654',1),rect(-28,-24,5,6,C.ink),rect(-1,-24,5,6,C.ink),
    rect(-35,-33,43,11,'#344e5b',3,C.ink),rect(4,-35,11,15,'#6c8790',2,C.ink),rect(10,-32,3,9,'#84cbd0',1),
    line(-29,-30,-1,-30,'#9eb9b9',1),
    rect(-44,-3,15,3,accent,1),rect(42,-6,7,2,accent,1),text(-22,-6,'W-12','#d1e4db',4),
    dot(-39,4,1.8,C.ink),dot(7,2,1.6,C.ink),
  ];
}

// Traditional break-action double barrel: paired full-length tubes, exposed
// twin hammers and a broad maple stock, without a pump or detachable magazine.
function doubleBarrel(accent) {
  return [
    poly([[-98,-4],[-80,-10],[-58,-5],[-39,1],[-27,10],[-34,19],[-54,11],[-72,25],[-95,29]],'#96583c',C.ink),
    poly([[-91,1],[-78,-5],[-58,0],[-47,7],[-58,6],[-75,18],[-89,22]],'#ce8b55'),
    line(-85,8,-65,3,'#79482f',1.6),line(-86,14,-70,9,'#e5ab6b',1.4),line(-83,20,-73,15,'#9d613b',1.3),
    rect(-99,-2,5,33,'#3c4740',2),
    poly([[-41,3],[-18,3],[-6,13],[-17,27],[-30,26],[-23,12],[-39,12]],'#b68b54',C.ink),
    rect(-25,10,22,15,'#5f684f',6,C.ink),rect(-21,13,14,8,'#a4bd88',4),
    rect(-35,-13,47,23,'#c6a061',4,C.ink),rect(-31,-10,35,5,'#ead097',1),
    poly([[-30,-12],[-38,-24],[-32,-26],[-22,-13]],'#5e6a5a',C.ink),
    poly([[-12,-13],[-19,-24],[-13,-25],[-5,-13]],'#7d8064',C.ink),
    rect(9,-14,88,9,'#64776e',2,C.ink),rect(9,-1,88,9,'#52665f',2,C.ink),
    line(14,-12,91,-12,'#bdc9b3',1.3),line(14,1,91,1,'#a9bca7',1.3),
    rect(91,-15,9,24,'#354a43',2,C.ink),dot(96,-10,3,'#182f2c'),dot(96,4,3,'#182f2c'),
    rect(21,7,37,9,'#9b603b',4,C.ink),line(26,10,51,10,'#db9b5b',1.5),
    rect(46,-15,4,24,'#b8965a',1),rect(77,-15,4,24,'#a28354',1),
    rect(78,-19,4,5,'#d6b774',1),
    rect(-29,-4,14,3,accent,1),dot(-6,-3,4,'#8d6b42',C.ink),dot(-6,-3,1.4,'#efd29a'),
    text(-22,7,'II','#705a3c',4),line(-18,-12,-11,-17,'#e1c084',2),
  ];
}

const models=[rifle,smg,shotgun,marksman,pistol,carbine,burstRifle,lmg,sniper,autoShotgun,revolver,vector,suppressed,doubleBarrel];
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
  x=Number.isFinite(x)?x:0;y=Number.isFinite(y)?y:0;
  scale=Number.isFinite(scale)?scale:1;angle=Number.isFinite(angle)?angle:0;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
  ctx.lineJoin='round';ctx.lineCap='round';
  for(const part of partsFor(weaponIndex,rarity))canvasPart(ctx,part);
  ctx.restore();
}
