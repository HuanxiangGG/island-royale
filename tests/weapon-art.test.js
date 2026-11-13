import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { WEAPON_SKINS, weaponSVG, drawWeapon, rarityColor } from '../dist/js/weapon-art.js';

const RARITIES=['common','uncommon','rare','epic','legendary','mythic'];
const GEOMETRY_KEYS=['x','y','width','height','rx','cx','cy','r','x1','y1','x2','y2','points'];

function shapes(svg) {
  return [...svg.matchAll(/<(rect|polygon|circle|line)\b([^>]*?)\/>/g)].map(([,type,source])=>{
    const attributes=Object.fromEntries([...source.matchAll(/([\w-]+)="([^"]*)"/g)].map(([,key,value])=>[key,value]));
    const geometry=Object.fromEntries(GEOMETRY_KEYS.filter(key=>attributes[key]!==undefined).map(key=>[key,key==='points'?attributes[key].split(' ').map(point=>point.split(',').map(Number)):Number(attributes[key])]));
    return {type,...geometry};
  });
}

function insidePolygon(x,y,points) {
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const [xi,yi]=points[i],[xj,yj]=points[j];
    if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
  }
  return inside;
}

// Compare the union of filled geometry, ignoring color, labels, detail strokes
// and the shared drop shadow. A renamed or recolored copy has the same mask.
function silhouette(svg) {
  const geometry=shapes(svg).filter(shape=>shape.type!=='line');
  const pixels=[];
  for(let y=-42;y<=42;y+=2)for(let x=-101;x<=101;x+=2){
    pixels.push(Number(geometry.some(shape=>{
      if(shape.type==='rect')return x>=shape.x&&x<=shape.x+shape.width&&y>=shape.y&&y<=shape.y+shape.height;
      if(shape.type==='circle')return (x-shape.cx)**2+(y-shape.cy)**2<=shape.r**2;
      return insidePolygon(x,y,shape.points);
    })));
  }
  return createHash('sha256').update(Buffer.from(pixels)).digest('hex');
}

function finiteContext() {
  const calls=[];
  let depth=0;
  const context={};
  for(const method of ['save','restore','translate','rotate','scale','beginPath','moveTo','lineTo','arcTo','arc','closePath','stroke','fill','fillText']){
    context[method]=(...args)=>{
      if(method==='save')depth++;
      if(method==='restore')depth--;
      assert.ok(depth>=0,'canvas restore must have a matching save');
      for(const value of args.slice(method==='fillText'?1:0))assert.ok(Number.isFinite(value),`${method} received a non-finite coordinate`);
      if(method==='arcTo')assert.ok(args[4]>=0,'rounded corner radius must be nonnegative');
      if(method==='arc')assert.ok(args[2]>=0,'circle radius must be nonnegative');
      calls.push([method,...args]);
    };
  }
  return {context,calls,depth:()=>depth};
}

test('fourteen original skins retain the first five indexes and unique names',()=>{
  assert.equal(WEAPON_SKINS.length,14);
  assert.deepEqual(WEAPON_SKINS.slice(0,5).map(skin=>skin.name),['沙丘游骑','潮汐脉冲','赤铜猎手','暮光远征','白隼信号']);
  assert.equal(new Set(WEAPON_SKINS.map(skin=>skin.name)).size,14);
  assert.equal(new Set(WEAPON_SKINS.map(skin=>skin.subtitle)).size,14);
  assert.ok(WEAPON_SKINS.every(skin=>skin.finish.length>8));
});

test('all eighty-four weapon and rarity combinations produce bounded finite SVG geometry',()=>{
  for(let index=0;index<14;index++)for(const quality of RARITIES){
    const svg=weaponSVG(index,quality);
    assert.match(svg,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.ok(svg.endsWith('</svg>'));
    assert.ok(svg.includes(`aria-label="${WEAPON_SKINS[index].name}"`));
    assert.ok(svg.includes(rarityColor(quality)));
    assert.doesNotMatch(svg,/NaN|Infinity|undefined|<script/);
    const geometry=shapes(svg);assert.ok(geometry.length>=20);
    for(const shape of geometry){
      for(const [key,value] of Object.entries(shape)){
        if(key==='type')continue;
        const numbers=key==='points'?value.flat():[value];
        assert.ok(numbers.every(Number.isFinite));
      }
      if(shape.type==='rect'){
        assert.ok(shape.width>0&&shape.height>0&&shape.rx>=0);
        assert.ok(shape.x>=-102&&shape.x+shape.width<=102);
        assert.ok(shape.y>=-43&&shape.y+shape.height<=43);
      }
      if(shape.type==='circle'){
        assert.ok(shape.r>0&&shape.cx-shape.r>=-102&&shape.cx+shape.r<=102);
        assert.ok(shape.cy-shape.r>=-43&&shape.cy+shape.r<=43);
      }
      if(shape.type==='polygon')assert.ok(shape.points.every(([x,y])=>Math.abs(x)<=102&&Math.abs(y)<=43));
    }
  }
});

test('all fourteen silhouettes differ independently of their paint and labels',()=>{
  const silhouettes=WEAPON_SKINS.map((_,index)=>silhouette(weaponSVG(index,'common')));
  assert.equal(new Set(silhouettes).size,14,'each weapon must have its own filled outline, not merely a new color');
});

test('rarity changes detail accents while retaining each model and its skin palette',()=>{
  for(let index=0;index<14;index++){
    const common=weaponSVG(index,'common'),mythic=weaponSVG(index,'mythic');
    assert.notEqual(common,mythic);
    assert.deepEqual(shapes(common),shapes(mythic));
    const colors=svg=>new Set([...svg.matchAll(/(?:fill|stroke)="(#[a-f\d]{6})"/gi)].map(match=>match[1]));
    const a=colors(common),b=colors(mythic);
    assert.ok([...a].filter(color=>b.has(color)).length>=8,'quality must preserve the skin colors and material details');
    assert.ok(a.has(rarityColor('common'))&&b.has(rarityColor('mythic')));
  }
});

test('every shared canvas model draws finite geometry and restores its caller transform',()=>{
  for(let index=0;index<14;index++)for(const quality of RARITIES){
    const {context,calls,depth}=finiteContext();
    drawWeapon(context,index,quality,{x:180,y:65,scale:.28,angle:1.7});
    assert.equal(depth(),0);
    assert.ok(calls.length>100);
    assert.deepEqual(calls[1],['translate',180,65]);
    assert.deepEqual(calls[2],['rotate',1.7]);
    assert.deepEqual(calls[3],['scale',.28,.28]);
    assert.equal(calls.at(-1)[0],'restore');
  }
});

test('unknown weapon indexes and invalid transform values fall back without broken output',()=>{
  const fallback=weaponSVG(0);
  for(const index of [-1,14,100,NaN,2.5])assert.equal(weaponSVG(index),fallback);
  const {context,depth}=finiteContext();
  drawWeapon(context,999,'unknown',{x:Infinity,y:NaN,scale:NaN,angle:-Infinity});
  assert.equal(depth(),0);
});
