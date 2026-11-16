# ADR-007 — Modelo inicial de dinâmica populacional por habitat

- **Estado:** aprovado para prototipagem; não aprovado como modelo científico final.
- **Data:** 16/11/2026.
- **Contexto:** o Stage 4 C# possui uma população ecológica global com limite máximo fixo, mas ainda não representa habitats independentes, recolonização ou distinção formal entre extinção local e global. A continuidade do projeto exige preservar determinismo, identidade e eventos auditáveis.
- **Decisão:** desenvolver primeiro um modelo agregado e isolado por habitat no protótipo Alpha, com contratos explícitos, para validar os conceitos antes de transportá-los ao núcleo C#.
- **Consequências positivas:** separa extinção local/global; cria um conceito explícito de refúgio e recolonização; relaciona recursos à capacidade efetiva; permite medir diversidade genética a partir de frequências observadas; mantém a execução reproduzível por seed e ordem estável.
- **Limitações aceitas:** população inteira agregada; taxas heurísticas; migração simplificada; sem múltiplas espécies concorrentes; sem mutação/seleção/deriva integradas às frequências; sem calibração empírica.
- **Regra de integração futura:** o modelo C# deverá ser autoritativo. O protótipo JavaScript é referência experimental e não pode se tornar uma segunda fonte de verdade persistente.
- **Alternativas não escolhidas:** implementar diretamente no C# sem SDK/testes disponíveis; acoplar a lógica populacional à interface web; modelar indivíduos e genética completa antes de estabilizar os contratos populacionais.
- **Revisão necessária:** ao importar o núcleo .NET, reconciliar este contrato com `EcologySystem`, `WorldManager`, `WorldSaveService` e o journal de eventos. Definir migração de schema antes de persistir o novo estado.
