# Task: Collect Business Info

## Metadata
```yaml
name: collect-business-info
executor: scanner-chief
elicit: true
model_tier: sonnet
estimated_duration: "5-10 min"
```

## Purpose
Coletar informacoes estruturadas do negocio via formulario adaptado por setor. Input de qualidade e pre-requisito pra todo o diagnostico.

## Pre-conditions
- User descreveu o negocio ou setor
- Nenhum diagnostico em andamento

## Elicitation (MANDATORY)

### Quick Scan Mode (5 perguntas)
```
1. Qual o setor e tamanho da empresa? (funcionarios/faturamento)
2. Quais os 3 processos que mais consomem tempo da equipe?
3. Quais ferramentas/sistemas voces usam hoje?
4. Qual o maior gargalo que impede crescimento?
5. Ja usam alguma IA no negocio? Se sim, qual?
```

### Full Scan Mode (8 perguntas por setor)

**Carregue `data/sector-profiles.yaml` para perguntas especificas do setor.**

Perguntas universais (sempre aplicam):
```
1. SETOR: Qual o setor e tamanho da empresa?
2. TEMPORAL: Quais os 3 processos que mais CONSOMEM TEMPO toda semana?
3. REPETITIVO: O que voces fazem IGUAL toda vez, sem variacao?
4. DECISAO: Que decisao depende de DADOS que ninguem consolida?
5. GARGALO: Onde o trabalho TRAVA esperando alguem ou algo?
6. MANUAL: O que voces fazem MANUALMENTE que um sistema poderia fazer?
7. ESCALA: O que IMPEDE voces de crescer sem contratar mais gente?
8. FERRAMENTAS: Que sistemas usam hoje? Quais NAO conversam entre si?
```

## Execution

1. Identificar setor do negocio
2. Classificar porte (micro/pequena/media/grande)
3. Avaliar maturidade tecnologica (low/medium/high)
4. Fazer perguntas estruturadas (quick ou full mode)
5. Registrar respostas no formato BUSINESS_PROFILE

## Veto Conditions

- `< 5 campos preenchidos` → Pedir mais informacoes
- `Setor nao identificado` → Perguntar diretamente
- `< 3 processos mencionados` → Insistir com perguntas de desconstrucao
- `Respostas monossilabicas` → Reformular pergunta com exemplos

## Output Format

```yaml
BUSINESS_PROFILE:
  company:
    sector: string
    sub_sector: string
    size: "micro | pequena | media | grande"
    employees: number
    revenue_range: string
  tech_maturity:
    level: "low | medium | high"
    current_tools: array
    ai_usage: "none | basic | moderate | advanced"
  processes:
    - name: string
      frequency: "diario | semanal | mensal"
      time_consumed: string
      people_involved: number
      pain_level: "1-10"
  pain_points: array
  growth_blockers: array
  integration_gaps: array
```

## Completion Criteria
- [ ] Setor e porte classificados
- [ ] Maturidade tech avaliada
- [ ] Minimo 3 processos mapeados (quick) ou 5 (full)
- [ ] Ferramentas atuais registradas
- [ ] BUSINESS_PROFILE formatado
