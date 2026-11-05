'use strict';
const main = document.querySelector('#main');
const icons = {
  compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5 5-3Z"/>',
  map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Z"/><path d="M9 3v16M15 5v16"/>',
  spell:'<path d="m3 19 6-14 6 14M5 14h8M17 8h5l-5 9h5"/>',
  city:'<path d="m3 8 9-5 9 5H3ZM3 21h18M5 10v8M10 10v8M14 10v8M19 10v8"/>',
  globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6h14M5 18h14"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  book:'<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/>',
  trophy:'<path d="M8 3h8v7a4 4 0 0 1-8 0V3ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 14v5M7 21h10"/>',
  spark:'<path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8L12 2Z"/>',
  flag:'<path d="M5 22V3m0 1c6-4 8 4 14 0v10c-6 4-8-4-14 0"/>'
};
const icon = (name, cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.compass}</svg>`;
const skills = [
  {id:'map',name:'River explorer',short:'River locations',icon:'map',color:'teal',desc:'Find your way from the Nile to the Yangtze.'},
  {id:'spell',name:'Spelling studio',short:'Spelling',icon:'spell',color:'purple',desc:'Turn tricky river names into familiar friends.'},
  {id:'civilization',name:'Civilization detective',short:'Civilizations',icon:'city',color:'orange',desc:'Connect great rivers with the people they shaped.'},
  {id:'country',name:'Then & now',short:'Modern countries',icon:'globe',color:'blue',desc:'Find ancient places in today’s world.'}
];
let activeRiver = 'nile';
let mapRegion = 'all';
const mapRegions = {all:{name:'Full atlas',box:'0 0 1050 550'},nile:{name:'Lower Nile',box:'0 170 420 290'},mesopotamia:{name:'Mesopotamia',box:'120 100 330 220'},indus:{name:'Indus basin',box:'420 115 275 230'},china:{name:'China’s rivers',box:'670 60 360 260'}};
let game = null;
let pendingRoute = null;
let route = '';
function esc(value) {return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function readBest(mode) {try {const n=Number(localStorage.getItem(`ancient-rivers-best-${mode}`)); return Number.isFinite(n)&&n>=0&&n<=100?n:0;}catch{return 0;}}
function saveBest(mode, value) {try {localStorage.setItem(`ancient-rivers-best-${mode}`,String(Math.max(readBest(mode),value)));return true;}catch{return false;}}
const project = ([lon,lat]) => [(lon-18)*9.2,(55-lat)*9.2];
function geoPath(points,close=false) {return points.map((p,i)=>`${i?'L':'M'}${project(p).map(n=>n.toFixed(1)).join(',')}`).join(' ')+(close?'Z':'');}
function mapMarkup({interactive=false, study=false, selected=null, correct=null, wrong=null}={}) {
  let grid='';
  for(let lon=20;lon<=130;lon+=10) {const x=project([lon,0])[0];grid+=`<path d="M${x} 0V550"/><text x="${x+4}" y="537">${lon}°E</text>`;}
  for(let lat=0;lat<=50;lat+=10) {const y=project([0,lat])[1];grid+=`<path d="M0 ${y}H1050"/><text x="8" y="${y-6}">${lat}°${lat?'N':''}</text>`;}
  return `<svg class="atlas ${interactive?'interactive-atlas':''}" viewBox="${mapRegions[mapRegion].box}" role="group" aria-label="Learning map of northeastern Africa and Asia${interactive?'. Select a river marker from A to F.':''}">
    <defs><pattern id="water-dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="#b6ced0" opacity=".45"/></pattern><filter id="land-shadow"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#91ada8" flood-opacity=".12"/></filter></defs>
    <rect width="1050" height="550" fill="#e2edeb"/><rect width="1050" height="550" fill="url(#water-dots)"/>
    <g class="land" filter="url(#land-shadow)">${LAND.map(p=>`<path d="${geoPath(p,true)}"/>`).join('')}</g>
    <g class="inland-water">${INLAND_SEAS.map(p=>`<path d="${geoPath(p,true)}"/>`).join('')}</g>
    <g class="grid">${grid}</g>
    <g class="country-labels">${COUNTRY_LABELS.map(([text,lon,lat])=>{const [x,y]=project([lon,lat]);return `<text x="${x}" y="${y}">${text}</text>`;}).join('')}</g>
    <g class="sea-labels"><text x="402" y="445">ARABIAN SEA</text><text x="663" y="492">BAY OF BENGAL</text><text x="73" y="166">MEDITERRANEAN SEA</text><text x="970" y="287" transform="rotate(-55 970 287)">EAST CHINA SEA</text></g>
    <g class="rivers">${RIVERS.map(r=>`<g class="river ${selected===r.id?'selected':''} ${correct===r.id?'correct-river':''} ${wrong===r.id?'wrong-river':''}" style="--river:${r.color}"><path class="river-halo" d="${geoPath(r.course)}"/><path class="river-course" d="${geoPath(r.course)}"/>${(r.branches||[]).map(p=>`<path class="river-branch" d="${geoPath(p)}"/>`).join('')}</g>`).join('')}</g>
    ${study?`<g class="river-labels">${RIVERS.map(r=>{const [x,y]=project(r.label);return `<text x="${x}" y="${y}" fill="${r.color}">${r.name}</text>`;}).join('')}</g>`:''}
    <g class="map-markers">${RIVERS.map(r=>{const [x,y]=project(r.anchor);const picked=selected===r.id;const state=correct===r.id?' correct-marker':wrong===r.id?' wrong-marker':'';return `<g transform="translate(${x},${y})" class="map-marker ${picked?'is-selected':''}${state}" ${interactive?`role="button" tabindex="0" aria-label="River marker ${r.letter}" aria-pressed="${picked}" data-map-answer="${r.id}"`:study?`role="button" tabindex="0" aria-label="Explore ${r.name}" aria-pressed="${picked}" data-explore="${r.id}"`:''} style="--river:${r.color}"><circle class="marker-target" r="24" fill="transparent"/><circle class="marker-ring" r="19"/><circle class="marker-dot" r="13.5"/><text text-anchor="middle" dy="4.5">${r.letter}</text></g>`;}).join('')}</g>
    <g class="north-arrow" transform="translate(1004 49)"><text y="-12" text-anchor="middle">N</text><path d="m0 0-7 23 7-4 7 4Z"/><path d="M0 19v15"/></g>
  </svg>`;
}
function mapFooter() {return `<div class="map-view-controls"><span>Look a little closer</span><label>Map view <select class="map-region-select" aria-label="Map region">${Object.entries(mapRegions).map(([id,r])=>`<option value="${id}" ${mapRegion===id?'selected':''}>${r.name}</option>`).join('')}</select></label></div><div class="map-footnote"><span><span class="legend-line"></span> River courses <span class="map-footnote-divider">/</span> Modern country labels</span><span>Geographic learning map · Simplified</span></div>`;}
function riverTabs() {return `<div class="river-tabs" aria-label="Explore a river">${RIVERS.map(r=>`<button data-explore="${r.id}" class="river-tab ${r.id===activeRiver?'active':''}" aria-pressed="${r.id===activeRiver}"><span style="--river:${r.color}">${r.letter}</span>${r.name}</button>`).join('')}</div>`;}
function explorerCard() {const r=RIVERS.find(r=>r.id===activeRiver);return `<div class="explorer-card"><div class="explorer-card-icon" style="--river:${r.color}">${icon('city')}</div><div><span class="eyebrow">${r.region}</span><h3>${r.name} <span>→</span> ${r.civilization}</h3><p>${r.fact}</p></div><span class="explorer-card-tag">${r.country}</span></div>`;}
function renderHome() {
  main.innerHTML=`<section class="hero"><div class="hero-copy"><span class="eyebrow"><span class="tiny-star">✦</span> THE CIVILIZATION CHALLENGE <span class="grade-tag">GRADE 7</span></span><h1>Big rivers.<br>Brilliant <em>civilizations.</em></h1><p>Every great civilization has a story.<br>Follow the rivers. Discover where it began.</p><div class="hero-actions"><button class="button" data-start="mixed">Start your expedition ${icon('arrow')}</button><a class="button secondary" href="#guide">${icon('book')} Explore the field guide</a></div><div class="hero-details"><span>${icon('check')} No sign-up needed</span><span>${icon('check')} Play at your own pace</span></div></div><div class="hero-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="art-sun"></div><div class="art-arch"><svg viewBox="0 0 310 280"><path d="M0 178 60 100 115 163 180 70 250 155 310 107V280H0Z" fill="#c8d0af"/><path d="m0 209 91-80 69 79 63-81 87 69v84H0" fill="#a9b994"/><path d="M176 132c-80 50 88 55 2 95-23 11-50 19-37 53H89c-9-39 50-49 62-62 27-31-89-26 25-86Z" fill="#3b9b9e"/><path d="m51 208 26-48 26 48H51Z" fill="#d9b879"/><path d="m77 160 26 48H78Z" fill="#c1995a"/><path d="m214 224 29-52 29 52h-58Z" fill="#f3d699"/><path d="m243 172 29 52h-29Z" fill="#d4b577"/><path d="M20 249h54m182-6h32" stroke="#7c9276" stroke-width="3"/></svg></div><div class="art-compass">${icon('compass')}</div><span class="art-note">Your next discovery<br>is just around the river.</span><span class="art-spark one">✧</span><span class="art-spark two">✦</span><span class="art-caption">A LITTLE CURIOSITY GOES A LONG WAY</span></div></section>
  <section class="explore-section" aria-labelledby="explore-title"><div class="section-heading"><div><span class="eyebrow">YOUR WORLD, WAITING TO BE EXPLORED</span><h2 id="explore-title">Six rivers. Countless discoveries.</h2></div><span class="section-aside">Click a river. Get to know its story. ${icon('compass')}</span></div><div class="map-card"><div class="map-topline"><span><span class="green-dot"></span> THE RIVER ATLAS</span><span>AFRICA & ASIA <span class="map-zoom-note">20°E — 130°E</span></span></div><div id="home-map">${mapMarkup({study:true,selected:activeRiver})}</div>${mapFooter()}<div id="river-tabs">${riverTabs()}</div><div id="explorer-card">${explorerCard()}</div></div></section>
  <section class="skills-section"><div class="section-heading"><div><span class="eyebrow">CHOOSE YOUR OWN ADVENTURE</span><h2>One world. Four ways to learn.</h2></div><span class="section-aside">Mix it up, or sharpen one skill.</span></div><div class="skill-grid">${skills.map((s,i)=>`<button class="skill-card ${s.color}" data-start="${s.id}"><span class="skill-icon">${icon(s.icon)}</span><span class="skill-number">0${i+1}</span><h3>${s.name}</h3><p>${s.desc}</p><span class="skill-link">6 questions ${icon('arrow')}</span></button>`).join('')}</div></section>
  <section class="bottom-callout"><span class="callout-icon">${icon('flag')}</span><div><h3>Ready to put your knowledge on the map?</h3><p>24 questions. Four skills. One great expedition.</p></div><button class="button" data-start="mixed">Let’s explore ${icon('arrow')}</button></section>`;
}
function renderGuide() {
  main.innerHTML=`<section class="page-intro"><span class="eyebrow">A LITTLE KNOWLEDGE. A BIG HEAD START.</span><h1>Your river <em>field guide.</em></h1><p>Meet the rivers that helped shape our world. Explore the map, then take what you learn on an expedition.</p><button class="button" data-start="mixed">I’m ready to play ${icon('arrow')}</button></section><section class="map-card guide-map"><div class="map-topline"><span>THE RIVER ATLAS</span><span>Tap a marker to explore</span></div><div id="home-map">${mapMarkup({study:true,selected:activeRiver})}</div>${mapFooter()}<div id="river-tabs">${riverTabs()}</div><div id="explorer-card">${explorerCard()}</div></section><div class="context-note">${icon('globe')}<p><strong>Ancient world, modern map.</strong> Civilization names describe historical cultures and regions, not modern countries. Many rivers cross today’s borders.</p></div><section class="guide-grid">${RIVERS.map(r=>`<article class="guide-card" id="guide-${r.id}" style="--river:${r.color}"><div class="guide-card-top"><span class="guide-letter">${r.letter}</span><span class="eyebrow">${r.region}</span></div><h2>${r.name}</h2><span class="alternate-name">${r.id==='huanghe'?'Also called the Yellow River':r.id==='yangtze'?'Also called Chang Jiang':'A river with a story'}</span><h3>${r.civilization}</h3><p class="era">${r.era}</p><p>${r.fact}</p><div class="country-note"><strong>${icon('globe')} On today’s map</strong><p>${r.countryFact}</p></div><button class="text-button" data-explore="${r.id}" data-scroll-map="true">Find it on the map ${icon('arrow')}</button></article>`).join('')}</section>`;
}
function renderHow() {
  main.innerHTML=`<section class="page-intro"><span class="eyebrow">CURIOSITY IS ALL YOU NEED</span><h1>Your adventure.<br><em>Your own pace.</em></h1><p>No countdowns. No accounts. Just a colorful journey through geography and history.</p></section><section class="how-grid">${[{n:'01',title:'Choose your challenge',text:'Play a full 24-question expedition or pick a six-question practice round: river locations, spelling, civilizations, or modern countries.',i:'compass'},{n:'02',title:'Make your discovery',text:'Choose a lettered river marker on the map, pick an answer, or type a river’s name. Map markers also work with Tab and Enter.',i:'map'},{n:'03',title:'Learn as you go',text:'Every answer reveals an explanation. Each correct first answer earns 10 points. An incorrect answer earns 0, with no penalty beyond that question.',i:'spark'},{n:'04',title:'See how far you’ve come',text:'Finish to see your score, accuracy, skill breakdown, and a review of anything you missed. Replay as often as you like!',i:'trophy'}].map(s=>`<article class="how-card"><span class="skill-icon">${icon(s.i)}</span><span class="eyebrow">STEP ${s.n}</span><h2>${s.title}</h2><p>${s.text}</p></article>`).join('')}</section><section class="rules-card"><h2>A few helpful trail notes</h2><ul><li>Spelling ignores capital letters and extra spaces. Accents and punctuation are normalized. Huang He / Yellow River and Yangtze / Chang Jiang are accepted alternatives.</li><li>Your first submitted answer counts. Read the feedback before moving on; there is no time limit.</li><li>Only best percentages for completed rounds are saved on this browser, when storage is available. No names, accounts, or personal information are collected.</li><li>On shared devices, a best score might belong to someone else. You can clear saved scores below.</li><li>Map courses and coastlines are simplified. The field guide explains cross-border rivers and historical context.</li></ul><button class="button secondary" id="clear-scores">Clear saved best scores</button><p id="storage-message" role="status"></p></section><section class="bottom-callout"><span class="callout-icon">${icon('flag')}</span><div><h3>The world is waiting.</h3><p>Take your first step into the ancient world.</p></div><button class="button" data-start="mixed">Start your expedition ${icon('arrow')}</button></section>`;
}
function shuffle(array) {const a=[...array];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function buildQuestions(mode) {
  const questions=[];
  for(const r of RIVERS) {
    questions.push({type:'map',river:r.id,prompt:`Where is the ${r.name}${r.id==='huanghe'?' (Yellow River)':''}?`,detail:'Select its lettered marker on the map, or choose a letter below.',answer:r.id,options:RIVERS.map(v=>({value:v.id,label:`Marker ${v.letter}`})),explanation:r.fact});
    questions.push({type:'spell',river:r.id,prompt:'Name that river.',detail:r.spelling,answer:r.name,explanation:`${r.name}${r.id==='huanghe'?' (Yellow River)':r.id==='yangtze'?' (Chang Jiang)':''}. ${r.fact}`});
    const civilizations=['Ancient Egypt','Mesopotamia','Indus Valley civilization','Early Chinese civilization'];
    const civPrompts={nile:'Which civilization built pyramids and farmed along the Nile?',euphrates:'Sumerian cities developed along the Euphrates in which historical region?',tigris:'Nineveh stood beside the Tigris. Which historical region was it part of?',indus:'Mohenjo-daro and Harappa belonged to which civilization?',huanghe:'The Shang dynasty developed in the Huang He basin. Which civilization does it belong to?',yangtze:'Ancient cultures in the Yangtze basin, including Liangzhu, contributed to which broader civilization?'};
    questions.push({type:'civilization',river:r.id,prompt:civPrompts[r.id],detail:'Follow the connection between a river and its people.',answer:r.civilization,options:shuffle(civilizations).map(v=>({value:v,label:v})),explanation:r.fact});
    const countryPrompts={nile:'In which modern country are Giza and the Nile delta?',euphrates:'The ancient city of Babylon stood near the Euphrates. In which modern country is its site?',tigris:'The Tigris flows through Baghdad. In which modern country is Baghdad?',indus:'Mohenjo-daro lies near the lower Indus. In which modern country is it?',huanghe:'The Huang He reaches the Bohai Sea. In which modern country does this river flow?',yangtze:'The Yangtze reaches the sea near Shanghai. In which modern country is its entire course?'};
    questions.push({type:'country',river:r.id,prompt:countryPrompts[r.id],detail:'Ancient places. Today’s map.',answer:r.country,options:shuffle([r.country,...shuffle(['Egypt','Iraq','Pakistan','China','India','Iran','Türkiye','Syria'].filter(v=>v!==r.country)).slice(0,3)]).map(v=>({value:v,label:v})),explanation:r.countryFact});
  }
  return shuffle(questions.filter(q=>mode==='mixed'||q.type===mode));
}
function startGame(mode) {
  if(!['mixed',...skills.map(s=>s.id)].includes(mode))return;
  mapRegion='all';
  game={mode,questions:buildQuestions(mode),index:0,score:0,streak:0,maxStreak:0,answers:[],selected:null,submitted:false,hint:false};
  setHash('play');
  renderGame();
  main.focus();
}
function modeName(mode) {return mode==='mixed'?'The full expedition':skills.find(s=>s.id===mode).name;}
function progressHeader() {return `<div class="game-top"><a class="back-link" href="#home">← Leave round</a><span class="eyebrow">${modeName(game.mode)}</span><span class="score-pill">${icon('spark')} <strong>${game.score}</strong> points</span></div><div class="progress-row"><span>Question <strong>${game.index+1}</strong> of ${game.questions.length}</span><span>${game.streak>1?`<span class="streak">${game.streak} in a row!</span>`:'Every discovery counts.'}</span></div><div class="progress-track" role="progressbar" aria-label="Questions completed" aria-valuemin="0" aria-valuemax="${game.questions.length}" aria-valuenow="${game.index}"><span style="width:${100*game.index/game.questions.length}%"></span></div>`;}
function renderGame() {
  if(!game)return renderHome();
  const q=game.questions[game.index];const r=RIVERS.find(r=>r.id===q.river);const skill=skills.find(s=>s.id===q.type);
  const isMap=q.type==='map';
  main.innerHTML=`<section class="game-shell">${progressHeader()}<div class="game-layout ${isMap?'map-question':'knowledge-question'}"><div class="game-visual"><div class="map-card"><div class="map-topline"><span>${icon(isMap?'map':skill.icon)} ${isMap?'FIND YOUR RIVER':'EXPEDITION ATLAS'}</span><span>AFRICA & ASIA</span></div><div id="question-map">${mapMarkup({interactive:isMap,selected:isMap?game.selected:r.id,study:false})}</div>${mapFooter()}</div><div class="trail-note">${icon('compass')}<p>${isMap?'Look for the river’s shape and its position. North is up. The labels show modern countries.':'The highlighted river gives you geographic context. The field guide has more to discover after your round.'}</p></div><div class="game-river-legend">${isMap?'<span>Letters are fixed locations, not answer rankings.</span>':`<span class="river-tag" style="--river:${r.color}">${r.letter}</span><strong>${r.name}</strong><span> ${r.region}</span>`}</div></div><section class="question-card" aria-labelledby="question-title"><span class="question-kind ${skill.color}">${icon(skill.icon)} ${skill.short}</span><h1 id="question-title" tabindex="-1">${q.prompt}</h1><p class="question-detail">${q.detail}</p>${q.type==='spell'?`<form id="spelling-form"><label for="spelling-input">River name</label><input id="spelling-input" name="river" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Type the river’s name…" maxlength="80" aria-describedby="spelling-help" required><span id="spelling-help" class="input-help">Capital letters don’t matter. Take your time.</span><button type="button" class="hint-button" id="hint-button" aria-expanded="false">Need a spelling hint?</button><p id="hint-text" class="hint-text" hidden>${r.hint} <span>Hints don’t reduce your score.</span></p><button class="button submit-answer" type="submit">Check my spelling ${icon('arrow')}</button></form>`:`<div class="answer-options ${isMap?'marker-options':''}" role="group" aria-label="Answer choices">${q.options.map((o,i)=>`<button class="answer-option" data-answer="${esc(o.value)}"><span class="answer-letter">${isMap?RIVERS[i].letter:String.fromCharCode(65+i)}</span>${isMap?'River '+RIVERS[i].letter:esc(o.label)}<span class="answer-indicator"></span></button>`).join('')}</div><button class="button submit-answer" id="check-answer" disabled>Check my answer ${icon('arrow')}</button>`}<div id="feedback" aria-live="polite" aria-atomic="true"></div></section></div></section>`;
  if(q.type==='spell')document.querySelector('#spelling-form').addEventListener('submit',e=>{e.preventDefault();submitAnswer(document.querySelector('#spelling-input').value);});
}
function normalize(value) {return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').trim().replace(/\s+/g,' ');}
function chooseAnswer(value) {
  if(!game||game.submitted)return;
  const q=game.questions[game.index];if(!q.options?.some(o=>o.value===value))return;
  game.selected=value;
  document.querySelectorAll('[data-answer]').forEach(b=>{const active=b.dataset.answer===value;b.classList.toggle('chosen',active);b.setAttribute('aria-pressed',String(active));});
  document.querySelector('#check-answer').disabled=false;
  if(q.type==='map'){const hadMapFocus=document.activeElement?.hasAttribute('data-map-answer');document.querySelector('#question-map').innerHTML=mapMarkup({interactive:true,selected:value});if(hadMapFocus)document.querySelector(`[data-map-answer="${value}"]`).focus({preventScroll:true});}
}
function submitAnswer(value) {
  if(!game||game.submitted)return;
  const q=game.questions[game.index];const r=RIVERS.find(r=>r.id===q.river);
  if(q.type==='spell'&&!normalize(value)) {const input=document.querySelector('#spelling-input');input.setCustomValidity('Type a river name first.');input.reportValidity();input.addEventListener('input',()=>input.setCustomValidity(''),{once:true});return;}
  if(q.type!=='spell'&&!q.options.some(o=>o.value===value))return;
  const correct=q.type==='spell'?r.answers.includes(normalize(value)):value===q.answer;
  game.submitted=true;
  if(correct){game.score+=10;game.streak++;game.maxStreak=Math.max(game.maxStreak,game.streak);}else game.streak=0;
  game.answers.push({question:q,value,correct,hint:game.hint});
  document.querySelector('.score-pill strong').textContent=game.score;
  const correctLabel=q.type==='map'?`River ${r.letter} is the ${r.name}`:q.answer;
  document.querySelectorAll('.answer-option').forEach(b=>{b.disabled=true;b.classList.toggle('correct-choice',b.dataset.answer===q.answer);b.classList.toggle('wrong-choice',!correct&&b.dataset.answer===value);if(b.dataset.answer===q.answer)b.querySelector('.answer-indicator').innerHTML=icon('check');});
  const submit=document.querySelector('.submit-answer');submit.hidden=true;
  const input=document.querySelector('#spelling-input');if(input)input.disabled=true;
  const hint=document.querySelector('#hint-button');if(hint)hint.disabled=true;
  if(q.type==='map'){mapRegion=({nile:'nile',tigris:'mesopotamia',euphrates:'mesopotamia',indus:'indus',huanghe:'china',yangtze:'china'})[q.river];document.querySelector('.map-region-select').value=mapRegion;document.querySelector('#question-map').innerHTML=mapMarkup({selected:value,correct:q.river,wrong:correct?null:value,study:true});}
  const feedback=document.querySelector('#feedback');
  feedback.className=`feedback ${correct?'positive':'negative'}`;
  feedback.innerHTML=`<div class="feedback-title">${icon(correct?'check':'book')}<strong>${correct?'That’s a discovery! +10 points':'Keep exploring. You’re learning!'}</strong></div>${!correct?`<p class="correct-answer">${q.type==='map'?'Correct location':'Correct answer'}: <strong>${esc(correctLabel)}</strong></p>`:''}${q.type==='spell'?`<p class="spelling-reveal">${esc(r.name)}</p>`:''}<p>${esc(q.explanation)}</p>${game.hint?'<span class="small">A little hint helped you on your way.</span>':''}<button class="button" id="next-question">${game.index===game.questions.length-1?'See my results':'Next discovery'} ${icon('arrow')}</button>`;
  feedback.querySelector('button').focus({preventScroll:true});
  feedback.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
}
function nextQuestion() {
  if(!game?.submitted)return;
  if(game.index===game.questions.length-1){finishGame();return;}
  mapRegion='all';game.index++;game.selected=null;game.submitted=false;game.hint=false;
  renderGame();document.querySelector('#question-title').focus();
}
function finishGame() {
  const correct=game.answers.filter(a=>a.correct).length;const percent=Math.round(correct/game.questions.length*100);
  game.bestSaved=saveBest(game.mode,percent);game.finished=true;
  renderResults();window.scrollTo(0,0);
}
function renderResults() {
  if(!game?.finished){setHash('home');renderHome();return;}
  const n=game.questions.length;const correct=game.answers.filter(a=>a.correct).length;const percent=Math.round(correct/n*100);const missed=game.answers.filter(a=>!a.correct);
  main.innerHTML=`<section class="results-header"><div class="result-medal">${icon('trophy')}</div><span class="eyebrow">${modeName(game.mode)} · COMPLETE</span><h1>${percent>=80?'An extraordinary expedition!':percent>=50?'Look how far you’ve traveled!':'Every explorer starts somewhere.'}</h1><p>${percent===100?'A perfect round! You know your way around the ancient world.':missed.length?'Every discovery builds your knowledge. Take a look at your trail notes, then try again.':'You followed every river to the right answer. Keep that curiosity flowing.'}</p><div class="result-stats"><div><strong>${game.score}<span> / ${n*10}</span></strong><span>Total points</span></div><div><strong>${percent}<span>%</span></strong><span>Accuracy · ${correct} of ${n} correct</span></div><div><strong>${game.maxStreak}</strong><span>Best correct streak</span></div></div><span class="best-note">${icon('trophy')} ${game.bestSaved?`Best completed ${game.mode==='mixed'?'expedition':'round in this skill'} on this browser: ${readBest(game.mode)}%`:'Best-score storage is unavailable. You can still play every round.'}</span><div class="results-actions"><button class="button" data-start="${game.mode}">Explore again ${icon('arrow')}</button><a class="button secondary" href="#guide">${icon('book')} Visit the field guide</a><button class="text-button" id="print-results">Print my results</button></div></section><section class="breakdown-section"><div class="section-heading"><div><span class="eyebrow">YOUR EXPEDITION, AT A GLANCE</span><h2>A little stronger in every skill.</h2></div></div><div class="skill-grid">${skills.filter(s=>game.answers.some(a=>a.question.type===s.id)).map(s=>{const answers=game.answers.filter(a=>a.question.type===s.id);const right=answers.filter(a=>a.correct).length;return `<article class="skill-card ${s.color}"><span class="skill-icon">${icon(s.icon)}</span><h3>${s.short}</h3><p>${right} of ${answers.length} correct</p><div class="mini-progress"><span style="width:${100*right/answers.length}%"></span></div><button class="text-button" data-start="${s.id}">Practice this skill ${icon('arrow')}</button></article>`;}).join('')}</div></section><section class="review-section"><span class="eyebrow">TAKE SOMETHING WITH YOU</span><h2>${missed.length?'Your trail notes':'A trail worth remembering'}</h2>${missed.length?`<p>Revisit these discoveries. There’s always another chance to learn.</p><div class="review-list">${missed.map(a=>{const q=a.question;const r=RIVERS.find(r=>r.id===q.river);const answer=q.type==='map'?`River ${r.letter} — ${r.name}`:q.answer;const yours=q.type==='map'?`River ${RIVERS.find(r=>r.id===a.value).letter}`:a.value;return `<article class="review-item"><span class="review-icon">${icon(skills.find(s=>s.id===q.type).icon)}</span><div><span class="eyebrow">${skills.find(s=>s.id===q.type).short}</span><h3>${esc(q.prompt)}</h3><p class="review-answer">Your answer: ${esc(yours)} <span>→</span> <strong>${esc(answer)}</strong></p><p>${esc(q.explanation)}</p></div></article>`;}).join('')}</div>`:`<div class="perfect-note">${icon('spark')}<p>You connected all the dots this time. Try another skill, or challenge yourself to a full expedition.</p></div>`}</section><div class="end-link"><a href="#home">← Back to the challenge</a></div>`;
  setHash('results');
}
function setHash(next) {route=next;history.replaceState(null,'',`#${next}`);updateNav(next);}
function updateNav(next) {document.querySelectorAll('[data-nav]').forEach(a=>{const active=a.dataset.nav===next;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});}
function navigate(next) {
  if(game&&!game.finished&&route==='play'&&next!=='play') {
    pendingRoute=next;history.replaceState(null,'','#play');document.querySelector('#leave-dialog').showModal();return;
  }
  const screens={home:renderHome,guide:renderGuide,how:renderHow,play:()=>{if(game&&!game.finished)renderGame();else{setHash('home');renderHome();}},results:renderResults};
  route=Object.hasOwn(screens,next)?next:'home';
  updateNav(route);screens[route]();window.scrollTo(0,0);
}
function exploreRiver(id,scroll=false) {
  if(!RIVERS.some(r=>r.id===id))return;
  activeRiver=id;
  if(mapRegion!=='all'){const [x,y]=project(RIVERS.find(r=>r.id===id).anchor);const [bx,by,bw,bh]=mapRegions[mapRegion].box.split(' ').map(Number);if(x<bx||x>bx+bw||y<by||y>by+bh){mapRegion='all';const select=document.querySelector('.map-region-select');if(select)select.value='all';}}
  const map=document.querySelector('#home-map');if(!map)return;
  const focused=document.activeElement;const wasMap=focused?.hasAttribute('data-explore')&&focused.tagName.toLowerCase()==='g';const tabFocus=focused?.classList.contains('river-tab');
  map.innerHTML=mapMarkup({study:true,selected:id});
  document.querySelector('#river-tabs').innerHTML=riverTabs();document.querySelector('#explorer-card').innerHTML=explorerCard();
  if(wasMap)map.querySelector(`[data-explore="${id}"]`).focus({preventScroll:true});
  if(tabFocus)document.querySelector(`.river-tab[data-explore="${id}"]`).focus({preventScroll:true});
  if(scroll)map.scrollIntoView({behavior:'smooth',block:'center'});
}
document.addEventListener('click',e=>{
  const start=e.target.closest('[data-start]');if(start){startGame(start.dataset.start);return;}
  const explore=e.target.closest('[data-explore]');if(explore){exploreRiver(explore.dataset.explore,explore.dataset.scrollMap==='true');return;}
  const answer=e.target.closest('[data-answer], [data-map-answer]');if(answer){chooseAnswer(answer.dataset.answer||answer.dataset.mapAnswer);return;}
  if(e.target.closest('#check-answer')){submitAnswer(game.selected);return;}
  if(e.target.closest('#next-question')){nextQuestion();return;}
  if(e.target.closest('#hint-button')){game.hint=true;document.querySelector('#hint-text').hidden=false;document.querySelector('#hint-button').setAttribute('aria-expanded','true');return;}
  if(e.target.closest('#print-results')){window.print();return;}
  if(e.target.closest('#clear-scores')){try{for(const mode of ['mixed',...skills.map(s=>s.id)])localStorage.removeItem(`ancient-rivers-best-${mode}`);document.querySelector('#storage-message').textContent='Saved best scores have been cleared.';}catch{document.querySelector('#storage-message').textContent='Browser storage is unavailable. You can still play every round.';}}
});
document.addEventListener('change',e=>{if(e.target.matches('.map-region-select')&&Object.hasOwn(mapRegions,e.target.value)){mapRegion=e.target.value;document.querySelector('.atlas').setAttribute('viewBox',mapRegions[mapRegion].box);}});
document.addEventListener('keydown',e=>{const marker=e.target.closest('g[data-map-answer], g[data-explore]');if(marker&&(e.key==='Enter'||e.key===' ')){e.preventDefault();marker.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)||'home'));
document.querySelector('#sources-button').addEventListener('click',()=>document.querySelector('#sources-dialog').showModal());
document.querySelector('.dialog-close').addEventListener('click',()=>document.querySelector('#sources-dialog').close());
document.querySelector('#keep-playing').addEventListener('click',()=>{pendingRoute=null;document.querySelector('#leave-dialog').close();});
document.querySelector('#leave-game').addEventListener('click',()=>{game=null;document.querySelector('#leave-dialog').close();setHash(pendingRoute||'home');pendingRoute=null;navigate(route);});
document.querySelector('#leave-dialog').addEventListener('cancel',()=>{pendingRoute=null;});
navigate(location.hash.slice(1)||'home');
