const assert=require('node:assert/strict');
const Genetics=require('./genetic-dynamics.js');
const Lineages=require('./lineage-dynamics.js');
const Eco=require('./multi-species-ecosystem.js');
const tests=[]; function test(name,fn){fn();tests.push(name);}
function make(options={}){
 const population=options.population??20;
 const habitats=[{id:'forest',neighbors:[],resources:options.resources??1,maxResources:1,regeneration:0,resourceUnit:1}];
 const species=['grazer','browser'].map((id,i)=>({id,name:id,lineageId:`lineage-${id}`,populations:{forest:population},resourceUse:options.resourceUse??0.04,reproductionRate:options.reproductionRate??0,mortalityRate:options.mortalityRate??0,shortageMortality:options.shortageMortality??0.5,
 genetics:Genetics.createState({seed:10+i,speciesId:id,habitats:[{id:'forest',population,alleleCounts:{coat:{A:population*2,a:0}}}]})}));
 const lineages=Lineages.createState({tick:0,species:species.map(s=>({id:s.id,name:s.name})),lineages:species.map(s=>({id:s.lineageId,speciesId:s.id})),populations:species.map(s=>({lineageId:s.lineageId,byHabitat:{forest:s.populations.forest}}))});
 return Eco.createEcosystem({seed:77,habitats,species,lineages});
}
test('creates multiple species with separate genetic pools and one shared habitat',()=>{const s=make();assert.equal(s.species.length,2);assert.equal(s.habitats.length,1);assert.equal(s.lineages.lineages.length,2);assert.notEqual(s.species[0].genetics,s.species[1].genetics);});
test('resource availability is shared rather than duplicated per species',()=>{const s=Eco.step(make({population:20,resourceUse:0.04,resources:1}));assert.equal(s.lastDiagnostics[0].demand,1.6);assert.equal(s.lastDiagnostics[0].consumed,1);assert.equal(s.lastDiagnostics[0].satisfaction,0.625);assert.equal(s.habitats[0].resources,0);});
test('both species experience the same resource satisfaction in a habitat',()=>{const s=Eco.step(make({population:20,resourceUse:0.04,resources:1,reproductionRate:0.5,mortalityRate:0,shortageMortality:0}));assert(s.species.every(sp=>sp.populations.forest>=26&&sp.populations.forest<=27));});
test('each species genetic pool follows its own population',()=>{const s=Eco.step(make({population:20,resourceUse:0.01,reproductionRate:0.5}));for(const sp of s.species){assert.equal(sp.genetics.habitats[0].population,sp.populations.forest);assert.equal(Object.values(sp.genetics.habitats[0].alleleCounts.coat).reduce((a,b)=>a+b,0),sp.populations.forest*2);}});
test('species can go extinct without ending other species',()=>{let s=make({population:4,resources:0,resourceUse:1,mortalityRate:1,shortageMortality:0});const vulnerable=s.species.find(x=>x.id==='grazer'),survivor=s.species.find(x=>x.id==='browser');vulnerable.populations.forest=1;vulnerable.genetics.habitats[0].population=1;vulnerable.genetics.habitats[0].alleleCounts.coat={A:2,a:0};survivor.populations.forest=4;survivor.genetics.habitats[0].population=4;survivor.genetics.habitats[0].alleleCounts.coat={A:8,a:0};s.lineages.populations.find(p=>p.lineageId==='lineage-grazer').byHabitat.forest=1;s.lineages.populations.find(p=>p.lineageId==='lineage-browser').byHabitat.forest=4;s=Eco.step(s);assert.equal(s.species.find(x=>x.id==='grazer').populations.forest,0);assert(s.species.find(x=>x.id==='browser').populations.forest>=0);assert.equal(s.habitats.length,1);assert(s.lineages.events.some(e=>e.type==='lineage.extinct'&&e.lineageId==='lineage-grazer'));});
test('step is deterministic and does not mutate input',()=>{const a=make({resources:0.5});const before=structuredClone(a);const x=Eco.step(a),y=Eco.step(a);assert.deepEqual(x,y);assert.deepEqual(a,before);});
test('summary reports shared resources and species-specific populations',()=>{const v=Eco.summary(Eco.step(make()));assert.equal(v.species.length,2);assert.equal(v.habitats.length,1);assert.equal(v.tick,1);assert.equal(v.lineageEvents.length,0);});
test('synchronizes lineage populations and preserves species identity',()=>{const s=Eco.step(make({population:20,resourceUse:0.01,reproductionRate:0.2}));for(const sp of s.species){const p=s.lineages.populations.find(x=>x.lineageId===sp.lineageId);assert.equal(p.byHabitat.forest,sp.populations.forest);}});
test('rejects duplicated species lineage identity',()=>{const s=make();s.species[1].lineageId=s.species[0].lineageId;assert.throws(()=>Eco.createEcosystem(s),/linhagem exclusiva/);});
test('rejects inconsistent genetic population',()=>{const s=make();s.species[0].genetics.habitats[0].population++;assert.throws(()=>Eco.createEcosystem(s),/População genética incompatível/);});
console.log(`${tests.length} testes Multi-Species Ecosystem aprovados:`);tests.forEach(t=>console.log('✓ '+t));
