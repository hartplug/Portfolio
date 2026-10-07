import { mountFooter, mountGridIntro, mountTransitions } from './shared.js';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clock=document.querySelector('#clock'),nav=document.querySelector('.nav');
function paintClock(){if(clock)clock.textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Lagos',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date())+' WAT / ABUJA';}
paintClock();const clockId=setInterval(paintClock,1000);
let lastY=scrollY,ticking=false;addEventListener('scroll',()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{const y=scrollY;nav?.classList.toggle('scrolled',y>40&&y>=lastY);if(y<40)nav?.classList.remove('scrolled');lastY=y;ticking=false;});},{passive:true});
const revealEls=document.querySelectorAll('.content-section,.work-card,.contact-card');
if(!reduced&&'IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}}),{threshold:.1});revealEls.forEach(el=>{el.classList.add('reveal');observer.observe(el);});}
mountFooter();mountGridIntro();mountTransitions();
addEventListener('pagehide',()=>clearInterval(clockId),{once:true});
