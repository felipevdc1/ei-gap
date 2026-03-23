# AI Scanner

> Diagnostico empresarial com IA — Descubra onde IA gera mais resultado no seu negocio

## O que faz

Analisa qualquer negocio atraves de perguntas estruturadas por setor, mapeia processos, identifica oportunidades de aplicacao de IA e gera um relatorio com **10 oportunidades rankeadas por impacto vs esforco** com ROI estimado.

**Proposito:** Lead generation para consultoria de implementacao com Claude Code.

## Arquitetura

```
User → scanner-chief (intake)
            ↓
       business-analyst (extracao + classificacao)
            ↓
       process-architect (scoring tecnico)
            ↓
       growth-strategist (ROI + ranking)
            ↓
       scanner-chief (report final + CTA)
```

## Agents (4)

| Agent | Papel | Tier |
|-------|-------|------|
| **scanner-chief** | Orchestrator — coordena diagnostico, monta report | 0 |
| **business-analyst** | Extrai processos, classifica ouro/bronze, Pareto ao Cubo | 1 |
| **process-architect** | Scoring tecnico 4D, viabilidade, guardrails | 1 |
| **growth-strategist** | ROI, Loss Aversion 2.5:1, ranking, conversao | 1 |

## Comandos Principais

```
*scan {empresa}     — Diagnostico completo (8 perguntas por setor)
*quick-scan         — Diagnostico rapido (5 perguntas essenciais)
*report {id}        — Gerar relatorio de oportunidades
*deep-dive {#}      — Aprofundar oportunidade (teaser pra consultoria)
```

## Workflow: Business Diagnosis (5 fases)

| Fase | Executor | Output | Duracao |
|------|----------|--------|---------|
| 1. Intake | scanner-chief | BUSINESS_PROFILE | 5-10 min |
| 2. Extraction | business-analyst | PROCESS_MAP | 5-10 min |
| 3. Scoring | process-architect | SCORED_OPPORTUNITIES | 3-5 min |
| 4. Ranking | growth-strategist | RANKED_OPPORTUNITIES | 3-5 min |
| 5. Report | scanner-chief | FINAL_REPORT | 2-3 min |

**Total:** 15-30 min (interativo)

## Barreira Estrategica de Entrega

| FREE (relatorio) | PAID (consultoria) |
|-----------------|-------------------|
| 10 oportunidades rankeadas | Implementacao com Claude Code |
| Score impacto/esforco | Setup de ambiente + prompts |
| ROI em range (R$X-Y) | ROI calculado com precisao |
| O QUE fazer | COMO fazer passo a passo |
| Complexidade (baixa/media/alta) | Cronograma detalhado |
| Diagnostico | Cirurgia |

## Setores Suportados

- E-commerce
- Agencia de Marketing Digital
- SaaS / Tech
- Servicos Profissionais
- Varejo Fisico
- Industria / Manufatura
- Educacao / Infoprodutos
- Saude / Clinicas
- Generico (qualquer setor)

## Frameworks Embutidos

**business-analyst:**
- Knowledge Extraction Architecture (5 fases)
- Pareto ao Cubo (0.8% genialidade → 51% resultado)
- Curadoria Ouro vs Bronze
- Perguntas de Desconstrucao (8 tipos)
- 10 heuristics de decisao

**process-architect:**
- Impossibilitar Caminhos (4 passos)
- Automation Tipping Point (4×4 matrix)
- Diagnostic Framework (6 perguntas + red/green flags)
- Scoring Engine (4 dimensoes × 10 niveis)
- 10 heuristics de decisao

**growth-strategist:**
- Funnel Logic as Systems Architecture
- OMIE Meta-Learning
- Dopamine Engineering
- Loss Aversion 2.5:1
- Storytelling as Architecture
- 10 heuristics de decisao

## Estrutura de Arquivos

```
squads/ai-scanner/
├── squad.yaml
├── config.yaml
├── README.md
├── agents/
│   ├── scanner-chief.md
│   ├── business-analyst.md
│   ├── growth-strategist.md
│   └── process-architect.md
├── tasks/
│   ├── collect-business-info.md
│   ├── analyze-processes.md
│   ├── score-ai-opportunities.md
│   ├── rank-opportunities.md
│   └── generate-report.md
├── workflows/
│   └── wf-business-diagnosis.yaml
├── templates/
│   ├── report-tmpl.md
│   ├── opportunity-card-tmpl.md
│   └── scoring-matrix-tmpl.yaml
├── data/
│   ├── sector-profiles.yaml
│   ├── ai-opportunities-catalog.yaml
│   └── scoring-criteria.yaml
├── checklists/
│   └── diagnosis-quality.md
└── config/
```

## Quick Start

```
# Ativar o squad
/aiScanner:agents:scanner-chief

# Iniciar diagnostico
*scan minha empresa de e-commerce

# Ou diagnostico rapido
*quick-scan
```

## Stats

- **Agents:** 4
- **Tasks:** 5
- **Workflows:** 1
- **Templates:** 3
- **Data files:** 3
- **Checklists:** 1
- **Setores:** 8 + generico
- **Oportunidades catalogadas:** 23
- **Heuristics totais:** 30+
