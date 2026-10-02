// Whole-body illustrations hold at 8 fps; the door and coin flights use real time.
export const FPS=8,CYCLE=112,HEIGHT=208;
export const PORT=[[617.6,533.3],[649.5,520.5],[650,584.5],[618,594.1]];
export const WAIT=[817,726],SLOTS=[WAIT,[933,770],[1050,814]];
export const TIMES=Object.freeze({lift:0,reach:3,release:5,withdraw:6,close:8,closed:24,card:25,paid:29,cardAway:32,filled:48,opened:64,takeLift:64,takeReach:66,grasp:68,takeLower:70,taken:72,leave:72,advance:92});
export const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const mix=(a,b,t)=>a+(b-a)*t;
export const ease=n=>{const t=clamp(n);return t*t*(3-2*t)};
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export const bottleFor=id=>id%3===2?'jug':'bottle';
// Approved two-angle sheets: eight distinct exposures, played left to right.
export const WALK_OUT=Object.freeze([21,22,23,24,25,26,27,28]);
export const WALK_IN=Object.freeze([29,30,31,32,33,34,35,36]);
export const WALK_QUEUE=WALK_IN;
export const GAITS=Object.freeze({arrive:{cels:WALK_IN,holdFrames:1},advance:{cels:WALK_QUEUE,holdFrames:1},leave:{cels:WALK_OUT,holdFrames:1}});
// Foot positions are on the pavement in front of the machine, independent of artwork bounds.
export const SERVICE_GROUND=Object.freeze({bottle:Object.freeze([694,675]),jug:Object.freeze([693.53,687.8])});
const exits=[[495,796],[164,994]];
const entries=[[[1510,930],[1180,815]],[[1220,1090],[1120,930]],[[1570,1010],[1270,907]]];
// User-approved handle positions. One bottle size is shared by every animation phase.
export function chamberGrip(name,props){return [...props[name].machineGrip]}
export function createCast(atlas,props){return ['man','woman'].map(name=>({name,cels:atlas[name],stations:{bottle:[...SERVICE_GROUND.bottle],jug:[...SERVICE_GROUND.jug]}}))}
function path(points,q){const lengths=points.slice(1).map((p,i)=>dist(points[i],p)),length=lengths.reduce((a,b)=>a+b,0),d=clamp(q)*length;let rest=d,i=0;while(i<lengths.length-1&&rest>lengths[i])rest-=lengths[i++];const a=points[i],b=points[i+1],u=rest/(lengths[i]||1);return {point:[mix(a[0],b[0],u),mix(a[1],b[1],u)],distance:d}}
function travel(points,frame,start,duration){const q=clamp((frame-start)/duration),r=2/duration;const p=q<r?q*q/(2*r):q>1-r?1-r-(1-q)*(1-q)/(2*r):q-r/2;return path(points,p/(1-r))}
function walk(points,frame,start,duration,kind){
 const gait=GAITS[kind];
 // A drawing always lasts exactly 1/FPS seconds. Distance never selects the pose.
 const exposure=Math.floor(Math.max(0,frame-start)/gait.holdFrames);
 const move=travel(points,frame,start,duration);
 return {point:move.point,distance:move.distance,cel:gait.cels[exposure%gait.cels.length]};
}
export function arrivalFor(id){const group=Math.floor((id-1)/3),slot=(id-1)%3;return {group,slot,start:(group*3*CYCLE/FPS+[-7,-4,-1][slot])*FPS}}
export function customer(id,frame,cast){
 if(id<0)return null;
 const type=id%2,person=cast[type],container=bottleFor(id),station=person.stations[container],t=frame-id*CYCLE;
 if(t>=TIMES.leave+68)return null;
 let point=station,cel=8,kind='wait',distance=0,carrying=true,opacity=1,card=false;
 if(t< -20){
  if(id===0)return null;
  const arrival=arrivalFor(id);if(frame<arrival.start)return null;
  point=SLOTS[arrival.slot];
  if(frame<arrival.start+72){const move=walk([...entries[arrival.slot],point],frame,arrival.start,72,'arrive');point=move.point;distance=move.distance;cel=move.cel;kind='arrive';opacity=clamp((frame-arrival.start)/8)}
  else{
   cel=(Math.floor((frame+id*7)/24)%2)?8:11;
   // Each follower reacts 0.75 seconds after the person ahead, not all at once.
   for(let step=0;step<arrival.slot;step++){
    const start=(arrival.group*3+step)*CYCLE+TIMES.advance+(arrival.slot-step)*6;
    if(frame<start)break;
    const from=SLOTS[arrival.slot-step],to=SLOTS[arrival.slot-step-1];
    if(frame<start+18){const move=walk([from,to],frame,start,18,'advance');point=move.point;distance=move.distance;cel=move.cel;kind='advance';break}
    point=to;
   }
  }
 }else if(t< -2){const move=walk([WAIT,station],t,-20,18,'advance');point=move.point;distance=move.distance;cel=move.cel;kind='advance'}
 else if(t<TIMES.leave){
  kind='service';card=t>=TIMES.card&&t<TIMES.cardAway;
  if(t<TIMES.lift)cel=8;else if(t<TIMES.reach)cel=9;else if(t<TIMES.withdraw)cel=10;else if(t<TIMES.close)cel=9;else if(card)cel=t<TIMES.paid-1||t>=TIMES.cardAway-2?37:20;else if(t<TIMES.takeLift)cel=8;else if(t<TIMES.takeReach)cel=9;else if(t<TIMES.takeLower)cel=10;else cel=9;
  carrying=t<TIMES.release||t>=TIMES.grasp;
 }else{
  const move=walk([station,...exits],t,TIMES.leave,68,'leave');
  point=move.point;distance=move.distance;cel=move.cel;kind='leave';opacity=1-clamp((t-(TIMES.leave+52))/16);
 }
 // World translation is continuous; only the limb drawings change at 8 fps.
 const sprite=person.cels[cel],scale=HEIGHT/sprite.height;
 const hand=[point[0]+(sprite.grip[0]-sprite.anchor[0])*scale,point[1]+(sprite.grip[1]-sprite.anchor[1])*scale];
 return {id,type,t,point,cel,kind,distance,container,carrying,card,opacity,hand,scale,inside:kind==='service'&&cel===10,cardHand:card?'right':null};
}
export function machine(seconds){
 const id=Math.floor(seconds/(CYCLE/FPS)),t=((seconds*FPS%CYCLE)+CYCLE)%CYCLE;let door=0;
 if(t>=TIMES.close&&t<TIMES.closed)door=ease((t-TIMES.close)/(TIMES.closed-TIMES.close));else if(t>=TIMES.closed&&t<TIMES.filled)door=1;else if(t>=TIMES.filled&&t<TIMES.opened)door=1-ease((t-TIMES.filled)/(TIMES.opened-TIMES.filled));
 const bottle=t>=TIMES.release&&t<TIMES.grasp;
 const phase=t<TIMES.close?'Şişesini yerleştiriyor':t<TIMES.closed?'Kapak kapanıyor':t>=TIMES.card&&t<TIMES.cardAway?'Kartını okutuyor':t<TIMES.filled?'Dolum sürüyor':t<TIMES.opened?'Kapak açılıyor':t<TIMES.leave?'Şişesini alıyor':'Yoluna devam ediyor';
 return {id,t,door,bottle,container:bottleFor(id),phase};
}
export function sceneAt(seconds,cast){const safe=Math.max(0,seconds),frame=Math.floor(safe*FPS+1e-7),id=Math.floor(frame/CYCLE);const people=Array.from({length:6},(_,i)=>customer(id-1+i,safe*FPS,cast)).filter(Boolean).filter(p=>p.opacity>0).sort((a,b)=>a.point[1]-b.point[1]);return {frame,time:safe,machine:machine(safe),people}}
export const routes={entries,exit:exits,waiting:SLOTS};
