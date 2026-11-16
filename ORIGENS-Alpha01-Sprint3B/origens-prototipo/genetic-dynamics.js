/* ORIGENS — Genetic Dynamics v0.1
 * Deterministic, aggregate diploid population-genetics model.
 * Experimental module; not the authoritative C# engine.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ORIGENSGeneticDynamics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 1;
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
    pickIndex(weights) {
      const total = weights.reduce((a, b) => a + b, 0);
      if (!(total > 0)) throw new RangeError('Pesos de seleção devem somar valor positivo.');
      let r = this.next() * total;
      for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r < 0) return i; }
      return weights.length - 1;
    }
  }
  function normalizeCounts(counts, expected, label) {
    if (!counts || typeof counts !== 'object' || Array.isArray(counts) || Object.keys(counts).length === 0) throw new TypeError(`${label}: informe ao menos um alelo.`);
    const result = {};
    for (const allele of Object.keys(counts).sort()) {
      const count = finite(counts[allele], `${label}.${allele}`);
      if (!Number.isSafeInteger(count)) throw new RangeError('Contagens alélicas devem ser inteiras.');
      result[allele] = count;
    }
    const total = Object.values(result).reduce((a, b) => a + b, 0);
    if (total !== expected) throw new RangeError(`${label}: esperado ${expected} cópias alélicas, recebido ${total}.`);
    return result;
  }
  function normalizeHabitat(h) {
    if (!h || typeof h.id !== 'string' || !h.id.trim()) throw new TypeError('Habitat exige id textual.');
    const population = finite(h.population, `${h.id}.population`);
    if (!Number.isSafeInteger(population)) throw new RangeError('População deve ser inteira.');
    const alleleCounts = {};
    for (const locus of Object.keys(h.alleleCounts || {}).sort()) alleleCounts[locus] = normalizeCounts(h.alleleCounts[locus], population * 2, `${h.id}.${locus}`);
    return { id: h.id, population, alleleCounts };
  }
  function createState(config = {}) {
    if (!Array.isArray(config.habitats) || !config.habitats.length) throw new TypeError('Informe ao menos um habitat.');
    const habitats = config.habitats.map(normalizeHabitat).sort((a, b) => a.id.localeCompare(b.id));
    if (new Set(habitats.map(h => h.id)).size !== habitats.length) throw new Error('IDs de habitat duplicados.');
    return {
      version: VERSION, tick: 0, rngState: (Number(config.seed ?? 1) >>> 0) || 1,
      speciesId: String(config.speciesId ?? 'species-1'),
      mutationRate: finite(config.mutationRate ?? 0, 'mutationRate', 0, 1),
      selection: structuredClone(config.selection || {}), habitats
    };
  }
  function sampleCopies(counts, copies, fitness, mutationRate, random) {
    const alleles = Object.keys(counts).sort();
    const baseTotal = Object.values(counts).reduce((a, b) => a + b, 0);
    if (copies === 0) return Object.fromEntries(alleles.map(a => [a, 0]));
    if (baseTotal === 0) throw new RangeError('Não é possível evoluir um locus sem cópias ancestrais.');
    const weights = alleles.map(a => (counts[a] / baseTotal) * finite(fitness[a] ?? 1, `fitness.${a}`, 0));
    if (weights.reduce((a, b) => a + b, 0) <= 0) throw new RangeError('Todos os alelos possuem aptidão zero.');
    const result = Object.fromEntries(alleles.map(a => [a, 0]));
    for (let i = 0; i < copies; i++) {
      let chosen = random.pickIndex(weights);
      if (alleles.length > 1 && random.next() < mutationRate) {
        const alternatives = alleles.map((_, index) => index).filter(index => index !== chosen);
        chosen = alternatives[Math.floor(random.next() * alternatives.length)];
      }
      result[alleles[chosen]]++;
    }
    return result;
  }
  function drawWithoutReplacement(counts, copies, random) {
    const pool = { ...counts };
    const picked = Object.fromEntries(Object.keys(pool).map(a => [a, 0]));
    for (let i = 0; i < copies; i++) {
      const alleles = Object.keys(pool).sort();
      const index = random.pickIndex(alleles.map(a => pool[a]));
      const allele = alleles[index]; pool[allele]--; picked[allele]++;
    }
    return { remaining: pool, picked };
  }
  function step(state, options = {}) {
    if (!state || state.version !== VERSION || !Array.isArray(state.habitats)) throw new TypeError('Estado genético incompatível.');
    const random = new Random(state.rngState);
    const migrations = (options.migrations || []).map(m => {
      if (!m || typeof m.sourceHabitatId !== 'string' || typeof m.targetHabitatId !== 'string') throw new TypeError('Migração exige habitat de origem e destino.');
      const individuals = finite(m.individuals ?? 1, 'migration.individuals');
      if (!Number.isSafeInteger(individuals) || individuals < 1) throw new RangeError('Migrantes deve ser inteiro positivo.');
      return { sourceHabitatId: m.sourceHabitatId, targetHabitatId: m.targetHabitatId, individuals };
    });
    const populations = options.populations || Object.fromEntries(state.habitats.map(h => [h.id, h.population]));
    const incoming = {}, outgoing = {};
    for (const m of migrations) {
      outgoing[m.sourceHabitatId] = (outgoing[m.sourceHabitatId] || 0) + m.individuals;
      incoming[m.targetHabitatId] = (incoming[m.targetHabitatId] || 0) + m.individuals;
    }
    const evolved = state.habitats.map(h => {
      const finalPopulation = finite(populations[h.id] ?? h.population, `${h.id}.population`);
      if (!Number.isSafeInteger(finalPopulation)) throw new RangeError('População deve ser inteira.');
      const preMigrationPopulation = finalPopulation + (outgoing[h.id] || 0) - (incoming[h.id] || 0);
      if (preMigrationPopulation < 0) throw new RangeError(`Migração excede população disponível em ${h.id}.`);
      const alleleCounts = {};
      for (const [locus, counts] of Object.entries(h.alleleCounts)) {
        const fitness = state.selection[locus] || {};
        alleleCounts[locus] = sampleCopies(counts, preMigrationPopulation * 2, fitness, state.mutationRate, random);
      }
      return { id: h.id, population: preMigrationPopulation, alleleCounts };
    });
    const byId = new Map(evolved.map(h => [h.id, h]));
    for (const migration of migrations) {
      const source = byId.get(migration.sourceHabitatId), target = byId.get(migration.targetHabitatId);
      if (!source || !target) throw new Error('Migração referencia habitat inexistente.');
      if (source.population < migration.individuals) throw new RangeError(`Migração excede população disponível em ${source.id}.`);
      if (source === target) throw new Error('Origem e destino da migração devem ser diferentes.');
      for (const locus of Object.keys(source.alleleCounts)) {
        if (!target.alleleCounts[locus]) target.alleleCounts[locus] = Object.fromEntries(Object.keys(source.alleleCounts[locus]).map(a => [a, 0]));
        const targetAlleles = Object.keys(target.alleleCounts[locus]);
        for (const allele of Object.keys(source.alleleCounts[locus])) if (!(allele in target.alleleCounts[locus])) throw new Error(`Conjunto de alelos incompatível no locus ${locus}.`);
        const draw = drawWithoutReplacement(source.alleleCounts[locus], migration.individuals * 2, random);
        source.alleleCounts[locus] = draw.remaining;
        for (const allele of targetAlleles) target.alleleCounts[locus][allele] = (target.alleleCounts[locus][allele] || 0) + (draw.picked[allele] || 0);
      }
      source.population -= migration.individuals;
      target.population += migration.individuals;
    }
    for (const h of evolved) {
      const expected = h.population * 2;
      for (const [locus, counts] of Object.entries(h.alleleCounts)) {
        const actual = Object.values(counts).reduce((a, b) => a + b, 0);
        if (actual !== expected) throw new Error(`Invariante violada em ${h.id}.${locus}: ${actual} != ${expected}.`);
      }
    }
    return { ...state, tick: state.tick + 1, rngState: random.state, habitats: evolved };
  }
  function stepWithEcology(state, previousWorld, nextWorld) {
    if (!state || state.version !== VERSION || !Array.isArray(state.habitats)) throw new TypeError('Estado genético incompatível.');
    if (!previousWorld || !nextWorld || !Array.isArray(previousWorld.habitats) || !Array.isArray(nextWorld.habitats)) {
      throw new TypeError('São necessários os estados ecológicos anterior e posterior.');
    }
    if (nextWorld.tick !== previousWorld.tick + 1) throw new RangeError('Os estados ecológicos devem representar ticks consecutivos.');
    if (previousWorld.speciesId !== nextWorld.speciesId || String(state.speciesId) !== String(previousWorld.speciesId)) {
      throw new Error('Identidade de espécie incompatível entre ecologia e genética.');
    }
    const before = new Map(previousWorld.habitats.map(h => [h.id, h.population]));
    const after = new Map(nextWorld.habitats.map(h => [h.id, h.population]));
    const genetic = new Map(state.habitats.map(h => [h.id, h]));
    if (before.size !== after.size || before.size !== genetic.size) throw new Error('Os conjuntos de habitats devem ser idênticos entre os estados.');
    for (const [id, population] of before) {
      if (!after.has(id) || !genetic.has(id)) throw new Error(`Habitat ${id} ausente em um dos subsistemas.`);
      if (genetic.get(id).population !== population) throw new Error(`População genética desatualizada no habitat ${id}.`);
    }
    const migrations = (nextWorld.events || [])
      .filter(event => event.tick === previousWorld.tick && (event.type === 'population.recolonized' || event.type === 'population.migrated'))
      .map(event => ({
        sourceHabitatId: event.sourceHabitatId,
        targetHabitatId: event.habitatId || event.targetHabitatId,
        individuals: event.count
      }));
    for (const migration of migrations) {
      if (!migration.sourceHabitatId || !migration.targetHabitatId || !Number.isSafeInteger(migration.individuals) || migration.individuals < 1) {
        throw new Error('Evento ecológico de migração inválido; atualização genética cancelada.');
      }
    }
    const populations = Object.fromEntries([...after.entries()]);
    return step(state, { populations, migrations });
  }
  function frequencies(state) {
    return Object.fromEntries(state.habitats.map(h => [h.id, Object.fromEntries(Object.entries(h.alleleCounts).map(([locus, counts]) => {
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return [locus, Object.fromEntries(Object.entries(counts).map(([a, n]) => [a, total ? n / total : 0]))];
    }))]));
  }
  return { VERSION, createState, step, stepWithEcology, frequencies };
});
