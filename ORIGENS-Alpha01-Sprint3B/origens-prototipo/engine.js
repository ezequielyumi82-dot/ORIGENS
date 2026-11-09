/* ORIGENS — Motor Evolutivo v0.2
   Simulação baseada em espécies, não em indivíduos: escalável para mundos persistentes. */
const Evolution = (() => {
  const clamp = (n,min=0,max=1)=>Math.max(min,Math.min(max,n));
  let randomState = 874562913 >>> 0;
  const setSeed = seed => { randomState = (Number(seed) >>> 0) || 1; };
  const random = () => ((randomState = (randomState * 1664525 + 1013904223) >>> 0) / 4294967296);
  const r = (a,b)=>a+random()*(b-a);
  const pick = a => a[Math.floor(random()*a.length)];
  const uid = () => Math.floor(random()*0x7fffffff).toString(36);

  const namesA=['Aur','Cae','Doro','Ely','Fera','Gali','Hera','Iri','Kora','Lumi','Mora','Neri','Orbi','Pala','Rhe','Soli','Tavi','Vela'];
  const namesB=['lis','mon','ria','this','vora','len','nix','ara','dune','mel','quill','phos','tara','vex'];
  const speciesName=()=>`${pick(namesA)}${pick(namesB)} ${pick(['minor','prima','vitalis','nativa','alta','lenta','ferox'])}`;

  const mutationLibrary = [
    {id:'cilia',name:'cílios velozes',branch:'Locomoção',need:'water',apply:d=>d.locomotion.speed+=.16},
    {id:'fins',name:'nadadeiras largas',branch:'Locomoção',need:'water',apply:d=>{d.locomotion.speed+=.11;d.locomotion.modes.add('nadar')}},
    {id:'legs',name:'membros articulados',branch:'Locomoção',need:'land',apply:d=>{d.body.limbs+=2;d.locomotion.modes.add('andar');d.locomotion.speed+=.08}},
    {id:'shell',name:'carapaça mineral',branch:'Defesa',apply:d=>{d.defense.armor+=.22;d.body.mass+=.08;d.metabolism.cost+=.05}},
    {id:'spines',name:'espinhos',branch:'Defesa',apply:d=>d.defense.spines+=.24},
    {id:'toxin',name:'glândulas de toxina',branch:'Defesa',need:'predators',apply:d=>d.defense.toxin+=.28},
    {id:'camouflage',name:'pigmentação adaptativa',branch:'Defesa',apply:d=>d.defense.camouflage+=.24},
    {id:'fat',name:'reserva lipídica',branch:'Corpo',need:'cold',apply:d=>{d.body.energyReserve+=.25;d.metabolism.coldTolerance+=.2;d.body.mass+=.07}},
    {id:'efficient',name:'núcleo eficiente',branch:'Metabolismo',need:'scarceFood',apply:d=>{d.metabolism.efficiency+=.22;d.metabolism.cost-=.1}},
    {id:'photo',name:'membrana fotossintética',branch:'Alimentação',need:'light',apply:d=>{d.diet.type='fotossintetizante';d.diet.flexibility+=.2}},
    {id:'filter',name:'filtros bucais',branch:'Alimentação',need:'water',apply:d=>{d.diet.type='filtradora';d.diet.flexibility+=.16}},
    {id:'thermal',name:'sensores térmicos',branch:'Sentidos',need:'dark',apply:d=>d.senses.thermal+=.27},
    {id:'electro',name:'campo elétrico',branch:'Sentidos',need:'water',apply:d=>d.senses.electro+=.25},
    {id:'social',name:'comunicação química',branch:'Comportamento',apply:d=>{d.behavior.social+=.22;d.intelligence.communication+=.15}},
    {id:'care',name:'cuidado parental',branch:'Reprodução',apply:d=>{d.reproduction.care+=.25;d.reproduction.rate-=.12}},
  ];

  function createDNA(seed={}) { return {
    body:{size:seed.size??r(.16,.48),mass:seed.mass??r(.15,.45),limbs:seed.limbs??0,energyReserve:r(.25,.6)},
    locomotion:{modes:new Set(seed.modes||['nadar']),speed:r(.22,.55)},
    diet:{type:seed.diet||pick(['filtradora','decompositora','fotossintetizante']),flexibility:r(.15,.55)},
    defense:{armor:r(0,.12),spines:0,toxin:0,camouflage:r(.05,.25)},
    senses:{vision:r(.05,.35),chemical:r(.35,.7),thermal:0,electro:0},
    reproduction:{mode:seed.reproduction||'divisão celular',rate:r(.45,.8),care:0},
    intelligence:{memory:r(.02,.14),learning:r(.02,.14),communication:0,cooperation:r(0,.12)},
    behavior:{aggression:r(.05,.35),social:r(.04,.25),migration:r(.05,.3),nocturnal:r(.05,.3)},
    metabolism:{efficiency:r(.32,.65),cost:r(.25,.5),coldTolerance:r(.05,.28),heatTolerance:r(.12,.4)},
    traits:[]
  }}
  function makeSpecies(origin, year=0) { const dna=createDNA(origin); return {id:uid(),name:speciesName(),dna,population:Math.round(r(900,3600)),born:year,peak:0,habitat:origin?.habitat||'oceano raso',status:'viva',events:[`${year.toLocaleString('pt-BR')} anos — surgiu em ${origin?.habitat||'oceano raso'}.`]}; }
  function pressure(env,dna) {
    let score=1; const traits=[];
    if(env.temperature<.35){score+=dna.metabolism.coldTolerance*.8+dna.body.energyReserve*.35;traits.push('resistência ao frio')}
    if(env.temperature>.68){score+=dna.metabolism.heatTolerance*.7+(1-dna.body.mass)*.3;traits.push('dissipação de calor')}
    if(env.food<.42){score+=dna.metabolism.efficiency*.8+dna.diet.flexibility*.45;traits.push('eficiência alimentar')}
    if(env.predators>.55){score+=dna.locomotion.speed*.4+(dna.defense.armor+dna.defense.spines+dna.defense.toxin+dna.defense.camouflage)*.42;traits.push('defesa')}
    if(env.light<.4){score+=(dna.senses.thermal+dna.senses.electro+ dna.senses.chemical*.4)*.6;traits.push('sentidos alternativos')}
    if(env.water<.4 && dna.locomotion.modes.has('nadar')&&!dna.locomotion.modes.has('andar'))score-=.45;
    if(env.water>.55 && dna.locomotion.modes.has('nadar'))score+=.2;
    return {score:clamp(score/1.75,0,1.6),traits};
  }
  function availableMutations(env,dna) { const tags=[];if(env.water>.5)tags.push('water');if(env.water<.55)tags.push('land');if(env.temperature<.38)tags.push('cold');if(env.food<.45)tags.push('scarceFood');if(env.predators>.55)tags.push('predators');if(env.light>.55)tags.push('light');if(env.light<.45)tags.push('dark');return mutationLibrary.filter(m=>!dna.traits.includes(m.id)&&(!m.need||tags.includes(m.need))); }
  function mutate(species,env,year,forced) { const options=availableMutations(env,species.dna);const m=forced||pick(options);if(!m)return null;m.apply(species.dna);species.dna.traits.push(m.id);species.events.push(`${year.toLocaleString('pt-BR')} anos — desenvolveu ${m.name}.`);return m; }
  function simulateGeneration(species,env,year) { if(species.status==='extinta')return; const fit=pressure(env,species.dna); const growth=(fit.score-.56)*.42+species.dna.reproduction.rate*.08; species.population=Math.max(0,Math.round(species.population*(1+growth)));species.peak=Math.max(species.peak,species.population);if(random()<.34+Math.max(0,.48-fit.score))mutate(species,env,year);if(species.population<18){species.status='extinta';species.events.push(`${year.toLocaleString('pt-BR')} anos — extinta: pressão ambiental superior à adaptação.`)} }
  function biography(s) {const d=s.dna;const principal=d.traits.length?mutationLibrary.find(m=>m.id===d.traits[d.traits.length-1])?.name:'forma primordial';return {name:s.name,origin:s.habitat,first:s.born,food:d.diet.type,mutation:principal,peak:s.peak||s.population,status:s.status==='viva'?'Viva':'Extinta',reason:s.status==='viva'?'A linhagem continua se adaptando.':s.events.at(-1).replace(/^.*— /,'')};}
  return {createDNA,makeSpecies,pressure,availableMutations,mutate,simulateGeneration,biography,mutationLibrary,setSeed,random};
})();


/* ORIGENS App Hub — estado compartilhado entre módulos. */
(() => {
  const KEY = 'origens.alpha01.state';
  const defaults = { version: 1, activeModule: 'inicio', visits: {}, actions: [], seed: 874562913,
    progress: { discoveries: [], lineage: 0, energy: 68 }, updatedAt: null };
  const clone = value => JSON.parse(JSON.stringify(value));
  function read() {
    try { const raw = localStorage.getItem(KEY); return raw ? { ...clone(defaults), ...JSON.parse(raw) } : clone(defaults); }
    catch (_) { return clone(defaults); }
  }
  let state = read();
  const listeners = new Set();
  function persist() {
    state.updatedAt = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {}
    listeners.forEach(fn => fn(getState()));
  }
  function getState() { return clone(state); }
  function setState(module) {
    const allowed = ['inicio','anatomia','ciclo','laboratorio','mente','observatorio','semente'];
    if (!allowed.includes(module)) throw new Error('Módulo ORIGENS desconhecido: ' + module);
    state.activeModule = module;
    state.visits[module] = (state.visits[module] || 0) + 1;
    persist();
    return getState();
  }
  function recordAction(module, action, payload = {}) {
    state.actions.unshift({ module, action, payload, at: new Date().toISOString() });
    state.actions = state.actions.slice(0, 60);
    const key = module + ':' + action;
    if (!state.progress.discoveries.includes(key)) state.progress.discoveries.push(key);
    persist();
    return getState();
  }
  function updateProgress(patch = {}) {
    state.progress = { ...state.progress, ...patch };
    persist();
    return getState();
  }
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function navigate(module) {
    const pages = { inicio:'index.html', anatomia:'anatomia.html', ciclo:'ciclo.html',
      laboratorio:'laboratorio.html', mente:'mente.html', observatorio:'observatorio.html',
      semente:'projeto-semente.html' };
    if (!pages[module]) throw new Error('Destino inválido');
    setState(module);
    location.href = pages[module];
  }
  window.ORIGENSApp = { getState, setState, navigate, recordAction, updateProgress, subscribe,
    storageKey: KEY, reset() { state = clone(defaults); persist(); } };
  const page = location.pathname.split('/').pop();
  const module = ({'index.html':'inicio','anatomia.html':'anatomia','ciclo.html':'ciclo',
    'laboratorio.html':'laboratorio','mente.html':'mente','observatorio.html':'observatorio',
    'projeto-semente.html':'semente'})[page] || 'inicio';
  if (state.activeModule !== module) setState(module);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const target = link.getAttribute('href');
    const match = Object.entries({ 'anatomia.html':'anatomia','ciclo.html':'ciclo',
      'laboratorio.html':'laboratorio','mente.html':'mente','observatorio.html':'observatorio',
      'projeto-semente.html':'semente','index.html':'inicio' }).find(([file]) => target.endsWith(file));
    if (match) setState(match[1]);
  }, true);
})();
