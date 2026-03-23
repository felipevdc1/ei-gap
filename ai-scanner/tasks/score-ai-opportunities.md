# Task: Score AI Opportunities

## Metadata
```yaml
name: score-ai-opportunities
executor: process-architect
elicit: false
model_tier: sonnet
estimated_duration: "3-5 min"
```

## Purpose
Scoring tecnico de cada oportunidade de IA usando 4 dimensoes fixas. Aplicar diagnostic framework. Definir guardrails obrigatorios.

## Pre-conditions
- PROCESS_MAP recebido do business-analyst
- Processos classificados e Pareto aplicado

## Execution

### Phase 1: Opportunity Identification
Para cada processo ouro/prata do PROCESS_MAP:
1. Identificar oportunidade de IA especifica
2. Categorizar: automacao | analise | geracao | integracao | decisao
3. Cruzar com `data/ai-opportunities-catalog.yaml` pra enriquecer

### Phase 2: 4-Dimension Scoring
Usar criterios FIXOS de `data/scoring-criteria.yaml`:

```yaml
dimensions:
  impact: # 1-10
    "9-10": "Core business — afeta receita diretamente"
    "7-8": "Eficiencia operacional — reduz custo significativo"
    "5-6": "Melhoria incremental — ganho moderado"
    "3-4": "Nice to have — baixo impacto"
    "1-2": "Cosmetic — quase nenhum impacto real"

  effort: # 1-10 (invertido: 10 = pouco esforco)
    "9-10": "Plug and play — configuracao minima"
    "7-8": "Integracao simples — 1-2 semanas"
    "5-6": "Integracao moderada — 2-4 semanas"
    "3-4": "Projeto medio — 1-3 meses"
    "1-2": "Projeto complexo — 3+ meses"

  feasibility: # 1-10
    "9-10": "Nenhuma barreira tecnica"
    "7-8": "Barreiras minimas"
    "5-6": "Barreiras moderadas"
    "3-4": "Barreiras significativas"
    "1-2": "Quase inviavel"

  automation_readiness: # 1-10
    "9-10": "Totalmente repetitivo, regras claras"
    "7-8": "Majoritariamente repetitivo"
    "5-6": "Mix repetitivo/criativo"
    "3-4": "Majoritariamente criativo"
    "1-2": "Totalmente criativo"

composite: "(impact × 0.35) + (effort × 0.25) + (feasibility × 0.20) + (automation_readiness × 0.20)"
```

### Phase 3: Diagnostic Framework
Para cada oportunidade, rodar as 6 perguntas:
1. Se o executor nao ler instrucoes, o que acontece?
2. Se tentar pular passo, consegue?
3. Se errar, o sistema detecta?
4. Se alguem sair de ferias, para?
5. Quanto gap de tempo entre handoffs?
6. Quantos cliques pra completar?

Registrar green/red flags.

### Phase 4: Automation Decision
Aplicar Automation Tipping Point:
```
Alta freq + Alto impacto + Alta automatizabilidade → AUTOMATE
Alta freq + Alto impacto + Baixa automatizabilidade → DELEGATE
Baixa freq + Alto impacto → KEEP_MANUAL
Baixa freq + Baixo impacto → ELIMINATE
Qualquer sem guardrails → VETO
```

### Phase 5: Guardrails Definition
Para cada AUTOMATE/DELEGATE:
- Idempotency (repetir nao causa efeito duplo)
- Logs (tudo registrado)
- Escape manual (humano assume se IA falha)
- Threshold de confianca (se aplicavel)

## Veto Conditions

- `Score sem criterios fixos` → Usar dimensoes documentadas
- `Automacao sem guardrails` → Definir antes de aprovar
- `Oportunidade inviavel pro porte` → Marcar como ELIMINATE
- `Feasibility < 3 sem justificativa` → Justificar ou VETO

## Output Format

```yaml
SCORED_OPPORTUNITIES:
  business_context:
    sector: string
    size: string
    tech_maturity: string
  opportunities:
    - name: string
      process_source: string
      category: "automacao | analise | geracao | integracao | decisao"
      scores:
        impact: number
        effort: number
        feasibility: number
        automation_readiness: number
      composite_score: number
      automation_decision: "AUTOMATE | DELEGATE | ELIMINATE | KEEP_MANUAL"
      diagnostic:
        green_flags: number
        red_flags: number
        details: array
      guardrails: array
      implementation:
        complexity: "baixa | media | alta"
        time_estimate: string
```

## Completion Criteria
- [ ] Todas oportunidades com score composto (4 dimensoes)
- [ ] Criterios documentados por score
- [ ] Diagnostic framework aplicado
- [ ] Automation decision pra cada
- [ ] Guardrails definidos
- [ ] SCORED_OPPORTUNITIES formatado
