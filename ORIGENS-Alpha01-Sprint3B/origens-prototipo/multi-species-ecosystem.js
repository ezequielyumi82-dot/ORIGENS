/* ORIGENS — Multi-Species Ecosystem v0.1
 * Shared-resource, deterministic, aggregate ecosystem prototype.
 * Experimental JavaScript module; not the authoritative C# engine.
 */
(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./genetic-dynamics.js') : root.ORIGENSGeneticDynamics, typeof module === 'object' && module.exports ? require('./lineage-dynamics.js') : root.ORIGENSLineageDynamics);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ORIGENSMultiSpeciesEcosystem = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Genetics, Lineages) {
  'use strict';
  const VERSION = 1;
  const clone = value => structuredClone(value);
  const finite = (v, name, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < min || n > max) throw new RangeError(`${name} fora do intervalo permitido.`);
    return n;
  };
  const integer = (v, name, min = 0) => {
    const n = finite(v, name, min);
    if (!Number.isSafeInteger(n)) throw new RangeError(`${name} deve ser inteiro.`);
    return n;
  };
  class Random {
    constructor(seed) { this.state = (Number(seed) >>> 0) || 1; }
    next() {
      let x = this.state >>> 0;
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
      this.state = x >>> 0;
      return this.state / 4294967296;
    }
    round(value) { const n = Math.floor(value); return n + (this.next() < value - n ? 1 : 0); }
  }
  function createEcosystem(config = {}) {
    if (!Genetics || !Lineages) throw new Error('Genetic Dynamics e Lineage Dynamics devem estar carregados.');
    if (!Array.isArray(config.habitats) || !config.habitats.length) throw new TypeError('Informe ao menos um habitat.');
    if (!Array.isArray(config.species) || !config.species.length) throw new TypeError('Informe ao menos uma espécie.');
    if (!config.lineages) throw new TypeError('Informe o registro inicial de linhagens.');
    const lineages = clone(config.lineages);
    Lineages.validateState(lineages);
    const habitats = config.habitats.map(h => {
      if (!h || typeof h.id !== 'string' || !h.id.trim()) throw new TypeError('Habitat exige id textual.');
      return { id: h.id, neighbors: [...new Set(h.neighbors || [])].map(String).sort(), resources: finite(h.resources ?? 1, `${h.id}.resources`), maxResources: finite(h.maxResources ?? 1, `${h.id}.maxResources`, 0.000001), regeneration: finite(h.regeneration ?? 0.05, `${h.id}.regeneration`), resourceUnit: finite(h.resourceUnit ?? 1, `${h.id}.resourceUnit`, 0.000001) };
    }).sort((a,b)=>a.id.localeCompare(b.id));
    const habitatIds = new Set(habitats.map(h=>h.id));
    if (habitatIds.size !== habitats.length) throw new Error('IDs de habitat duplicados.');
    for (const h of habitats) {
      if (h.resources > h.maxResources) throw new RangeError(`Recursos excedem o máximo em ${h.id}.`);
      for (const n of h.neighbors) if (!habitatIds.has(n)) throw new Error(`Habitat vizinho inexistente: ${n}`);
    }
    const species = config.species.map(s => {
      if (!s || typeof s.id !== 'string' || !s.id.trim()) throw new TypeError('Espécie exige id textual.');
      if (!s.genetics || String(s.genetics.speciesId) !== s.id) throw new Error(`Pool genético deve pertencer à espécie ${s.id}.`);
      const populations = {};
      for (const id of habitatIds) populations[id] = integer((s.populations || {})[id] ?? 0, `${s.id}.${id}.population`);
      for (const id of Object.keys(s.populations || {})) if (!habitatIds.has(id)) throw new Error(`Espécie ${s.id} referencia habitat inexistente: ${id}`);
      const genetic = clone(s.genetics);
      if (genetic.tick !== (config.tick ?? 0)) throw new RangeError(`Tick genético incompatível para ${s.id}.`);
      const geneticById = new Map(genetic.habitats.map(h=>[h.id,h]));
      if (geneticById.size !== habitats.length) throw new Error(`Habitats genéticos incompatíveis para ${s.id}.`);
      for (const id of habitatIds) if (!geneticById.has(id) || geneticById.get(id).population !== populations[id]) throw new Error(`População genética incompatível em ${s.id}/${id}.`);
      return { id:s.id, name:s.name == null ? null : String(s.name), lineageId:String(s.lineageId || `lineage-${s.id}`), populations,
        resourceUse:finite(s.resourceUse ?? 0.01, `${s.id}.resourceUse`, 0.000001), reproductionRate:finite(s.reproductionRate ?? 0.2, `${s.id}.reproductionRate`, 0, 1),
        mortalityRate:finite(s.mortalityRate ?? 0.05, `${s.id}.mortalityRate`, 0, 1), shortageMortality:finite(s.shortageMortality ?? 0.5, `${s.id}.shortageMortality`, 0, 1), genetics:genetic };
    }).sort((a,b)=>a.id.localeCompare(b.id));
    if (new Set(species.map(s=>s.id)).size !== species.length) throw new Error('IDs de espécie duplicados.');
    if (new Set(species.map(s=>s.lineageId)).size !== species.length) throw new Error('v0.1 exige uma linhagem exclusiva por espécie.');
    const tick=integer(config.tick ?? 0,'tick');
    if(lineages.tick!==tick) throw new RangeError('Ecossistema e linhagens devem iniciar no mesmo tick.');
    if(lineages.species.length!==species.length || lineages.lineages.length!==species.length) throw new Error('O registro deve conter uma espécie e uma linhagem por população ecológica.');
    for(const s of species){
      const lin=lineages.lineages.find(x=>x.id===s.lineageId), sp=lineages.species.find(x=>x.id===s.id), pop=lineages.populations.find(x=>x.lineageId===s.lineageId);
      if(!lin||!sp||lin.speciesId!==s.id||!pop) throw new Error(`Identidade/linhagem ausente para ${s.id}.`);
      for(const h of habitats) if((pop.byHabitat[h.id]||0)!==s.populations[h.id]) throw new Error(`População de linhagem incompatível em ${s.id}/${h.id}.`);
    }
    return { version:VERSION, tick, seed:(Number(config.seed ?? 1)>>>0)||1, rngState:(Number(config.seed ?? 1)>>>0)||1, habitats, species, lineages, events:[] };
  }
  function validateEcosystem(state) {
    if (!state || state.version!==VERSION || !Array.isArray(state.habitats) || !Array.isArray(state.species) || !state.lineages) throw new TypeError('Estado multiespécie incompatível.');
    const ids = new Set(state.habitats.map(h=>h.id));
    if (ids.size!==state.habitats.length) throw new Error('Habitats duplicados.');
    Lineages.validateState(state.lineages);
    if(state.lineages.tick!==state.tick) throw new Error('Tick do registro de linhagens dessincronizado.');
    const speciesIds = new Set(), lineageIds = new Set();
    for (const s of state.species) {
      if (speciesIds.has(s.id) || lineageIds.has(s.lineageId)) throw new Error('Identidade de espécie/linhagem duplicada.');
      speciesIds.add(s.id); lineageIds.add(s.lineageId);
      if (s.genetics.tick!==state.tick || s.genetics.speciesId!==s.id) throw new Error(`Genética dessincronizada para ${s.id}.`);
      const genes = new Map(s.genetics.habitats.map(h=>[h.id,h]));
      for (const h of state.habitats) if (!genes.has(h.id) || genes.get(h.id).population!==s.populations[h.id]) throw new Error(`População genética dessincronizada em ${s.id}/${h.id}.`);
      for (const id of Object.keys(s.populations)) if (!ids.has(id)) throw new Error(`Habitat inexistente em ${s.id}: ${id}`);
      const lp=state.lineages.populations.find(p=>p.lineageId===s.lineageId);
      if(!lp) throw new Error(`População de linhagem ausente: ${s.lineageId}`);
      for(const id of ids) if((lp.byHabitat[id]||0)!==(s.populations[id]||0)) throw new Error(`População de linhagem dessincronizada em ${s.id}/${id}.`);
    }
    return true;
  }
  function step(state) {
    validateEcosystem(state);
    const rng = new Random(state.rngState);
    const habitats = state.habitats.map(h=>({ ...h, neighbors:[...h.neighbors], resources:Math.min(h.maxResources,h.resources+h.regeneration) }));
    const species = clone(state.species), events=[], diagnostics=[];
    for (const habitat of habitats) {
      const members=species.map(s=>({ species:s, population:s.populations[habitat.id]||0, demand:(s.populations[habitat.id]||0)*s.resourceUse })).filter(x=>x.population>0);
      const demand=members.reduce((sum,x)=>sum+x.demand,0), available=habitat.resources*habitat.resourceUnit;
      const satisfaction=demand>0?Math.min(1,available/demand):1, consumed=Math.min(available,demand);
      habitat.resources=Math.max(0,habitat.resources-consumed/habitat.resourceUnit);
      diagnostics.push({ habitatId:habitat.id, demand, available, consumed, satisfaction });
      for (const member of members) {
        const s=member.species, old=member.population;
        const births=rng.round(old*s.reproductionRate*satisfaction);
        const deaths=Math.min(old,rng.round(old*(s.mortalityRate+s.shortageMortality*(1-satisfaction))));
        s.populations[habitat.id]=Math.max(0,old+births-deaths);
        if(births) events.push({type:'ecosystem.births',tick:state.tick,speciesId:s.id,habitatId:habitat.id,count:births});
        if(deaths) events.push({type:'ecosystem.deaths',tick:state.tick,speciesId:s.id,habitatId:habitat.id,count:deaths});
        if(old>0 && s.populations[habitat.id]===0) events.push({type:'ecosystem.local_extinction',tick:state.tick,speciesId:s.id,habitatId:habitat.id});
      }
    }
    for (const s of species) {
      const populations={...s.populations}, previousTotal=Object.values(s.populations).reduce((a,b)=>a+b,0);
      s.genetics=Genetics.step(s.genetics,{populations});
      const total=Object.values(populations).reduce((a,b)=>a+b,0);
      if(total===0 && previousTotal>0) events.push({type:'ecosystem.species_extinct',tick:state.tick,speciesId:s.id,lineageId:s.lineageId});
    }
    const nextTick=state.tick+1;
    const nextLineages=Lineages.step(state.lineages,{populationUpdates:species.map(s=>({lineageId:s.lineageId,byHabitat:{...s.populations}}))});
    const next={...state,tick:nextTick,rngState:rng.state,habitats,species,lineages:nextLineages,events:[...state.events,...events],lastDiagnostics:diagnostics};
    validateEcosystem(next);
    return next;
  }
  function summary(state) {
    validateEcosystem(state);
    return {tick:state.tick,totalPopulation:state.species.reduce((sum,s)=>sum+Object.values(s.populations).reduce((a,b)=>a+b,0),0),
      habitats:state.habitats.map(h=>({id:h.id,resources:h.resources,maxResources:h.maxResources})),
      species:state.species.map(s=>({id:s.id,name:s.name,lineageId:s.lineageId,totalPopulation:Object.values(s.populations).reduce((a,b)=>a+b,0),populations:{...s.populations},geneticFrequencies:Genetics.frequencies(s.genetics)})),
      events:state.events.filter(e=>e.tick===state.tick-1), lineageEvents:state.lineages.events.filter(e=>e.tick===state.tick), diagnostics:clone(state.lastDiagnostics||[])};
  }
  return {VERSION,createEcosystem,step,summary,validateEcosystem};
});
