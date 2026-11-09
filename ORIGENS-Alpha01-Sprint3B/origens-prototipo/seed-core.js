/* ORIGENS — Núcleo Semente Alpha 0.1: eventos, relógios, aleatoriedade reproduzível e deltas. */
const SeedCore = (() => {
  class SeededRandom {
    constructor(seed=874562913) { this.setSeed(seed); }
    setSeed(seed) { this.state = (Number(seed) >>> 0) || 1; }
    next() { this.state = (this.state * 1664525 + 1013904223) >>> 0; return this.state / 4294967296; }
    range(min=0,max=1) { return min + this.next() * (max-min); }
    pick(items) { if (!items.length) return undefined; return items[Math.floor(this.next()*items.length)]; }
  }
  class EventBus {
    constructor(){this.handlers=new Map();}
    on(type,fn){const list=this.handlers.get(type)||[];list.push(fn);this.handlers.set(type,list);return()=>{const next=(this.handlers.get(type)||[]).filter(x=>x!==fn);if(next.length)this.handlers.set(type,next);else this.handlers.delete(type);};}
    emit(type,payload={}){(this.handlers.get(type)||[]).slice().forEach(fn=>fn(payload));}
    clear(){this.handlers.clear();}
  }
  class Clocks {
    constructor(){this.real=0;this.biological=0;this.geological=0;this.biologicalScale=1;this.geologicalScale=1;}
    tick(dt){const step=Math.max(0,Number(dt)||0);this.real+=step;this.biological+=step*this.biologicalScale;this.geological+=step*this.geologicalScale;return this;}
  }
  class DeltaSave {
    constructor(seed,version=1){this.seed=Number(seed)>>>0;this.version=version;this.delta={entities:{},events:[]};}
    set(id,changes){this.delta.entities[id]={...(this.delta.entities[id]||{}),...changes};}
    event(type,data={}){this.delta.events.push({type,data});}
    snapshot(){return JSON.stringify({version:this.version,seed:this.seed,delta:this.delta});}
    static restore(snapshot){const data=typeof snapshot==='string'?JSON.parse(snapshot):snapshot;if(!data||!Number.isFinite(data.seed)||!data.delta)throw new Error('SaveDelta inválido');const save=new DeltaSave(data.seed,data.version||1);save.delta=data.delta;return save;}
  }
  class WorldManager {
    constructor(seed=874562913){this.seed=Number(seed)>>>0;this.random=new SeededRandom(this.seed);this.events=new EventBus();this.clocks=new Clocks();this.save=new DeltaSave(this.seed);this.state={temperature:21,food:[],predators:[],organisms:[],records:[],lod:{near:0,mid:0,far:0},progress:{}};}
    start(){this.events.emit('WorldStarted',{seed:this.seed});}
    tick(dt){this.clocks.tick(dt);this.events.emit('WorldTick',{dt,clocks:this.clocks});}
    record(text){this.state.records.unshift(text);this.state.records=this.state.records.slice(0,8);this.save.event('LifeRecorded',{text});this.events.emit('LifeRecorded',{text});}
    commit(module,action,payload={}){this.state.progress[module]={...(this.state.progress[module]||{}),[action]:payload};this.save.set('progress.'+module,this.state.progress[module]);this.events.emit('ProgressChanged',{module,action,payload});}
    snapshot(){return {seed:this.seed,clocks:{real:this.clocks.real,biological:this.clocks.biological,geological:this.clocks.geological},state:this.state,delta:this.save.snapshot()};}
  }
  return {SeededRandom,EventBus,Clocks,DeltaSave,WorldManager};
})();
