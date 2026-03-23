# AI Scanner — Documento de Handoff

> Documento para onboarding do time/agente que vai construir o webapp.
> Gerado em 2026-03-23 pelo Squad Creator Pro.

---

## 1. O Que É

O **AI Scanner** é um squad de 4 agentes de IA que diagnostica negócios e apresenta 10 oportunidades de aplicação de IA rankeadas por impacto vs esforço.

**Propósito:** Lead generation para consultoria de implementação com Claude Code.

**Fluxo resumido:**
```
Empresário descreve negócio → Squad analisa → Relatório com 10 oportunidades + ROI → CTA pra consultoria
```

**Barreira estratégica:** O relatório mostra O QUÊ fazer (diagnóstico), nunca O COMO (implementação). O COMO é o produto da consultoria.

---

## 2. Squad: Arquitetura de Agents

O squad tem 4 agents, cada um com frameworks proprietários embutidos (white-label — nenhum nome de pessoa aparece).

### scanner-chief (Orchestrator — Tier 0)
- **Papel:** Coordena o fluxo de diagnóstico, coleta dados do negócio, monta relatório final
- **Quando age:** Início (intake) e fim (report assembly)
- **Frameworks:** Diagnostic Orchestration (5 fases), Strategic Barrier Enforcement
- **Heuristics:** 5 (SC001-SC005)

### business-analyst (Tier 1)
- **Papel:** Extrai processos do negócio, classifica por valor, aplica Pareto
- **Quando age:** Depois do intake, antes do scoring
- **Frameworks:**
  - Knowledge Extraction Architecture (5 fases: discovery → classification → pareto → bottleneck → handoff)
  - Curadoria Ouro vs Bronze (processos repetitivos de alto volume = ouro, criativos de baixa freq = bronze)
  - Pareto ao Cubo (0.8% genialidade → 51% resultado, 80% desperdício → automatizar/eliminar)
  - Perguntas de Desconstrução (8 tipos: temporal, repetitivo, decisão, gargalo, manual, erro, escala, integração)
- **Heuristics:** 10 (BA001-BA010)
- **Output:** PROCESS_MAP (processos classificados + Pareto + gargalos)

### process-architect (Tier 1)
- **Papel:** Scoring técnico de cada oportunidade de IA
- **Quando age:** Recebe PROCESS_MAP, gera SCORED_OPPORTUNITIES
- **Frameworks:**
  - Impossibilitar Caminhos (mapear fluxo → identificar erros → criar bloqueios → testar com leigo)
  - Automation Tipping Point (frequência × impacto × automatizabilidade → AUTOMATE/DELEGATE/ELIMINATE/KEEP_MANUAL)
  - Diagnostic Framework (6 perguntas que revelam automatizabilidade)
  - Scoring Engine 4D (impact 35% + effort 25% + feasibility 20% + automation_readiness 20%)
- **Heuristics:** 10 (PA001-PA010)
- **Output:** SCORED_OPPORTUNITIES (score composto + automação decision + guardrails)

### growth-strategist (Tier 1)
- **Papel:** Rankeia por ROI, aplica loss aversion, prepara conversão
- **Quando age:** Recebe SCORED_OPPORTUNITIES, gera RANKED_OPPORTUNITIES
- **Frameworks:**
  - Funnel Logic as Systems Architecture (o relatório É o funil de conversão)
  - OMIE Meta-Learning (Observar → Modelar → Melhorar → Excelência)
  - Dopamine Engineering (sequenciar report: curiosidade → confiança → comprometimento)
  - Loss Aversion 2.5:1 (perdas pesam 2.5x mais que ganhos — frame como "quanto PERDE por mês")
  - Storytelling as Architecture (número + contexto do negócio = memorável)
- **Heuristics:** 10 (GS001-GS010)
- **Output:** RANKED_OPPORTUNITIES (top 10 + ROI + loss + conversion elements)

---

## 3. Workflow: Business Diagnosis (5 Fases)

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
Intake    Extract    Score      Rank       Report
(chief)  (analyst)  (architect)(strategist)(chief)
```

**Fluxo unidirecional** — nada volta pra fase anterior. Se fase falha veto → loop na mesma fase.

| Fase | Executor | Input | Output | Veto Conditions | Duração |
|------|----------|-------|--------|-----------------|---------|
| 1. Intake | scanner-chief | User input | BUSINESS_PROFILE | < 5 campos, setor não identificado | 5-10 min |
| 2. Extraction | business-analyst | BUSINESS_PROFILE | PROCESS_MAP | processos genéricos, < 5 mapeados, sem Pareto | 5-10 min |
| 3. Scoring | process-architect | PROCESS_MAP | SCORED_OPPORTUNITIES | score sem critérios, sem guardrails | 3-5 min |
| 4. Ranking | growth-strategist | SCORED_OPPORTUNITIES | RANKED_OPPORTUNITIES | sem ROI, sem loss aversion | 3-5 min |
| 5. Report | scanner-chief | RANKED_OPPORTUNITIES | FINAL_REPORT | sem CTA, com detalhes de implementação | 2-3 min |

---

## 4. Data Files (Contexto Injetável)

### sector-profiles.yaml
- 8 setores + genérico (e-commerce, agência marketing, SaaS, serviços profissionais, varejo, indústria, educação, saúde)
- Cada setor tem: keywords, processos típicos, perguntas específicas, oportunidades de alto ROI
- **Uso no webapp:** Detectar setor do user → carregar perguntas específicas no formulário

### ai-opportunities-catalog.yaml
- 23 oportunidades catalogadas em 5 categorias (automação, análise, geração, integração, decisão)
- Cada oportunidade tem: ROI típico, esforço, time-to-value, quando aplicar, tech necessária
- **Uso no webapp:** Enriquecer oportunidades identificadas com dados do catálogo

### scoring-criteria.yaml
- 4 dimensões de scoring (impact, effort, feasibility, automation_readiness)
- Cada dimensão com 10 níveis documentados
- Fórmula composta com pesos: (impact×0.35) + (effort×0.25) + (feasibility×0.20) + (readiness×0.20)
- Matriz de decisão de automação + guardrails obrigatórios
- **Uso no webapp:** Garantir scoring consistente e determinístico

---

## 5. Barreira Estratégica de Entrega

### O que o relatório FREE entrega:
- 10 oportunidades rankeadas com score composto
- ROI estimado em **range** (R$X - R$Y/ano) por oportunidade
- ROI total estimado
- Perda mensal se não implementar (Loss Aversion)
- Classificação de complexidade (baixa/média/alta)
- O QUE fazer e POR QUE funciona
- Categorização (automação, análise, geração, integração, decisão)

### O que o relatório FREE **NÃO** entrega (isso é consultoria):
- COMO implementar passo a passo
- Qual stack/ferramenta usar
- Setup de ambiente
- Prompts customizados
- Cronograma detalhado
- ROI calculado com precisão (só range)
- Integração com sistemas existentes
- Treinamento da equipe

**A barreira é natural, não artificial.** É como médico que dá diagnóstico mas não opera na consulta.

---

## 6. Plano de Construção do Webapp

### Stack Recomendada
- **Frontend:** Next.js 14 + Tailwind CSS + Shadcn/ui
- **Backend:** Next.js API Routes (Server Actions)
- **IA Engine:** Claude API (Anthropic SDK) — `@anthropic-ai/sdk`
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Deploy:** Vercel

### Arquitetura

```
┌─────────────────────────────────────────┐
│  FRONTEND (Next.js)                      │
│  / → Landing page + CTA                 │
│  /scan → Formulário dinâmico por setor   │
│  /report/[id] → Relatório visual         │
│  /admin → Dashboard de leads (opcional)  │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│  API ROUTES                              │
│  POST /api/scan → Inicia diagnóstico     │
│  GET /api/report/[id] → Retorna report   │
│  GET /api/sectors → Lista setores        │
│  POST /api/lead → Captura lead           │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│  ENGINE (Claude API)                     │
│  5 chamadas sequenciais:                 │
│  1. Intake → system: scanner-chief       │
│  2. Extract → system: business-analyst   │
│  3. Score → system: process-architect    │
│  4. Rank → system: growth-strategist     │
│  5. Report → system: scanner-chief       │
│                                          │
│  Contexto injetado por chamada:          │
│  - sector-profiles.yaml (fase 1-2)      │
│  - scoring-criteria.yaml (fase 3)       │
│  - ai-opportunities-catalog.yaml (3-4)  │
│  - report-tmpl.md (fase 5)             │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│  SUPABASE                                │
│  scans (id, sector, input, status, ts)   │
│  reports (id, scan_id, content, roi)     │
│  leads (id, scan_id, email, company)     │
└─────────────────────────────────────────┘
```

### Como Agents Viram System Prompts

Cada agent `.md` do squad vira o `system` prompt de uma chamada à Claude API. A lógica:

```typescript
// Exemplo simplificado
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// Fase 2: Extraction
const processMap = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 4096,
  system: businessAnalystPrompt + sectorProfilesData,
  messages: [
    {
      role: 'user',
      content: `Analise este negócio e gere o PROCESS_MAP:\n\n${JSON.stringify(businessProfile)}`
    }
  ]
});
```

**Regras de conversão agent → system prompt:**
1. Extrair seções THINKING DNA + HEURISTICS + SCOPE + VOICE DNA do `.md`
2. Adicionar data files relevantes como contexto
3. Adicionar output format esperado (YAML/JSON)
4. O agent NÃO precisa ser carregado inteiro — extrair o core operacional

### MVP (Caminho 1 — 1-2 dias)

**Escopo mínimo:**
1. Landing page com proposta de valor
2. Formulário com 5-8 perguntas (baseado em sector-profiles.yaml)
3. Botão "Gerar Diagnóstico"
4. Loading com progresso das fases
5. Página de resultado com relatório + CTA
6. Salvar lead no Supabase

**Páginas:**
- `/` — Landing com headline + CTA "Descubra onde IA gera resultado no seu negócio"
- `/scan` — Formulário multi-step (setor → perguntas específicas → processos → submit)
- `/report/[id]` — Relatório visual com tabela de oportunidades + ROI + CTA

**Simplificações do MVP:**
- Pode ser 1-2 chamadas à Claude API em vez de 5 (combinar prompts)
- Sem auth (capturar email no final)
- Sem dashboard admin
- Deploy direto na Vercel

### Evolução (Caminho 2 — 3-5 dias)

Adicionar:
- Formulário dinâmico que muda por setor detectado
- Pipeline de 5 chamadas (fidelidade total ao squad)
- Streaming do relatório (aparece em tempo real)
- Supabase com histórico de scans
- Email automático com PDF do relatório
- Gráficos de impacto vs esforço (Chart.js ou Recharts)
- Animações de loading por fase

### Full Product (Caminho 3 — 2-4 semanas)

Adicionar:
- Auth (Supabase Auth)
- Dashboard admin (leads, analytics, conversões)
- A/B testing de CTAs
- Email drip sequence pós-relatório
- Landing page otimizada (copy com Dopamine Engineering)
- Múltiplos idiomas
- Relatório em PDF exportável
- Integração com calendário (agendar consultoria)
- Analytics (quais setores, quais oportunidades convertem mais)

---

## 7. Localização dos Arquivos do Squad

Todos os arquivos do squad estão em:
```
squads/ai-scanner/
├── squad.yaml                          # Metadados do squad
├── config.yaml                         # Configuração
├── README.md                           # Documentação completa
├── HANDOFF.md                          # Este documento
├── agents/
│   ├── scanner-chief.md                # Orchestrator (388 linhas)
│   ├── business-analyst.md             # Extração + Pareto (369 linhas)
│   ├── growth-strategist.md            # ROI + Conversão (411 linhas)
│   └── process-architect.md            # Scoring técnico (483 linhas)
├── tasks/
│   ├── collect-business-info.md        # Fase 1: Intake
│   ├── analyze-processes.md            # Fase 2: Extração
│   ├── score-ai-opportunities.md       # Fase 3: Scoring
│   ├── rank-opportunities.md           # Fase 4: Ranking
│   └── generate-report.md             # Fase 5: Report
├── workflows/
│   └── wf-business-diagnosis.yaml      # Workflow completo (5 fases)
├── templates/
│   ├── report-tmpl.md                  # Template do relatório final
│   ├── opportunity-card-tmpl.md        # Template de card de oportunidade
│   └── scoring-matrix-tmpl.yaml        # Template da matriz de scoring
├── data/
│   ├── sector-profiles.yaml            # 8 setores + perguntas específicas
│   ├── ai-opportunities-catalog.yaml   # 23 oportunidades catalogadas
│   └── scoring-criteria.yaml           # Critérios fixos de scoring 4D
└── checklists/
    └── diagnosis-quality.md            # Checklist de qualidade
```

---

## 8. Instruções para o Agente/Dev que Vai Construir

1. **Leia os 4 agents** — eles são o coração do sistema. Cada um tem THINKING DNA, HEURISTICS, VOICE DNA, OUTPUT EXAMPLES e VETO CONDITIONS que devem ser respeitados.

2. **Os data files são contexto injetável** — não hardcode oportunidades. Injete `sector-profiles.yaml` e `ai-opportunities-catalog.yaml` como contexto nas chamadas à Claude API.

3. **Respeite a barreira free/paid** — o relatório NUNCA mostra COMO implementar. Se aparecer implementação detalhada no output da IA, filtre ou re-prompt.

4. **Scoring usa critérios fixos** — `scoring-criteria.yaml` define os 4 dimensões × 10 níveis. O scoring não pode ser gut feeling.

5. **Loss Aversion é obrigatório** — todo relatório deve mostrar quanto o empresário PERDE por mês se não implementar (2.5x do ganho).

6. **CTA é natural, não forçado** — aparece DEPOIS do ROI total, não antes. Primeiro impressiona, depois oferece.

7. **Formulário estruturado > texto livre** — nunca aceitar texto livre como único input. Sempre formulário com perguntas específicas por setor.

8. **O workflow é unidirecional** — se uma fase falha, faz loop na mesma fase. Nunca volta pra fase anterior.

---

## 9. Métricas de Sucesso

| Métrica | Target MVP | Target Full |
|---------|-----------|-------------|
| Tempo do scan completo | < 60s | < 45s |
| Taxa de conclusão do formulário | > 70% | > 85% |
| Taxa de visualização do relatório | > 90% | > 95% |
| Taxa de clique no CTA | > 15% | > 25% |
| NPS do relatório | > 7 | > 8.5 |
| Leads capturados/mês | 50+ | 200+ |
| Conversão lead → call | > 10% | > 20% |

---

*Documento gerado pelo Squad Creator Pro — Squad Architect*
*Clone minds > create bots.*
