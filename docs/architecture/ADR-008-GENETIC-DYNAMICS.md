# ADR-008 — Evolução genética agregada por habitat

- **Estado:** aprovado para prototipagem experimental; não aprovado como modelo científico final.
- **Data:** 16/11/2026.
- **Contexto:** Population Dynamics v0.1 já representa populações agregadas por habitat e mede diversidade a partir de contagens externas, mas não altera frequências alélicas.
- **Decisão:** implementar um módulo genético separado, determinístico e diploide em contagem de cópias, com seleção alélica, mutação entre alelos declarados, deriva por amostragem finita e fluxo gênico explícito entre habitats.
- **Consequências positivas:** separa ecologia de genética; formaliza invariantes `2 × população`; torna testáveis os efeitos de seleção, mutação, deriva e migração; permite futura integração com o núcleo autoritativo sem acoplar genética à interface.
- **Limitações aceitas:** cópias amostradas independentemente; sem genótipos, dominância, ligação, recombinação, mutação direcional ou surgimento de alelos; aptidão simplificada por alelo; migrações ainda fornecidas pelo chamador.
- **Regra de integração:** este módulo é experimental. O C# deverá permanecer como fonte de verdade para simulação persistente, snapshots e replay.
- **Alternativas não escolhidas:** implementar genética individual antes de estabilizar contratos; misturar seleção e mutação diretamente na interface; considerar diversidade descritiva como evolução genética.
- **Revisão necessária:** integrar com a dinâmica populacional, identidade de espécie/linhagem, eventos versionados, persistência e migrações de schema. Validar biologicamente as hipóteses antes de qualquer alegação de realismo científico.
