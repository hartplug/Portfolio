import * as THREE from 'three';

const NODES = [
  { id:'internet', label:'INTERNET', type:'edge', layer:'network', zone:'NETWORK EDGE', detail:'Public request origin · HTTPS entry', position:[0,2.05,0], color:0x9ec5ca, size:0.24 },
  { id:'route53', label:'ROUTE 53', type:'dns', layer:'network', zone:'GLOBAL DNS', detail:'DNS resolution · Health-aware routing', position:[0,1.35,0], color:0xd3bd8a, size:0.3 },
  { id:'alb', label:'LOAD BALANCER', type:'alb', layer:'network', zone:'PUBLIC SUBNET', detail:'Public entry point · Traffic distribution · Health checks', position:[0,0.62,0], color:0xc9a879, size:0.43 },
  { id:'api', label:'API / INGRESS', type:'api', layer:'compute', zone:'PUBLIC SUBNET', detail:'Ingress layer · Request validation · Private service routing', position:[-0.68,-0.16,0.23], color:0x97bbc1, size:0.37 },
  { id:'compute', label:'COMPUTE', type:'compute', layer:'compute', zone:'PRIVATE SUBNET', detail:'Application layer · Private subnet · Auto scaling', position:[0.12,-0.18,-0.12], color:0xd3bd8a, size:0.47 },
  { id:'rds', label:'RDS', type:'database', layer:'data', zone:'PRIVATE SUBNET', detail:'Database · Private subnet · Multi-AZ · Encrypted', position:[0.78,-0.76,-0.28], color:0x9abec4, size:0.43 },
  { id:'s3', label:'S3', type:'storage', layer:'data', zone:'AWS MANAGED SERVICE', detail:'Object storage · Versioned assets · Encrypted at rest', position:[1.45,-0.28,0.16], color:0xc98e68, size:0.34 },
  { id:'iam', label:'IAM', type:'identity', layer:'security', zone:'ACCOUNT SECURITY', detail:'Least-privilege roles · Scoped service access', position:[-1.3,0.73,-0.55], color:0x9abec4, size:0.3 },
  { id:'cloudwatch', label:'CLOUDWATCH', type:'observability', layer:'observability', zone:'OBSERVABILITY', detail:'Metrics · Logs · Alarms · Operational visibility', position:[1.39,0.57,-0.62], color:0xa9b8aa, size:0.31 },
  { id:'deploy', label:'DEPLOYMENT', type:'deployment', layer:'compute', zone:'DELIVERY PIPELINE', detail:'Build and release automation · Repeatable deployment', position:[-1.3,-0.86,-0.42], color:0xc98e68, size:0.31 },
];
const BY_ID=Object.fromEntries(NODES.map(n=>[n.id,n]));
const MODES={overview:NODES.map(n=>n.id),network:['internet','route53','alb','api','compute'],compute:['alb','api','compute','deploy'],data:['compute','rds','s3'],security:['internet','route53','alb','api','compute','rds','s3','iam'],observability:['compute','rds','s3','cloudwatch']};
const EDGES=[['internet','route53'],['route53','alb'],['alb','api'],['api','compute'],['compute','rds'],['compute','s3'],['iam','compute'],['iam','rds'],['deploy','compute'],['compute','cloudwatch'],['rds','cloudwatch']];
const $=(root,s)=>root.querySelector(s);

function meshNode(node){
 const g=new THREE.Group();g.userData.nodeId=node.id;
 const metal=new THREE.MeshStandardMaterial({color:0x191b1c,metalness:.6,roughness:.36});
 const face=new THREE.MeshStandardMaterial({color:0x272724,metalness:.43,roughness:.4});
 const trim=new THREE.MeshStandardMaterial({color:node.color,emissive:node.color,emissiveIntensity:.18,metalness:.48,roughness:.32});
 const dim=new THREE.MeshStandardMaterial({color:0x101315,metalness:.2,roughness:.55});
 const box=(w,h,d,x,y,z,m=metal)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);return o};
 const cylinder=(r,h,x,y,z,m=metal)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),m);o.position.set(x,y,z);g.add(o);return o};
 const sphere=(r,x,y,z,m=trim)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),m);o.position.set(x,y,z);g.add(o);return o};
 const ring=(r,t,x,y,z,m=trim)=>{const o=new THREE.Mesh(new THREE.TorusGeometry(r,t,8,32),m);o.position.set(x,y,z);g.add(o);return o};
 if(node.type==='edge'){
   const geo=new THREE.IcosahedronGeometry(.22,1);g.add(new THREE.Mesh(geo,trim));ring(.34,.009,0,0,0,dim);
 }else if(node.type==='dns'){
   cylinder(.23,.24,0,0,0,face);cylinder(.18,.035,0,.15,0,trim);ring(.27,.012,0,.02,0,trim);
 }else if(node.type==='alb'){
   box(.72,.055,.43,0,-.2,0,dim);box(.64,.26,.36,0,-.03,0,face);box(.54,.035,.29,0,.12,0,trim);
   for(let i=-1;i<=1;i++){box(.035,.17,.035,i*.2,-.03,.2,trim);sphere(.025,i*.2,.17,.12,trim)}
   for(let i=0;i<5;i++)box(.06,.018,.018,-.22+i*.11,-.09,.19,dim);
 }else if(node.type==='api'){
   box(.5,.24,.32,0,0,0,face);box(.38,.04,.23,0,.13,.01,trim);
   for(let i=0;i<3;i++)box(.07,.08,.05,-.14+i*.14,-.035,.18,i===1?trim:dim);
 }else if(node.type==='compute'){
   box(.68,.06,.47,0,-.28,0,dim);
   for(let i=0;i<3;i++){box(.16,.39,.31,-.23+i*.23,-.035,0,i===1?face:metal);box(.12,.04,.275,-.23+i*.23,.185,.018,trim);for(let j=0;j<3;j++)sphere(.012,-.27+i*.23+j*.035,-.03,.16,trim)}
   box(.7,.025,.49,0,.19,0,face);
 }else if(node.type==='database'){
   cylinder(.22,.48,0,-.03,0,metal);const cap=(y)=>{const e=new THREE.Mesh(new THREE.CircleGeometry(.22,28),face);e.rotation.x=-Math.PI/2;e.position.set(0,y,.001);g.add(e)};cap(.22);cap(-.27);
   for(let y=-.14;y<=.12;y+=.13)ring(.22,.012,0,y,0,trim);
 }else if(node.type==='storage'){
   cylinder(.19,.39,0,-.03,0,metal);const e=new THREE.Mesh(new THREE.CircleGeometry(.19,24),trim);e.rotation.x=-Math.PI/2;e.position.y=.17;g.add(e);ring(.2,.017,0,.15,0,trim);
   for(let i=0;i<3;i++)box(.22,.018,.018,0,-.12+i*.1,.18,dim);
 }else if(node.type==='identity'){
   ring(.13,.025,-.07,.04,0,trim);box(.29,.045,.045,.13,.03,0,trim);box(.045,.09,.045,.23,-.025,0,trim);sphere(.04,-.07,.04,.03,face);
 }else if(node.type==='observability'){
   box(.42,.045,.28,0,-.13,0,dim);for(let i=0;i<4;i++)box(.055,[.1,.2,.15,.24][i],.05,-.15+i*.1,[-.07,-.02,-.045,.0][i],0,i===2?trim:face);
   const arc=new THREE.Mesh(new THREE.TorusGeometry(.22,.009,6,28,Math.PI),trim);arc.position.y=.13;g.add(arc);
 }else if(node.type==='deployment'){
   box(.38,.23,.26,0,-.01,0,face);box(.29,.035,.19,0,.13,0,trim);for(let i=0;i<3;i++)box(.06,.1,.04,-.1+i*.1,-.03,.15,i===1?trim:dim);
 }
 g.userData.disposeMaterials=[metal,face,trim,dim];return g;
}
function pathBetween(a,b,lift=.08){const mid=a.clone().add(b).multiplyScalar(.5);mid.y+=lift;return new THREE.QuadraticBezierCurve3(a,mid,b)}

export function mountAwsArchitecture(host,{reducedMotion=false}={}){
 const canvas=$(host,'[data-aws-scene]'),fallback=$(host,'[data-aws-fallback]');if(!canvas)return{destroy(){}};
 const viewStage=host.querySelector('.observatory-stage')||host.querySelector('.aws-model-stage');
  const mobile=()=>innerWidth<700;let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!mobile(),powerPreference:'low-power'})}
 catch{host.dataset.sceneState='fallback';fallback?.removeAttribute('hidden');canvas.hidden=true;return{destroy(){}}}
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile()?1.25:1.6));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x0b0d0e,.016);const camera=new THREE.PerspectiveCamera(37,1,.1,60),root=new THREE.Group();scene.add(root);
 scene.add(new THREE.HemisphereLight(0xb9c6c3,0x101112,1.25));const key=new THREE.DirectionalLight(0xe4d2a5,2.1);key.position.set(-4,7,5);scene.add(key);const rim=new THREE.PointLight(0x79a5ac,22,14);rim.position.set(4,2,3);scene.add(rim);const warm=new THREE.PointLight(0xc98e68,12,11);warm.position.set(-4,-1,-2);scene.add(warm);
 const stage=new THREE.Group();root.add(stage);const geometries=[],materials=[],nodeGroups=new Map(),edgeObjects=[];
 const mat=(color,opacity=.16)=>new THREE.MeshStandardMaterial({color,transparent:true,opacity,roughness:.72,metalness:.12,side:THREE.DoubleSide,depthWrite:false});
 const lineMat=(color,opacity=.5)=>new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false});
 const addMesh=(geo,material,parent=stage)=>{geometries.push(geo);materials.push(material);const m=new THREE.Mesh(geo,material);parent.add(m);return m};
 const addLine=(pts,material,parent=stage)=>{const geo=new THREE.BufferGeometry().setFromPoints(pts);geometries.push(geo);materials.push(material);const line=new THREE.Line(geo,material);parent.add(line);return line};
 const ground=addMesh(new THREE.PlaneGeometry(8.3,5.8),mat(0x141718,.35));ground.rotation.x=-Math.PI/2;ground.position.y=-1.45;
 const gridMat=lineMat(0x8b8068,.1);for(let x=-4;x<=4.01;x+=.5)addLine([new THREE.Vector3(x,-1.438,-2.8),new THREE.Vector3(x,-1.438,2.8)],gridMat);for(let z=-2.75;z<=2.76;z+=.5)addLine([new THREE.Vector3(-4.1,-1.438,z),new THREE.Vector3(4.1,-1.438,z)],gridMat);
 const vpc=new THREE.Group();root.add(vpc);vpc.userData.layer='network';const corners=[[-2.2,-1.39,-1.28],[2.35,-1.39,-1.28],[2.35,-1.39,1.2],[-2.2,-1.39,1.2],[-2.2,.55,-1.28],[2.35,.55,-1.28],[2.35,.55,1.2],[-2.2,.55,1.2]].map(p=>new THREE.Vector3(...p));
 const boundaryMat=lineMat(0xc9b47d,.56);[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(([a,b])=>addLine([corners[a],corners[b]],boundaryMat,vpc));const fill=addMesh(new THREE.PlaneGeometry(4.52,2.45),mat(0xc9b47d,.035),vpc);fill.rotation.x=-Math.PI/2;fill.position.set(.075,-1.375,-.04);
 function subnet(bounds,color){const g=new THREE.Group();g.userData.layer='network';root.add(g);const [x1,x2,z1,z2]=bounds,y=-1.34;[[x1,z1,x2,z1],[x2,z1,x2,z2],[x2,z2,x1,z2],[x1,z2,x1,z1]].forEach(e=>addLine([new THREE.Vector3(e[0],y,e[1]),new THREE.Vector3(e[2],y,e[3])],lineMat(color,.48),g));const plane=addMesh(new THREE.PlaneGeometry(x2-x1,z2-z1),mat(color,.028),g);plane.rotation.x=-Math.PI/2;plane.position.set((x1+x2)/2,y+.006,(z1+z2)/2);return g}
 subnet([-2.05,0,-1.12,1.05],0x9bb9bc);subnet([.14,2.2,-1.12,1.05],0xc9ad78);
 for(const node of NODES){const g=new THREE.Group();g.position.set(...node.position);g.userData={nodeId:node.id,layer:node.layer};root.add(g);nodeGroups.set(node.id,g);const pg=new THREE.CylinderGeometry(node.size*.83,node.size*.92,.075,6),pm=new THREE.MeshStandardMaterial({color:0x17191a,metalness:.64,roughness:.4});geometries.push(pg);materials.push(pm);const plinth=new THREE.Mesh(pg,pm);plinth.position.y=-node.size*.62;g.add(plinth);const tg=new THREE.TorusGeometry(node.size*.79,.009,6,32),tm=new THREE.MeshBasicMaterial({color:node.color,transparent:true,opacity:.45});geometries.push(tg);materials.push(tm);const trim=new THREE.Mesh(tg,tm);trim.rotation.x=Math.PI/2;trim.position.y=-node.size*.58;g.add(trim);const model=meshNode(node);g.add(model);g.userData.model=model;const light=new THREE.PointLight(node.color,node.id==='alb'?1:.36,1.9);light.position.y=.3;g.add(light);g.userData.light=light}
 for(const[from,to]of EDGES){const a=nodeGroups.get(from).position.clone(),b=nodeGroups.get(to).position.clone();a.y-=.08;b.y+=.02;const curve=pathBetween(a,b,from==='internet'||from==='route53'?.09:.24),line=addLine(curve.getPoints(32),lineMat(0xbda878,.42));line.userData={from,to};edgeObjects.push({line,curve,from,to})}
 const packetGeo=new THREE.SphereGeometry(.027,8,8),packetMat=new THREE.MeshBasicMaterial({color:0xd3bd8a,transparent:true,opacity:.86});geometries.push(packetGeo);materials.push(packetMat);const packets=[];for(const[i,t]of [[0,.12],[1,.55],[2,.2],[3,.66],[4,.38],[5,.76],[9,.22]]){const e=edgeObjects[i],m=new THREE.Mesh(packetGeo,packetMat);root.add(m);packets.push({mesh:m,curve:e.curve,t,speed:.035+(i%3)*.006,edge:e})}
 let seed=703;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};const points=[];for(let i=0;i<38;i++)points.push((rand()-.5)*8,rand()*3.2-1,(rand()-.5)*5.8);const pgeo=new THREE.BufferGeometry();pgeo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometries.push(pgeo);const pmat=new THREE.PointsMaterial({color:0xc9b47d,size:.016,transparent:true,opacity:.25,sizeAttenuation:true});materials.push(pmat);const ambient=new THREE.Points(pgeo,pmat);root.add(ambient);
  let selected='compute',mode='overview',visible=false,destroyed=false,raf=0,elapsed=0,dragging=false,lastX=0,lastY=0,rotX=-.1,rotY=0,dragDistance=0;const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();const buttons=[...host.querySelectorAll('[data-aws-node]')],modeButtons=[...host.querySelectorAll('[data-aws-mode]')];const title=$(host,'[data-aws-detail-title]'),copy=$(host,'[data-aws-detail-copy]'),kicker=$(host,'[data-aws-detail-kicker]'),zone=$(host,'[data-aws-detail-zone]');
 const allowed=()=>new Set(MODES[mode]);function applyFocus(){const keep=allowed();nodeGroups.forEach((g,id)=>{const active=keep.has(id),chosen=id===selected;g.traverse(o=>{if(o.isMesh)o.material.opacity=active?(chosen?.98:.88):.18});g.userData.light.intensity=active?(chosen?1.2:.56):.08});edgeObjects.forEach(e=>{const on=keep.has(e.from)&&keep.has(e.to)&&(selected===e.from||selected===e.to||mode==='overview');e.line.material.opacity=on?.64:(keep.has(e.from)&&keep.has(e.to)?.3:.055)});buttons.forEach(b=>{const id=b.dataset.awsNode;b.setAttribute('aria-pressed',String(id===selected));b.classList.toggle('active',id===selected);b.classList.toggle('is-muted',!keep.has(id))});modeButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.awsMode===mode)))}
 function select(id){if(!BY_ID[id])return;selected=id;const n=BY_ID[id];title.textContent=n.label;copy.textContent=n.detail;zone.textContent=n.zone;kicker.textContent=`${n.layer.toUpperCase()} / ${n.type.toUpperCase()}`;applyFocus();render()}
 function setMode(next){if(!MODES[next])return;mode=next;if(!allowed().has(selected)){const first=MODES[next].find(id=>BY_ID[id]);if(first)selected=first}select(selected)}
 const resetButton=host.querySelector('[data-aws-reset]');
 function resetView(){rotX=-.1;rotY=0;root.rotation.set(rotX,rotY,0);select('compute');render()}
 const onReset=()=>resetView();resetButton?.addEventListener('click',onReset);
 const onModeClick=event=>setMode(event.currentTarget.dataset.awsMode);const onNodeClick=event=>select(event.currentTarget.dataset.awsNode);
 buttons.forEach(b=>b.addEventListener('click',onNodeClick));modeButtons.forEach(b=>b.addEventListener('click',onModeClick));
 function resize(){const w=host.clientWidth||1,h=viewStage?.clientHeight||1;renderer.setSize(w,h,false);camera.aspect=w/h;const mobileView=w<620,tablet=w>=620&&w<940;camera.fov=mobileView?34:35;camera.position.set(0,mobileView?3.5:tablet?3.25:2.95,mobileView?10.6:tablet?9.5:8.4);camera.lookAt(0,-.15,0);camera.updateProjectionMatrix();render()}
 function render(){if(!destroyed)renderer.render(scene,camera)}
 function pick(e){const r=canvas.getBoundingClientRect();pointer.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects([...nodeGroups.values()].map(g=>g.userData.model),true)[0];if(hit){let o=hit.object;while(o&&!o.userData.nodeId)o=o.parent;if(o?.userData.nodeId)select(o.userData.nodeId)}}
 function down(e){if(e.button>0)return;dragging=true;dragDistance=0;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture?.(e.pointerId)}function move(e){if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;dragDistance+=Math.abs(dx)+Math.abs(dy);rotY+=dx*.003;rotX=THREE.MathUtils.clamp(rotX+dy*.002,-.34,.22);lastX=e.clientX;lastY=e.clientY;root.rotation.set(rotX,rotY,0);render()}function up(e){if(!dragging)return;dragging=false;if(dragDistance<8)pick(e);if(!reducedMotion&&visible)start()}
 const cancelDrag=()=>{dragging=false};canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancelDrag);const keydown=e=>{let i=NODES.findIndex(n=>n.id===selected);if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();select(NODES[(i+1)%NODES.length].id)}else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();select(NODES[(i-1+NODES.length)%NODES.length].id)}};canvas.addEventListener('keydown',keydown);
 function frame(now){raf=0;if(destroyed||!visible||document.hidden||reducedMotion||dragging)return;elapsed=now*.001;root.rotation.y+=(rotY-root.rotation.y)*.018;root.rotation.x+=(rotX-root.rotation.x)*.018;key.position.x=-4+Math.sin(elapsed*.09)*.12;ambient.rotation.y=Math.sin(elapsed*.035)*.012;packets.forEach(p=>{p.t=(p.t+p.speed/60)%1;p.mesh.position.copy(p.curve.getPoint(p.t));p.mesh.visible=mode==='overview'||allowed().has(p.edge.from)&&allowed().has(p.edge.to)});render();raf=requestAnimationFrame(frame)}function start(){if(!raf&&visible&&!document.hidden&&!destroyed&&!reducedMotion)raf=requestAnimationFrame(frame)}function stop(){if(raf)cancelAnimationFrame(raf);raf=0}
 const observer=new IntersectionObserver(entries=>{visible=Boolean(entries[0]?.isIntersecting);if(visible){render();start()}else stop()},{threshold:.01});observer.observe(host);const ro=new ResizeObserver(resize);ro.observe(host);window.addEventListener('resize',resize,{passive:true});const visibility=()=>document.hidden?stop():start();document.addEventListener('visibilitychange',visibility);resize();select('compute');host.dataset.sceneState=reducedMotion?'static':'ready';
 const destroy=()=>{if(destroyed)return;destroyed=true;stop();observer.disconnect();ro.disconnect();window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancelDrag);canvas.removeEventListener('keydown',keydown);resetButton?.removeEventListener('click',onReset);buttons.forEach(b=>b.removeEventListener('click',onNodeClick));modeButtons.forEach(b=>b.removeEventListener('click',onModeClick));geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());nodeGroups.forEach(g=>g.userData.model?.userData.disposeMaterials?.forEach(m=>m.dispose()));renderer.dispose()};window.addEventListener('pagehide',destroy,{once:true});return{destroy,select,setMode,resetView};
}
