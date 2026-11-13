/** Original procedural WebGL farm illustration. It never reads or changes planning data. */
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
function multiply(a,b){const out=new Float32Array(16);for(let col=0;col<4;col++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)out[col*4+row]+=a[k*4+row]*b[col*4+k];return out;}
function camera(aspect,yaw,pitch){
  const distance=7.5,eye=[Math.sin(yaw)*Math.cos(pitch)*distance,Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance],target=[0,0.22,0];
  const normalize=a=>{const d=Math.hypot(...a);return a.map(n=>n/d);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0);
  const z=normalize(eye.map((n,i)=>n-target[i])),x=normalize(cross([0,1,0],z)),y=cross(z,x);
  const view=new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
  const f=1/Math.tan(0.55/2),near=0.1,far=50;
  return multiply(new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]),view);
}
function farmMesh(){
  const vertices=[];
  const tri=(a,b,c,color,wind=[0,0,0])=>{
    const u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]),normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],d=Math.hypot(...normal)||1;
    for(const [i,p] of [a,b,c].entries())vertices.push(...p,...normal.map(n=>n/d),...color,wind[i]);
  };
  const box=(x,y,z,w,h,d,color)=>{
    const p=[[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2],[x-w/2,y+h,z-d/2],[x+w/2,y+h,z-d/2],[x+w/2,y+h,z+d/2],[x-w/2,y+h,z+d/2]];
    for(const face of [[0,3,2,1],[4,5,6,7],[0,1,5,4],[3,7,6,2],[0,4,7,3],[1,2,6,5]]){tri(p[face[0]],p[face[1]],p[face[2]],color);tri(p[face[0]],p[face[2]],p[face[3]],color);}
  };
  const cone=(x,y,z,r,h,color,segments=7)=>{for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2;tri([x+Math.sin(a)*r,y,z+Math.cos(a)*r],[x+Math.sin(b)*r,y,z+Math.cos(b)*r],[x,y+h,z],color);}};
  box(0,-0.24,0,3.2,0.24,2.75,[0.40,0.27,0.15]);box(0,-0.06,0,3.23,0.09,2.78,[0.62,0.67,0.36]);
  // Four cultivated plots separated by walkways. Paths and canals are illustrative.
  for(const [index,[cx,cz]] of [[-0.78,-0.66],[0.78,-0.66],[-0.78,0.66],[0.78,0.66]].entries()){
    box(cx,0.03,cz,1.4,0.03,1.14,index===1?[0.66,0.60,0.32]:[0.48,0.54,0.26]);
    for(let row=0;row<8;row++){
      const x=cx-0.57+row*0.16;box(x,0.06,cz,0.05,0.018,1.02,[0.42,0.34,0.19]);
      for(let plant=0;plant<13;plant++){
        const z=cz-0.48+plant*0.077,seed=(row*17+plant*13+index*11)%19/19,h=(index===1?0.22:0.10)+seed*0.065;
        if(index===1){
          tri([x-0.008,0.07,z],[x+0.008,0.07,z],[x+0.008,0.07+h,z],[0.70,0.59,0.25],[0,0,1]);
          cone(x,0.07+h*0.8,z,0.022,h*0.3,[0.86,0.73,0.34],4);
        } else {
          for(let blade=0;blade<3;blade++){
            const angle=blade/3*Math.PI*2+seed,dx=Math.sin(angle)*0.026,dz=Math.cos(angle)*0.026;
            tri([x-dx,0.07,z-dz],[x+dx,0.07,z+dz],[x+dx*1.2,0.07+h,z+dz*1.2],[0.24+seed*0.07,0.43+seed*0.12,0.17],[0,0,1]);
          }
        }
      }
    }
  }
  box(0,0.04,0,0.12,0.035,2.72,[0.86,0.79,0.56]);box(0,0.04,0,3.17,0.035,0.12,[0.86,0.79,0.56]);
  // A shallow irrigation channel and fence create scale without suggesting field boundaries.
  box(0,0.025,1.28,3.05,0.025,0.075,[0.38,0.69,0.72]);
  for(let i=0;i<13;i++)box(-1.5+i*0.25,0.03,1.38,0.025,0.14,0.025,[0.88,0.86,0.69]);
  box(0,0.12,1.38,3.08,0.022,0.02,[0.87,0.85,0.70]);
  // Low-poly farm shed, trees and turning wind vane.
  box(1.20,0.06,-1.02,0.40,0.31,0.34,[0.90,0.82,0.59]);
  const roof=[[[0.94,0.37,-1.24],[1.20,0.57,-1.24],[1.46,0.37,-1.24]],[[0.94,0.37,-0.80],[1.46,0.37,-0.80],[1.20,0.57,-0.80]]];
  roof.forEach(points=>tri(...points,[0.63,0.28,0.16]));
  for(const side of [-1,1]){const a=[1.2+side*0.26,0.37,-1.24],b=[1.2,0.57,-1.24],c=[1.2,0.57,-0.80],d=[1.2+side*0.26,0.37,-0.80];tri(a,b,c,[0.75,0.36,0.19]);tri(a,c,d,[0.75,0.36,0.19]);}
  box(1.2,0.06,-0.841,0.11,0.23,0.01,[0.30,0.37,0.27]);box(1.34,0.22,-0.844,0.07,0.07,0.01,[0.58,0.73,0.67]);
  for(const [x,z,s] of [[-1.38,-1.12,1],[-1.05,-1.2,0.78],[1.44,0.94,0.8]]){
    box(x,0.05,z,0.045,0.26*s,0.045,[0.43,0.35,0.23]);cone(x,0.20*s,z,0.17*s,0.35*s,[0.20,0.39,0.28]);cone(x,0.36*s,z,0.13*s,0.27*s,[0.28,0.46,0.30]);
  }
  box(-1.20,0.05,-0.95,0.035,0.91,0.035,[0.65,0.65,0.49]);
  for(let i=0;i<3;i++){
    const angle=i/3*Math.PI*2,dx=Math.cos(angle),dy=Math.sin(angle),cx=-1.2,cy=1.00,z=-0.94;
    tri([cx-dy*0.025,cy+dx*0.025,z],[cx+dy*0.025,cy-dx*0.025,z],[cx+dx*0.28,cy+dy*0.28,z],[0.83,0.77,0.54],[-1,-1,-1]);
  }
  return new Float32Array(vertices);
}

export function mountFieldScene(root){
  const canvas=root.querySelector('[data-field-canvas]');if(!canvas)return ()=>{};
  const status=root.querySelector('[data-scene-status]'),motion=root.querySelector('[data-scene-motion]');
  let gl;try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});}catch{gl=null;}
  if(!gl){status.textContent='Static field illustration · 3D is unavailable on this device.';root.querySelectorAll('[data-scene-action]').forEach(button=>button.disabled=true);return ()=>{};}
  let disposed=false,frame=0,time=0,last=0,yaw=0.73,pitch=0.70,golden=0,visible=true;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');let paused=preference.matches;
  const shader=(kind,source)=>{const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('3D shader unavailable');return s;};
  let program,buffer;
  try {
    program=gl.createProgram();
    const vertex=shader(gl.VERTEX_SHADER,`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;attribute float aWind;uniform mat4 uCamera;uniform float uTime;uniform float uGolden;varying vec3 vColor;void main(){vec3 p=aPosition;vec3 color=aColor;if(aWind>0.0){p.x+=sin(uTime*1.8+p.x*4.0+p.z*3.0)*0.025*aWind;color=mix(color,vec3(0.74,0.62,0.27),uGolden*0.8);}if(aWind<0.0){vec2 q=p.xy-vec2(-1.2,1.0);float t=uTime*0.55;p.xy=vec2(q.x*cos(t)-q.y*sin(t),q.x*sin(t)+q.y*cos(t))+vec2(-1.2,1.0);}float light=0.55+0.45*max(dot(normalize(aNormal),normalize(vec3(-0.4,1.0,0.6))),0.0);vColor=color*light;gl_Position=uCamera*vec4(p,1.0);}`);
    const fragment=shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec3 vColor;void main(){gl_FragColor=vec4(vColor,1.0);}');
    gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('3D unavailable');
    gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);const mesh=farmMesh();gl.bufferData(gl.ARRAY_BUFFER,mesh,gl.STATIC_DRAW);
    for(const [name,size,offset] of [['aPosition',3,0],['aNormal',3,3],['aColor',3,6],['aWind',1,9]]){const slot=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(slot);gl.vertexAttribPointer(slot,size,gl.FLOAT,false,40,offset*4);}
    gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
    const uniforms=Object.fromEntries(['uCamera','uTime','uGolden'].map(name=>[name,gl.getUniformLocation(program,name)]));
    const draw=()=>{if(disposed)return;gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix4fv(uniforms.uCamera,false,camera(canvas.width/canvas.height,yaw,pitch));gl.uniform1f(uniforms.uTime,time);gl.uniform1f(uniforms.uGolden,golden);gl.drawArrays(gl.TRIANGLES,0,mesh.length/10);};
    const resize=()=>{const ratio=Math.min(devicePixelRatio||1,1.75);canvas.width=Math.max(1,Math.round(canvas.clientWidth*ratio));canvas.height=Math.max(1,Math.round(canvas.clientHeight*ratio));draw();};
    const tick=now=>{frame=0;if(disposed||paused||!visible||document.hidden)return;if(!last||now-last>=32){time+=last?Math.min((now-last)/1000,0.05):0;last=now;draw();}frame=requestAnimationFrame(tick);};
    const sync=()=>{cancelAnimationFrame(frame);frame=0;last=0;motion.textContent=paused?'Play motion':'Pause motion';status.textContent=paused?'Motion paused · drag or use the rotate buttons.':'Gentle wind · drag to explore the illustration.';if(!paused&&visible&&!document.hidden)frame=requestAnimationFrame(tick);draw();};
    const observer=new ResizeObserver(resize);observer.observe(canvas);
    const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();});intersection.observe(canvas);
    const media=()=>{paused=preference.matches;sync();};preference.addEventListener('change',media);document.addEventListener('visibilitychange',sync);
    let pointer=null;
    canvas.addEventListener('pointerdown',event=>{pointer={x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);});
    canvas.addEventListener('pointermove',event=>{if(!pointer)return;yaw+=(event.clientX-pointer.x)*0.008;pitch=clamp(pitch+(event.clientY-pointer.y)*0.004,0.35,1.05);pointer={x:event.clientX,y:event.clientY};draw();});
    canvas.addEventListener('pointerup',()=>pointer=null);canvas.addEventListener('pointercancel',()=>pointer=null);
    canvas.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;event.preventDefault();if(event.key==='Home'){yaw=0.73;pitch=0.70;}else if(event.key==='ArrowLeft')yaw-=0.12;else if(event.key==='ArrowRight')yaw+=0.12;else pitch=clamp(pitch+(event.key==='ArrowUp'?0.07:-0.07),0.35,1.05);draw();});
    root.addEventListener('click',event=>{const action=event.target.closest('[data-scene-action]')?.dataset.sceneAction;if(!action)return;if(action==='motion'){paused=!paused;sync();}if(action==='season'){golden=golden?0:1;event.target.closest('button').textContent=golden?'Green season':'Golden season';draw();}if(action==='reset'){yaw=0.73;pitch=0.70;draw();}if(action==='left'){yaw-=0.18;draw();}if(action==='right'){yaw+=0.18;draw();}});
    root.classList.add('scene-ready');resize();sync();
    canvas.addEventListener('webglcontextlost',event=>{if(disposed)return;event.preventDefault();paused=true;cancelAnimationFrame(frame);root.classList.remove('scene-ready');status.textContent='Static illustration · 3D context was interrupted.';root.querySelectorAll('[data-scene-action]').forEach(button=>button.disabled=true);});
    return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();preference.removeEventListener('change',media);document.removeEventListener('visibilitychange',sync);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();};
  } catch {
    if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);status.textContent='Static field illustration · 3D is unavailable on this device.';root.querySelectorAll('[data-scene-action]').forEach(button=>button.disabled=true);return ()=>{};
  }
}
