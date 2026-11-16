const assert = require('node:assert/strict');
const Lineages = require('./lineage-dynamics.js');
const tests = [];
function testCase(name, fn) { fn(); tests.push(name); }
function initial() {
  return Lineages.createState({
    tick: 0,
    species: [{ id: 'species-fox', name: 'Fox' }],
    lineages: [{ id: 'lineage-fox-main', speciesId: 'species-fox' }],
    populations: [{ lineageId: 'lineage-fox-main', byHabitat: { forest: 30, valley: 20 } }],
    speciation: { geneticDivergenceThreshold: 0.3, minIsolatedPopulation: 5, minIsolationTicks: 2 }
  });
}
function observation(overrides = {}) {
  return {
    lineageId: 'lineage-fox-main', geneticDivergence: 0.5,
    isolatedPopulation: 8, splitByHabitat: { forest: 6 }, ...overrides
  };
}
testCase('creates a validated registry with persistent species and lineage identity', () => {
  const state = initial();
  assert.equal(state.species[0].id, 'species-fox');
  assert.equal(state.lineages[0].speciesId, 'species-fox');
  assert.equal(Lineages.validateState(state), true);
});
testCase('rejects duplicate identities and unknown species references', () => {
  assert.throws(() => Lineages.createState({ species: [{ id: 's' }, { id: 's' }], lineages: [{ id: 'l', speciesId: 's' }] }), /duplicados/);
  assert.throws(() => Lineages.createState({ species: [{ id: 's' }], lineages: [{ id: 'l', speciesId: 'missing' }] }), /inexistente/);
});
testCase('does not create a species below the genetic divergence threshold', () => {
  const next = Lineages.step(initial(), { observations: [observation({ geneticDivergence: 0.2 })] });
  assert.equal(next.species.length, 1);
  assert.equal(next.lineages.length, 1);
  assert.equal(next.lineages[0].isolationTicks, 0);
});
testCase('requires consecutive qualifying ticks before speciation', () => {
  const first = Lineages.step(initial(), { observations: [observation()] });
  assert.equal(first.species.length, 1);
  assert.equal(first.lineages[0].isolationTicks, 1);
  const second = Lineages.step(first, { observations: [observation()] });
  assert.equal(second.species.length, 2);
  assert.equal(second.lineages.length, 2);
  assert.equal(second.events.at(-1).type, 'speciation');
});
testCase('deterministically creates child identities and ancestry', () => {
  const a1 = Lineages.step(initial(), { observations: [observation()] });
  const a2 = Lineages.step(a1, { observations: [observation()] });
  const b1 = Lineages.step(initial(), { observations: [observation()] });
  const b2 = Lineages.step(b1, { observations: [observation()] });
  assert.deepEqual(a2, b2);
  const child = a2.lineages.find(item => item.parentLineageId === 'lineage-fox-main');
  assert(child);
  assert.equal(a2.species.find(item => item.id === child.speciesId).parentSpeciesId, 'species-fox');
});
testCase('splits population without creating or losing individuals', () => {
  const first = Lineages.step(initial(), { observations: [observation()] });
  const second = Lineages.step(first, { observations: [observation()] });
  const counts = second.populations.reduce((sum, item) => sum + Object.values(item.byHabitat).reduce((a,b)=>a+b,0), 0);
  assert.equal(counts, 50);
  const parent = second.populations.find(item => item.lineageId === 'lineage-fox-main');
  const child = second.populations.find(item => item.lineageId !== 'lineage-fox-main');
  assert.equal(parent.byHabitat.forest, 24);
  assert.equal(child.byHabitat.forest, 6);
});
testCase('resets isolation duration when a criterion fails', () => {
  const first = Lineages.step(initial(), { observations: [observation()] });
  const second = Lineages.step(first, { observations: [observation({ isolatedPopulation: 2 })] });
  assert.equal(second.lineages[0].isolationTicks, 0);
  assert.equal(second.species.length, 1);
});
testCase('preserves extinct lineage and species history', () => {
  const next = Lineages.step(initial(), { populationUpdates: [{ lineageId: 'lineage-fox-main', byHabitat: { forest: 0, valley: 0 } }] });
  assert.equal(next.lineages[0].status, 'extinct');
  assert.equal(next.lineages[0].extinctionTick, 1);
  assert.equal(next.species[0].status, 'extinct');
  assert.equal(next.events.some(event => event.type === 'lineage.extinct'), true);
  assert.equal(next.events.some(event => event.type === 'species.extinct'), true);
  assert.equal(Lineages.history(next).lineages.length, 1);
});
testCase('does not erase an extinct lineage when another lineage remains active', () => {
  const state = Lineages.createState({
    species: [{ id: 's' }],
    lineages: [{ id: 'l1', speciesId: 's' }, { id: 'l2', speciesId: 's' }],
    populations: [{ lineageId: 'l1', byHabitat: { forest: 3 } }, { lineageId: 'l2', byHabitat: { forest: 2 } }]
  });
  const next = Lineages.step(state, { populationUpdates: [{ lineageId: 'l1', byHabitat: {} }] });
  assert.equal(next.lineages.find(item => item.id === 'l1').status, 'extinct');
  assert.equal(next.species[0].status, 'active');
});
testCase('rejects a split larger than the parent population', () => {
  const first = Lineages.step(initial(), { observations: [observation({ splitByHabitat: { forest: 6 } })] });
  assert.throws(() => Lineages.step(first, { observations: [observation({ splitByHabitat: { forest: 100 } })] }), /excede/);
});
testCase('rejects duplicate observations and invalid population counts', () => {
  assert.throws(() => Lineages.step(initial(), { observations: [observation(), observation()] }), /duplicada/);
  assert.throws(() => Lineages.step(initial(), { populationUpdates: [{ lineageId: 'lineage-fox-main', byHabitat: { forest: -1 } }] }), RangeError);
});
console.log(tests.length + ' testes Lineage Dynamics aprovados:');
tests.forEach(name => console.log('✓ ' + name));
