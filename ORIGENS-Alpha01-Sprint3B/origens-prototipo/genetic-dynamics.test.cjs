const assert = require('node:assert/strict');
const Genetics = require('./genetic-dynamics.js');
const tests = [];
function testCase(name, fn) { fn(); tests.push(name); }
const seed = () => Genetics.createState({ seed: 71, habitats: [
  { id: 'a', population: 40, alleleCounts: { coat: { A: 40, a: 40 } } },
  { id: 'b', population: 20, alleleCounts: { coat: { A: 40, a: 0 } } }
] });
testCase('validates diploid allele-copy totals', () => assert.throws(() => Genetics.createState({ habitats: [{ id: 'a', population: 2, alleleCounts: { x: { A: 3 } } }] }), RangeError));
testCase('same seed and state produce identical genetic evolution', () => assert.deepEqual(Genetics.step(seed()), Genetics.step(seed())));
testCase('genetic drift preserves total allele copies', () => { const next = Genetics.step(seed()); for (const h of next.habitats) assert.equal(Object.values(h.alleleCounts.coat).reduce((a,b)=>a+b,0), h.population*2); });
testCase('finite-population drift can change allele counts', () => { const next = Genetics.step(seed()); assert.notDeepEqual(next.habitats[0].alleleCounts.coat, seed().habitats[0].alleleCounts.coat); });
testCase('mutation can introduce a previously absent allele', () => { const s = Genetics.createState({ seed: 4, mutationRate: 1, habitats: [{ id: 'a', population: 20, alleleCounts: { coat: { A: 40, a: 0 } } }] }); const next = Genetics.step(s); assert.equal(next.habitats[0].alleleCounts.coat.A, 0); assert.equal(next.habitats[0].alleleCounts.coat.a, 40); });
testCase('selection favors an allele with higher fitness in repeated sampling', () => { const s = Genetics.createState({ seed: 9, selection: { coat: { A: 8, a: 1 } }, habitats: [{ id: 'a', population: 500, alleleCounts: { coat: { A: 500, a: 500 } } }] }); const next = Genetics.step(s); assert(next.habitats[0].alleleCounts.coat.A > 500); });
testCase('migration transfers allele copies and conserves global totals', () => { const s = seed(); const baseline = Genetics.step(s); const next = Genetics.step(s, { populations: { a: 37, b: 23 }, migrations: [{ sourceHabitatId: 'a', targetHabitatId: 'b', individuals: 3 }] }); assert.equal(next.habitats.find(h=>h.id==='a').population,37); assert.equal(next.habitats.find(h=>h.id==='b').population,23); const after = ['A','a'].map(a => next.habitats.reduce((n,h)=>n+h.alleleCounts.coat[a],0)); assert.deepEqual(after, ['A','a'].map(a => baseline.habitats.reduce((n,h)=>n+h.alleleCounts.coat[a],0))); });
testCase('demographic population changes resize the gene pool', () => { const next = Genetics.step(seed(), { populations: { a: 25, b: 10 } }); assert.equal(next.habitats.find(h=>h.id==='a').alleleCounts.coat.A + next.habitats.find(h=>h.id==='a').alleleCounts.coat.a,50); });
testCase('migration changes local frequencies while retaining the global gene pool', () => { const s = Genetics.createState({ seed: 2, habitats: [{ id:'source', population:10, alleleCounts:{ coat:{ A:20, a:0 } } }, { id:'sink', population:10, alleleCounts:{ coat:{ A:0, a:20 } } }] }); const baseline = Genetics.step(s); const migrated = Genetics.step(s, { populations:{ source:5, sink:15 }, migrations:[{ sourceHabitatId:'source', targetHabitatId:'sink', individuals:5 }] }); assert(migrated.habitats.find(h=>h.id==='sink').alleleCounts.coat.A > baseline.habitats.find(h=>h.id==='sink').alleleCounts.coat.A); });
testCase('frequency report is normalized', () => { const f = Genetics.frequencies(seed()); assert.equal(f.a.coat.A + f.a.coat.a,1); });
testCase('rejects migration that exceeds available population', () => assert.throws(() => Genetics.step(seed(), { migrations: [{ sourceHabitatId:'a', targetHabitatId:'b', individuals:100 }] }), RangeError));

testCase('ecology adapter transfers genes during recolonization', () => {
  const ecology = require('./population-dynamics.js');
  const previous = ecology.createWorld({ seed: 3, speciesId: 'fox', migrationRate: 1, habitats: [
    { id:'refuge', population:20, carryingCapacity:20, resources:1, resourceRegeneration:0, reproductionRate:0, mortalityRate:0, neighbors:['empty'] },
    { id:'empty', population:0, carryingCapacity:10, resources:1, resourceRegeneration:0, reproductionRate:0, mortalityRate:0, neighbors:['refuge'] }
  ] });
  const genetics = Genetics.createState({ seed: 8, speciesId:'fox', habitats: [
    { id:'refuge', population:20, alleleCounts:{ coat:{ A:40, a:0 } } },
    { id:'empty', population:0, alleleCounts:{ coat:{ A:0, a:0 } } }
  ] });
  const nextEcology = ecology.step(previous);
  const nextGenetics = Genetics.stepWithEcology(genetics, previous, nextEcology);
  assert.equal(nextGenetics.habitats.find(h=>h.id==='empty').population,1);
  assert.equal(nextGenetics.habitats.find(h=>h.id==='empty').alleleCounts.coat.A,2);
  assert.equal(nextGenetics.habitats.find(h=>h.id==='refuge').population,19);
  assert.equal(nextGenetics.habitats.reduce((n,h)=>n+h.alleleCounts.coat.A,0),40);
});
testCase('ecology adapter synchronizes demographic population changes', () => {
  const ecology = require('./population-dynamics.js');
  const previous = ecology.createWorld({ seed: 12, speciesId:'lynx', habitats:[
    { id:'valley', population:10, carryingCapacity:10, resources:0, resourceRegeneration:0, reproductionRate:0, mortalityRate:0.5 }
  ]});
  const genetics = Genetics.createState({ seed:12, speciesId:'lynx', habitats:[
    { id:'valley', population:10, alleleCounts:{ coat:{ A:10, a:10 } } }
  ]});
  const nextEcology = ecology.step(previous);
  const nextGenetics = Genetics.stepWithEcology(genetics, previous, nextEcology);
  assert.equal(nextGenetics.habitats[0].population,nextEcology.habitats[0].population);
  assert.equal(Object.values(nextGenetics.habitats[0].alleleCounts.coat).reduce((a,b)=>a+b,0),nextGenetics.habitats[0].population*2);
});
testCase('ecology adapter rejects stale or mismatched ecological states', () => {
  const ecology = require('./population-dynamics.js');
  const previous = ecology.createWorld({ speciesId:'wolf', habitats:[{ id:'forest', population:2, carryingCapacity:2 }] });
  const genetics = Genetics.createState({ speciesId:'wolf', habitats:[{ id:'forest', population:2, alleleCounts:{ coat:{ A:2, a:2 } } }] });
  const next = ecology.step(previous);
  assert.throws(() => Genetics.stepWithEcology(genetics, previous, { ...next, tick: next.tick + 1 }), RangeError);
  assert.throws(() => Genetics.stepWithEcology({ ...genetics, speciesId:'bear' }, previous, next), /Identidade de espécie/);
});


test('partitions allele copies without replacement and conserves each locus',()=>{const state=Genetics.createState({seed:19,speciesId:'parent',habitats:[{id:'forest',population:10,alleleCounts:{coat:{A:12,a:8},size:{L:4,S:16}}}]});const split=Genetics.partitionState(state,{childSpeciesId:'child',childPopulations:{forest:4}});assert.equal(split.parentState.habitats[0].population,6);assert.equal(split.childState.habitats[0].population,4);for(const locus of ['coat','size']){const before=state.habitats[0].alleleCounts[locus],p=split.parentState.habitats[0].alleleCounts[locus],c=split.childState.habitats[0].alleleCounts[locus];for(const allele of Object.keys(before))assert.equal(p[allele]+c[allele],before[allele]);assert.equal(Object.values(p).reduce((a,b)=>a+b,0),12);assert.equal(Object.values(c).reduce((a,b)=>a+b,0),8);}});
test('genetic partition is deterministic and does not mutate the ancestral pool',()=>{const state=Genetics.createState({seed:31,speciesId:'parent',habitats:[{id:'forest',population:10,alleleCounts:{coat:{A:10,a:10}}}]});const before=structuredClone(state),a=Genetics.partitionState(state,{childSpeciesId:'child',childPopulations:{forest:3}}),b=Genetics.partitionState(state,{childSpeciesId:'child',childPopulations:{forest:3}});assert.deepEqual(a,b);assert.deepEqual(state,before);});
test('rejects a partition larger than the available habitat population',()=>{const state=Genetics.createState({speciesId:'parent',habitats:[{id:'forest',population:2,alleleCounts:{coat:{A:4}}}]});assert.throws(()=>Genetics.partitionState(state,{childSpeciesId:'child',childPopulations:{forest:3}}),/excede a população/);});

console.log(`${tests.length} testes Genetic Dynamics aprovados:`);
tests.forEach(name => console.log(`✓ ${name}`));
