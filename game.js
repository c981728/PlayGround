import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

// DUST & IRON — a compact, entirely procedural Mojave FPS.
const canvas = document.querySelector('#game');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb4a184);
scene.fog = new THREE.Fog(0xb4a184, 44, 145);
const camera = new THREE.PerspectiveCamera(73, innerWidth / innerHeight, 0.08, 180);
camera.rotation.order = 'YXZ';
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;

scene.add(new THREE.HemisphereLight(0xe4d7b6, 0x554539, 2.15));
const sun = new THREE.DirectionalLight(0xffdfaa, 3.1);
sun.position.set(-32, 54, 25);
scene.add(sun);
const fill = new THREE.DirectionalLight(0x9ca99e, .75); fill.position.set(24, 18, -35); scene.add(fill);
const mat = (color, roughness=.9, metalness=0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const mats = {
  sand: mat(0x9b7856), road: mat(0x76604a), rock: mat(0x625448), lightRock: mat(0xa58c69),
  dark: mat(0x282c28), metal: mat(0x393e3b,.48,.72), rust: mat(0x87523b), wood: mat(0x66513a),
  cloth: mat(0x575b48), skin: mat(0x92745a), cactus: mat(0x475343), canvas: mat(0xb59a6b),
  concrete: mat(0x777368), glass: new THREE.MeshStandardMaterial({color:0x75837d, roughness:.25, metalness:.25})
};
const boxGeo = new THREE.BoxGeometry(1,1,1);
function box(parent, name, size, position, material, rotation){ const m=new THREE.Mesh(boxGeo,material); m.name=name; m.scale.set(...size);m.position.set(...position);if(rotation)m.rotation.set(...rotation);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m; }
function cylinder(parent,r1,r2,h,position,material,segments=8,rotation){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);m.position.set(...position);if(rotation)m.rotation.set(...rotation);m.castShadow=true;parent.add(m);return m;}
function sphere(parent,r,pos,material,scale=[1,1,1]){const m=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),material);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;parent.add(m);return m;}

// Broad baked-looking terrain, a dusty highway and distant mesas.
const collisionObstacles=[];
const addCircleObstacle=(x,z,r)=>collisionObstacles.push({x,z,r});
const addBoxObstacle=(x,z,hx,hz)=>collisionObstacles.push({x,z,hx,hz});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(260,260,1,1), mats.sand);
ground.rotation.x=-Math.PI/2;ground.position.y=-.12;ground.receiveShadow=true;scene.add(ground);
const road = new THREE.Mesh(new THREE.PlaneGeometry(7,150),mats.road);road.rotation.x=-Math.PI/2;road.position.set(0,-.09,-28);scene.add(road);
for(let i=0;i<38;i++){
  const z=16-i*3.65, x=(i%2?1:-1)*(3.65+(i%4)*.12);
  box(scene,'road stripe',[.08,.015,1.7],[x,-.07,z],mat(0xc3a777));
}
function mesa(x,z,sx,sy,sz,color){const m=new THREE.Mesh(new THREE.ConeGeometry(1,1,5),mat(color));m.scale.set(sx,sy,sz);m.position.set(x,sy*.5-0.1,z);m.rotation.y=.35+(x%2)*.2;scene.add(m);}
mesa(-49,-73,24,20,18,0x806950);mesa(50,-77,28,25,24,0x77634f);mesa(-77,-34,22,18,28,0x907454);mesa(82,-24,24,19,25,0x816a53);mesa(30,-105,34,25,20,0x8e765d);

// Rusted relay compound and roadside debris.
function makeTower(){
 const g=new THREE.Group();g.position.set(0,0,-49);scene.add(g);
 const steel=mats.metal, beam=boxGeo;
 for(const x of [-1.25,1.25])for(const z of [-1.1,1.1]){
  const leg=box(g,'tower leg',[.14,11,.14],[x,5.5,z],steel);leg.rotation.z=x*.08;
 }
 for(const y of [1.5,4,6.5,9,10.8]){
  box(g,'tower brace',[2.7,.12,.12],[0,y,-1.1],steel);box(g,'tower brace',[2.7,.12,.12],[0,y,1.1],steel);
  box(g,'tower side brace',[.12,.12,2.4],[-1.25,y,0],steel);box(g,'tower side brace',[.12,.12,2.4],[1.25,y,0],steel);
 }
 for(const y of [2.75,5.25,7.75]){const d=box(g,'cross brace',[.1,2.7,.1],[0,y,-1.15],steel);d.rotation.z=.65;const d2=box(g,'cross brace',[.1,2.7,.1],[0,y,1.15],steel);d2.rotation.z=-.65;}
 box(g,'relay hut',[3.4,2.3,3],[0,1.15,0],mats.concrete);
 box(g,'relay door',[.78,1.6,.06],[0,.8,-1.55],mats.dark);
 box(g,'antenna deck',[3.1,.16,2.8],[0,10.9,0],mats.rust);
 cylinder(g,.04,.04,5,[0,13.2,0],steel,8);
 const dish=new THREE.Mesh(new THREE.SphereGeometry(1,12,8,0,Math.PI*2,0,Math.PI/2),mat(0xaaa18a,.5,.5));dish.position.set(.9,12.4,.15);dish.rotation.z=-.5;dish.scale.set(.9,.22,.9);g.add(dish);
 const beacon=new THREE.PointLight(0xe5a44d,0,9);beacon.position.set(0,12.5,0);g.add(beacon);g.userData.beacon=beacon;
 for(let x=-1;x<=1;x+=2)box(g,'warning panel',[.38,.75,.04],[x*1.35,1.8,-1.54],mats.rust);
 g.userData.activate=()=>{beacon.intensity=8;};return g;
}
const relay=makeTower();
addBoxObstacle(0,-49,1.7,1.5);
function shack(x,z){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);box(g,'shack',[5,3.2,4],[0,1.6,0],mats.wood);box(g,'roof',[5.8,.24,4.8],[0,3.25,0],mats.rust);box(g,'door',[.9,2,.07],[1.35,1,-2.05],mats.dark);box(g,'window',[1,.75,.08],[-1.2,2,-2.06],mats.glass);addBoxObstacle(x,z,2.5,2);return g;}
shack(-12,-5);
function barrel(x,z){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);cylinder(g,.42,.42,.92,[0,.46,0],x%2?mats.rust:mats.metal,12);for(let y of [.2,.7])cylinder(g,.44,.44,.065,[0,y,0],mats.dark,12);}
for(const p of [[-5,-12],[4,-23],[-9,-35],[8,-42],[-14,-20],[14,-7]]){barrel(...p);addCircleObstacle(p[0],p[1],.58);}
function rock(x,z,s){const m=new THREE.Mesh(new THREE.DodecahedronGeometry(1,0),x%2?mats.rock:mats.lightRock);m.position.set(x,s*.48,z);m.scale.set(s*1.2,s*.8,s);m.rotation.set(.15*x,.2*z,.1*x);m.castShadow=true;scene.add(m);}
for(let i=0;i<54;i++){const side=i%2?1:-1;const x=side*(7+Math.random()*31),z=18-Math.random()*105,s=.35+Math.random()*1.7;rock(x,z,s);addCircleObstacle(x,z,s*.82);}
function cactus(x,z,s=1){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);cylinder(g,.22*s,.27*s,2.5*s,[0,1.25*s,0],mats.cactus,7);cylinder(g,.12*s,.13*s,.95*s,[.35*s,1.15*s,0],mats.cactus,7,[0,0,Math.PI/2.5]);cylinder(g,.12*s,.13*s,.8*s,[.51*s,1.55*s,0],mats.cactus,7,[0,0,-Math.PI/2.5]);cylinder(g,.12*s,.13*s,.85*s,[-.34*s,.95*s,0],mats.cactus,7,[0,0,-Math.PI/2.3]);cylinder(g,.12*s,.13*s,.72*s,[-.52*s,1.35*s,0],mats.cactus,7,[0,0,Math.PI/2.5]);}
for(let i=0;i<24;i++){const x=(i%2?1:-1)*(9+Math.random()*28),z=16-Math.random()*100,s=.55+Math.random()*.65;cactus(x,z,s);addCircleObstacle(x,z,.55*s);}

const player={pos:new THREE.Vector3(0,0,8),yaw:0,pitch:0,health:100,ammo:0,reserve:0,xp:0,kills:0,started:false,paused:false,done:false,moveX:0,moveY:0,lastDamage:0};
camera.position.set(player.pos.x,1.68,player.pos.z);scene.add(camera);

const weapons=[
 {name:'RANGER AR-16',short:'AR-16',type:'5.56MM · SERVICE CARBINE',capacity:24,ammo:24,reserve:96,damage:34,rate:145,reload:1550,spread:.007,kind:'rifle'},
 {name:'M1911 SERVICE',short:'M1911',type:'.45 ACP · SIDEARM',capacity:7,ammo:7,reserve:42,damage:48,rate:290,reload:1250,spread:.011,kind:'pistol'},
 {name:'M1903 SPRINGFIELD',short:'M1903',type:'.30-06 · BOLT-ACTION',capacity:5,ammo:5,reserve:25,damage:100,rate:760,reload:1850,spread:.002,kind:'bolt'},
 {name:'RANGER P9',short:'P9',type:'9MM · POLYMER SIDEARM',capacity:15,ammo:15,reserve:60,damage:40,rate:230,reload:1350,spread:.009,kind:'pistol'}
];
let weaponIndex=0, lastShot=0, reloading=false, reloadTimer=0, recoil=0, muzzleTimer=0, fireHeld=false;
const viewmodel=new THREE.Group();camera.add(viewmodel);viewmodel.position.set(.27,-.32,-.56);
const gunMaterials={steel:mat(0x343936,.38,.8),dark:mat(0x1d211f,.65,.25),wood:mat(0x5c4935),rubber:mat(0x292c28),brass:mat(0xa98244,.4,.7)};
function gunBox(parent,size,pos,material,rot){return box(parent,'weapon part',size,pos,material,rot);}
function gunTube(parent,radius,length,pos,material){return cylinder(parent,radius,radius,length,pos,material,10,[Math.PI/2,0,0]);}
function buildGun(kind){
 viewmodel.clear(); const g=new THREE.Group();viewmodel.add(g);
 if(kind==='pistol'){
  gunBox(g,[.15,.18,.34],[0,0,0],gunMaterials.steel);gunBox(g,[.13,.22,.16],[0,-.17,.04],gunMaterials.rubber,[.12,0,0]);
  gunTube(g,.035,.28,[0,.025,-.29],gunMaterials.dark);gunBox(g,[.17,.055,.22],[0,.105,-.04],gunMaterials.steel);
  gunBox(g,[.035,.04,.055],[0,.13,-.29],gunMaterials.dark);gunBox(g,[.09,.025,.045],[0,.13,.09],gunMaterials.dark);
  gunBox(g,[.16,.045,.045],[0,-.01,-.07],gunMaterials.dark);
 }else{
  const bolt=kind==='bolt';
  gunBox(g,[.19,.18,.4],[0,.01,0],gunMaterials.steel);
  gunBox(g,[.15,.14,.53],[0,-.035,.4],bolt?gunMaterials.wood:gunMaterials.rubber,[.04,0,0]);
  gunBox(g,[.105,.105,.29],[0,-.02,-.31],bolt?gunMaterials.wood:gunMaterials.dark);
  gunTube(g,.027,bolt?.72:.58,[0,.025,-.72],gunMaterials.steel);
  gunTube(g,.038,.12,[0,.025,-1.11],gunMaterials.dark);
  gunBox(g,[.045,.085,.075],[0,.14,-.38],gunMaterials.dark);
  gunBox(g,[.06,.08,.08],[0,.145,-.89],gunMaterials.dark);
  if(bolt){gunBox(g,[.035,.04,.14],[.12,.03,.02],gunMaterials.steel);sphere(g,.045,[.14,.04,.08],gunMaterials.dark);}
  else{
   gunBox(g,[.13,.32,.16],[0,-.25,-.08],gunMaterials.dark,[.08,0,0]);
   gunBox(g,[.105,.19,.15],[0,-.2,-.44],gunMaterials.rubber);
   gunBox(g,[.11,.075,.22],[.035,-.01,-.52],gunMaterials.dark);
  }
  gunBox(g,[.09,.07,.08],[0,.14,.22],gunMaterials.dark);
 }
 // Sleeves and a leather glove anchor the first-person model.
 const sleeve=mat(0x77705a),glove=mat(0x443c32);
 box(g,'sleeve',[.19,.22,.24],[-.15,-.24,.15],sleeve,[.16,0,-.18]);
 box(g,'glove',[.16,.13,.2],[-.05,-.16,-.02],glove,[.1,0,-.08]);
 g.position.set(0,0,0);return g;
}
let gunModel=buildGun('rifle');
const muzzleFlash=new THREE.Group();viewmodel.add(muzzleFlash);muzzleFlash.position.set(0,.01,-1.25);
const flashMat=new THREE.MeshBasicMaterial({color:0xffd26c,transparent:true,opacity:.9,depthWrite:false});
const flashMesh=new THREE.Mesh(new THREE.ConeGeometry(.12,.34,8),flashMat);flashMesh.rotation.x=-Math.PI/2;muzzleFlash.add(flashMesh);muzzleFlash.visible=false;

const enemies=[];
const enemyPositions=[[-5,-14],[6,-19],[-7,-27],[8,-32],[-4,-39],[5,-43]];
function createEnemy(x,z,index){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 const cloth=mat(index%2?0x5b5141:0x4c554a), scarf=mat(0x9a5740), skin=mat(0x94775e), armor=mat(0x393d37,.8,.1);
 box(g,'raider torso',[.72,.92,.4],[0,1.18,0],cloth);
 box(g,'vest',[.66,.58,.43],[0,1.24,-.02],armor);
 sphere(g,.27,[0,1.92,0],skin,[.85,1.05,.9]);
 box(g,'mask',[.43,.2,.4],[0,1.83,-.06],scarf);
 box(g,'raider arm',[.22,.7,.24],[-.48,1.2,-.02],cloth,[0,0,-.13]);box(g,'raider arm',[.22,.7,.24],[.48,1.2,-.02],cloth,[0,0,.12]);
 box(g,'raider leg',[.27,.75,.3],[-.2,.38,0],armor);box(g,'raider leg',[.27,.75,.3],[.2,.38,0],cloth);
 const rifle=new THREE.Group();g.add(rifle);gunBox(rifle,[.11,.11,.44],[.12,1.35,-.3],gunMaterials.dark);gunTube(rifle,.02,.4,[.12,1.38,-.7],gunMaterials.steel);gunBox(rifle,[.12,.18,.2],[.12,1.22,-.25],gunMaterials.wood);
 g.userData.hp=100;g.userData.maxHp=100;g.userData.live=true;g.userData.lastAttack=performance.now()+800+Math.random()*1800;g.userData.originX=x;g.userData.originZ=z;g.userData.index=index;g.userData.coverRadius=.55;
 g.traverse(o=>{if(o.isMesh){o.userData.enemy=g;o.castShadow=true;}});enemies.push(g);return g;
}
enemyPositions.forEach((p,i)=>createEnemy(p[0],p[1],i));
const enemyMeshes=[];for(const e of enemies)e.traverse(o=>{if(o.isMesh)enemyMeshes.push(o);});
const worldMeshes=[];scene.traverse(o=>{if(o.isMesh&&o!==ground&&o!==road&&!enemyMeshes.includes(o)&&o.name!=='weapon part'&&o.name!=='sleeve'&&o.name!=='glove')worldMeshes.push(o);});

let suppliesFound=false, nearObject=null;
const cache=new THREE.Group();cache.position.set(-7,0,1);scene.add(cache);
box(cache,'field cache',[1.2,.65,.8],[0,.35,0],mats.wood);box(cache,'cache lid',[1.3,.12,.88],[0,.72,0],mats.metal);box(cache,'cache latch',[.12,.18,.1],[0,.48,-.45],mats.brass);cache.traverse(o=>{if(o.isMesh)worldMeshes.push(o);});
function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2100);}
function updateWeaponHud(){const w=weapons[weaponIndex];document.querySelector('#weapon-name').textContent=w.name;document.querySelector('#weapon-type').textContent=w.type;document.querySelector('#ammo-current').textContent=w.ammo;document.querySelector('#ammo-reserve').textContent=w.reserve;document.querySelector('#mobile-weapon-label').textContent=w.short;}
function setWeapon(i){weaponIndex=(i+weapons.length)%weapons.length;gunModel=buildGun(weapons[weaponIndex].kind);updateWeaponHud();}
updateWeaponHud();
function updateMission(){
 const distance=player.pos.distanceTo(new THREE.Vector3(0,0,-49));const complete=player.kills>=enemies.length;
 document.querySelector('#objective-count').textContent=complete?'02 / 02':'01 / 02';
 document.querySelector('#objective-title').textContent=player.done?'SIGNAL RESTORED':complete?'THE RELAY IS CLEAR':'A SIGNAL IN THE DUST';
 document.querySelector('#objective-text').textContent=player.done?'A voice answers from the other side of the hills.':complete?'Reach the tower and bring the old relay back online.':`Clear the raiders (${Math.min(player.kills,enemies.length)} / ${enemies.length}) and reach the relay tower.`;
 document.querySelector('#mission-progress').style.width=player.done?'100%':`${Math.min(96,Math.max(8,player.kills/5*57+(1-distance/70)*40))}%`;
 document.querySelector('#distance-label').textContent=player.done?'TRANSMISSION · LIVE':`RELAY · ${Math.max(0,Math.round(distance))} M`;
 document.querySelector('#xp-value').textContent=String(player.xp).padStart(3,'0');document.querySelector('#xp-bar').style.width=`${Math.min(100,(player.xp%300)/3)}%`;
 document.querySelector('#level-label').textContent=`LVL ${String(1+Math.floor(player.xp/300)).padStart(2,'0')}`;
}

function interact(){
 if(nearObject==='cache'&&!suppliesFound){suppliesFound=true;player.health=Math.min(100,player.health+25);for(const w of weapons)w.reserve+=w.capacity*2;toast('FIELD CACHE SECURED  ·  AMMO & MEDICAL SUPPLIES');updateWeaponHud();updateHealth();return;}
 if(nearObject==='relay'&&player.kills>=enemies.length&&!player.done){player.done=true;player.xp+=250;relay.userData.activate();updateMission();document.querySelector('#end-screen').classList.remove('hidden');document.exitPointerLock?.();return;}
 if(nearObject==='relay'&&!player.done)toast(`RELAY LOCKED  ·  ${enemies.length-player.kills} RAIDER${enemies.length-player.kills===1?'':'S'} REMAIN`);
}
function updateHealth(){document.querySelector('#health-value').textContent=Math.ceil(player.health);document.querySelector('#health-bar').style.width=`${Math.max(0,player.health)}%`;document.querySelector('#health-bar').style.background=player.health<30?'#b74e3d':'#c8a05b';}
function reload(){const w=weapons[weaponIndex];if(reloading||w.ammo>=w.capacity||w.reserve<=0)return;reloading=true;reloadTimer=w.reload;toast('RELOADING');}
function damageEnemy(enemy,amount,hitPoint){
 if(!enemy.userData.live)return;
 const headshot=hitPoint&&hitPoint.y>enemy.position.y+1.73;
 enemy.userData.hp-=amount*(headshot?1.5:1);enemy.userData.flashUntil=performance.now()+95;
 const hm=document.querySelector('#hitmarker');hm.classList.add('show');clearTimeout(hm.timer);hm.timer=setTimeout(()=>hm.classList.remove('show'),100);
 if(enemy.userData.hp<=0){
  enemy.userData.live=false;enemy.visible=false;player.kills++;player.xp+=100;
  toast(headshot?'HEADSHOT  ·  +100 XP':'RAIDER DOWN  ·  +100 XP');updateMission();
  // Small chance to scavenge ammunition from a defeated raider.
  if(Math.random()<.58){const w=weapons[weaponIndex];w.reserve+=w.capacity;updateWeaponHud();}
 }else if(headshot)toast('HEADSHOT');
}
const raycaster=new THREE.Raycaster();
function shoot(){
 if(!player.started||player.paused||player.done)return;
 const now=performance.now(),w=weapons[weaponIndex];if(now-lastShot<w.rate||reloading)return;lastShot=now;
 if(w.ammo<=0){toast('EMPTY · RELOAD');return;}w.ammo--;updateWeaponHud();recoil=.095;muzzleTimer=75;muzzleFlash.visible=true;
 // A tight hitscan cone keeps all three firearms immediately responsive.
 raycaster.setFromCamera(new THREE.Vector2((Math.random()-.5)*w.spread,(Math.random()-.5)*w.spread),camera);raycaster.far=95;
 const hits=raycaster.intersectObjects(enemyMeshes,false).filter(h=>h.object.userData.enemy?.userData.live);
 const obstruction=raycaster.intersectObjects(worldMeshes,false)[0];
  const hit=hits.find(h=>!obstruction||h.distance<obstruction.distance);
  if(hit){const e=hit.object.userData.enemy;damageEnemy(e,w.damage,hit.point);}
 if(w.kind==='bolt'&&w.ammo===0)toast('BOLT ACTION · RELOAD');
}
function enemyAttack(enemy,now){
 if(!enemy.userData.live||now<enemy.userData.lastAttack)return;
 const delta=new THREE.Vector3(player.pos.x-enemy.position.x,0,player.pos.z-enemy.position.z),dist=delta.length();
 enemy.userData.lastAttack=now+1450+Math.random()*1900;
 if(dist>23)return;
  const rayDirection=delta.clone().setY(0).normalize();
  raycaster.set(new THREE.Vector3(enemy.position.x,1.35,enemy.position.z),rayDirection);raycaster.far=dist;
  if(raycaster.intersectObjects(worldMeshes,false).length)return;
 // Incoming rounds are readable, but pressure rather than instant-kill the player.
 const accuracy=Math.max(.35,1-dist/32);if(Math.random()<accuracy){player.health=Math.max(0,player.health-(5+Math.random()*5));updateHealth();player.lastDamage=now;const v=document.querySelector('#damage-vignette');v.classList.add('pulse');setTimeout(()=>v.classList.remove('pulse'),160);}
 if(player.health<=0){player.health=100;player.pos.set(0,0,8);camera.position.set(0,1.68,8);updateHealth();toast('WOUNDED · EVACUATED TO THE ROAD');}
}

let lastFrame=performance.now(), walkTime=0;
function animate(now){
 requestAnimationFrame(animate);const dt=Math.min(.05,(now-lastFrame)/1000);lastFrame=now;
 if(player.started&&!player.paused&&!player.done){
  let forward=0,strafe=0;
  if(keys.has('KeyW')||keys.has('ArrowUp'))forward+=1;if(keys.has('KeyS')||keys.has('ArrowDown'))forward-=1;
  if(keys.has('KeyD'))strafe+=1;if(keys.has('KeyA'))strafe-=1;
  forward+=player.moveY;strafe+=player.moveX;
  const len=Math.hypot(forward,strafe);if(len>1){forward/=len;strafe/=len;}
  const speed=(keys.has('ShiftLeft')?6.6:4.7)*dt;
  const nextX=THREE.MathUtils.clamp(player.pos.x+(-Math.sin(player.yaw)*forward+Math.cos(player.yaw)*strafe)*speed,-34,34);
  const nextZ=THREE.MathUtils.clamp(player.pos.z+(-Math.cos(player.yaw)*forward-Math.sin(player.yaw)*strafe)*speed,-61,30);
  const canStand=(x,z)=>!collisionObstacles.some(o=>o.hx!==undefined?Math.abs(x-o.x)<o.hx+.32&&Math.abs(z-o.z)<o.hz+.32:Math.hypot(x-o.x,z-o.z)<o.r+.32)&&!enemies.some(e=>e.userData.live&&Math.hypot(x-e.position.x,z-e.position.z)<.72);
  if(canStand(nextX,player.pos.z))player.pos.x=nextX;
  if(canStand(player.pos.x,nextZ))player.pos.z=nextZ;
  walkTime+=dt*(len?10:2);const bob=len?Math.sin(walkTime)*.035:0;
  camera.position.set(player.pos.x,1.68+bob,player.pos.z);camera.rotation.set(player.pitch,player.yaw,0,'YXZ');
  if(reloading){reloadTimer-=dt*1000;if(reloadTimer<=0){const w=weapons[weaponIndex],need=w.capacity-w.ammo,take=Math.min(need,w.reserve);w.ammo+=take;w.reserve-=take;reloading=false;updateWeaponHud();}}
  recoil=Math.max(0,recoil-dt*.42);viewmodel.position.y=-.32+Math.sin(walkTime)*Math.min(.012,len*.012);viewmodel.position.z=-.56+recoil;
  if(muzzleTimer>0){muzzleTimer-=dt*1000;if(muzzleTimer<=0)muzzleFlash.visible=false;}
  for(const enemy of enemies){if(!enemy.userData.live)continue;const dx=player.pos.x-enemy.position.x,dz=player.pos.z-enemy.position.z,dist=Math.hypot(dx,dz);enemy.rotation.y=Math.atan2(dx,dz);enemy.position.y=Math.sin(now*.002+enemy.userData.index)*.012;if(dist<24&&dist>10){enemy.position.x+=dx/dist*dt*.3;enemy.position.z+=dz/dist*dt*.3;}enemyAttack(enemy,now);}
   if(fireHeld)shoot();
  const cd=player.pos.distanceTo(new THREE.Vector3(-7,0,1));const rd=player.pos.distanceTo(new THREE.Vector3(0,0,-49));
  nearObject=cd<2.8&&!suppliesFound?'cache':rd<4.2?'relay':null;
  const prompt=document.querySelector('#interact-prompt');prompt.style.display=nearObject?'block':'none';
  prompt.textContent=nearObject==='cache'?'[ E ]  SEARCH FIELD CACHE':nearObject==='relay'?(player.kills>=enemies.length?'[ E ]  ACTIVATE RELAY':'[ E ]  CHECK RELAY') :'';
  document.querySelector('#distance-label').textContent=player.done?'TRANSMISSION · LIVE':`RELAY · ${Math.max(0,Math.round(rd))} M`;
  if(now-lastMissionUpdate>500){updateMission();lastMissionUpdate=now;}
 }
 renderer.render(scene,camera);
}
let lastMissionUpdate=0;requestAnimationFrame(animate);

const keys=new Set();let dragPointer=null,lastTouchX=0,lastTouchY=0,stickPointer=null;
const isTouch=()=>matchMedia('(pointer:coarse)').matches||innerWidth<800;
function beginGame(){document.querySelector('#start-screen').classList.add('hidden');player.started=true;toast('CONTRACT ACCEPTED  ·  CLEAR THE WASH');if(!isTouch())canvas.requestPointerLock?.();}
document.querySelector('#start-btn').addEventListener('click',beginGame);
function togglePause(force){if(!player.started||player.done)return;player.paused=force??!player.paused;document.querySelector('#pause-screen').classList.toggle('hidden',!player.paused);if(player.paused)document.exitPointerLock?.();else if(!isTouch())canvas.requestPointerLock?.();}
document.querySelector('#pause-btn').addEventListener('click',()=>togglePause());
document.querySelector('#resume-btn').addEventListener('click',()=>togglePause(false));
document.querySelector('#restart-btn').addEventListener('click',()=>location.reload());
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&player.started&&!player.paused&&!player.done&&!isTouch()){togglePause(true);}});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas&&!player.paused){player.yaw-=e.movementX*.0022;player.pitch=THREE.MathUtils.clamp(player.pitch-e.movementY*.002,-1.3,1.3);}});
canvas.addEventListener('pointerdown',e=>{if(!player.started||player.paused||e.pointerType==='mouse')return;dragPointer=e.pointerId;lastTouchX=e.clientX;lastTouchY=e.clientY;canvas.setPointerCapture?.(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(dragPointer!==e.pointerId)return;player.yaw-=(e.clientX-lastTouchX)*.004;player.pitch=THREE.MathUtils.clamp(player.pitch-(e.clientY-lastTouchY)*.003,-1.25,1.25);lastTouchX=e.clientX;lastTouchY=e.clientY;});
canvas.addEventListener('pointerup',e=>{if(dragPointer===e.pointerId)dragPointer=null;});
canvas.addEventListener('mousedown',e=>{if(e.button===0&&document.pointerLockElement===canvas)shoot();});
window.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('keydown',e=>{
 keys.add(e.code);if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.repeat)return;
 if(e.code==='Digit1')setWeapon(0);if(e.code==='Digit2')setWeapon(1);if(e.code==='Digit3')setWeapon(2);if(e.code==='Digit4')setWeapon(3);
 if(e.code==='KeyR')reload();if(e.code==='KeyE'||e.code==='KeyF')interact();
 if(e.code==='Escape'&&player.started)togglePause();
 if(e.code==='KeyQ')setWeapon(weaponIndex+1);
});window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>keys.clear());
const pad=document.querySelector('#move-pad'),knob=document.querySelector('#stick-knob');
pad.addEventListener('pointerdown',e=>{stickPointer=e.pointerId;pad.setPointerCapture(e.pointerId);moveStick(e);e.preventDefault();});
pad.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)moveStick(e);});
function moveStick(e){const r=pad.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,max=38,len=Math.hypot(dx,dy),scale=len>max?max/len:1;const x=dx*scale,y=dy*scale;knob.style.transform=`translate(${x}px,${y}px)`;player.moveX=x/max;player.moveY=-y/max;}
function releaseStick(e){if(e.pointerId!==stickPointer)return;stickPointer=null;player.moveX=player.moveY=0;knob.style.transform='translate(0,0)';}
pad.addEventListener('pointerup',releaseStick);pad.addEventListener('pointercancel',releaseStick);
const fireBtn=document.querySelector('#mobile-fire');fireBtn.addEventListener('pointerdown',e=>{e.preventDefault();fireHeld=true;shoot();fireBtn.setPointerCapture(e.pointerId);fireBtn.classList.add('pressed');});const releaseFire=()=>{fireHeld=false;fireBtn.classList.remove('pressed');};fireBtn.addEventListener('pointerup',releaseFire);fireBtn.addEventListener('pointercancel',releaseFire);fireBtn.addEventListener('lostpointercapture',releaseFire);
document.querySelector('#mobile-reload').addEventListener('pointerdown',e=>{e.preventDefault();reload();});
document.querySelector('#mobile-use').addEventListener('pointerdown',e=>{e.preventDefault();interact();});
document.querySelector('#weapon-prev').addEventListener('pointerdown',e=>{e.preventDefault();setWeapon(weaponIndex-1);});
document.querySelector('#weapon-next').addEventListener('pointerdown',e=>{e.preventDefault();setWeapon(weaponIndex+1);});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));});
