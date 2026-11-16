const assert = require('node:assert/strict');
const Population = require('./population-dynamics.js');
const Genetics = require('./genetic-dynamics.js');
const Lineages = require('./lineage-dynamics.js');
const Integrated = require('./integrated-evolution.js');
const tests = [];
function test(name, fn) { fn(); tests.push(name); }
function baseConfig(options = {}) {
  const ecology = Population.createWorld({
    seed: 21, speciesId: 'species-fox', migrationRate: 0,
    habitats: [
      { id: 'forest', population: 20, carryingCapacity: 30, resources: 1, resourceRegeneration: 0, reproductionRate: 0, mortalityRate: 0, neighbors: [] },
      { id: 'island', population: 20, carryingCapacity: 30, resources: 1, resourceRegeneration: 0, reproductionRate: 0, mortalityRate: 0, neighbors: [] }
    ]
  });
  const genetics = Genetics.createState({
    seed: 31, speciesId: 'species-fox',
    mutationRate: options.mutationRate ?? 0,
    habitats: [
      { id: 'forest', population: 20, alleleCounts: { coat: { A: 40, a: 0 } } },
      { id: 'island', population: 20, alleleCounts: { coat: { A: 0, a: 40 } } }
    ]
  });
  const lineages = Lineages.createState({
    tick: 0,
    species: [{ id: 'species-fox', name: 'Fox' }],
    lineages: [{ id: 'lineage-fox-main', speciesId: 'species-fox' }],
    populations: [{ lineageId: 'lineage-fox-main', byHabitat: { forest: 20, island: 20 } }],
    speciation: {
      geneticDivergenceThreshold: options.threshold ?? 0.2,
      minIsolatedPopulation: options.minPopulation ?? 5,
      minIsolationTicks: options.minTicks ?? 2
    }
  });
  return { ecology, genetics, lineages };
}
test('creates a synchronized three-module simulation', () => {
  const state = Integrated.createSimulation(baseConfig());
  assert.equal(state.tick, 0);
  assert.equal(Integrated.validateSimulation(state), true);
});
test('one integrated tick advances ecology, genetics and lineages together', () => {
  const next = Integrated.step(Integrated.createSimulation(baseConfig()));
  assert.equal(next.tick, 1);
  assert.equal(next.ecology.tick, 1);
  assert.equal(next.genetics.tick, 1);
  assert.equal(next.lineages.tick, 1);
});
test('derives divergence from allele frequencies rather than a caller-provided value', () => {
  const next = Integrated.step(Integrated.createSimulation(baseConfig({ threshold: 0.1 })));
  assert(next.lastDiagnostics.geneticDivergence > 0.9);
  assert.equal(next.lastDiagnostics.isolatedHabitatId, 'forest');
});
test('speciation waits for configured consecutive integrated ticks', () => {
  const config = baseConfig({ threshold: 0.2, minTicks: 2 });
  const first = Integrated.step(Integrated.createSimulation(config));
  assert.equal(first.status, 'running');
  assert.equal(first.lineages.species.length, 1);
  const second = Integrated.step(first);
  assert.equal(second.status, 'species_partition_required');
  assert.equal(second.lineages.species.length, 2);
  assert.equal(second.lastDiagnostics.speciationOccurred, true);
});
test('stops safely after speciation until multi-species partitioning is implemented', () => {
  const config = baseConfig({ threshold: 0.2, minTicks: 1 });
  const split = Integrated.step(Integrated.createSimulation(config));
  assert.equal(split.status, 'species_partition_required');
  assert.throws(() => Integrated.step(split), /não pode avançar/);
});
test('conserves total population during a lineage split', () => {
  const split = Integrated.step(Integrated.createSimulation(baseConfig({ threshold: 0.2, minTicks: 1 })));
  assert.equal(split.ecology.habitats.reduce((sum, h) => sum + h.population, 0), 40);
  assert.equal(split.lineages.populations.reduce((sum, p) => sum + Object.values(p.byHabitat).reduce((a,b)=>a+b,0), 0), 40);
});
test('derives zero divergence when habitats have identical allele frequencies', () => {
  const config = baseConfig();
  config.genetics.habitats[0].alleleCounts.coat = { A: 20, a: 20 };
  config.genetics.habitats[1].alleleCounts.coat = { A: 20, a: 20 };
  const state = Integrated.createSimulation(config);
  const next = Integrated.step(state);
  assert.equal(next.lastDiagnostics.geneticDivergence, null);
  assert.equal(next.lineages.lineages[0].isolationTicks, 0);
});
test('does not treat adjacent occupied habitats as geographically isolated', () => {
  const config = baseConfig();
  config.ecology.habitats.find(h => h.id === 'forest').neighbors = ['island'];
  config.ecology.habitats.find(h => h.id === 'island').neighbors = ['forest'];
  const next = Integrated.step(Integrated.createSimulation(config));
  assert.equal(next.lastDiagnostics.geneticDivergence, null);
});
test('extinction is synchronized and recorded in lineage history', () => {
  const config = baseConfig();
  for (const habitat of config.ecology.habitats) {
    habitat.resources = 0;
    habitat.resourceRegeneration = 0;
    habitat.mortalityRate = 1;
  }
  const state = Integrated.createSimulation(config);
  const next = Integrated.step(state);
  assert.equal(next.status, 'extinct');
  assert(next.lineages.events.some(event => event.type === 'lineage.extinct'));
  assert(next.lineages.events.some(event => event.type === 'species.extinct'));
});
test('rejects tick mismatch before starting', () => {
  const config = baseConfig();
  config.genetics.tick = 2;
  assert.throws(() => Integrated.createSimulation(config), /mesmo tick/);
});
test('rejects species identity mismatch', () => {
  const config = baseConfig();
  config.genetics.speciesId = 'species-other';
  assert.throws(() => Integrated.createSimulation(config), /identidade de espécie/);
});
test('rejects habitat population mismatch across subsystems', () => {
  const config = baseConfig();
  config.genetics.habitats[0].population++;
  assert.throws(() => Integrated.createSimulation(config), /População genética desatualizada/);
});
test('rejects multiple species until explicit partitioning support exists', () => {
  const config = baseConfig();
  config.lineages.species.push({ id: 'species-other' });
  assert.throws(() => Integrated.createSimulation(config), /exatamente uma espécie/);
});
test('does not mutate the input simulation when stepping', () => {
  const state = Integrated.createSimulation(baseConfig());
  const before = structuredClone(state);
  Integrated.step(state);
  assert.deepEqual(state, before);
});
test('summary exposes population, genetic frequencies and evolutionary events', () => {
  const next = Integrated.step(Integrated.createSimulation(baseConfig({ threshold: 0.2, minTicks: 1 })));
  const view = Integrated.summary(next);
  assert.equal(view.tick, 1);
  assert.equal(view.totalPopulation, 40);
  assert.equal(view.species.length, 2);
  assert.equal(view.events.some(event => event.type === 'speciation'), true);
});
console.log(tests.length + ' testes Integrated Evolution aprovados:');
tests.forEach(name => console.log('✓ ' + name));
