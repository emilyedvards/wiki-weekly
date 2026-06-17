(function(){
  let e=document.createElement(`link`).relList;
  if(e&&e.supports&&e.supports(`modulepreload`))return;
  for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);
  new MutationObserver(e=>{
    for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)
  }).observe(document, {
    childList:!0, subtree:!0
  });
  function t(e){
    let t={

    };
    return e.integrity&&(t.integrity=e.integrity), e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy), e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,
    t
  }
  function n(e){
    if(e.ep)return;
    e.ep=!0;
    let n=t(e);
    fetch(e.href, n)
  }
})();
var e=[`Overall`, `Music`, `Movies`, `TV`, `Celebrities`, `Internet Culture`, `Sports`, `Politics`, `Current Events`], t=document.querySelector(`#app`);
if(!t)throw Error(`App root was not found.`);
var n=t, r=[`Noseblood`, `Thinman`, `Tetrominoes`, `Arial Black`, `Impact`, `Georgia`, `Times New Roman`, `Courier New`,
`Helvetica`, `Verdana`, `Trebuchet MS`, `Arial`], i=100, a=90, o=r[Math.floor(Math.random()*r.length)], s=!1;
function c(){
  let e=new URLSearchParams(window.location.search).get(`previewDate`);
  if(e){
    let[t, n, r]=e.split(`-`).map(Number);
    if(t&&n&&r)return new Date(t, n-1, r)
  }
  return new Date
}
function l(e){
  return new Date(e.getFullYear(), e.getMonth(), e.getDate())
}
function u(e, t){
  let n=new Date(e);
  return n.setDate(n.getDate()+t), n
}
function d(e=c()){
  let t=l(e), n=t.getDay(), r=u(t, -(n===0?6:n-1));
  return{
    monday:r, sunday:u(r, 6)
  }
}
function f(e=c()){
  let{
    monday:t
  }
  =d(e), n=l(e), r=[];
  for(let e=new Date(t);
  e.getTime()<n.getTime();
  e=u(e, 1))r.push(new Date(e));
  return r
}
function p(e=c()){
  let{
    monday:t
  }
  =d(e), n=u(t, -7);
  return Array.from({
    length:7
  }, (e, t)=>u(n, t))
}
function m(e){
  return{
    year:String(e.getFullYear()), month:String(e.getMonth()+1).padStart(2, `0`), day:String(e.getDate()).padStart(2, `0`)
  }
}
function h(e){
  return new Intl.DateTimeFormat(`en-US`, {
    month:`long`, day:`numeric`
  }).format(e)
}
function g(e, t){
  let n=new Intl.DateTimeFormat(`en-US`, {
    month:`long`
  }).format(e), r=e.getMonth()===t.getMonth(), i=e.getFullYear()===t.getFullYear();
  return r&&i?`${n} ${e.getDate()}–${t.getDate()}, ${t.getFullYear()}`:i?`${h(e)}–${h(t)}, ${t.getFullYear()}`:`${h(e)}, ${e.getFullYear()}–${h(t)}, ${t.getFullYear()}`
}
function _(e){
  return`${new Intl.NumberFormat(`en-US`,{maximumFractionDigits:0}).format(e)} views`
}
function v(e){
  return decodeURIComponent(e).replaceAll(`_`, ` `)
}
function y(e){
  return`https://en.wikipedia.org/wiki/${encodeURIComponent(e).replaceAll(`%2F`,`/`)}`
}
function b(e){
  return e.replace(/[&<>"']/g, e=>({
    "&":`&amp;`, "<":`&lt;`, ">":`&gt;`, '"':`&quot;`, "'":`&#039;`
  })[e])
}
function x(e){
  return`"${e}", Arial, Helvetica, sans-serif`
}
function S(e){
  let t=n.querySelector(`.title`);
  t&&(t.style.fontFamily=x(e))
}
function C(){
  if(s){
    S(o);
    return
  }
  s=!0;
  let e=0, t=window.setInterval(()=>{
    let n=r[e%r.length];
    S(n), e+=1, e>=i&&(window.clearInterval(t), S(o))
  }, a)
}
function w(e, t){
  let n=e.toLowerCase(), r=t.toLowerCase(), i=n.replace(/\(.+?\)/g, ``).split(/\s+/).filter(e=>e.length>2), a=0;
  r.includes(n)&&(a+=100);
  for(let e of i)r.includes(e)&&(a+=10);
  return r.endsWith(`.svg`)&&(a+=5), /\b(poster|cover|emblem|logo|seal|flag)\b/.test(r)&&(a+=40), /\b(portal|puzzle|protection|shackle|userbox|wikiquote|generic|icon|smiley)\b/.test(r)&&(a-=100),
  a
}
function T(e, t=[]){
  return t.filter(e=>/\.(gif|jpe?g|png|svg|webp)$/i.test(e.title)).map(t=>({
    title:t.title, score:w(e, t.title)
  })).filter(e=>e.score>0).sort((e, t)=>t.score-e.score)[0]?.title
}
function E(e, t){
  let n=[];
  for(let r=0;
  r<e.length;
  r+=t)n.push(e.slice(r, r+t));
  return n
}
function D(e){
  let t=v(e).trim().toLowerCase();
  return new Set([``, `main page`, `search`, `wikimedia foundation`, `wikipedia`]).has(t)||[`api/`, `book:`, `category:`,
  `draft:`, `file:`, `help:`, `mediawiki:`, `module:`, `portal:`, `special:`, `talk:`, `template:`, `template talk:`, `timedtext:`,
  `user:`, `user talk:`, `wikipedia:`, `wikipedia talk:`].some(e=>t.startsWith(e))?!1:!t.includes(`404.php`)&&!t.includes(`undefined`)
}
function O(e, t){
  if(t===`Overall`)return!0;
  let n=e.title.toLowerCase(), r=(e.categories??[]).join(` `).toLowerCase(), i=`${n} ${r}`, a=String(c().getFullYear()),
  o=/\b(living people|births|deaths|actors|actresses|singers|rappers|musicians|athletes|players|people from|models|directors|writers|businesspeople|entrepreneurs|chief executives|podcasters|media personalities|bodyguards|comedians)\b/.test(r),
  s=/\b(film|films|movie|movies|cinema)\b/.test(i), l=/\b(sport|sports|football|soccer|basketball|baseball|tennis|golf|cricket|ufc|mma|fighter|athlete|olympic|fifa|nba|nfl|mlb|nhl|wrestl)\b/.test(i),
  u=/\b(politician|politicians|president|presidents|prime minister|prime ministers|government minister|government ministers|cabinet member|cabinet members|senator|senators|representative|representatives|governor|governors|mayor|mayors|heads of state|heads of government|members of parliament|members of congress|members of the lok sabha)\b/.test(r),
  d=/\b(election|elections|referendum|referendums|political party|political parties|legislature|legislatures|parliament|parliamentary|congress|congressional|senate|cabinet|government agency|government agencies|government ministry|government ministries|supreme court|constitutional court|law|laws|legislation|bill|bills|treaty|treaties|diplomacy|diplomatic)\b/.test(i),
  f=/\b(journalist|journalists|bodyguard|bodyguards|security guards|media personalities|podcaster|podcasters|commentator|commentators)\b/.test(`${n} ${r}`),
  p=/\b(actor|actors|actress|actresses|singer|singers|rapper|rappers|musician|musicians|athlete|athletes|footballer|basketball player|baseball player|tennis player|fighter|wrestler|comedian|comedians)\b/.test(r),
  m=/\b(president|presidents|prime minister|prime ministers|government minister|government ministers|cabinet member|cabinet members|senator|senators|representative|representatives|governor|governors|heads of state|heads of government|members of parliament|members of congress|members of the lok sabha)\b/.test(r);
  switch(t){
    case`Music`:return!l&&(!s||/\b(song|songs|album|albums|single|singles|soundtrack)\b/.test(r))&&(/\b(song|songs|album|albums|single|singles|ep|concert tour|music festival|record label|band|musical group|discography)\b/.test(i)||/\b(singer|rapper|musician|songwriter|record producer|musical artist)\b/.test(r)&&!/\b(film director|actor|actress)\b/.test(r));
    case`Movies`:return/\b(film|films|movie|movies|cinema|box office)\b/.test(i)&&!o;
    case`TV`:return!o&&!l&&/\b(television series|tv series|television show|television program|television episode|streaming television|sitcom|miniseries|soap opera|game show|reality television series)\b/.test(i);
    case`Celebrities`:return/\b(celebrity|actor|actress|model|influencer|youtuber|tiktoker|media personality|socialite|royalty|singer|rapper|musician)\b/.test(i);
    case`Internet Culture`:return!l&&!u&&!d&&!s&&!/\b(television series|tv series|television show|television program|streaming television|sitcom|miniseries|soap opera|game show)\b/.test(i)&&/\b(internet meme|internet memes|meme|memes|viral video|viral videos|viral phenomenon|viral phenomena|viral trend|viral trends|viral phrase|viral phrases|internet slang|online slang|slang|catchphrase|catchphrases|internet culture|online culture|digital culture|web culture|tiktok trend|tiktok trends|hashtag|hashtags|challenge|challenges|creepypasta|reaction image|reaction images|emoji|emojis|content creator|content creators|online creator|online creators|youtuber|youtubers|tiktoker|tiktokers|streamer|streamers|influencer|influencers|social media platform|social media platforms|online platform|online platforms|video-sharing platform|video-sharing platforms|mobile app|mobile apps|social media app|social media apps|online community|online communities|internet forum|internet forums|message board|message boards|internet phenomenon|internet phenomena|online phenomenon|online phenomena|collectible toy|collectible toys|designer toy|designer toys|art toy|art toys)\b/.test(i);
    case`Sports`:return l;
    case`Politics`:return!f&&(!p||m)&&(u||!o&&d)&&!l;
    case`Current Events`:return!u&&!d&&!o&&!n.startsWith(`list of `)&&(n.includes(a)||/\b(war|attack|disaster|earthquake|hurricane|protest|summit|trial|conflict|crisis|incident)\b/.test(n))&&/\b(event|events|war|attack|disaster|earthquake|hurricane|protest|summit|trial|conflict|crisis|incident|tournament|world cup|championship|awards|ceremony)\b/.test(i)
  }
}
async function k(e){
  let{
    year:t, month:n, day:r
  }
  =m(e), i=`https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${t}/${n}/${r}`, a=await fetch(i,
  {
    headers:{
      Accept:`application/json`
    }
  });
  if(!a.ok)throw Error(`Wikimedia returned ${a.status} for ${t}-${n}-${r}.`);
  return(await a.json()).items[0]?.articles??[]
}
async function A(e){
  let t=new Map;
  for(let n of E(e, 50)){
    let e=new URLSearchParams({
      action:`query`, format:`json`, origin:`*`, prop:`categories`, cllimit:`max`, titles:n.map(e=>e.slug).join(`|`)
    }), r=await fetch(`https://en.wikipedia.org/w/api.php?${e.toString()}`, {
      headers:{
        Accept:`application/json`
      }
    });
    if(!r.ok)throw Error(`Wikipedia categories returned ${r.status}.`);
    let i=await r.json();
    for(let e of Object.values(i.query?.pages??{

    }))e.title&&t.set(e.title, (e.categories??[]).map(e=>e.title.replace(/^Category:/, ``)))
  }
  return t
}
async function j(e){
  let t=new URLSearchParams({
    action:`query`, format:`json`, origin:`*`, prop:`pageimages`, piprop:`thumbnail`, pithumbsize:`360`, titles:e.join(`|`)
  }), n=await fetch(`https://en.wikipedia.org/w/api.php?${t.toString()}`, {
    headers:{
      Accept:`application/json`
    }
  });
  if(!n.ok)throw Error(`Wikipedia image metadata returned ${n.status}.`);
  let r=await n.json(), i=new Map;
  for(let e of Object.values(r.query?.pages??{

  }))e.title&&e.thumbnail?.source&&i.set(e.title, e.thumbnail.source);
  return i
}
async function M(e){
  let t=new Map;
  for(let n of e){
    let e=await N(n);
    if(!e)continue;
    let r=await P(e);
    r&&t.set(n.title, r)
  }
  return t
}
async function N(e){
  let t=new URLSearchParams({
    action:`query`, format:`json`, origin:`*`, prop:`images`, imlimit:`50`, titles:e.slug
  }), n=await fetch(`https://en.wikipedia.org/w/api.php?${t.toString()}`, {
    headers:{
      Accept:`application/json`
    }
  });
  if(!n.ok)throw Error(`Wikipedia article files returned ${n.status}.`);
  let r=await n.json(), i=Object.values(r.query?.pages??{

  })[0];
  return i?.title?T(i.title, i.images):void 0
}
async function P(e){
  let t=new URLSearchParams({
    action:`query`, format:`json`, origin:`*`, prop:`imageinfo`, iiprop:`url`, iiurlwidth:`360`, titles:e
  }), n=await fetch(`https://en.wikipedia.org/w/api.php?${t.toString()}`, {
    headers:{
      Accept:`application/json`
    }
  });
  if(!n.ok)throw Error(`Wikipedia image files returned ${n.status}.`);
  let r=await n.json(), i=Object.values(r.query?.pages??{

  })[0];
  return i?.imageinfo?.[0]?.thumburl??i?.imageinfo?.[0]?.url
}
async function F(e){
  try{
    let t=await j(e.map(e=>e.slug)), n=e.filter(e=>!t.has(e.title)), r=n.length>0?await M(n):new Map;
    return e.map(e=>({
      ...e, thumbnailUrl:t.get(e.title)??r.get(e.title)
    }))
  }
  catch{
    return e
  }
}
async function I(e){
  let t=(await Promise.allSettled(e.map(k))).filter(e=>e.status===`fulfilled`), n=new Map;
  if(t.length===0)throw Error(`No Wikimedia pageview data was available for the completed days.`);
  for(let e of t)for(let t of e.value)D(t.article)&&n.set(t.article, (n.get(t.article)??0)+t.views);
  let r=Array.from(n.entries()).map(([e, t])=>({
    title:v(e), slug:e, views:t
  })).sort((e, t)=>t.views-e.views).slice(0, 1e3);
  try{
    let e=await A(r);
    return r.map(t=>({
      ...t, categories:e.get(t.title)??[]
    }))
  }
  catch{
    return r
  }
}
async function L(){
  let e=f();
  return e.length===0?[]:I(e)
}
async function R(){
  return I(p())
}
function z(t){
  return`
    <nav class="category-filter" aria-label="Ranking categories">
      ${e.map((n,r)=>{let i=r<e.length-1?`<span class="category-separator">|</span>`:``;return`
          <button
            class="category-button${n===t?` is-selected`:``}"
            type="button"
            data-category="${n}"
            aria-pressed="${n===t}"
          >${n}</button>${
    i
  }
  `}).join(``)}
    </nav>
  `
}
function B(e, t=`Overall`){
  let{
    monday:n, sunday:r
  }
  =d();
  return`
    <section class="publication">
      <header class="masthead">
        <p class="title">TWOW</p>
        <p class="kicker">This Week on Wikipedia</p>
        <time class="date-range">Week of: ${g(n,r)}</time>
        <h1>What people are reading.</h1>
        ${z(t)}
      </header>
      ${e}
      <footer>
        <span class="delay-note">*24-hour delay</span>
        <a class="credit" href="https://www.instagram.com/emilyedwards" target="_blank" rel="noreferrer">TWOW by ee</a>
      </footer>
    </section>
  `
}
function V(){
  n.innerHTML=B(`<p class="status">Loading this week's pages.</p>`), C()
}
function H(){
  n.innerHTML=B(`<p class="status">This week is still coming into view.</p>`), C()
}
async function U(e, t=`Overall`){
  n.innerHTML=B(`
    <p class="status">*Note: This week will be available starting tomorrow. In the meantime, here's what people were reading about the last 7 days.</p>
    ${K(await F(G(e,t)))}
  `, t), C(), q(e, t, U), J()
}
function W(){
  n.innerHTML=B(`<p class="status">This week is temporarily unavailable.</p>`), C()
}
function G(e, t){
  return e.filter(e=>O(e, t)).slice(0, 10)
}
function K(e){
  return e.length===0?`
      <table class="ranked-table">
        <tbody>
          <tr class="ranked-item">
            <td class="article-cell" colspan="3">
              No rankings. Pages in this category have not reached Wikipedia's top 1,000 viewed yet.
            </td>
          </tr>
        </tbody>
      </table>
    `:`
    <table class="ranked-table">
      <tbody>${e.map((e,t)=>{let n=e.thumbnailUrl?`<img class="thumbnail" src="${b(e.thumbnailUrl)}" alt="" loading="lazy" decoding="async" />`:``;return` <tr class="ranked-item"> <td class="rank">${
    t+1
  }.</td>
          <td class="article-cell">
            <span class="article-link-wrap">
              <a href="${y(e.slug)}" target="_blank" rel="noreferrer">${b(e.title)}</a> ${
    n
  }
  </span>
          </td> <td class="views">${
    _(e.views)
  }
  </td>
        </tr> `}).join(``)}</tbody>
    </table>
  `
}
function q(e, t, r){
  let i=n.querySelectorAll(`.category-button`);
  for(let n of i){
    let i=n.dataset.category;
    !i||i===t||n.addEventListener(`click`, ()=>{
      r(e, i)
    })
  }
}
function J(){
  let e=n.querySelectorAll(`.article-link-wrap`);
  for(let t of e){
    let e=t.closest(`.ranked-item`), n, r=()=>{
      n!==void 0&&(window.clearTimeout(n), n=void 0), t.classList.remove(`is-previewing`)
    };
    t.addEventListener(`pointerenter`, ()=>t.classList.add(`is-previewing`)), t.addEventListener(`pointerleave`, ()=>t.classList.remove(`is-previewing`)),
    t.addEventListener(`focusin`, ()=>t.classList.add(`is-previewing`)), t.addEventListener(`focusout`, ()=>t.classList.remove(`is-previewing`)),
    e?.addEventListener(`pointerdown`, e=>{
      e.pointerType!==`mouse`&&(n=window.setTimeout(()=>{
        t.classList.add(`is-previewing`)
      }, 350))
    }), e?.addEventListener(`pointerup`, r), e?.addEventListener(`pointercancel`, r), e?.addEventListener(`pointerleave`,
    r), e?.addEventListener(`contextmenu`, e=>{
      t.classList.contains(`is-previewing`)&&e.preventDefault()
    })
  }
}
async function Y(e, t=`Overall`){
  n.innerHTML=B(K(await F(G(e, t))), t), C(), q(e, t, Y), J()
}
async function X(){
  V();
  try{
    let e=await L();
    if(e.length===0){
      let e=await R();
      if(e.length===0){
        H();
        return
      }
      await U(e);
      return
    }
    await Y(e)
  }
  catch{
    W()
  }
}
X();
