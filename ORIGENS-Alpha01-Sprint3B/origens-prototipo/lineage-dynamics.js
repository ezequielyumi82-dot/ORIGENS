/* ORIGENS — Lineage Dynamics v0.1
 * Deterministic lineage/species registry with persistent extinction history.
 * Experimental aggregate model; not the authoritative C# engine.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ORIGENSLineageDynamics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 1;
  const finite = (value, name, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < min || n > max) throw new RangeError(name + ' fora do intervalo permitido.');
    return n;
  };
  const integer = (value, name, min = 0) => {
    const n = finite(value, name, min);
    if (!Number.isSafeInteger(n)) throw new RangeError(name + ' deve ser inteiro.');
    return n;
  };
  const nonEmpty = (value, name) => {
    if (typeof value !== 'string' || !value.trim()) throw new TypeError(name + ' deve ser texto não vazio.');
    return value;
  };
  function stableId(prefix, input) {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return prefix + '-' + hash.toString(16).padStart(8, '0');
  }
  function normalizeCounts(counts, label) {
    if (!counts || typeof counts !== 'object' || Array.isArray(counts)) throw new TypeError(label + ' deve ser um objeto por habitat.');
    const result = {};
    for (const habitatId of Object.keys(counts).sort()) result[nonEmpty(habitatId, 'habitatId')] = integer(counts[habitatId], label + '.' + habitatId);
    return result;
  }
  function total(counts) {
    return Object.values(counts).reduce((sum, count) => sum + count, 0);
  }
  function createState(config = {}) {
    if (!Array.isArray(config.species) || !config.species.length) throw new TypeError('Informe ao menos uma espécie.');
    if (!Array.isArray(config.lineages) || !config.lineages.length) throw new TypeError('Informe ao menos uma linhagem.');
    const tick = integer(config.tick ?? 0, 'tick');
    const species = config.species.map(item => ({
      id: nonEmpty(item.id, 'species.id'),
      name: item.name == null ? null : String(item.name),
      parentSpeciesId: item.parentSpeciesId == null ? null : nonEmpty(item.parentSpeciesId, 'parentSpeciesId'),
      originTick: integer(item.originTick ?? 0, 'species.originTick'),
      status: 'active',
      extinctionTick: null
    })).sort((a, b) => a.id.localeCompare(b.id));
    if (new Set(species.map(item => item.id)).size !== species.length) throw new Error('IDs de espécie duplicados.');
    const speciesIds = new Set(species.map(item => item.id));
    const lineages = config.lineages.map(item => {
      const id = nonEmpty(item.id, 'lineage.id');
      const speciesId = nonEmpty(item.speciesId, 'lineage.speciesId');
      if (!speciesIds.has(speciesId)) throw new Error('Linhagem referencia espécie inexistente: ' + speciesId);
      return {
        id, speciesId,
        parentLineageId: item.parentLineageId == null ? null : nonEmpty(item.parentLineageId, 'parentLineageId'),
        originTick: integer(item.originTick ?? 0, 'lineage.originTick'),
        isolationTicks: integer(item.isolationTicks ?? 0, 'lineage.isolationTicks'),
        status: 'active',
        extinctionTick: null
      };
    }).sort((a, b) => a.id.localeCompare(b.id));
    if (new Set(lineages.map(item => item.id)).size !== lineages.length) throw new Error('IDs de linhagem duplicados.');
    const lineageIds = new Set(lineages.map(item => item.id));
    for (const lineage of lineages) {
      if (lineage.parentLineageId && !lineageIds.has(lineage.parentLineageId)) throw new Error('Linhagem ancestral inexistente: ' + lineage.parentLineageId);
      if (lineage.parentLineageId === lineage.id) throw new Error('Linhagem não pode descender de si mesma.');
    }
    const populations = (config.populations || []).map(item => ({
      lineageId: nonEmpty(item.lineageId, 'population.lineageId'),
      byHabitat: normalizeCounts(item.byHabitat || {}, 'population.byHabitat')
    })).sort((a, b) => a.lineageId.localeCompare(b.lineageId));
    if (new Set(populations.map(item => item.lineageId)).size !== populations.length) throw new Error('População duplicada para a mesma linhagem.');
    for (const population of populations) if (!lineageIds.has(population.lineageId)) throw new Error('População referencia linhagem inexistente: ' + population.lineageId);
    for (const lineage of lineages) if (!populations.some(item => item.lineageId === lineage.id)) {
      populations.push({ lineageId: lineage.id, byHabitat: {} });
    }
    const speciation = config.speciation || {};
    const thresholds = {
      geneticDivergenceThreshold: finite(speciation.geneticDivergenceThreshold ?? 0.25, 'geneticDivergenceThreshold', 0, 1),
      minIsolatedPopulation: integer(speciation.minIsolatedPopulation ?? 10, 'minIsolatedPopulation', 1),
      minIsolationTicks: integer(speciation.minIsolationTicks ?? 3, 'minIsolationTicks', 1)
    };
    const state = {
      version: VERSION, tick, species, lineages,
      populations: populations.sort((a, b) => a.lineageId.localeCompare(b.lineageId)),
      speciation: thresholds, events: Array.isArray(config.events) ? structuredClone(config.events) : []
    };
    validateState(state);
    return state;
  }
  function validateState(state) {
    if (!state || state.version !== VERSION || !Array.isArray(state.species) || !Array.isArray(state.lineages) || !Array.isArray(state.populations)) {
      throw new TypeError('Estado de linhagens incompatível.');
    }
    const speciesIds = new Set(state.species.map(item => item.id));
    const lineageIds = new Set(state.lineages.map(item => item.id));
    if (speciesIds.size !== state.species.length || lineageIds.size !== state.lineages.length) throw new Error('Identificadores duplicados no estado.');
    for (const lineage of state.lineages) {
      if (!speciesIds.has(lineage.speciesId)) throw new Error('Espécie ausente para linhagem ' + lineage.id);
      if (lineage.parentLineageId && !lineageIds.has(lineage.parentLineageId)) throw new Error('Ancestral ausente para linhagem ' + lineage.id);
    }
    for (const population of state.populations) {
      if (!lineageIds.has(population.lineageId)) throw new Error('População referencia linhagem ausente.');
      for (const count of Object.values(population.byHabitat)) integer(count, 'population count');
    }
    return true;
  }
  function step(state, options = {}) {
    validateState(state);
    const nextTick = integer(state.tick, 'tick') + 1;
    const species = structuredClone(state.species);
    const lineages = structuredClone(state.lineages);
    const populations = structuredClone(state.populations);
    const events = structuredClone(state.events || []);
    const lineageById = new Map(lineages.map(item => [item.id, item]));
    const populationById = new Map(populations.map(item => [item.lineageId, item]));
    const speciesById = new Map(species.map(item => [item.id, item]));

    for (const update of options.populationUpdates || []) {
      if (!update || !lineageById.has(update.lineageId)) throw new Error('Atualização referencia linhagem inexistente.');
      const population = populationById.get(update.lineageId);
      population.byHabitat = normalizeCounts(update.byHabitat || {}, 'populationUpdates.' + update.lineageId);
    }

    for (const lineage of lineages) {
      if (lineage.status === 'extinct') continue;
      const population = populationById.get(lineage.id);
      if (total(population.byHabitat) === 0) {
        lineage.status = 'extinct';
        lineage.extinctionTick = nextTick;
        events.push({ type: 'lineage.extinct', tick: nextTick, lineageId: lineage.id, speciesId: lineage.speciesId });
      }
    }

    const observations = options.observations || [];
    if (!Array.isArray(observations)) throw new TypeError('observations deve ser uma lista.');
    const observed = new Set();
    for (const observation of observations) {
      if (!observation || !lineageById.has(observation.lineageId)) throw new Error('Observação referencia linhagem inexistente.');
      if (observed.has(observation.lineageId)) throw new Error('Observação duplicada para linhagem.');
      observed.add(observation.lineageId);
      const parent = lineageById.get(observation.lineageId);
      if (parent.status !== 'active') throw new Error('Não é possível especiar uma linhagem extinta.');
      const divergence = finite(observation.geneticDivergence, 'geneticDivergence', 0, 1);
      const isolatedPopulation = integer(observation.isolatedPopulation, 'isolatedPopulation');
      const counts = normalizeCounts(observation.splitByHabitat || {}, 'splitByHabitat');
      const candidateCount = total(counts);
      const qualifies = divergence >= state.speciation.geneticDivergenceThreshold &&
        isolatedPopulation >= state.speciation.minIsolatedPopulation &&
        candidateCount >= state.speciation.minIsolatedPopulation;
      parent.isolationTicks = qualifies ? parent.isolationTicks + 1 : 0;
      if (!qualifies || parent.isolationTicks < state.speciation.minIsolationTicks) continue;
      const parentPopulation = populationById.get(parent.id);
      for (const [habitatId, count] of Object.entries(counts)) {
        if ((parentPopulation.byHabitat[habitatId] || 0) < count) {
          throw new RangeError('A divisão excede a população disponível no habitat ' + habitatId + '.');
        }
      }
      const ordinal = lineages.filter(item => item.parentLineageId === parent.id).length + 1;
      const lineageId = stableId('lineage', parent.id + '|' + nextTick + '|' + ordinal);
      const speciesId = stableId('species', parent.speciesId + '|' + parent.id + '|' + nextTick + '|' + ordinal);
      if (lineageById.has(lineageId) || speciesById.has(speciesId)) throw new Error('Colisão na geração de identidade determinística.');
      const childSpecies = {
        id: speciesId, name: null, parentSpeciesId: parent.speciesId,
        originTick: nextTick, status: 'active', extinctionTick: null
      };
      const childLineage = {
        id: lineageId, speciesId, parentLineageId: parent.id,
        originTick: nextTick, isolationTicks: 0, status: 'active', extinctionTick: null
      };
      for (const [habitatId, count] of Object.entries(counts)) parentPopulation.byHabitat[habitatId] -= count;
      species.push(childSpecies);
      lineages.push(childLineage);
      const childPopulation = { lineageId, byHabitat: counts };
      populations.push(childPopulation);
      lineageById.set(lineageId, childLineage);
      speciesById.set(speciesId, childSpecies);
      populationById.set(lineageId, childPopulation);
      parent.isolationTicks = 0;
      events.push({
        type: 'speciation', tick: nextTick, parentSpeciesId: parent.speciesId,
        speciesId, parentLineageId: parent.id, lineageId, geneticDivergence: divergence,
        population: candidateCount
      });
    }

    for (const speciesItem of species) {
      if (speciesItem.status === 'extinct') continue;
      const members = lineages.filter(item => item.speciesId === speciesItem.id);
      if (members.length && members.every(item => item.status === 'extinct')) {
        speciesItem.status = 'extinct';
        speciesItem.extinctionTick = nextTick;
        events.push({ type: 'species.extinct', tick: nextTick, speciesId: speciesItem.id });
      }
    }
    return {
      ...state, tick: nextTick,
      species: species.sort((a, b) => a.id.localeCompare(b.id)),
      lineages: lineages.sort((a, b) => a.id.localeCompare(b.id)),
      populations: populations.sort((a, b) => a.lineageId.localeCompare(b.lineageId)),
      events
    };
  }
  function history(state) {
    validateState(state);
    return {
      species: state.species.map(item => ({ ...item })),
      lineages: state.lineages.map(item => ({ ...item })),
      events: structuredClone(state.events || [])
    };
  }
  return { VERSION, createState, step, history, validateState };
});
