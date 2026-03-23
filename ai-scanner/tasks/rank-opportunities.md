# Task: Rank Opportunities

## Metadata
```yaml
name: rank-opportunities
executor: growth-strategist
elicit: false
model_tier: sonnet
estimated_duration: "3-5 min"
```

## Purpose
Rankear oportunidades por ROI real, aplicar Loss Aversion 2.5:1, e preparar elementos de conversao pro relatorio.

## Pre-conditions
- SCORED_OPPORTUNITIES recebido do process-architect
- Scores compostos calculados

## Execution

### Phase 1: ROI Estimation
Para cada oportunidade scored:
1. Estimar economia/ganho em range conservador (R$X - R$Y/ano)
2. Basear em:
   - Tempo economizado × custo/hora da equipe
   - Erros evitados × custo por erro
   - Vendas incrementais (se aplicavel)
   - Eficiencia operacional
3. NUNCA inflar — range conservador e mais credivel

### Phase 2: Loss Aversion Analysis (2.5:1)
Para cada oportunidade:
1. Calcular quanto PERDE por mes se NAO implementar
2. Aplicar multiplicador 2.5x: perda pesa mais que ganho
3. Frame: "Cada mes sem isso custa R$X"
4. Incluir perdas indiretas:
   - Custo de oportunidade
   - Erro humano acumulado
   - Tempo desperdicado que poderia ser vendido

### Phase 3: Final Ranking
```yaml
ranking_formula:
  primary: "composite_score (do process-architect)"
  secondary: "roi_range_midpoint"
  tiebreaker: "effort (menor esforco ganha)"
```

Ordenar top 10 por score composto + ROI.

### Phase 4: Conversion Elements
Preparar pra cada oportunidade:
```yaml
conversion_elements:
  total_roi_highlight: "R$X - R$Y/ano em oportunidades identificadas"
  loss_aversion_hook: "Cada mes sem implementar custa R$X"
  urgency_trigger: "Em 6 meses sem acao = R$X perdidos"
  cta_text: "Para implementar com Claude Code → Agende consultoria"
```

### Phase 5: Dopamine Sequence
Sequenciar o report pra conversao:
```
1. ROI TOTAL (ancora com numero grande)
2. Top 3 oportunidades (quick wins)
3. Loss aversion (quanto perde)
4. Tabela completa (10 oportunidades)
5. Deep dive #1 (teaser da melhor)
6. CTA (consultoria)
```

## Veto Conditions

- `ROI sem considerar downside` → Aplicar Loss Aversion 2.5:1
- `ROI inflado sem evidencia` → Reduzir pra range conservador
- `Ranking sem criterios` → Usar formula documentada
- `Sem CTA pra consultoria` → Adicionar
- `Report com detalhes de implementacao` → VETO (barreira quebrada)

## Output Format

```yaml
RANKED_OPPORTUNITIES:
  summary:
    sector: string
    company_size: string
    total_roi_range: "R$X - R$Y/ano"
    total_loss_monthly: "R$X - R$Y/mes"
    total_loss_6months: "R$X - R$Y"
  opportunities:
    - rank: number
      name: string
      description: string
      category: string
      composite_score: number
      roi_range: "R$X - R$Y/ano"
      loss_monthly: "R$X - R$Y/mes"
      implementation_complexity: "baixa | media | alta"
      time_to_value: string
      quick_win: boolean
  conversion:
    roi_highlight: string
    loss_hook: string
    urgency: string
    cta: string
    dopamine_sequence: array
```

## Completion Criteria
- [ ] 10 oportunidades rankeadas
- [ ] ROI em range por oportunidade
- [ ] ROI total calculado
- [ ] Loss aversion por item
- [ ] Conversion elements preparados
- [ ] Dopamine sequence definida
- [ ] Zero hedging nos numeros
