/* Shared footer and app-level motion primitives. */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export function mountFooter() {
  if (document.querySelector('.ascii-footer')) return;
  const footer = document.createElement('footer');
  footer.className = 'ascii-footer';
  footer.innerHTML = `<div class="footer-revealer" aria-hidden="true"></div><div class="footer-images" aria-hidden="true"><div class="footer-hand-img left"><canvas></canvas></div><div class="footer-hand-img right"><canvas></canvas></div></div><div class="footer-content"><nav class="footer-links" aria-label="Footer navigation"><a href="work.html">Work</a><a href="project.html">AWS case study</a><a href="lab.html">Lab</a><a href="contact.html">Contact</a></nav><p class="footer-text">Cloud infrastructure and workflow automation for business systems. Abuja, Nigeria.</p></div><div class="footer-header"><h2>PHILIP</h2><h2>TAIWO</h2></div>`;
  document.body.append(footer);
  if (!reduced) initAsciiHands(footer);
  initFooterReveal(footer);
}

const ramp = '........:::=+xX#0369';
function makeHand(side) {
  const w=480,h=580,c=document.createElement('canvas');c.width=w;c.height=h;
  const x=c.getContext('2d');x.fillStyle='#faf8f3';x.fillRect(0,0,w,h);x.fillStyle='#29221e';
  x.beginPath();x.roundRect(150,250,200,235,74);x.fill();x.beginPath();x.roundRect(210,445,78,130,26);x.fill();
  [[160,130,42,180],[208,84,42,220],[256,99,42,205],[304,151,42,165]].forEach(([a,b,d,e])=>{x.beginPath();x.roundRect(a,b,d,e,21);x.fill();});
  x.lineWidth=58;x.lineCap='round';x.beginPath();x.moveTo(171,310);x.lineTo(92,240);x.strokeStyle='#29221e';x.stroke();
  if(side==='right'){const mirror=document.createElement('canvas');mirror.width=w;mirror.height=h;const m=mirror.getContext('2d');m.translate(w,0);m.scale(-1,1);m.drawImage(c,0,0);return mirror;}
  return c;
}
function initAsciiHands(footer) {
  const contexts = [];
  footer.querySelectorAll('.footer-hand-img').forEach((wrap, i) => {
    const canvas=wrap.querySelector('canvas'), ctx=canvas.getContext('2d');
    const source=makeHand(i===0?'left':'right'); const cols=64, rows=Math.round(cols*source.height/source.width), cw=12, ch=12;
    canvas.width=cols*cw; canvas.height=rows*ch;
    const off=document.createElement('canvas'); off.width=cols; off.height=rows;
    const ox=off.getContext('2d',{willReadFrequently:true}); ox.drawImage(source,0,0,cols,rows);
    const px=ox.getImageData(0,0,cols,rows).data, cells=[];
    ctx.font='11px "DM Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    const staticLayer=document.createElement('canvas');staticLayer.width=canvas.width;staticLayer.height=canvas.height;const sx=staticLayer.getContext('2d');sx.font=ctx.font;sx.textAlign='center';sx.textBaseline='middle';sx.fillStyle='#803500';
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      const q=(r*cols+c)*4, br=(px[q]+px[q+1]+px[q+2])/765;
      const n=Math.min(ramp.length-1,Math.floor((1-br)*ramp.length)); if(n<=ramp.lastIndexOf('.')) continue;
      cells.push({c,r,ch:ramp[n],until:0});sx.fillText(ramp[n],c*cw+cw/2,r*ch+ch/2);
    }
    let hot=[];
    const draw=()=>{
      const now=performance.now(); ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(staticLayer,0,0);ctx.font='11px "DM Mono", monospace';
      cells.forEach(cell=>{if(cell.until<=now)return;ctx.fillStyle='#ff6a00';ctx.fillRect(cell.c*cw,cell.r*ch,cw,ch);ctx.fillStyle='#0f0f0f';ctx.fillText(cell.ch,cell.c*cw+cw/2,cell.r*ch+ch/2);});
    };
    canvas.addEventListener('pointermove',e=>{
      const rect=canvas.getBoundingClientRect(), c=(e.clientX-rect.left)/rect.width*cols, r=(e.clientY-rect.top)/rect.height*rows;
      let best=null,dist=Infinity; cells.forEach(cell=>{const d=Math.hypot(cell.c-c,cell.r-r);if(d<dist){dist=d;best=cell;}});
      if(!best||dist>8)return; let cur=best;const now=performance.now();
      for(let k=0;k<10&&cur;k++){cur.until=now+300+k*10;const ns=cells.filter(v=>Math.abs(v.c-cur.c)<=1&&Math.abs(v.r-cur.r)<=1&&v!==cur);cur=ns[Math.floor(Math.random()*ns.length)];}
      draw();
    });
    contexts.push(draw);
  });
  let raf=0, visible=true;
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&!reduced)loop();else cancelAnimationFrame(raf);}); observer.observe(footer);
  const loop=()=>{if(!visible||reduced)return;contexts.forEach(draw=>draw());raf=requestAnimationFrame(loop);};
  loop();
}
function initFooterReveal(footer) {
  const reveal = () => footer.classList.add('revealed');
  if (!('IntersectionObserver' in window)) { reveal(); return; }
  const io = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { reveal(); io.disconnect(); }
  }, { threshold: .01 });
  io.observe(footer);
  // Some embedded/headless contexts don't deliver observer callbacks; the
  // visibility check also makes the reveal deterministic once scrolled in.
  const check = () => {
    if (footer.getBoundingClientRect().top < innerHeight && footer.getBoundingClientRect().bottom > 0) { reveal(); io.disconnect(); }
    else if (!footer.classList.contains('revealed')) requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
}

export function mountGridIntro() {
  if (reduced || sessionStorage.getItem('grid-intro-seen')) return;
  const overlay=document.createElement('div'); overlay.className='grid-intro'; overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true'); overlay.setAttribute('aria-labelledby','intro-title');
  overlay.innerHTML='<div class="grid-intro-cells" aria-hidden="true"></div><div class="grid-intro-content"><p class="eyebrow">PT / CLOUD SYSTEMS</p><h2 id="intro-title">Interface<br>ready.</h2><p class="grid-progress-label">INITIALISING <span>100%</span></p><button class="button" type="button">Enter →</button><button class="intro-skip" type="button">Skip intro</button></div>';
  document.body.append(overlay);
  const cells=overlay.querySelector('.grid-intro-cells'); for(let i=0;i<12;i++){const d=document.createElement('i');cells.append(d);}
  requestAnimationFrame(()=>overlay.classList.add('ready'));
  const close=()=>{sessionStorage.setItem('grid-intro-seen','1');overlay.classList.add('exit');setTimeout(()=>overlay.remove(),650);};
  overlay.querySelector('.button').addEventListener('click',close);overlay.querySelector('.intro-skip').addEventListener('click',close);overlay.addEventListener('keydown',e=>{if(e.key==='Escape')close();});overlay.querySelector('.button').focus();
}
export function mountTransitions() {
  document.addEventListener('click',event=>{
    const link=event.target.closest('a'); if(!link||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target||link.origin!==location.origin||!link.pathname.match(/\.(html)?$/))return;
    if(reduced)return; event.preventDefault();sessionStorage.setItem('page-transition','1');
    const cover=document.createElement('div');cover.className='page-cover';cover.innerHTML='<div></div>'.repeat(12);document.body.append(cover);
    requestAnimationFrame(()=>cover.classList.add('cover'));setTimeout(()=>location.href=link.href,520);
  });
}
