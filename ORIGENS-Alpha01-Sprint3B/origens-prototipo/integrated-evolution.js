/* ORIGENS — Integrated Evolution v0.1
 * Experimental coordinator for ecology, genetics and lineage dynamics.
 * Single-species/single-lineage scope until explicit species partitioning exists.
 */
(function (root, factory) {
  const api = factory(
    typeof module === 'object' && module.exports ? require('./population-dynamics.js') : root.ORIGENSPopulationDynamics,
    typeof module === 'object' && module.exports ? require('./genetic-dynamics.js') : root.ORIGENSGeneticDynamics,
    typeof module === 'object' && module.exports ? require('./lineage-dynamics.js') : root.ORIGENSLineageDynamics
  );
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ORIGENSIntegratedEvolution = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Population, Genetics, Lineages) {
  'use strict';
  const VERSION = 1;
  const clone = value => structuredClone(value);
  const fail = message => { throw new Error(message); };
  function validateInputs(ecology, genetics, lineages) {
    if (!Population || !Genetics || !Lineages) throw new Error('Os três módulos ORIGENS devem estar carregados.');
    if (!ecology || !Array.isArray(ecology.habitats) || !genetics || !Array.isArray(genetics.habitats)) {
      throw new TypeError('Estados ecológico e genético são obrigatórios.');
    }
    Lineages.validateState(lineages);
    if (ecology.tick !== genetics.tick || ecology.tick !== lineages.tick) {
      throw new RangeError('Ecologia, genética e linhagens devem iniciar no mesmo tick.');
    }
    if (String(ecology.speciesId) !== String(genetics.speciesId)) fail('A identidade de espécie diverge entre ecologia e genética.');
    if (lineages.species.length !== 1 || lineages.lineages.length !== 1) {
      fail('Integrated Evolution v0.1 exige exatamente uma espécie e uma linhagem; partição multiespécie ainda não implementada.');
    }
    const species = lineages.species[0], lineage = lineages.lineages[0];
    if (species.id !== String(ecology.speciesId) || lineage.speciesId !== species.id) {
      fail('A identidade da espécie/linhagem não corresponde ao mundo ecológico.');
    }
    if (lineage.status !== 'active' || species.status !== 'active') fail('A simulação inicial exige espécie e linhagem ativas.');
    const eco = new Map(ecology.habitats.map(h => [h.id, h]));
    const gen = new Map(genetics.habitats.map(h => [h.id, h]));
    if (eco.size !== ecology.habitats.length || gen.size !== genetics.habitats.length || eco.size !== gen.size) {
      fail('Os conjuntos de habitats devem ser únicos e idênticos.');
    }
    for (const habitat of ecology.habitats) {
      const genetic = gen.get(habitat.id);
      if (!genetic) fail('Habitat ausente no estado genético: ' + habitat.id);
      if (genetic.population !== habitat.population) fail('População genética desatualizada no habitat ' + habitat.id + '.');
    }
    const population = lineages.populations.find(item => item.lineageId === lineage.id);
    if (!population) fail('População inicial da linhagem ausente.');
    for (const habitat of ecology.habitats) {
      if ((population.byHabitat[habitat.id] || 0) !== habitat.population) {
        fail('População da linhagem não corresponde à ecologia no habitat ' + habitat.id + '.');
      }
    }
    for (const habitatId of Object.keys(population.byHabitat)) if (!eco.has(habitatId)) fail('Linhagem referencia habitat inexistente: ' + habitatId);
  }
  function totalVariation(a, b) {
    const alleles = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
    let sum = 0;
    for (const allele of alleles) sum += Math.abs((a && a[allele] || 0) - (b && b[allele] || 0));
    return sum / 2;
  }
  function divergenceForHabitat(habitatId, world, geneticState, lineagePopulation) {
    const target = world.habitats.find(h => h.id === habitatId);
    const targetCount = lineagePopulation.byHabitat[habitatId] || 0;
    const peers = world.habitats.filter(h => h.id !== habitatId && (lineagePopulation.byHabitat[h.id] || 0) > 0);
    if (!target || targetCount === 0 || peers.length === 0) return 0;
    const occupiedNeighbors = target.neighbors.filter(id => (lineagePopulation.byHabitat[id] || 0) > 0);
    if (occupiedNeighbors.length) return 0;
    const frequencies = Genetics.frequencies(geneticState);
    const targetLoci = frequencies[habitatId] || {};
    const peerWeight = peers.reduce((sum, h) => sum + (lineagePopulation.byHabitat[h.id] || 0), 0);
    const distances = [];
    for (const locus of Object.keys(targetLoci).sort()) {
      const targetFrequency = targetLoci[locus];
      const alleles = new Set(Object.keys(targetFrequency));
      for (const peer of peers) for (const allele of Object.keys((frequencies[peer.id] || {})[locus] || {})) alleles.add(allele);
      const reference = {};
      for (const allele of alleles) {
        reference[allele] = peers.reduce((sum, h) => {
          const count = lineagePopulation.byHabitat[h.id] || 0;
          return sum + (((frequencies[h.id] || {})[locus] || {})[allele] || 0) * count;
        }, 0) / peerWeight;
      }
      distances.push(totalVariation(targetFrequency, reference));
    }
    return distances.length ? distances.reduce((sum, value) => sum + value, 0) / distances.length : 0;
  }
  function deriveObservation(world, genetics, lineages) {
    const lineage = lineages.lineages[0];
    const population = lineages.populations.find(item => item.lineageId === lineage.id);
    if (!population) return null;
    const candidates = world.habitats
      .map(h => ({
        habitatId: h.id,
        population: population.byHabitat[h.id] || 0,
        divergence: divergenceForHabitat(h.id, world, genetics, population)
      }))
      .filter(item => item.population > 0 && item.divergence > 0)
      .sort((a, b) => b.divergence - a.divergence || b.population - a.population || a.habitatId.localeCompare(b.habitatId));
    if (!candidates.length) return null;
    const candidate = candidates[0];
    return {
      lineageId: lineage.id,
      geneticDivergence: candidate.divergence,
      isolatedPopulation: candidate.population,
      splitByHabitat: { [candidate.habitatId]: candidate.population }
    };
  }
  function createSimulation(config = {}) {
    const ecology = clone(config.ecology);
    const genetics = clone(config.genetics);
    const lineages = clone(config.lineages);
    validateInputs(ecology, genetics, lineages);
    return {
      version: VERSION,
      tick: ecology.tick,
      status: 'running',
      ecology, genetics, lineages,
      lastDiagnostics: {
        geneticDivergence: null,
        isolatedHabitatId: null,
        speciationOccurred: false
      }
    };
  }
  function validateSimulation(state) {
    if (!state || state.version !== VERSION || !['running', 'species_partition_required', 'extinct'].includes(state.status)) {
      throw new TypeError('Estado integrado incompatível.');
    }
    if (state.tick !== state.ecology.tick || state.tick !== state.genetics.tick || state.tick !== state.lineages.tick) {
      throw new RangeError('Os subsistemas integrados perderam a sincronização de ticks.');
    }
    Lineages.validateState(state.lineages);
    return true;
  }
  function step(state) {
    validateSimulation(state);
    if (state.status !== 'running') fail('A simulação não pode avançar: estado atual ' + state.status + '.');
    if (state.lineages.species.length !== 1 || state.lineages.lineages.length !== 1) {
      fail('A partição por espécie/linhagem precisa ser implementada antes do próximo tick.');
    }
    const nextEcology = Population.step(state.ecology);
    const nextGenetics = Genetics.stepWithEcology(state.genetics, state.ecology, nextEcology);
    const lineageId = state.lineages.lineages[0].id;
    const populationUpdates = [{
      lineageId,
      byHabitat: Object.fromEntries(nextEcology.habitats.map(h => [h.id, h.population]))
    }];
    const provisionalLineages = {
      ...state.lineages,
      populations: state.lineages.populations.map(item => item.lineageId === lineageId
        ? { ...item, byHabitat: populationUpdates[0].byHabitat }
        : item)
    };
    const observation = deriveObservation(nextEcology, nextGenetics, provisionalLineages);
    const nextLineages = Lineages.step(state.lineages, {
      populationUpdates,
      observations: observation ? [observation] : []
    });
    const speciationOccurred = nextLineages.events.some(event => event.type === 'speciation' && event.tick === nextLineages.tick);
    const extinct = nextEcology.globalExtinct || nextLineages.lineages.every(item => item.status === 'extinct');
    const status = speciationOccurred ? 'species_partition_required' : extinct ? 'extinct' : 'running';
    return {
      version: VERSION,
      tick: nextEcology.tick,
      status,
      ecology: nextEcology,
      genetics: nextGenetics,
      lineages: nextLineages,
      lastDiagnostics: {
        geneticDivergence: observation ? observation.geneticDivergence : null,
        isolatedHabitatId: observation ? Object.keys(observation.splitByHabitat)[0] : null,
        speciationOccurred
      }
    };
  }
  function summary(state) {
    validateSimulation(state);
    return {
      tick: state.tick,
      status: state.status,
      totalPopulation: state.ecology.habitats.reduce((sum, h) => sum + h.population, 0),
      habitats: state.ecology.habitats.map(h => ({ id: h.id, population: h.population, resources: h.resources })),
      geneticFrequencies: Genetics.frequencies(state.genetics),
      species: state.lineages.species.map(item => ({ ...item })),
      lineages: state.lineages.lineages.map(item => ({ ...item })),
      events: state.lineages.events.filter(event => event.tick === state.tick),
      diagnostics: clone(state.lastDiagnostics)
    };
  }
  return { VERSION, createSimulation, step, summary, validateSimulation };
});
