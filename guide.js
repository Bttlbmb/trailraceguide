
(() => {
  const nav = document.querySelector('.course-nav');
  if (!nav) return;
  const links = nav.querySelector('.course-inline');
  const menu = nav.querySelector('details');

  function fitCourses() {
    const rows = new Set(Array.from(links.children, item => item.offsetTop));
    const width = links.clientWidth;
    const fits = width > 0 && rows.size <= 2 && links.scrollWidth <= width;
    nav.classList.toggle('courses-fit', fits);
    if (fits) menu.open = false;
  }

  fitCourses();
  const observer = new ResizeObserver(fitCourses);
  observer.observe(nav);
  observer.observe(links);
})();

(function(){
const bands=document.getElementById('race-bands'),frame=bands.parentElement;
function resize(){
 const scale=Math.min(1,frame.clientWidth/bands.offsetWidth);
 bands.style.transform=scale===1?'none':'scale('+scale+')';
 frame.style.height=bands.getBoundingClientRect().height+'px';
}
resize();
addEventListener('resize',resize);
new ResizeObserver(resize).observe(bands);
})();

(function(){var page=document.getElementById('fit'),btns=document.querySelectorAll('.sw button');
function set(g){page.dataset.g=g;btns.forEach(function(b){b.setAttribute('aria-pressed',b.dataset.g===g)});page.dispatchEvent(new Event('finisher-group-change'))}
btns.forEach(function(b){b.addEventListener('click',function(){set(page.dataset.g===b.dataset.g?'all':b.dataset.g)})});
function fromFragment(){var h=location.hash.slice(1);if(h==='women'||h==='men')set(h)}
addEventListener('hashchange',fromFragment);fromFragment();})();

(() => {
  const page = document.getElementById('fit');
  const layouts = Array.from(document.querySelectorAll('#finish, #p-time'), section => {
    const chips = Array.from(section.querySelectorAll('[data-lo][data-hi]'));
    const lanes = section.querySelectorAll('.lane');
    const clear = section.querySelector('[data-clear]');
    const tracks = Array.from(section.querySelectorAll('.trk[data-p], .trk[data-sp]'), track => {
      const row = track.closest('tr, .ed'), cell = row.querySelector('.range-value'), count = row.querySelector('.fin-n');
      return {
        cell, original: cell.textContent, count, countOriginal: count ? count.textContent : '', peer: track.hasAttribute('data-sp'),
        percentiles: (track.dataset.sp || track.dataset.p).split(',').map(Number),
        left: track.querySelector('.vl'), right: track.querySelector('.vr'),
        window: track.querySelector('.cohort-window'), edge: track.querySelector('.rank-beyond')
      };
    });
    return {section, chips, lanes, clear, tracks, marks: section.querySelectorAll('.finish-picked'),
            medians: section.querySelectorAll('.median-heading'), averages: section.querySelectorAll('.average-heading'), headings: section.querySelectorAll('.range-heading')};
  });
  let selected = null;

  function clock(hours) {
    const minutes = Math.round(hours * 60);
    return Math.floor(minutes / 60) + ':' + String(minutes % 60).padStart(2, '0');
  }

  function paint() {
    for (const {section, chips, lanes, clear, tracks, marks, medians, averages, headings} of layouts) {
      const {lo: axisStart, hi: axisEnd} = section.dataset;
      const position = hours => Math.max(0, Math.min(100, (hours - axisStart) / (axisEnd - axisStart) * 100));
      const chip = chips[selected];
      section.classList.toggle('dnf-off', !!chip);
      for (const track of tracks) {
        track.window.hidden = !chip;
        if (track.edge) track.edge.hidden = true;
        if (!chip) {
          track.left.style.display = track.right.style.display = 'none';
          track.cell.textContent = track.original;
          if (track.count) { track.count.textContent = track.countOriginal; track.count.removeAttribute('title'); }
          continue;
        }
        const {lo, hi} = chip.dataset;
        const p = track.percentiles;
        const a = position(p[track.peer ? Math.max(1, lo) : lo]);
        const b = position(p[track.peer ? Math.min(99, hi) : hi]);
        track.cell.textContent = (clear ? '' : chip.textContent + ' ') + clock(p[lo]) + '–' + clock(p[hi]);
        if (track.count) {
          const total = Number(track.count.dataset.n), share = Math.round(total * (hi - lo) / 100);
          const text = 'about ' + share.toLocaleString('en') + ' of ' + total.toLocaleString('en');
          track.count.textContent = track.count.dataset.long ? text + ' finishers' : '≈' + share.toLocaleString('en');
          track.count.title = text + ' finishers in this rank (the ranks are percentile bands)';
        }
        if (track.edge) {
          track.edge.hidden = lo !== '0' && hi !== '100';
          track.edge.classList.toggle('early', lo === '0');
          track.edge.style.left = (lo === '0' ? a : b) + '%';
        }
        track.left.style.display = track.right.style.display = 'block';
        track.left.style.left = '0';
        track.left.style.width = a + '%';
        track.right.style.right = '0';
        track.right.style.width = (100 - b) + '%';
        track.window.style.left = a + '%';
        track.window.style.width = (b - a) + '%';
      }
      chips.forEach((button, index) => button.setAttribute('aria-pressed', selected === index));
      for (const heading of medians) heading.textContent = chip ? 'Field median' : 'Median';
      for (const heading of averages) heading.textContent = chip ? 'Field average' : 'Average';
      for (const heading of headings) heading.textContent = chip ? chip.textContent : 'Middle 80%';
      if (clear) clear.hidden = !chip;
      for (const mark of marks) mark.hidden = true;
      for (const lane of lanes) {
        const index = Number(lane.dataset.i);
        lane.disabled = chips[index].hidden;
        lane.setAttribute('aria-pressed', selected === index);
        if (selected === index) {
          const mark = lane.closest('.finish-chart').querySelector('.finish-picked');
          mark.style.cssText = lane.querySelector('.finish-track i').style.cssText;
          mark.hidden = false;
        }
      }
    }
  }

  // Choosing a rank hides text above the clock lanes, so the page below it shifts. Scroll by the shift so the tapped control stays under the finger (instant: the page scrolls smoothly otherwise).
  function inPlace(control, change) {
    const before = control.getBoundingClientRect().top;
    change();
    const shift = control.getBoundingClientRect().top - before;
    if (shift) window.scrollBy({top: shift, behavior: 'instant'});
  }
  function toggle(control, index) {
    inPlace(control, () => { selected = selected === index ? null : index; paint(); });
  }
  for (const {chips, lanes, clear} of layouts) {
    chips.forEach((button, index) => button.addEventListener('click', () => toggle(button, index)));
    for (const lane of lanes) lane.addEventListener('click', () => toggle(lane, Number(lane.dataset.i)));
    if (clear) clear.addEventListener('click', () => inPlace(clear, () => { selected = null; paint(); }));
  }
  function updateGroup() {
    const tooFew = Number(layouts[0].section.dataset['min' + page.dataset.g]) < 100;
    for (const {chips} of layouts) chips[0].hidden = tooFew;
    if (tooFew && selected === 0) selected = null;
    paint();
  }
  if (layouts.length) {
    page.addEventListener('finisher-group-change', updateGroup);
    updateGroup();
  }
})();

(function(){
var open=null;
function close(back){if(!open)return;var p=open.pop,b=open.btn,s=p.closest('section');p.hidden=true;p.classList.remove('up');b.setAttribute('aria-expanded','false');if(s)s.classList.remove('sx-live');open=null;if(back)b.focus()}
function show(b){var p=document.getElementById(b.getAttribute('aria-controls')),s=p.closest('section');close(false);p.hidden=false;b.setAttribute('aria-expanded','true');if(s)s.classList.add('sx-live');
 var foot=document.querySelector('.foot'),limit=foot?foot.getBoundingClientRect().top+pageYOffset:1e9;if(p.getBoundingClientRect().bottom+pageYOffset>limit)p.classList.add('up');
 open={btn:b,pop:p};p.focus({preventScroll:true})}
document.addEventListener('click',function(e){var b=e.target.closest('.qm');
 if(b){(open&&open.btn===b)?close(true):show(b);return}
 if(e.target.closest('.sx-pop .x')){close(true);return}
 if(e.target.closest('.sx-pop a[href^="#foot-"]')){close(false);return}
 if(open&&!e.target.closest('.sx-pop')){var a=document.activeElement;close(!a||a===document.body||open.pop.contains(a))}});      // outside click: focus goes back to the ? unless the click landed on something focusable
document.addEventListener('keydown',function(e){if(e.key==='Escape')close(true)});
})();

(function(){
var ph=document.getElementById('phone');if(!ph)return;
ph.classList.add('pjs');
/* one page: a fragment scrolls to its part or opens its folded source row; the index marks the part being read */
/* chart scale labels stay inside the text edges: the first and last label of an axis are nudged back from the gutter */
function clampAxes(){ph.querySelectorAll('.axl').forEach(function(a){var p=a.getBoundingClientRect();if(!p.width)return;
 a.querySelectorAll(':scope > span').forEach(function(sp){sp.style.marginLeft='';var r=sp.getBoundingClientRect();
  if(r.left<p.left-.5)sp.style.marginLeft=(p.left-r.left)+'px';else if(r.right>p.right+.5)sp.style.marginLeft=(p.right-r.right)+'px'})})}
/* Labels never touch: where an axis is too narrow for all its labels every second one is left out (its tick stays), and a sunrise or sunset label that would touch the one before drops to a second row. */
function touching(boxes){for(var k=1;k<boxes.length;k++)if(boxes[k-1].right+6>boxes[k].left)return true;return false}
function thinAxes(){ph.querySelectorAll('.axl,.climb-ticks').forEach(function(a){
 var spans=Array.from(a.querySelectorAll(':scope > span')),step=1;
 spans.forEach(function(sp){sp.style.visibility=''});
 if(!a.getBoundingClientRect().width)return;
 function shown(){return spans.filter(function(sp){return sp.style.visibility!=='hidden'}).map(function(sp){return sp.getBoundingClientRect()})}
 while(step<spans.length&&touching(shown())){step++;spans.forEach(function(sp,i){sp.style.visibility=i%step?'hidden':''})}})}
function stackSun(){ph.querySelectorAll('.solar-labels').forEach(function(row){
 var spans=Array.from(row.querySelectorAll(':scope > span')),end=[-1e9,-1e9],two=false;
 spans.forEach(function(sp){sp.classList.remove('low')});row.classList.remove('two');
 if(!row.getBoundingClientRect().width)return;
 spans.forEach(function(sp){var r=sp.getBoundingClientRect(),line=r.left<end[0]+8?1:0;
  if(line&&r.left<end[1]+8)line=0;
  if(line){sp.classList.add('low');two=true}
  end[line]=r.right});
 row.classList.toggle('two',two)})}
function fitLabels(){clampAxes();thinAxes();stackSun()}
fitLabels();addEventListener('resize',fitLabels);addEventListener('load',fitLabels);
var compact=matchMedia('(width < 1240px)'),index=ph.querySelectorAll('.pidx a');
var parts=Array.from(index,function(a){return document.getElementById(a.getAttribute('href').slice(1))});
function showFragment(){
 var h=location.hash.slice(1);if(!h)return;
 var foot=h.replace(/^pfoot-/,'foot-');
 if(!compact.matches){var d=h.startsWith('pfoot-')&&document.getElementById(foot);if(d)d.scrollIntoView({block:'center'});return}
 var target=foot.startsWith('foot-')?document.getElementById('p'+foot):document.getElementById(h==='women'||h==='men'?'p-time':(/^(course|time|weather)$/.test(h)?'p-'+h:''));
 if(!target)return;
 if(target.matches('details')){target.open=true;target.scrollIntoView({block:'center'})}else target.scrollIntoView({block:'start'});
}
function mark(){
 var y=(ph.querySelector('.pidx').getBoundingClientRect().bottom||0)+12,at=0,end=scrollY>0&&scrollY>=document.documentElement.scrollHeight-innerHeight-4;
 parts.forEach(function(p,i){if(p&&p.getBoundingClientRect().top<=y)at=i});
 if(end)at=parts.length-1;
 index.forEach(function(a,i){a.setAttribute('aria-current',i===at)});
}
document.addEventListener('click',function(e){
 var a=e.target.closest('.sx-pop a[href^="#pfoot-"]');if(!a||!compact.matches)return;
 e.preventDefault();
 document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));
 history.pushState(null,'',a.getAttribute('href'));
 showFragment();
});
addEventListener('hashchange',showFragment);
compact.addEventListener('change',showFragment);
addEventListener('scroll',mark,{passive:true});
showFragment();mark();
/* the legs: a row, or a tap on the profile, highlights the same leg in both */
var rows=ph.querySelectorAll('.lrow'),legs=ph.querySelectorAll('.ph-leg'),prof=ph.querySelector('.ph-prof'),list=ph.querySelector('.plegs');
function leg(i){rows.forEach(function(r){r.setAttribute('aria-pressed',+r.dataset.leg===i)});
 legs.forEach(function(l){l.classList.toggle('on',+l.dataset.leg===i)});if(prof)prof.classList.add('sel')}
rows.forEach(function(r){r.addEventListener('click',function(){leg(+r.dataset.leg)})});
ph.querySelectorAll('.ph-hit').forEach(function(r){r.addEventListener('click',function(){leg(+r.dataset.leg)})});
if(list)leg(+list.dataset.slow);
var pt=document.getElementById('p-time');
/* Keep the day change legible as the visible clock or its available width changes. */
var clockObserver=new ResizeObserver(function(entries){
 entries.forEach(function(entry){
  if(!entry.contentRect.width)return;
  var axis=entry.target;
  var midnights=Array.from(axis.querySelectorAll('[data-midnight]'),function(tick){return tick.getBoundingClientRect()});
  axis.querySelectorAll('span:not([data-midnight])').forEach(function(tick){
   var bounds=tick.getBoundingClientRect();
   var crowded=midnights.some(function(mid){return bounds.left<mid.right+6 && mid.left<bounds.right+6});
   tick.style.visibility=crowded?'hidden':'';
   tick.nextElementSibling.style.visibility=crowded?'hidden':'';
  });
 });
});
pt.querySelectorAll('.clock-ticks').forEach(function(axis){
 if(axis.querySelector('[data-midnight]'))clockObserver.observe(axis);
});
})();

(() => {
  const course = document.querySelector('.cw');
  const hero = document.querySelector('.mhero .route-map');
  if (!course || !hero) return;
  const phone = matchMedia('(width < 1240px)');
  let pinned = null, temporary = null, activeKey = null;
  const controls = document.querySelectorAll('.cw [data-map-leg], .cw [data-k], #p-course .lrow, #p-course .ph-hit, #p-course [data-k]');
  function keyFor(el) {
    if (el.hasAttribute('data-k')) return 'swing-' + el.dataset.k;
    return 'leg-' + (el.dataset.mapLeg ?? el.dataset.leg);
  }
  function draw() {
    const el = temporary || pinned;
    const key = el ? keyFor(el) : null;
    if (activeKey !== key) {
      hero.querySelector('.map-on')?.classList.remove('map-on');
      if (key) hero.querySelector('[data-section="'+key+'"]')?.classList.add('map-on');
      hero.classList.toggle('map-active', !!key);
      document.querySelector('#p-course .ph-swing.on')?.classList.remove('on');
      if (el?.dataset.k) document.querySelector('#p-course .ph-swing[data-swing="'+el.dataset.k+'"]')?.classList.add('on');
      if (el?.dataset.k) course.dataset.a = el.dataset.k;
      else delete course.dataset.a;
      activeKey = key;
    }
  }
  function pin(el) {
    pinned = pinned && keyFor(pinned) === keyFor(el) ? null : el;
    temporary = null;
    controls.forEach(control => {
      if (control.matches('.pb,.leg-hit,#p-course [data-k]')) control.setAttribute('aria-pressed', String(!!pinned && keyFor(control) === keyFor(pinned)));
    });
    draw();
  }
  controls.forEach(el => {
    if (el.matches('tr.cr')) el.tabIndex = 0;
    if (el.closest('.cw')) {
      for (const event of ['mouseenter','focus']) el.addEventListener(event, () => { temporary = el; draw(); });
      for (const event of ['mouseleave','blur']) el.addEventListener(event, () => { if (temporary === el) temporary = null; draw(); });
    }
    if (el.closest('.cw') || el.matches('.ph-badge')) {
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pin(el); }
      });
    }
    el.addEventListener('click', () => pin(el));
  });
  function clear() {
    pinned = temporary = null;
    for (const el of controls) if (el.matches('.pb,.leg-hit,#p-course [data-k]')) el.setAttribute('aria-pressed','false');
    draw();
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') clear(); });
  document.querySelectorAll('.pidx a').forEach(link => link.addEventListener('click', clear));
  phone.addEventListener('change', clear);
})();
