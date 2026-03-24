# EI-GAP AI Scanner — Roadmap

> **Atualizado:** 2026-03-24 | **Status:** MVP Completo | **Testes:** 648 passing | **Build:** OK

---

## Visão Geral

| Métrica | Valor |
|---------|-------|
| Epics | 6 (E0-E5) |
| Stories | 29/29 concluídas |
| Story Points | ~114 SP |
| Testes | 648 passing |
| Build | `pnpm build` OK |

---

## Epic 0 — Infraestrutura de Testes + Middleware Guard ✅

| Story | Status | Testes |
|-------|--------|:------:|
| E0.S1 — Setup Vitest + Testing Library | ✅ Concluído | 4 |
| E0.S2 — MSW para OpenRouter | ✅ Concluído | 11 |
| E0.S3 — Middleware Guard (Supabase opcional) | ✅ Concluído | 4 |

---

## Epic 1 — Foundation: Tipos, Data Layer, OpenRouter Client, Store ✅

| Story | Status | Testes |
|-------|--------|:------:|
| E1.S1 — Tipos TypeScript + Schemas Zod | ✅ Concluído | 56 |
| E1.S2 — YAML Data Loader com cache | ✅ Concluído | 21 |
| E1.S3 — Validação centralizada de env vars | ✅ Concluído | 25 |
| E1.S4 — OpenRouter Client com timeout | ✅ Concluído | 7 |
| E1.S5 — Prompts dos agentes do squad | ✅ Concluído | 37 |
| E1.S6 — ScanStore Interface + In-Memory | ✅ Concluído | 21 |

---

## Epic 2 — AI Engine: Pipeline LLM + API Routes ✅

| Story | Status | Testes |
|-------|--------|:------:|
| E2.S1a — Pipeline Core (5 chamadas sequenciais) | ✅ Concluído | 18 |
| E2.S1b — Resiliência (timeout, circuit breaker, fallback) | ✅ Concluído | 13 |
| E2.S2 — Validadores de Pipeline + Barreira Estratégica | ✅ Concluído | 41 |
| E2.S3 — Sanitização de Input | ✅ Concluído | 34 |
| E2.S4 — Rate Limiter In-Memory | ✅ Concluído | 10 |
| E2.S5 — API Routes com SSE | ✅ Concluído | 25 |

---

## Epic 3 — Scan Form: Formulário Multi-Step ✅

| Story | Status | Testes |
|-------|--------|:------:|
| E3.S1 — Estrutura do Form + Navegação Multi-Step | ✅ Concluído | 16 |
| E3.S2 — Steps 1-2: Seleção de Setor + Info Empresa | ✅ Concluído | 38 |
| E3.S3 — Steps 3-4: Perguntas do Setor + Processos | ✅ Concluído | 32 |
| E3.S4 — Step 5: Revisão + Submit + Loading SSE | ✅ Concluído | 34 |

---

## Epic 4a — Landing Page ✅

| Story | Status | Testes |
|-------|--------|:------:|
| E4a.S1 — Hero + How It Works + CTA | ✅ Concluído | 35 |
| E4a.S2 — Value Cards + Sector Showcase + SEO | ✅ Concluído | 20 |

---

## Epic 4b — Report Page ✅

| Story | Status | Testes |
|-------|--------|:------:|
| E4b.S1 — Estrutura + Estados (200/202/404/500) | ✅ Concluído | 10 |
| E4b.S2a — Seções de Dados (Loss Aversion + Tabela + Top 3) | ✅ Concluído | 33 |
| E4b.S2b — Custo de Inação + CTA (Dopamine Sequence) | ✅ Concluído | 19 |
| E4b.S3 — Lead Capture Modal | ✅ Concluído | 18 |

---

## Epic 5 — Supabase + LGPD + Deploy ✅

| Story | Status | Testes |
|-------|--------|:------:|
| E5.S1 — Schema Supabase + Migrations + RLS | ✅ Concluído | 41 |
| E5.S2 — ScanStore Supabase + Swap Transparente | ✅ Concluído | 27 |
| E5.S3 — LGPD Compliance | ✅ Concluído | 25 |
| E5.S4 — Deploy Vercel + E2E + Polish | ✅ Concluído | — |

---

## Como Testar

### 1. Rodar testes unitários
```bash
pnpm test              # Roda todos os 648 testes
pnpm test:watch        # Modo watch (re-roda ao salvar)
pnpm test:coverage     # Testes com relatório de cobertura
```

### 2. Rodar o app em dev
```bash
# Criar .env com as variáveis obrigatórias (copiar de .env.example)
cp .env.example .env
# Preencher: OPENROUTER_API_KEY, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_CTA_URL

pnpm dev               # Inicia em http://localhost:3000
```

### 3. Fluxo manual completo
1. Abrir `http://localhost:3000` — Landing page
2. Clicar "Comece Agora" → `/scan`
3. Step 1: Selecionar um setor
4. Step 2: Preencher dados da empresa
5. Step 3: Responder perguntas do setor
6. Step 4: Mapear 3+ processos
7. Step 5: Revisar e clicar "Gerar Diagnóstico"
8. Aguardar loading com progresso real (SSE)
9. Ver report com 10 oportunidades rankeadas
10. Clicar CTA → Modal de lead capture

### 4. Testar sem Supabase (in-memory store)
Não precisa configurar Supabase — o middleware guard + store swap funcionam automaticamente. Dados ficam em memória (perdem ao reiniciar).

### 5. Testar com Supabase
```bash
# Adicionar ao .env:
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Rodar migrations:
supabase db push
```

### 6. Build de produção
```bash
pnpm build            # Build Next.js (deve passar sem erros)
pnpm start            # Inicia em modo produção
```

### 7. E2E (quando tiver servidor rodando)
```bash
npx playwright install  # Instalar browsers (primeira vez)
pnpm test:e2e           # Rodar testes E2E (precisa de pnpm dev rodando)
```

---

## Env Vars Necessárias

| Variável | Obrigatória | Descrição |
|----------|:-----------:|-----------|
| `OPENROUTER_API_KEY` | ✅ | Chave da API OpenRouter |
| `OPENROUTER_MODEL` | — | Default: `google/gemini-2.0-flash-lite-001` |
| `NEXT_PUBLIC_SITE_URL` | ✅ | URL do site (referer header) |
| `NEXT_PUBLIC_CTA_URL` | ✅ | URL do CTA (WhatsApp/Calendly) |
| `OPENROUTER_TIMEOUT_MS` | — | Default: 30000 (30s) |
| `OPENROUTER_MAX_RETRIES` | — | Default: 3 |
| `OPENROUTER_FALLBACK_MODEL` | — | Modelo fallback (opcional) |
| `RATE_LIMIT_PER_IP` | — | Default: 5 scans/hora |
| `NEXT_PUBLIC_SUPABASE_URL` | — | Phase 5 (Supabase) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | Phase 5 (Supabase) |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Phase 5 (server-side) |

---

## Decisões Técnicas

| Data | Decisão |
|------|---------|
| 2026-03-23 | Guard no middleware — app funciona sem Supabase (Phases 0-4) |
| 2026-03-23 | Report completo sem gate — todas 10 oportunidades liberadas |
| 2026-03-23 | Quick-scan mode diferido para v2 |
| 2026-03-23 | SSE via ReadableStream (não EventSource) — melhor controle |
| 2026-03-23 | Adapter pattern no store — swap memory↔Supabase transparente |
| 2026-03-23 | Pipeline validators: Zod (estrutural) + regex (barreira estratégica) |
| 2026-03-23 | Focus trap manual no modal (sem lib externa) |
| 2026-03-23 | Zod v4 com schemas de contrato entre fases do pipeline |
| 2026-03-24 | maxDuration: 120 na rota /api/scan (requer Vercel Pro) |

---

## v2 (Backlog Futuro)

| Feature | Prioridade |
|---------|-----------|
| Quick-scan mode (top 5, report resumido) | Alta |
| Campos expandidos no form (budget, revenue, growth) | Média |
| Email automático pós-lead (Resend/SendGrid) | Alta |
| Analytics de funil (Posthog/Vercel Analytics) | Média |
| Admin dashboard para leads | Média |
| Share button no report (WhatsApp/LinkedIn) | Média |
| PDF export do diagnóstico | Baixa |
| Deep-dive em oportunidade específica | Média |
| A/B testing no CTA | Baixa |
