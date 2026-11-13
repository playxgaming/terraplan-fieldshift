// A small, dependency-free WebGL diorama. All geometry is illustrative.
const VERTEX=`attribute vec3 aPosition;attribute vec3 aColor;attribute float aMotion;uniform mat4 uMatrix;uniform float uTime;uniform float uSeason;varying vec3 vColor;void main(){vec3 p=aPosition;vec3 c=aColor;if(aMotion>1.5){vec2 q=p.xy-vec2(-2.7,1.9);float angle=uTime*.55;p.xy=vec2(cos(angle)*q.x-sin(angle)*q.y,sin(angle)*q.x+cos(angle)*q.y)+vec2(-2.7,1.9);}else if(aMotion>.0){p.x+=sin(uTime*1.5+p.x*2.7+p.z*1.9)*.045*aMotion;p.z+=cos(uTime*1.2+p.x)*.018*aMotion;c=mix(c,vec3(.77,.62,.32)*(.7+aColor.g*.4),uSeason*.8);}vColor=c;gl_Position=uMatrix*vec4(p,1.);}`;
const FRAGMENT=`precision mediump float;varying vec3 vColor;void main(){gl_FragColor=vec4(vColor,1.);}`;
function multiply(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out}
const norm=v=>{const l=Math.hypot(...v);return v.map(x=>x/l)};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
function matrix(yaw,pitch,zoom,aspect){
 const eye=[Math.sin(yaw)*Math.cos(pitch)*12,Math.sin(pitch)*12,Math.cos(yaw)*Math.cos(pitch)*12],target=[0,.4,0],z=norm(eye.map((v,i)=>v-target[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);
 const view=new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
 const half=4.5/zoom,wide=half*Math.max(aspect,1),tall=half/Math.min(aspect,1),near=.1,far=40;
 const projection=new Float32Array([1/wide,0,0,0,0,1/tall,0,0,0,0,-2/(far-near),0,0,0,-(far+near)/(far-near),1]);return multiply(projection,view);
}
function geometry(){
 const vertices=[];
 function triangle(a,b,c,color,motion=0,shade=1){for(const p of [a,b,c])vertices.push(...p,...color.map(v=>v*shade),motion)}
 function quad(a,b,c,d,color,motion=0,shade=1){triangle(a,b,c,color,motion,shade);triangle(a,c,d,color,motion,shade)}
 function box(x,y,z,w,h,d,color,motion=0){const a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],c=[x+w/2,y,z+d/2],e=[x-w/2,y,z+d/2],up=p=>[p[0],p[1]+h,p[2]];quad(up(a),up(b),up(c),up(e),color,motion,1.07);quad(a,b,up(b),up(a),color,motion,.75);quad(b,c,up(c),up(b),color,motion,.9);quad(c,e,up(e),up(c),color,motion,.83);quad(e,a,up(a),up(e),color,motion,.7)}
 function cone(x,y,z,r,h,color,motion=0,sides=6){for(let i=0;i<sides;i++){const a=i/sides*Math.PI*2,b=(i+1)/sides*Math.PI*2;triangle([x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],[x,y+h,z],color,motion,.78+.22*Math.sin(a+1.3))}}
 const soil=[.49,.37,.24],grass=[.43,.59,.30],path=[.85,.79,.61];
 // Floating soil slab and contrasting topsoil layers.
 box(0,-.62,0,6.9,.55,5.5,soil);box(0,-.1,0,7,.16,5.6,[.67,.70,.41]);box(0,.05,0,7,.05,5.6,[.65,.71,.43]);
 box(0,.105,0,.35,.018,5.55,path);box(0,.11,0,6.95,.019,.3,path);
 const plots=[[-1.65,-1.32,[.43,.57,.26]],[1.7,-1.32,[.67,.65,.33]],[-1.65,1.32,[.35,.52,.27]],[1.7,1.32,[.59,.65,.35]]];
 for(let p=0;p<plots.length;p++){
  const [cx,cz,color]=plots[p];box(cx,.107,cz,2.95,.035,2.2,color);
  for(let row=0;row<7;row++){
   const x=cx-1.23+row*.4;box(x,.15,cz,.09,.035,1.95,[.47,.43,.27]);
   for(let col=0;col<8;col++){
    const z=cz-.87+col*.25,n=(Math.sin(row*19+col*13+p*43)+1)/2,h=.22+n*.12;
    const stem=p===1?[.66,.63,.28]:[.3,.48,.21];
    triangle([x-.018,.18,z],[x+.025,.18,z],[x+.02,.18+h,z],stem,0.8);
    triangle([x,.25,z],[x-.1,.33,z-.055],[x+.01,.41,z],p===1?[.77,.72,.4]:[.49,.65,.29],1);
    triangle([x,.23,z],[x+.105,.33,z+.045],[x+.02,.38,z],p===1?[.74,.68,.35]:[.4,.59,.25],1);
    cone(x+.015,.18+h,z,.04,.1,p===1?[.83,.72,.36]:[.67,.73,.38],1,5);
   }
  }
 }
 // Irrigation channel along the near boundary, with a stone edge.
 box(0,.14,2.53,5.6,.022,.2,[.40,.67,.65]);box(0,.13,2.68,5.85,.075,.08,[.77,.77,.62]);
 for(let i=0;i<13;i++)box(-2.65+i*.43,.17,2.53,.12,.006,.025,[.66,.81,.74]);
 // Small barn beside the path.
 const bx=2.43,bz=-1.9;box(bx,.16,bz,.87,.63,.69,[.82,.75,.54]);box(bx,.16,bz+.354,.29,.42,.02,[.44,.39,.29]);box(bx-.25,.47,bz+.36,.12,.14,.02,[.31,.49,.47]);
 const a=[bx-.53,.78,bz-.43],b=[bx+.53,.78,bz-.43],c=[bx+.53,.78,bz+.43],d=[bx-.53,.78,bz+.43],r1=[bx,1.1,bz-.43],r2=[bx,1.1,bz+.43];quad(a,d,r2,r1,[.64,.32,.2],0,.92);quad(b,c,r2,r1,[.72,.39,.24]);triangle(a,b,r1,[.84,.76,.54]);triangle(d,c,r2,[.82,.73,.51]);
 // Low-poly orchard along the rear edge.
 for(const [x,z,scale] of [[-2.9,-2.18,1],[-2.12,-2.18,.8],[-1.45,-2.2,.7],[3.02,.5,.7],[3.03,1.1,.85]]){
  box(x,.15,z,.09,.4*scale,.09,[.49,.39,.26]);cone(x,.4,z,.33*scale,.66*scale,[.27,.46,.31],.2,7);cone(x,.72*scale,z,.24*scale,.46*scale,[.4,.56,.33],.25,7);
 }
 // Fencing at the front-left corner.
 for(let i=0;i<7;i++){const x=-3.25+i*.45;box(x,.16,2.75,.055,.3,.055,[.88,.85,.69]);if(i<6){box(x+.22,.25,2.75,.45,.045,.04,[.84,.81,.64]);box(x+.22,.38,2.75,.45,.045,.04,[.84,.81,.64])}}
 // A windmill; the shader rotates only the blade geometry.
 box(-2.7,.15,-1.9,.11,1.75,.11,[.62,.62,.48]);box(-2.7,1.86,-1.9,.16,.13,.17,[.82,.77,.6]);
 for(let i=0;i<4;i++){const angle=i*Math.PI/2,point=(radius,side)=>[-2.7+Math.cos(angle)*radius-Math.sin(angle)*side,1.9+Math.sin(angle)*radius+Math.cos(angle)*side,-1.78];quad(point(.09,-.025),point(.09,.025),point(.68,.11),point(.68,-.05),[.9,.87,.7],2)}
 return new Float32Array(vertices);
}
export function fieldSceneHTML(compact=false){return `<section class="field-world ${compact?'compact':''}" aria-label="Interactive illustrative 3D farm"><div class="scene-topline"><span class="scene-live-dot"></span><span>THE LIVING FIELD</span><span class="scene-caption">3D ILLUSTRATION</span></div><div class="canvas-stage"><div class="scene-shadow"></div><canvas class="field-canvas" tabindex="0" aria-label="Illustrative 3D farm. Drag to rotate, use arrow keys to orbit, and plus or minus to zoom."></canvas><img class="scene-fallback" src="farm.svg" alt="Illustration of fields and a satellite" hidden></div><div class="scene-bottomline"><span>Drag to explore <span aria-hidden="true">↔</span></span><div class="scene-controls"><button type="button" data-scene="season" aria-pressed="false" title="Change illustrative crop colors">Golden season</button><button type="button" data-scene="pause" aria-pressed="false" title="Pause wind and field movement">Pause motion</button><button type="button" data-scene="reset" aria-label="Reset 3D field view">↺</button></div></div><p class="scene-footnote">Conceptual landscape · not a map or a crop-growth simulation</p></section>`}
function initScene(root){
 const canvas=root.querySelector('canvas'),fallback=root.querySelector('.scene-fallback'),gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});
 if(!gl){canvas.hidden=true;fallback.hidden=false;root.querySelector('.scene-bottomline').hidden=true;return ()=>{}}
 const resources=[],shader=(type,code)=>{const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('3D shader could not compile.');resources.push(['shader',s]);return s};
 let program,buffer;
 try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,VERTEX));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,FRAGMENT));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('3D program could not link.');gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);const data=geometry();gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);const count=data.length/7;
  for(const [name,size,offset] of [['aPosition',3,0],['aColor',3,12],['aMotion',1,24]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,28,offset)}
  const matrixLocation=gl.getUniformLocation(program,'uMatrix'),timeLocation=gl.getUniformLocation(program,'uTime'),seasonLocation=gl.getUniformLocation(program,'uSeason');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let paused=reduced.matches,yaw=.66,pitch=.58,zoom=1.22,season=0,time=0,last=0,frame=0,visible=true,drag=null,disposed=false;
  const pauseButton=root.querySelector('[data-scene="pause"]'),syncPause=()=>{pauseButton.textContent=paused?'Play motion':'Pause motion';pauseButton.setAttribute('aria-pressed',String(paused))};syncPause();
  function paint(){if(disposed)return;const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);if(!w||!h)return;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.uniformMatrix4fv(matrixLocation,false,matrix(yaw+(!paused?Math.sin(time*.12)*.035:0),pitch,zoom,w/h));gl.uniform1f(timeLocation,time);gl.uniform1f(seasonLocation,season);gl.drawArrays(gl.TRIANGLES,0,count)}
  function tick(now){frame=0;if(disposed||paused||!visible||document.hidden)return;if(last)time+=Math.min((now-last)/1000,.08);last=now;paint();frame=requestAnimationFrame(tick)}
  function schedule(){if(!paused&&visible&&!document.hidden&&!frame){last=0;frame=requestAnimationFrame(tick)}}
  const resize=new ResizeObserver(()=>{paint();schedule()});resize.observe(canvas);
  const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){cancelAnimationFrame(frame);frame=0}else{paint();schedule()}},{threshold:.05});visibility.observe(root);
  function onDocument(){if(document.hidden){cancelAnimationFrame(frame);frame=0}else schedule()}
  function onReduced(){paused=reduced.matches;syncPause();cancelAnimationFrame(frame);frame=0;paint();schedule()}
  function onDown(e){if(e.button!==0)return;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)}
  function onMove(e){if(!drag)return;yaw+=(e.clientX-drag.x)*.008;pitch=Math.max(.28,Math.min(1.12,pitch+(e.clientY-drag.y)*.006));drag={x:e.clientX,y:e.clientY};paint()}
  function onUp(){drag=null}
  function onKey(e){if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')yaw-=.12;if(e.key==='ArrowRight')yaw+=.12;if(e.key==='ArrowUp')pitch=Math.min(1.12,pitch+.08);if(e.key==='ArrowDown')pitch=Math.max(.28,pitch-.08);if(e.key==='+'||e.key==='=')zoom=Math.min(1.6,zoom+.08);if(e.key==='-')zoom=Math.max(.8,zoom-.08);paint()}
  function onButton(e){const b=e.target.closest('[data-scene]');if(!b)return;if(b.dataset.scene==='pause'){paused=!paused;syncPause();cancelAnimationFrame(frame);frame=0;schedule()}if(b.dataset.scene==='season'){season=1-season;b.setAttribute('aria-pressed',String(Boolean(season)));b.textContent=season?'Green season':'Golden season'}if(b.dataset.scene==='reset'){yaw=.66;pitch=.58;zoom=1.22}paint()}
  function onLost(e){e.preventDefault();cancelAnimationFrame(frame);frame=0;canvas.hidden=true;fallback.hidden=false;root.querySelector('.scene-bottomline').hidden=true}
  canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onUp);canvas.addEventListener('keydown',onKey);canvas.addEventListener('webglcontextlost',onLost);root.addEventListener('click',onButton);document.addEventListener('visibilitychange',onDocument);reduced.addEventListener('change',onReduced);paint();schedule();
  return ()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();visibility.disconnect();document.removeEventListener('visibilitychange',onDocument);reduced.removeEventListener('change',onReduced);canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',onUp);canvas.removeEventListener('keydown',onKey);canvas.removeEventListener('webglcontextlost',onLost);root.removeEventListener('click',onButton);gl.deleteBuffer(buffer);gl.deleteProgram(program);resources.forEach(([type,r])=>gl.deleteShader(r));gl.getExtension('WEBGL_lose_context')?.loseContext()};
 }catch{canvas.hidden=true;fallback.hidden=false;root.querySelector('.scene-bottomline').hidden=true;if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);resources.forEach(([type,r])=>gl.deleteShader(r));return ()=>{}}
}
let cleanups=[];
export function disposeScenes(){cleanups.forEach(fn=>fn());cleanups=[]}
export function mountScenes(container){disposeScenes();cleanups=[...container.querySelectorAll('.field-world')].map(initScene)}
