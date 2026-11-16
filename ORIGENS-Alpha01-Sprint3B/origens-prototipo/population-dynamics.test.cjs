const assert = require('node:assert/strict');
const Population = require('./population-dynamics.js');
const tests = [];
function test(name, fn) { fn(); tests.push(name); }
const base = () => Population.createWorld({ seed: 42, speciesId: 'species-a', migrationRate: 1, habitats: [
  { id: 'reef', population: 20, carryingCapacity: 20, resources: 1, resourceRegeneration: 0, reproductionRate: 0, mortalityRate: 0, neighbors: ['lagoon'] },
  { id: 'lagoon', population: 0, carryingCapacity: 10, resources: 1, resourceRegeneration: 0, reproductionRate: 0, mortalityRate: 0, neighbors: ['reef'] }
] });
test('world creation validates and orders habitats', () => { const w = base(); assert.deepEqual(w.habitats.map(h => h.id), ['lagoon', 'reef']); assert.equal(w.tick, 0); });
test('same seed and state produce identical next state', () => { const a = Population.step(base()), b = Population.step(base()); assert.deepEqual(a, b); });
test('resource recovery moves depleted habitat toward recovery', () => { const w = Population.createWorld({ habitats: [{ id: 'a', population: 0, carryingCapacity: 10, resources: 0, resourceRegeneration: .25 }] }); const next = Population.step(w); assert.equal(next.habitats[0].resources, .25); });
test('population never exceeds effective carrying capacity through births', () => { const w = Population.createWorld({ seed: 2, habitats: [{ id: 'a', population: 9, carryingCapacity: 10, resources: 1, reproductionRate: 1, mortalityRate: 0, resourceRegeneration: 0 }] }); const next = Population.step(w); assert(next.habitats[0].population <= 10); });
test('local extinction is recorded while a neighboring refuge survives', () => { const w = Population.createWorld({ seed: 4, migrationRate: 0, habitats: [{ id: 'a', population: 1, carryingCapacity: 1, resources: 0, resourceRegeneration: 0, reproductionRate: 0, mortalityRate: 1 }, { id: 'b', population: 5, carryingCapacity: 5, resources: 1, resourceRegeneration: 0, reproductionRate: 0, mortalityRate: 0, neighbors: ['a'] }] }); const next = Population.step(w); assert(next.events.some(e => e.type === 'population.local_extinction' && e.habitatId === 'a')); assert.equal(next.globalExtinct, false); });
test('recolonization occurs from an adjacent surviving refuge', () => { const next = Population.step(base()); assert.equal(next.habitats.find(h => h.id === 'lagoon').population, 1); assert(next.events.some(e => e.type === 'population.recolonized')); });
test('global extinction is distinguished from local extinction', () => { const w = Population.createWorld({ habitats: [{ id: 'a', population: 1, carryingCapacity: 1, resources: 0, resourceRegeneration: 0, reproductionRate: 0, mortalityRate: 1 }] }); const next = Population.step(w); assert.equal(next.globalExtinct, true); assert(next.events.some(e => e.type === 'population.global_extinction')); });
test('diversity metrics reflect allele frequencies', () => { const d = Population.diversity({ coat: { A: 10, a: 10 }, size: { S: 20 } }); assert.equal(d.loci, 2); assert.equal(d.allelicRichness, 1.5); assert.equal(d.meanHeterozygosity, .25); assert(d.meanShannonEntropy > 0); });
test('empty diversity data returns neutral metrics', () => { assert.deepEqual(Population.diversity({}), { loci: 0, allelicRichness: 0, meanHeterozygosity: 0, meanShannonEntropy: 0 }); });
test('recolonization requires positive effective carrying capacity', () => { const w = Population.createWorld({ seed: 42, migrationRate: 1, habitats: [{ id: 'source', population: 5, carryingCapacity: 5, resources: 1, resourceRegeneration: 0, reproductionRate: 0, mortalityRate: 0, neighbors: ['sink'] }, { id: 'sink', population: 0, carryingCapacity: 0, resources: 1, resourceRegeneration: 0, neighbors: ['source'] }] }); const next = Population.step(w); assert.equal(next.habitats.find(h => h.id === 'sink').population, 0); });
test('allele counts must be whole non-negative numbers', () => { assert.throws(() => Population.diversity({ locus: { A: 1.5 } }), RangeError); });
console.log(`${tests.length} testes Population Dynamics aprovados:`);
tests.forEach(name => console.log(`✓ ${name}`));
