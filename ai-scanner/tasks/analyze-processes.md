# Task: Analyze Processes

## Metadata
```yaml
name: analyze-processes
executor: business-analyst
elicit: false
model_tier: opus
estimated_duration: "5-10 min"
```

## Purpose
Extrair, classificar e analisar processos do negocio usando Pareto ao Cubo. Separar ouro de bronze. Identificar gargalos que IA resolve.

## Pre-conditions
- BUSINESS_PROFILE recebido do scanner-chief
- Minimo 3 processos mencionados

## Execution

### Phase 1: Process Discovery
Para cada processo mencionado no BUSINESS_PROFILE:
1. Detalhar com perguntas de desconstrucao:
   - "Em que PONTO EXATO isso acontece?"
   - "Quantas vezes por semana?"
   - "Quantas pessoas envolvem?"
   - "Quanto tempo consome por vez?"
   - "O que acontece se fizer errado?"

### Phase 2: Classification (Ouro vs Bronze)
```yaml
classification_rules:
  ouro:
    criteria: "Repetitivo + alto volume + regras claras + dados estruturados"
    ai_potential: "Alto"
    examples: "Atendimento padrao, relatorios, entrada de dados, classificacao"
  prata:
    criteria: "Parcialmente repetitivo + precisa algum julgamento"
    ai_potential: "Medio (IA assiste, humano decide)"
    examples: "Analise de dados, priorizacao, recomendacoes"
  bronze:
    criteria: "Criativo + baixa frequencia + julgamento humano essencial"
    ai_potential: "Baixo (IA gera rascunho, humano refina)"
    examples: "Estrategia, negociacao complexa, design original"
```

### Phase 3: Pareto ao Cubo
Aplicar nos processos mapeados:
```
0.8% Genialidade → Processos que se otimizados geram 51% do impacto
4% Excelencia    → Processos de alto valor estrategico
20% Impacto      → Processos importantes mas nao criticos
80% Desperdicio  → Processos candidatos a eliminacao/automacao
```

### Phase 4: Bottleneck Mapping
Para cada processo ouro/prata:
- Tipo de gargalo: repetitivo | decisao | integracao | criativo
- Impacto se resolver: alto | medio | baixo
- IA resolve? sim | parcial | nao

## Veto Conditions

- `Processo generico sem especificidade` → Perguntar detalhes
- `< 5 processos classificados` → Continuar extracao
- `Todos processos como ouro` → Recalibrar (impossivel, algo e bronze)
- `Sem Pareto aplicado` → Nao gerar handoff

## Output Format

```yaml
PROCESS_MAP:
  business_context:
    sector: string
    size: string
    tech_maturity: string
  processes:
    - name: string
      classification: "ouro | prata | bronze"
      frequency: "diario | semanal | mensal"
      time_consumed: string
      people_involved: number
      pain_level: "1-10"
      ai_potential: "alto | medio | baixo"
      bottleneck_type: "repetitivo | decisao | integracao | criativo"
      description: string
      specifics: string
  pareto_analysis:
    genius_zone: array    # 0.8%
    excellence_zone: array # 4%
    impact_zone: array     # 20%
    waste_zone: array      # 80%
  bottleneck_summary:
    total_identified: number
    high_impact: array
    ai_resolvable: array
```

## Completion Criteria
- [ ] 5+ processos mapeados com detalhes
- [ ] Todos classificados (ouro/prata/bronze)
- [ ] Pareto ao Cubo aplicado
- [ ] Gargalos identificados com tipo
- [ ] PROCESS_MAP formatado pro handoff
