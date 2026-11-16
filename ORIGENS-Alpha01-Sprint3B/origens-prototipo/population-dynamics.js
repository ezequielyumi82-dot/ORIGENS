/* ORIGENS — Population Dynamics v0.1
 * Deterministic habitat-level population model for the Alpha prototype.
 * This is an experimental aggregate model, not the authoritative C# engine.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ORIGENSPopulationDynamics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 1;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const finite = (value, name, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < min || n > max) throw new RangeError(`${name} fora do intervalo permitido.`);
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
    stochasticRound(value) {
      const whole = Math.floor(value);
      return whole + (this.next() < value - whole ? 1 : 0);
    }
  }
  function normalizeHabitat(input) {
    if (!input || typeof input.id !== 'string' || !input.id.trim()) throw new TypeError('Habitat exige id textual.');
    const neighbors = Array.isArray(input.neighbors) ? [...new Set(input.neighbors.map(String))].sort() : [];
    return {
      id: input.id,
      population: Math.floor(finite(input.population ?? 0, 'population')),
      carryingCapacity: Math.floor(finite(input.carryingCapacity ?? 0, 'carryingCapacity')),
      resources: finite(input.resources ?? 1, 'resources', 0, 1),
      resourceRegeneration: finite(input.resourceRegeneration ?? 0.02, 'resourceRegeneration', 0, 1),
      reproductionRate: finite(input.reproductionRate ?? 0.2, 'reproductionRate', 0, 1),
      mortalityRate: finite(input.mortalityRate ?? 0.05, 'mortalityRate', 0, 1),
      neighbors
    };
  }
  function createWorld(config = {}) {
    if (!Array.isArray(config.habitats) || config.habitats.length === 0) throw new TypeError('Informe ao menos um habitat.');
    const habitats = config.habitats.map(normalizeHabitat).sort((a, b) => a.id.localeCompare(b.id));
    const ids = new Set();
    for (const habitat of habitats) {
      if (ids.has(habitat.id)) throw new Error(`Habitat duplicado: ${habitat.id}`);
      ids.add(habitat.id);
    }
    for (const habitat of habitats) for (const neighbor of habitat.neighbors) {
      if (!ids.has(neighbor)) throw new Error(`Habitat vizinho inexistente: ${neighbor}`);
    }
    const seed = (Number(config.seed ?? 1) >>> 0) || 1;
    return {
      version: VERSION, tick: 0, seed, rngState: seed,
      speciesId: String(config.speciesId ?? 'species-1'),
      globalExtinct: habitats.every(h => h.population === 0),
      migrationRate: finite(config.migrationRate ?? 0.15, 'migrationRate', 0, 1),
      recolonizationResourceThreshold: finite(config.recolonizationResourceThreshold ?? 0.5, 'recolonizationResourceThreshold', 0, 1),
      habitats, events: []
    };
  }
  function step(world) {
    if (!world || world.version !== VERSION || !Array.isArray(world.habitats)) throw new TypeError('Estado de população incompatível.');
    const random = new Random(world.rngState);
    const previousTotal = world.habitats.reduce((sum, h) => sum + h.population, 0);
    const originalPopulations = new Map(world.habitats.map(h => [h.id, h.population]));
    const events = [];
    const habitats = world.habitats.map(source => {
      const h = { ...source, neighbors: [...source.neighbors] };
      h.resources = clamp(h.resources + h.resourceRegeneration * (1 - h.resources), 0, 1);
      const effectiveCapacity = Math.floor(h.carryingCapacity * h.resources);
      const density = effectiveCapacity > 0 ? h.population / effectiveCapacity : (h.population > 0 ? 2 : 0);
      const pressure = Math.max(0, density - 1);
      const birthExpectation = h.population * h.reproductionRate * h.resources * Math.max(0, 1 - density);
      const deathExpectation = h.population * h.mortalityRate * (1 + pressure + (1 - h.resources));
      const births = Math.min(Math.max(0, effectiveCapacity - h.population), random.stochasticRound(birthExpectation));
      const deaths = Math.min(h.population, random.stochasticRound(deathExpectation));
      h.population = Math.max(0, h.population + births - deaths);
      if (births) events.push({ type: 'population.births', tick: world.tick, habitatId: h.id, count: births });
      if (deaths) events.push({ type: 'population.deaths', tick: world.tick, habitatId: h.id, count: deaths });
      if (originalPopulations.get(h.id) > 0 && h.population === 0) events.push({ type: 'population.local_extinction', tick: world.tick, habitatId: h.id, speciesId: world.speciesId });
      return h;
    });
    // Recolonization is possible only from a surviving neighboring refuge.
    for (const target of habitats) {
      if (originalPopulations.get(target.id) !== 0 || target.population !== 0 || target.resources < world.recolonizationResourceThreshold) continue;
      const sources = target.neighbors.map(id => habitats.find(h => h.id === id)).filter(h => h && h.population > 1).sort((a, b) => a.id.localeCompare(b.id));
      if (sources.length && random.next() < world.migrationRate) {
        const source = sources[0];
        source.population -= 1; target.population += 1;
        events.push({ type: 'population.recolonized', tick: world.tick, habitatId: target.id, sourceHabitatId: source.id, count: 1 });
      }
    }
    const total = habitats.reduce((sum, h) => sum + h.population, 0);
    if (previousTotal > 0 && total === 0) events.push({ type: 'population.global_extinction', tick: world.tick, speciesId: world.speciesId });
    return { ...world, tick: world.tick + 1, rngState: random.state, globalExtinct: total === 0, habitats, events: [...world.events, ...events] };
  }
  function diversity(alleleCounts) {
    if (!alleleCounts || typeof alleleCounts !== 'object' || Array.isArray(alleleCounts)) throw new TypeError('alleleCounts deve ser um objeto por locus.');
    const loci = Object.entries(alleleCounts).sort(([a], [b]) => a.localeCompare(b));
    if (!loci.length) return { loci: 0, allelicRichness: 0, meanHeterozygosity: 0, meanShannonEntropy: 0 };
    let richness = 0, heterozygosity = 0, entropy = 0, measured = 0;
    for (const [, counts] of loci) {
      if (!counts || typeof counts !== 'object' || Array.isArray(counts)) throw new TypeError('Contagem de alelos inválida.');
      const values = Object.values(counts).map(v => finite(v, 'allele count'));
      const total = values.reduce((sum, value) => sum + value, 0);
      if (total === 0) continue;
      const frequencies = values.filter(v => v > 0).map(v => v / total);
      richness += frequencies.length;
      heterozygosity += 1 - frequencies.reduce((sum, p) => sum + p * p, 0);
      entropy += -frequencies.reduce((sum, p) => sum + p * Math.log(p), 0);
      measured++;
    }
    return {
      loci: measured, allelicRichness: measured ? richness / measured : 0,
      meanHeterozygosity: measured ? heterozygosity / measured : 0,
      meanShannonEntropy: measured ? entropy / measured : 0
    };
  }
  return { VERSION, createWorld, step, diversity };
});
