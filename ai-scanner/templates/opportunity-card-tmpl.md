## Oportunidade #{{rank}} — {{name}}

**Categoria:** {{category}}
**Score:** {{composite_score}}/10

| Dimensao | Score | Criterio |
|----------|-------|----------|
| Impacto | {{impact}}/10 | {{impact_criteria}} |
| Esforco | {{effort}}/10 | {{effort_criteria}} |
| Viabilidade | {{feasibility}}/10 | {{feasibility_criteria}} |
| Prontidao | {{readiness}}/10 | {{readiness_criteria}} |

**O que e:** {{description}}

**Por que funciona:** {{why_it_works}}

**ROI estimado:** {{roi_range}}/ano

**Perda mensal sem implementar:** {{loss_monthly}}/mes

**Complexidade:** {{complexity}}
**Tempo pra resultado:** {{time_to_value}}
**Quick Win:** {{quick_win}}

**Decisao de automacao:** {{automation_decision}}

{{#if guardrails}}
**Guardrails necessarios:**
{{#each guardrails}}
- {{this}}
{{/each}}
{{/if}}
