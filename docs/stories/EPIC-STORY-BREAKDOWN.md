# EI-GAP AI Scanner -- Epic & Story Breakdown (v2)

> **Gerado por:** @pm (Morgan) | **Data:** 2026-03-23
> **Plano base:** `ei-gap-revised-plan.md` v2 (com feedback de 5 agentes)
> **Metodologia:** Story-Driven Development + TDD (NON-NEGOTIABLE)

---

## Sumario Executivo

| Item | Valor |
|------|-------|
| Epics | 6 (E0-E5) |
| Stories | 29 |
| Story Points totais | ~114 SP |
| Caminho critico | E0 -> E1 -> E2 -> E4b -> E5 |
| Paralelismo maximo | E3 + E4a (apos E1 concluido) |

---

## Decisoes do Owner (vinculantes)

| Decisao | Escolha | Impacto no Backlog |
|---------|---------|-------------------|
| Supabase na Phase 1? | NAO -- guard no middleware | E5 contem toda integracao Supabase |
| Lead gate parcial? | NAO -- report completo liberado | Sem stories de paywall/gate |
| Quick-scan mode | Diferido para v2 | Nenhuma story neste backlog |
| Campos expandidos (budget, revenue, growth) | Diferido para v2 | Form usa campos atuais apenas |

---

## Mapa de Dependencias

```
E0.S1 ─┬─> E0.S2 ─> E0.S3
       │
       └─> E1.S1 ─┬─> E1.S2
                   ├─> E1.S3
                   ├─> E1.S4 ──┐
                   ├─> E1.S5 ──┤  (paralelo: client + prompts)
                   └─> E1.S6   │
                         │     │
              E1.* done ─┤─────┘
                         │
                   ┌─────┴──────────────┐
                   │                    │
               E2.S1a ─> E2.S1b ─┐     │
                   │        │     │     │
                E2.S2 ──────┘     │     │
                                  │     │
                E2.S3 ───────────┤   E3.S1 ─> E3.S2 ─> E3.S3 ─> E3.S4
                                  │     │
                E2.S4 ───────────┤   E4a.S1 ─> E4a.S2
                                  │
                         E2.S5 ──┤
                                  │
                E2.* + E3.* ──────┴─> E4b.S1 ─> E4b.S2a ─> E4b.S2b ─> E4b.S3
                                                  │
                                 E4.* done ───────┴─> E5.S1 ─┬─> E5.S2 ─┐
                                                              └─> E5.S3 ─┤
                                                                          └─> E5.S4
```

---

## Caminho Critico

```
E0.S1 -> E0.S2 -> E1.S1 -> E1.S4 ─┐
                            E1.S5 ─┘-> E2.S1a -> E2.S1b -> E2.S2 -> E2.S5 -> E4b.S1 -> E4b.S2a -> E4b.S2b -> E5.S1 -> E5.S2 -> E5.S4
```

**Duracao estimada do caminho critico:** ~72 SP (otimizado: E1.S4//E1.S5 em paralelo economiza ~2 SP)

---

## Paralelismo Possivel

| Janela | Stories em paralelo | Condicao |
|--------|---------------------|----------|
| Apos E1 completo | E2.S1a + E3.S1 + E4a.S1 | Independentes entre si |
| Dentro de E1 | E1.S4 // E1.S5 | Client e prompts sao independentes (ambos dependem de E1.S1) |
| Dentro de E2 | E2.S1a // E2.S3 // E2.S4 | Pipeline core, sanitizer e rate limit sao independentes |
| Apos E2 + E3 completos | E4b.S1 (report) | Depende de API + form |
| Dentro de E5 | E5.S3 (LGPD) // E5.S2 (Supabase store) apos E5.S1 | Independentes |

---

# EPIC 0: Infraestrutura de Testes + Middleware Guard

> **Objetivo:** Estabelecer fundacao TDD e desbloquear desenvolvimento sem Supabase.
> **Justificativa:** TDD e NON-NEGOTIABLE (Constitution). Middleware guard permite iterar sem Supabase ate Phase 5.

| Campo | Valor |
|-------|-------|
| ID | E0 |
| Titulo | Infraestrutura de Testes + Middleware Guard |
| Dependencias | Nenhuma (primeiro epic) |
| AC do Epic | Vitest configurado e rodando; MSW interceptando chamadas; middleware funciona com e sem Supabase; `pnpm test` e `pnpm build` passam sem erro |

---

### E0.S1 -- Configuracao Vitest + Testing Library

| Campo | Valor |
|-------|-------|
| ID | E0.S1 |
| Titulo | Setup Vitest com React Testing Library |
| User Story | Como desenvolvedor, quero uma suite de testes configurada com Vitest e React Testing Library, para poder praticar TDD desde o primeiro dia. |
| Prioridade | P0 |
| Estimativa | 2 SP |
| Dependencias | Nenhuma |

**Criterios de Aceitacao:**

- [ ] `vitest.config.ts` criado com plugin React e path aliases configurados
- [ ] `src/test/setup.ts` criado com imports de `@testing-library/jest-dom`
- [ ] Dependencias instaladas: `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `vitest-axe`
- [ ] Scripts adicionados ao `package.json`: `test`, `test:watch`, `test:coverage`
- [ ] `pnpm test` executa sem erro (0 tests, 0 failures)
- [ ] `pnpm build` continua passando apos as mudancas
- [ ] Teste smoke criado (`src/test/smoke.test.ts`) que valida setup funcional

**Notas Tecnicas:**
- Arquivos: `vitest.config.ts`, `src/test/setup.ts`, `src/test/smoke.test.ts`, `package.json`
- Usar `@vitejs/plugin-react` para JSX transform
- Configurar `globals: true` no vitest para nao precisar importar `describe/it/expect`

---

### E0.S2 -- MSW (Mock Service Worker) para OpenRouter

| Campo | Valor |
|-------|-------|
| ID | E0.S2 |
| Titulo | Setup MSW para mock de chamadas OpenRouter |
| User Story | Como desenvolvedor, quero mocks de API do OpenRouter via MSW, para testar o pipeline LLM sem depender de chamadas reais. |
| Prioridade | P0 |
| Estimativa | 3 SP |
| Dependencias | E0.S1 |

> **Nota SM:** Fixtures iniciais usam formato placeholder. Quando E1.S1 (tipos Zod) estiver pronto, fixtures devem ser atualizadas para alinhar com os schemas reais. Isso é debt intencional para não bloquear o setup de MSW.

**Criterios de Aceitacao:**

- [ ] `msw` instalado como devDependency
- [ ] `src/test/mocks/handlers.ts` criado com handler para `POST https://openrouter.ai/api/v1/chat/completions`
- [ ] `src/test/mocks/server.ts` criado com setup/teardown
- [ ] `src/test/fixtures/` criado com pelo menos 1 fixture de resposta LLM por fase (5 fixtures)
- [ ] Teste de integracao: MSW intercepta chamada ao OpenRouter e retorna fixture
- [ ] MSW integrado no `src/test/setup.ts` (beforeAll/afterEach/afterAll)
- [ ] Fixtures seguem o formato real da API do OpenRouter (campo `choices[0].message.content`)

**Notas Tecnicas:**
- Arquivos: `src/test/mocks/handlers.ts`, `src/test/mocks/server.ts`, `src/test/fixtures/*.json`
- Fixtures devem cobrir: intake (Call 1), extraction (Call 2), scoring (Call 3), ranking (Call 4), report (Call 5)
- Handler deve suportar respostas diferentes baseado no system prompt (para testes de fases diferentes)

---

### E0.S3 -- Middleware Guard (Supabase opcional)

| Campo | Valor |
|-------|-------|
| ID | E0.S3 |
| Titulo | Guard clause no middleware para funcionar sem Supabase |
| User Story | Como desenvolvedor, quero que o app funcione sem env vars de Supabase configuradas, para iterar rapido nas Phases 0-4 sem depender de banco de dados. |
| Prioridade | P0 |
| Estimativa | 2 SP |
| Dependencias | E0.S1 |

**Criterios de Aceitacao:**

- [ ] `src/middleware.ts` implementado com guard clause: se `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` ausentes, retorna `NextResponse.next()` sem tocar em Supabase
- [ ] Quando env vars de Supabase estao presentes, middleware executa autenticacao normalmente
- [ ] Teste unitario: middleware sem env vars retorna passthrough
- [ ] Teste unitario: middleware com env vars chama `createServerClient`
- [ ] `pnpm build` passa sem env vars de Supabase
- [ ] `pnpm dev` inicia sem env vars de Supabase sem crashar
- [ ] Matcher configurado para excluir assets estaticos

**Notas Tecnicas:**
- Arquivo: `src/middleware.ts`
- Pattern: early return com `NextResponse.next({ request })` quando env vars ausentes
- Manter matcher existente para excluir `_next/static`, `_next/image`, `favicon.ico`, assets

---

# EPIC 1: Foundation -- Tipos, Data Layer, OpenRouter Client, Store

> **Objetivo:** Criar toda a camada de dados, tipos, cliente OpenRouter e store adapter.
> **Justificativa:** Tudo que vem depois (engine, form, report) depende destes building blocks.

| Campo | Valor |
|-------|-------|
| ID | E1 |
| Titulo | Foundation -- Estrutura, OpenRouter Client, Data Layer, Types |
| Dependencias | E0 completo |
| AC do Epic | Tipos definidos; YAML loader funcional; OpenRouter client com timeout; ScanStore interface + implementacao in-memory; validacao de env vars; todos os testes passam |

---

### E1.S1 -- Tipos TypeScript + Schemas Zod

| Campo | Valor |
|-------|-------|
| ID | E1.S1 |
| Titulo | Definicao de tipos e schemas de validacao |
| User Story | Como desenvolvedor, quero tipos TypeScript e schemas Zod para todas as entidades do sistema, para ter type safety e validacao em runtime. |
| Prioridade | P0 |
| Estimativa | 3 SP |
| Dependencias | E0.S1 |

**Criterios de Aceitacao:**

- [ ] `src/types/scanner.ts` criado com interfaces: `BusinessProfile`, `ScoredOpportunity`, `RankedOpportunity`, `ScanReport`, `ScanFormData`, `LeadData`, `PhaseEvent`, `ScanStatus`
- [ ] `src/lib/validators/form-validators.ts` criado com Zod schemas: `scanFormSchema`, `leadSchema`
- [ ] Zod schema valida corretamente input valido (teste com dados reais do sector-profiles.yaml)
- [ ] Zod schema rejeita input invalido: campos ausentes, tipos errados, string vazia onde obrigatorio
- [ ] Zod schema aplica limites: textarea max 500 chars, nome/empresa max 200 chars
- [ ] Schemas intermediarios definidos: `businessProfileSchema`, `processMapSchema`, `scoredOpportunitiesSchema`, `rankedOpportunitiesSchema`
- [ ] Testes escritos ANTES da implementacao (TDD)
- [ ] `pnpm typecheck` passa

**Notas Tecnicas:**
- Arquivos: `src/types/scanner.ts`, `src/lib/validators/form-validators.ts`, `src/lib/validators/__tests__/form-validators.test.ts`
- Schemas intermediarios sao usados como contract tests entre fases do pipeline (E2)
- `zod` deve ser instalado como dependencia

---

### E1.S2 -- YAML Data Loader

| Campo | Valor |
|-------|-------|
| ID | E1.S2 |
| Titulo | Loader de dados YAML com cache |
| User Story | Como desenvolvedor, quero um loader que parse os arquivos YAML do squad (setores, oportunidades, scoring), para alimentar o pipeline LLM com dados estruturados. |
| Prioridade | P0 |
| Estimativa | 3 SP |
| Dependencias | E1.S1 |

**Criterios de Aceitacao:**

- [ ] `src/lib/data/loader.ts` criado com funcoes: `getSectorProfiles()`, `getOpportunitiesCatalog()`, `getScoringCriteria()`
- [ ] `getSectorProfiles()` retorna 8 setores + generico (conforme `sector-profiles.yaml`)
- [ ] `getOpportunitiesCatalog()` retorna catalogo de 23 oportunidades
- [ ] `getScoringCriteria()` retorna criterios de scoring completos
- [ ] Cache module-level implementado (nao re-parse a cada chamada)
- [ ] Funcao auxiliar `getSectorBySlug(slug)` retorna setor especifico ou generico como fallback
- [ ] Testes escritos ANTES da implementacao (TDD)
- [ ] Teste valida contagem exata de setores, oportunidades e criterios

**Notas Tecnicas:**
- Arquivos: `src/lib/data/loader.ts`, `src/lib/data/__tests__/loader.test.ts`
- Dependencia: `yaml` (instalar)
- Dados fonte: `ai-scanner/data/sector-profiles.yaml`, `ai-scanner/data/ai-opportunities-catalog.yaml`, `ai-scanner/data/scoring-criteria.yaml`

---

### E1.S3 -- Validacao Centralizada de Env Vars

| Campo | Valor |
|-------|-------|
| ID | E1.S3 |
| Titulo | Config com validacao de env vars via Zod |
| User Story | Como desenvolvedor, quero validacao centralizada de env vars com fail fast, para detectar configuracao ausente no startup e nao em runtime. |
| Prioridade | P0 |
| Estimativa | 2 SP |
| Dependencias | E1.S1 |

**Criterios de Aceitacao:**

- [ ] `src/lib/config.ts` criado com schema Zod para todas as env vars
- [ ] Env vars obrigatorias (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `NEXT_PUBLIC_SITE_URL`) causam erro claro se ausentes
- [ ] Env vars opcionais (`OPENROUTER_TIMEOUT_MS`, `OPENROUTER_MAX_RETRIES`, `RATE_LIMIT_PER_IP`) tem defaults sensatos
- [ ] Env vars de Supabase sao opcionais (guard pattern do E0.S3)
- [ ] `.env.example` criado com todas as env vars documentadas
- [ ] Teste: env vars ausentes obrigatorias lancam erro com mensagem descritiva
- [ ] Teste: env vars opcionais usam defaults quando ausentes
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/lib/config.ts`, `src/lib/config/__tests__/config.test.ts`, `.env.example`
- Defaults: `OPENROUTER_TIMEOUT_MS=30000`, `OPENROUTER_MAX_RETRIES=3`, `RATE_LIMIT_PER_IP=5`

---

### E1.S4 -- OpenRouter Client

| Campo | Valor |
|-------|-------|
| ID | E1.S4 |
| Titulo | Cliente OpenRouter com SDK OpenAI + timeout |
| User Story | Como desenvolvedor, quero um cliente OpenRouter encapsulado com timeout por chamada, para fazer chamadas LLM de forma resiliente. |
| Prioridade | P0 |
| Estimativa | 3 SP |
| Dependencias | E1.S1, E1.S3 |

**Criterios de Aceitacao:**

- [ ] `src/lib/openrouter/client.ts` criado usando OpenAI SDK apontando para `https://openrouter.ai/api/v1`
- [ ] Funcao `chatCompletion(systemPrompt, userMessage, options?)` exportada
- [ ] Timeout por chamada configuravel via `OPENROUTER_TIMEOUT_MS` (default 30s) usando AbortController
- [ ] Headers do OpenRouter incluidos: `HTTP-Referer`, `X-Title`
- [ ] Modelo configuravel via `OPENROUTER_MODEL` env var
- [ ] Teste com MSW: chamada bem-sucedida retorna content
- [ ] Teste com MSW: timeout de 30s dispara AbortError (MSW com delay)
- [ ] Teste com MSW: resposta 429 retorna erro com info de rate limit
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/lib/openrouter/client.ts`, `src/lib/openrouter/__tests__/client.test.ts`
- Dependencia: `openai` (instalar)
- Usar `AbortController` com `setTimeout` para timeout por chamada
- Nao implementar retry aqui -- retry fica no pipeline (E2)

---

### E1.S5 -- Prompts dos Agentes

| Campo | Valor |
|-------|-------|
| ID | E1.S5 |
| Titulo | Extracao de system prompts dos agentes do squad |
| User Story | Como desenvolvedor, quero system prompts extraidos dos markdown dos agentes, para injetar nas chamadas LLM com contexto correto. |
| Prioridade | P0 |
| Estimativa | 2 SP |
| Dependencias | E1.S1, E1.S2 |

> **Nota SM:** Prompts são strings que dependem de tipos (E1.S1) e do data loader (E1.S2) para injetar contexto de setor. NÃO dependem do OpenRouter client (E1.S4). Isso permite paralelismo: E1.S4 (client) e E1.S5 (prompts) rodam em paralelo após E1.S1+E1.S2.

**Criterios de Aceitacao:**

- [ ] `src/lib/openrouter/prompts.ts` criado com funcoes que retornam system prompts por fase
- [ ] Cada prompt inclui: PERSONA, THINKING DNA, HEURISTICS relevantes do agente
- [ ] Prompt da Call 1 (intake) inclui contexto de `sector-profiles.yaml` (setor detectado)
- [ ] Prompt da Call 5 (report) inclui regras da barreira estrategica + template do report
- [ ] Testes validam que cada prompt contem secoes obrigatorias (PERSONA, THINKING DNA)
- [ ] Testes validam que prompt da Call 5 contem termos da barreira estrategica
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/lib/openrouter/prompts.ts`, `src/lib/openrouter/__tests__/prompts.test.ts`
- Fontes: `ai-scanner/agents/scanner-chief.md`, `business-analyst.md`, `process-architect.md`, `growth-strategist.md`
- Cada funcao recebe contexto dinamico (setor, dados anteriores) e retorna string

---

### E1.S6 -- ScanStore Interface + Implementacao In-Memory

| Campo | Valor |
|-------|-------|
| ID | E1.S6 |
| Titulo | Adapter pattern para store com implementacao in-memory |
| User Story | Como desenvolvedor, quero uma interface de store com implementacao in-memory, para desenvolver sem Supabase e trocar transparentemente na Phase 5. |
| Prioridade | P0 |
| Estimativa | 3 SP |
| Dependencias | E1.S1 |

**Criterios de Aceitacao:**

- [ ] `src/lib/store/interface.ts` criado com interface `ScanStore`: `saveScan()`, `getScan()`, `updateScanStatus()`, `saveReport()`, `getReport()`, `saveLead()`
- [ ] `src/lib/store/memory.ts` criado implementando `ScanStore` com `Map`
- [ ] TTL de 1h implementado no store in-memory (evitar memory leak em serverless)
- [ ] `src/lib/store/index.ts` re-exporta: usa memory por default, Supabase quando env vars presentes
- [ ] Teste: CRUD completo (save -> get -> update -> get -> delete)
- [ ] Teste: items expiram apos TTL (usar fake timers)
- [ ] Teste: interface e respeitada (todos os metodos existem e retornam tipos corretos)
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/lib/store/interface.ts`, `src/lib/store/memory.ts`, `src/lib/store/index.ts`, `src/lib/store/__tests__/memory.test.ts`
- Pattern: Strategy pattern -- interface define contrato, implementacoes sao intercambiaveis
- TTL: usar `setTimeout` para limpeza ou checagem lazy no `get()`

---

# EPIC 2: AI Engine -- Pipeline de 5 Chamadas LLM + APIs

> **Objetivo:** Implementar o core do produto: pipeline de diagnostico com 5 chamadas LLM sequenciais, SSE streaming, resiliencia e API routes.
> **Justificativa:** O pipeline e o diferencial do produto. Sem ele, nao ha diagnostico.

| Campo | Valor |
|-------|-------|
| ID | E2 |
| Titulo | AI Engine -- Pipeline LLM + API Routes |
| Dependencias | E1 completo |
| AC do Epic | Pipeline completo funcionando com 5 chamadas; SSE streaming; veto/retry; rate limiting; sanitizacao; todas as API routes funcionais; todos os testes passam |

---

### E2.S1a -- Pipeline Core (5 chamadas sequenciais)

| Campo | Valor |
|-------|-------|
| ID | E2.S1a |
| Titulo | Orquestrador do pipeline de 5 chamadas LLM |
| User Story | Como sistema, quero executar 5 chamadas LLM sequenciais seguindo o workflow do squad, para gerar um diagnostico completo de oportunidades de IA. |
| Prioridade | P0 |
| Estimativa | 5 SP |
| Dependencias | E1.S4, E1.S5, E1.S2 |

**Criterios de Aceitacao:**

- [ ] `src/lib/engine/pipeline.ts` criado com `runDiagnosis(formData, store, llmClient?) -> AsyncGenerator<PhaseEvent>`
- [ ] Pipeline executa 5 fases sequenciais: intake -> extraction -> scoring -> ranking -> report
- [ ] Cada fase emite eventos `PhaseEvent`: `phase_start`, `phase_complete`, `phase_retry`, `scan_complete`, `scan_error`
- [ ] Output de cada fase e validado com schema Zod antes de passar para a proxima (contract test)
- [ ] Veto conditions implementadas por fase (conforme plano v2): re-run ate max retries (default 3)
- [ ] **PRE-REQUISITO:** Benchmark do modelo — executar 1 chamada real por fase com prompts reais, validar que output é utilizável. Documentar resultado em `docs/model-benchmark.md`. Se insuficiente, atualizar `OPENROUTER_MODEL` no `.env.example`.
- [ ] Teste com MSW: pipeline completo retorna `ScanReport` valido
- [ ] Teste: veto condition trigga retry corretamente
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/lib/engine/pipeline.ts`, `src/lib/engine/__tests__/pipeline.test.ts`
- AsyncGenerator permite streaming de eventos para o SSE
- Injetar `llmClient` como parametro para facilitar testes com MSW

---

### E2.S1b -- Resiliencia do Pipeline (timeout, circuit breaker, fallback)

| Campo | Valor |
|-------|-------|
| ID | E2.S1b |
| Titulo | Mecanismos de resiliencia no pipeline LLM |
| User Story | Como sistema, quero que o pipeline tenha timeout total, circuit breaker e fallback de modelo, para nao travar o usuario indefinidamente quando a API falhar. |
| Prioridade | P0 |
| Estimativa | 3 SP |
| Dependencias | E2.S1a |

**Criterios de Aceitacao:**

- [ ] Timeout total do pipeline: 120s (aborta se exceder, emite `scan_error`)
- [ ] Max retries por fase configuravel via `OPENROUTER_MAX_RETRIES` env var (default 3)
- [ ] Circuit breaker: 3 chamadas consecutivas falhando -> abort com erro claro ao usuario
- [ ] Fallback de modelo: se primary falha com erro de modelo -> tenta `OPENROUTER_FALLBACK_MODEL` se configurado
- [ ] Backoff exponencial com jitter no retry de rate limit (429)
- [ ] Teste: max retries excedido -> erro (nao loop infinito)
- [ ] Teste: timeout total de 120s respeitado (fake timers)
- [ ] Teste: circuit breaker aborta apos 3 falhas consecutivas
- [ ] Teste: fallback model e tentado quando primary falha
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: atualizar `src/lib/engine/pipeline.ts`, `src/lib/engine/__tests__/pipeline-timeout.test.ts`, `src/lib/engine/__tests__/pipeline-retry.test.ts`
- Separar resiliencia da logica de negocio para facilitar testes independentes

---

### E2.S2 -- Validadores de Pipeline + Barreira Estrategica

| Campo | Valor |
|-------|-------|
| ID | E2.S2 |
| Titulo | Validacao pos-LLM e barreira estrategica por regex |
| User Story | Como sistema, quero validar o output de cada fase LLM e enforcement da barreira estrategica, para garantir qualidade do diagnostico e proteger IP. |
| Prioridade | P0 |
| Estimativa | 5 SP |
| Dependencias | E2.S1a |

**Criterios de Aceitacao:**

- [ ] `src/lib/engine/pipeline-validators.ts` criado com validador por fase
- [ ] Call 1: rejeita se < 5 campos ou setor nao identificado
- [ ] Call 2: rejeita se processos genericos, < 5 mapeados, sem Pareto
- [ ] Call 3: rejeita se score sem criterios fixos ou sem guardrails
- [ ] Call 4: rejeita se sem ROI ou sem loss aversion
- [ ] Call 5: rejeita se contem detalhes de implementacao ou sem CTA
- [ ] Regex de barreira estrategica implementado: detecta termos proibidos ("passo a passo", "implementacao:", "configurar", "setup", "cronjob", "API key", "codigo", "deploy")
- [ ] Se barreira falha apos max retries: strip da secao vazada do output
- [ ] Teste: cada veto condition trigga corretamente com input malformado
- [ ] Teste: barreira estrategica detecta todos os termos proibidos
- [ ] Teste: strip de secao vazada funciona como fallback
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/lib/engine/pipeline-validators.ts`, `src/lib/engine/__tests__/pipeline-validators.test.ts`
- Regex case-insensitive para termos proibidos
- Strip: remover paragrafos inteiros que contenham termos proibidos

---

### E2.S3 -- Sanitizacao de Input

| Campo | Valor |
|-------|-------|
| ID | E2.S3 |
| Titulo | Sanitizacao de input contra prompt injection |
| User Story | Como sistema, quero sanitizar todo input do usuario antes de injetar nos prompts LLM, para prevenir prompt injection e garantir seguranca. |
| Prioridade | P0 |
| Estimativa | 3 SP |
| Dependencias | E1.S1 |

**Criterios de Aceitacao:**

- [ ] `src/lib/engine/sanitizer.ts` criado com funcao `sanitizeFormData(formData) -> SanitizedFormData`
- [ ] Remove caracteres de controle (ASCII 0-31 exceto newline/tab)
- [ ] Limita tamanho por campo: textarea 500 chars, nome/empresa 200 chars
- [ ] Envolve user input em delimitadores: `<user_input>...</user_input>`
- [ ] Detecta e neutraliza payloads comuns de prompt injection: "ignore previous instructions", "system:", "assistant:"
- [ ] Teste: input limpo passa inalterado (exceto delimitadores)
- [ ] Teste: caracteres de controle sao removidos
- [ ] Teste: campos longos sao truncados no limite
- [ ] Teste: payloads de prompt injection sao neutralizados
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/lib/engine/sanitizer.ts`, `src/lib/engine/__tests__/sanitizer.test.ts`
- Nao usar blocklist exaustiva -- focar em sanitizacao estrutural (delimitadores + truncamento + controle chars)

---

### E2.S4 -- Rate Limiter In-Memory

| Campo | Valor |
|-------|-------|
| ID | E2.S4 |
| Titulo | Rate limiting por IP para rota /api/scan |
| User Story | Como sistema, quero limitar scans por IP para 5/hora, para prevenir abuso e controlar custos de API. |
| Prioridade | P0 |
| Estimativa | 2 SP |
| Dependencias | E1.S1 |

**Criterios de Aceitacao:**

- [ ] `src/lib/rate-limit.ts` criado com funcao `checkRateLimit(ip: string) -> { allowed: boolean, remaining: number, resetAt: Date }`
- [ ] Limite: 5 scans por IP por hora (configuravel via `RATE_LIMIT_PER_IP`)
- [ ] Sliding window ou fixed window implementado
- [ ] Limpeza automatica de entries antigas (evitar memory leak)
- [ ] Headers de rate limit retornados: `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- [ ] Teste: 5 requests passam, 6o e bloqueado
- [ ] Teste: apos 1h, contador reseta
- [ ] Teste: IPs diferentes tem contadores independentes
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/lib/rate-limit.ts`, `src/lib/__tests__/rate-limit.test.ts`
- Usar `Map<string, { count: number, windowStart: number }>` com limpeza lazy

---

### E2.S5 -- API Routes (scan, report, sectors, lead)

| Campo | Valor |
|-------|-------|
| ID | E2.S5 |
| Titulo | API routes com SSE streaming |
| User Story | Como frontend, quero API routes para iniciar scan (SSE), consultar report, listar setores e capturar leads, para integrar com a UI. |
| Prioridade | P0 |
| Estimativa | 5 SP |
| Dependencias | E2.S1a, E2.S1b, E2.S2, E2.S3, E2.S4, E1.S6 |

**Criterios de Aceitacao:**

- [ ] `POST /api/scan` implementado com SSE (`Content-Type: text/event-stream`)
- [ ] SSE emite eventos por fase: `phase_start`, `phase_complete`, `phase_retry`, `scan_complete`, `scan_error`
- [ ] `POST /api/scan` aplica rate limiting (429 se excedido)
- [ ] `POST /api/scan` valida input com Zod (400 se invalido)
- [ ] `POST /api/scan` sanitiza input antes de passar ao pipeline
- [ ] `GET /api/report/[id]` retorna report JSON (200), processing (202), not found (404)
- [ ] `GET /api/sectors` retorna lista de setores do YAML loader
- [ ] `POST /api/lead` valida e salva lead data no store
- [ ] Teste: POST /api/scan com dados validos retorna stream SSE
- [ ] Teste: POST /api/scan com dados invalidos retorna 400
- [ ] Teste: GET /api/report com ID existente retorna 200
- [ ] Teste: GET /api/report com ID inexistente retorna 404
- [ ] Teste: rate limit retorna 429 apos 5 requests
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/app/api/scan/route.ts`, `src/app/api/report/[id]/route.ts`, `src/app/api/sectors/route.ts`, `src/app/api/lead/route.ts`
- Testes: `src/app/api/scan/__tests__/route.test.ts`, `src/app/api/report/__tests__/route.test.ts`
- SSE: usar `ReadableStream` + `TextEncoder` para streaming
- Rate limit: hash do IP (nao armazenar IP raw)

---

# EPIC 3: Scan Form -- Formulario Multi-Step (`/scan`)

> **Objetivo:** Interface do formulario de 5 passos para coleta de dados empresariais.
> **Justificativa:** O form e o ponto de entrada do usuario. UX e acessibilidade sao criticos para conversao.

| Campo | Valor |
|-------|-------|
| ID | E3 |
| Titulo | Scan Form -- Formulario Multi-Step |
| Dependencias | E1 completo (tipos, validators, data loader) |
| AC do Epic | Formulario de 5 steps funcional; validacao inline; navegacao por teclado; a11y zero violations; submit conectado ao /api/scan com SSE; redirect para report |

---

### E3.S1 -- Estrutura do Form + Navegacao Multi-Step

| Campo | Valor |
|-------|-------|
| ID | E3.S1 |
| Titulo | Componente ScanForm com state machine de 5 steps |
| User Story | Como usuario, quero um formulario de diagnostico com navegacao clara entre etapas, para preencher meus dados de forma organizada e sem perder informacao. |
| Prioridade | P0 |
| Estimativa | 5 SP |
| Dependencias | E1.S1, E1.S2 |

**Criterios de Aceitacao:**

- [ ] `src/app/scan/page.tsx` criado como Server Component (busca setores via loader)
- [ ] `src/app/scan/components/ScanForm.tsx` criado como Client Component com state machine de 5 steps
- [ ] Navegacao next/back entre steps funciona corretamente
- [ ] State preservado entre steps (voltar nao perde dados)
- [ ] Progress indicator com `aria-current="step"` e `aria-label`
- [ ] Focus management: auto-focus no primeiro input de cada step
- [ ] Validacao Zod inline por step: nao avanca se step invalido
- [ ] Botao "Voltar" disponivel em todos os steps exceto o primeiro
- [ ] Debounce no submit (prevenir duplo-clique)
- [ ] Teste: renderiza 5 steps, navegacao next/back funciona
- [ ] Teste: state e preservado entre steps
- [ ] Teste: validacao impede avancar com dados invalidos
- [ ] Teste a11y: axe-core zero violations critical/serious
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/app/scan/page.tsx`, `src/app/scan/components/ScanForm.tsx`, `src/app/scan/__tests__/ScanForm.test.tsx`
- Usar `useReducer` ou state machine (nao `useState` encadeado) para gerenciar 5 steps
- `prefers-reduced-motion` respeitado em transicoes entre steps

---

### E3.S2 -- Steps 1-2: Selecao de Setor + Info da Empresa

| Campo | Valor |
|-------|-------|
| ID | E3.S2 |
| Titulo | Steps de selecao de setor e informacoes da empresa |
| User Story | Como usuario, quero selecionar meu setor de atuacao e informar dados da minha empresa, para que o diagnostico seja relevante ao meu contexto. |
| Prioridade | P0 |
| Estimativa | 5 SP |
| Dependencias | E3.S1 |

**Criterios de Aceitacao:**

- [ ] `SectorGrid.tsx` criado com grid de 8 cards + "Outro" usando Spotlight Card do react-bits
- [ ] Spotlight Card com `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space)
- [ ] `prefers-reduced-motion` desativa animacao do Spotlight Card
- [ ] `BusinessInfoStep.tsx` criado com campos: nome da empresa, porte (employees), maturidade tech, ferramentas atuais
- [ ] Labels associados a todos os inputs (`htmlFor` + `id`)
- [ ] Error messages com `aria-describedby` e `role="alert"`
- [ ] Campos obrigatorios marcados com `aria-required="true"`
- [ ] Teste: selecao de setor atualiza state, keyboard navigation funciona
- [ ] Teste: campos obrigatorios impedem avancar quando vazios
- [ ] Teste a11y: axe-core zero violations em ambos os steps
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/app/scan/components/SectorGrid.tsx`, `src/app/scan/components/BusinessInfoStep.tsx`
- Testes: `src/app/scan/__tests__/SectorGrid.test.tsx`, `src/app/scan/__tests__/BusinessInfoStep.test.tsx`
- react-bits: copiar Spotlight Card component (self-contained)

---

### E3.S3 -- Steps 3-4: Perguntas do Setor + Mapeamento de Processos

| Campo | Valor |
|-------|-------|
| ID | E3.S3 |
| Titulo | Perguntas dinamicas por setor e mapeamento de processos |
| User Story | Como usuario, quero responder perguntas especificas do meu setor e mapear meus processos criticos, para que o diagnostico identifique oportunidades reais no meu negocio. |
| Prioridade | P0 |
| Estimativa | 5 SP |
| Dependencias | E3.S2 |

**Criterios de Aceitacao:**

- [ ] `SectorQuestionsStep.tsx` criado com 5 perguntas dinamicas de `sector-profiles.yaml` baseadas no setor selecionado
- [ ] Perguntas renderizadas com Animated Content do react-bits (`prefers-reduced-motion` respeitado)
- [ ] `ProcessMappingStep.tsx` criado com lista de processos: nome + tempo/semana + nivel de dor (1-5)
- [ ] Minimo 3, maximo 10 processos (validacao Zod)
- [ ] Animated List do react-bits para adicionar/remover processos (`prefers-reduced-motion` respeitado)
- [ ] Cada textarea limitada a 500 chars com contador visivel
- [ ] Teste: perguntas mudam quando setor selecionado muda
- [ ] Teste: adicionar/remover processos funciona, min 3 validado
- [ ] Teste a11y: axe-core zero violations
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/app/scan/components/SectorQuestionsStep.tsx`, `src/app/scan/components/ProcessMappingStep.tsx`
- Testes: `src/app/scan/__tests__/SectorQuestionsStep.test.tsx`, `src/app/scan/__tests__/ProcessMappingStep.test.tsx`

---

### E3.S4 -- Step 5: Revisao + Submit + Loading SSE

| Campo | Valor |
|-------|-------|
| ID | E3.S4 |
| Titulo | Revisao de dados, submit e tela de loading com progresso real |
| User Story | Como usuario, quero revisar meus dados antes de enviar e acompanhar o progresso do diagnostico em tempo real, para ter confianca no processo. |
| Prioridade | P0 |
| Estimativa | 5 SP |
| Dependencias | E3.S3, E2.S5 |

> **Nota SM:** Esta story tem dependencia cruzada entre epics (E3 form + E2 API). Para desbloquear desenvolvimento, os testes de ReviewStep e ScanLoading podem ser escritos com MSW mockando a API. O AC "submit chama API" é integração e deve ser validado por último, quando E2.S5 estiver pronto. Se E2 atrasar, essa story pode avançar até ~80% com mocks.

**Criterios de Aceitacao:**

- [ ] `ReviewStep.tsx` criado mostrando resumo de todos os dados preenchidos
- [ ] Botao "Editar" por secao que volta ao step correspondente
- [ ] Botao "Gerar Diagnostico" com Shiny Text do react-bits
- [ ] Submit chama `POST /api/scan` e inicia listener SSE (EventSource)
- [ ] `ScanLoading.tsx` criado com progresso real baseado em SSE events
- [ ] Loading mostra fase atual: "Analisando seu negocio...", "Mapeando processos...", etc.
- [ ] Count Up do react-bits para progresso percentual (`aria-live="polite"`)
- [ ] Redirect para `/report/{id}` ao receber evento `scan_complete`
- [ ] Em caso de `scan_error`: mensagem amigavel + botao "Tentar novamente"
- [ ] Teste: resumo mostra dados corretos de todos os steps
- [ ] Teste: submit chama API e inicia SSE
- [ ] Teste: progresso atualiza com SSE events
- [ ] Teste: redirect ao completar
- [ ] Teste: erro mostra mensagem amigavel
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/app/scan/components/ReviewStep.tsx`, `src/app/scan/components/ScanLoading.tsx`
- Testes: `src/app/scan/__tests__/ReviewStep.test.tsx`, `src/app/scan/__tests__/ScanLoading.test.tsx`
- Usar `EventSource` API nativa para consumir SSE
- Mensagens de progresso por fase mapeadas em constante

---

# EPIC 4a: Landing Page (`/`)

> **Objetivo:** Pagina de entrada que comunica proposta de valor e direciona para o scan.
> **Justificativa:** Primeira impressao. Conversao depende desta pagina.

| Campo | Valor |
|-------|-------|
| ID | E4a |
| Titulo | Landing Page |
| Dependencias | E1 completo (tipos, data loader para setores) |
| AC do Epic | Landing page responsiva com todas as secoes; CTAs apontando para /scan; SEO + OG tags; a11y zero violations |

---

### E4a.S1 -- Landing Page: Hero + How It Works + CTA

| Campo | Valor |
|-------|-------|
| ID | E4a.S1 |
| Titulo | Secoes principais da landing page |
| User Story | Como visitante, quero entender rapidamente o que o EI-GAP faz e como funciona, para decidir se quero fazer o diagnostico. |
| Prioridade | P0 |
| Estimativa | 5 SP |
| Dependencias | E1.S1 |

**Criterios de Aceitacao:**

- [ ] `src/app/page.tsx` criado como composicao de secoes
- [ ] `HeroSection.tsx` com proposta de valor + CTA "Comece Agora" apontando para `/scan`
- [ ] Aurora ou Silk background do react-bits com `prefers-reduced-motion`
- [ ] Gradient Text e Count Up (numero de oportunidades) com `aria-live`
- [ ] `HowItWorks.tsx` com 3 steps visuais do processo (Animated List)
- [ ] `CtaSection.tsx` com CTA final (Shiny Text)
- [ ] `Header.tsx` com logo + CTA nav + skip navigation link (`#main-content`)
- [ ] `Footer.tsx` minimo com links
- [ ] Heading hierarchy correta: h1 > h2 > h3
- [ ] Responsivo: mobile (375px), tablet (768px), desktop (1280px)
- [ ] Teste: renderiza todas as secoes, CTAs apontam para /scan
- [ ] Teste a11y: axe-core zero violations
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/app/page.tsx`, `src/components/landing/HeroSection.tsx`, `src/components/landing/HowItWorks.tsx`, `src/components/landing/CtaSection.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`
- Teste: `src/components/landing/__tests__/Landing.test.tsx`

---

### E4a.S2 -- Landing Page: Value Cards + Sector Showcase + SEO

| Campo | Valor |
|-------|-------|
| ID | E4a.S2 |
| Titulo | Cards de valor, showcase de setores e meta tags |
| User Story | Como visitante, quero ver os beneficios e setores atendidos, e como motor de busca, quero meta tags corretas para indexar a pagina. |
| Prioridade | P1 |
| Estimativa | 3 SP |
| Dependencias | E4a.S1 |

**Criterios de Aceitacao:**

- [ ] `ValueCards.tsx` com 3-4 feature cards usando Tilted Card do react-bits
- [ ] `SectorShowcase.tsx` mostrando 8 setores suportados (dados do YAML loader)
- [ ] Meta tags: title, description, OG image, OG title, OG description
- [ ] Schema.org structured data (JSON-LD) para SEO
- [ ] Contraste minimo 4.5:1 em todo texto
- [ ] `prefers-reduced-motion` em Tilted Card
- [ ] Teste: Value Cards renderizam com conteudo correto
- [ ] Teste: Sector Showcase mostra 8 setores
- [ ] Teste: meta tags presentes no head
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/components/landing/ValueCards.tsx`, `src/components/landing/SectorShowcase.tsx`
- Teste: `src/components/landing/__tests__/ValueCards.test.tsx`, `src/components/landing/__tests__/SectorShowcase.test.tsx`
- Usar `metadata` export do Next.js App Router para meta tags

---

# EPIC 4b: Report Page (`/report/[id]`)

> **Objetivo:** Pagina de resultado do diagnostico com sequencia de dopamine engineering.
> **Justificativa:** E a pagina que converte. Sequencia do report segue heuristicas do growth-strategist.

| Campo | Valor |
|-------|-------|
| ID | E4b |
| Titulo | Report Page |
| Dependencias | E2 completo (API routes), E3 completo (form submete scan) |
| AC do Epic | Report renderiza todas as 10 oportunidades; sequencia de dopamine engineering; lead capture modal; estados 200/202/404/500; a11y zero violations |

---

### E4b.S1 -- Report Page: Estrutura + Estados

| Campo | Valor |
|-------|-------|
| ID | E4b.S1 |
| Titulo | Estrutura do report com loading/error/404 states |
| User Story | Como usuario, quero acessar meu diagnostico por link direto e ver estados claros (carregando, erro, nao encontrado), para ter uma experiencia confiavel. |
| Prioridade | P0 |
| Estimativa | 5 SP |
| Dependencias | E2.S5 |

**Criterios de Aceitacao:**

- [ ] `src/app/report/[id]/page.tsx` criado como Server Component
- [ ] Estado 200: renderiza report completo
- [ ] Estado 202: loading spinner "Seu diagnostico esta sendo gerado..."
- [ ] Estado 404: pagina customizada "Diagnostico nao encontrado" com link para /scan
- [ ] Estado 500: error boundary com "Ocorreu um erro. Tente novamente."
- [ ] `ReportHeader.tsx` com empresa, setor, ROI total headline (Gradient Text)
- [ ] OG tags dinamicas por report: setor + ROI total (compartilhavel)
- [ ] Teste: renderiza com dados mockados
- [ ] Teste: 404 para ID inexistente
- [ ] Teste: 202 para report em processamento
- [ ] Teste: error boundary renderiza mensagem amigavel
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/app/report/[id]/page.tsx`, `src/app/report/[id]/components/ReportHeader.tsx`
- Testes: `src/app/report/__tests__/ReportPage.test.tsx`, `src/app/report/__tests__/ReportStates.test.tsx`
- Usar `generateMetadata` do Next.js para OG tags dinamicas

---

### E4b.S2a -- Report Page: Secoes de Dados (Loss Aversion + Tabela + Deep Dive)

| Campo | Valor |
|-------|-------|
| ID | E4b.S2a |
| Titulo | Secoes de dados do report: loss aversion, tabela de oportunidades, top 3 |
| User Story | Como usuario, quero ver o contraste emocional GANHA vs PERDE, a tabela completa de 10 oportunidades e o deep dive das top 3, para entender o valor do diagnostico. |
| Prioridade | P0 |
| Estimativa | 5 SP |
| Dependencias | E4b.S1 |

**Criterios de Aceitacao:**

- [ ] `LossAversionSection.tsx`: GANHA vs PERDE em 2 colunas com Count Up (`aria-live="polite"`)
- [ ] `OpportunitiesTable.tsx`: Top 10 tabela com scores, ROI ranges (`<th scope="col">` semantico)
- [ ] `TopThreeDeepDive.tsx`: Top 3 cards detalhados com Spotlight Card
- [ ] `prefers-reduced-motion` em TODOS os componentes animados
- [ ] Todas as 10 oportunidades exibidas (sem gate)
- [ ] Responsivo: mobile, tablet, desktop
- [ ] Teste: 10 oportunidades na tabela
- [ ] Teste: DOM do report NAO contem termos de implementacao (barreira estrategica)
- [ ] Teste a11y: axe-core zero violations
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/app/report/[id]/components/LossAversionSection.tsx`, `OpportunitiesTable.tsx`, `TopThreeDeepDive.tsx`
- Testes: `src/app/report/__tests__/StrategicBarrier.test.tsx`, `src/app/report/__tests__/a11y.test.tsx`

---

### E4b.S2b -- Report Page: Custo de Inacao + CTA (Dopamine Sequence Closure)

| Campo | Valor |
|-------|-------|
| ID | E4b.S2b |
| Titulo | Secoes de urgencia e conversao: custo de inacao e CTA |
| User Story | Como usuario, quero ver o custo de nao agir e um CTA claro para consultoria, para sentir urgencia e saber o proximo passo. |
| Prioridade | P0 |
| Estimativa | 3 SP |
| Dependencias | E4b.S2a |

**Criterios de Aceitacao:**

- [ ] `CostOfInaction.tsx`: custo mensal/semestral/anual com Count Up (`aria-live="polite"`)
- [ ] `ReportCta.tsx`: CTA consultoria com Shiny Text + URL configuravel via env var
- [ ] Sequencia DOM completa: ROI total -> Loss Aversion -> Top 10 -> Top 3 -> Custo de Inacao -> CTA
- [ ] `prefers-reduced-motion` em componentes animados
- [ ] Responsivo: mobile, tablet, desktop
- [ ] Teste: DOM order segue sequencia de dopamine engineering (validar order completa)
- [ ] Teste a11y: axe-core zero violations
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/app/report/[id]/components/CostOfInaction.tsx`, `ReportCta.tsx`
- Testes: `src/app/report/__tests__/DopamineSequence.test.tsx`

---

### E4b.S3 -- Lead Capture Modal

| Campo | Valor |
|-------|-------|
| ID | E4b.S3 |
| Titulo | Modal de captura de lead pos-report |
| User Story | Como usuario interessado, quero poder deixar meu contato apos ver o diagnostico, para ser contatado sobre implementacao. |
| Prioridade | P1 |
| Estimativa | 3 SP |
| Dependencias | E4b.S1 |

**Criterios de Aceitacao:**

- [ ] `LeadCaptureModal.tsx` criado com campos: email (obrigatorio), nome (opcional), empresa (opcional)
- [ ] Modal abre via botao no `ReportCta.tsx`
- [ ] Focus trap implementado: Tab cycle dentro do modal, Escape fecha
- [ ] `aria-modal="true"`, `role="dialog"`, `aria-labelledby` no modal
- [ ] Backdrop fecha modal ao clicar fora
- [ ] Validacao inline com Zod: email valido obrigatorio
- [ ] Submit chama `POST /api/lead` com `scan_id`
- [ ] Feedback visual: sucesso ("Obrigado!") ou erro ("Tente novamente")
- [ ] Teste: modal abre/fecha corretamente
- [ ] Teste: focus trap funciona (Tab, Shift+Tab, Escape)
- [ ] Teste: validacao rejeita email invalido
- [ ] Teste: submit bem-sucedido mostra mensagem de sucesso
- [ ] Teste a11y: axe-core zero violations
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/app/report/[id]/components/LeadCaptureModal.tsx`
- Testes: `src/app/report/__tests__/LeadCaptureModal.test.tsx`
- LGPD consent checkbox sera adicionado na E5.S3

---

# EPIC 5: Supabase + LGPD + Deploy

> **Objetivo:** Persistencia real, conformidade legal e deploy para producao.
> **Justificativa:** Sem persistencia, dados se perdem. Sem LGPD, risco legal. Sem deploy, ninguem usa.

| Campo | Valor |
|-------|-------|
| ID | E5 |
| Titulo | Supabase + LGPD + Deploy |
| Dependencias | E4a + E4b completos |
| AC do Epic | Dados persistidos no Supabase; RLS policies ativas; LGPD compliance; deploy funcional no Vercel; fluxo E2E completo |

---

### E5.S1 -- Schema Supabase + Migrations

| Campo | Valor |
|-------|-------|
| ID | E5.S1 |
| Titulo | Schema de banco de dados com migrations e RLS |
| User Story | Como sistema, quero um banco de dados Supabase com schema otimizado e RLS, para persistir scans, reports e leads de forma segura. |
| Prioridade | P0 |
| Estimativa | 5 SP |
| Dependencias | E4a + E4b completos |

**Criterios de Aceitacao:**

- [ ] `supabase/migrations/001_initial_schema.sql` criado com tabelas: `scans`, `reports`, `leads`
- [ ] Indices criados: `idx_scans_sector`, `idx_scans_status`, `idx_scans_created_at`, `idx_reports_scan_id`, `idx_leads_email_scan`
- [ ] RLS ativado em todas as tabelas
- [ ] Policies implementadas conforme plano v2: anon insert scans, anon read by id, lead insert requer lgpd_consent=true
- [ ] Trigger `update_updated_at` funcional em scans e reports
- [ ] Campo `ip_hash` em scans (hash, nao IP raw)
- [ ] `supabase db push` executa sem erro
- [ ] Teste: schema cria tabelas corretamente
- [ ] Teste: RLS bloqueia insert de lead sem lgpd_consent=true
- [ ] Teste: indices existem
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `supabase/migrations/001_initial_schema.sql`, `supabase/__tests__/migration.test.ts`
- Usar Supabase CLI local para testar migrations

---

### E5.S2 -- ScanStore Supabase + Swap Transparente

| Campo | Valor |
|-------|-------|
| ID | E5.S2 |
| Titulo | Implementacao Supabase do ScanStore com swap automatico |
| User Story | Como sistema, quero trocar de store in-memory para Supabase automaticamente quando env vars estiverem presentes, para persistir dados em producao sem mudar codigo. |
| Prioridade | P0 |
| Estimativa | 5 SP |
| Dependencias | E5.S1, E1.S6 |

**Criterios de Aceitacao:**

- [ ] `src/lib/store/supabase.ts` criado implementando interface `ScanStore`
- [ ] `src/lib/supabase/queries.ts` criado com funcoes: `saveScan`, `getReport`, `saveLead`, `updateScanStatus`
- [ ] `src/lib/store/index.ts` atualizado: detecta env vars Supabase -> usa supabase.ts, senao memory.ts
- [ ] Swap e transparente: nenhuma API route precisa mudar
- [ ] Teste: CRUD via Supabase local funciona
- [ ] Teste: interface e compativel com memory store (mesmos metodos, mesmos tipos)
- [ ] Teste: com env vars -> Supabase; sem -> memory (swap test)
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/lib/store/supabase.ts`, `src/lib/supabase/queries.ts`, `src/lib/store/index.ts`
- Testes: `src/lib/store/__tests__/supabase.test.ts`, `src/lib/store/__tests__/swap.test.ts`
- Usar `@supabase/supabase-js` para client

---

### E5.S3 -- LGPD Compliance

| Campo | Valor |
|-------|-------|
| ID | E5.S3 |
| Titulo | Conformidade LGPD: consent, privacidade, retencao |
| User Story | Como usuario brasileiro, quero saber quais dados sao coletados e consentir explicitamente, para que meus direitos sob a LGPD sejam respeitados. |
| Prioridade | P1 (promover a P0 se deploy for publico) |
| Estimativa | 3 SP |
| Dependencias | E5.S1 |

> **Nota SM:** LGPD e requisito legal no Brasil. Se o deploy (E5.S4) for publico/producao, esta story DEVE ser promovida a P0 e concluida ANTES do deploy. Se for staging/demo interno, P1 e aceitavel. Decisao do owner no momento do sprint planning de E5.

**Criterios de Aceitacao:**

- [ ] `src/app/privacidade/page.tsx` criado com: dados coletados, finalidade, retencao (90 dias sem lead, indefinido com lead), compartilhamento com OpenRouter, contato DPO
- [ ] Checkbox obrigatorio no `LeadCaptureModal.tsx`: "Concordo com a Politica de Privacidade"
- [ ] Link para `/privacidade` no checkbox
- [ ] Submit do lead bloqueado sem checkbox marcado (frontend + backend + RLS)
- [ ] Campo `lgpd_consent` (boolean) + `lgpd_consent_at` (timestamp) salvos no banco
- [ ] Footer atualizado com link para Politica de Privacidade
- [ ] Teste: lead sem consent checkbox -> submit bloqueado (UI)
- [ ] Teste: POST /api/lead sem lgpd_consent=true -> 400
- [ ] Teste: pagina /privacidade renderiza com conteudo completo
- [ ] Testes escritos ANTES da implementacao (TDD)

**Notas Tecnicas:**
- Arquivos: `src/app/privacidade/page.tsx`, atualizar `LeadCaptureModal.tsx`, atualizar `Footer.tsx`
- Testes: `src/app/report/__tests__/LeadLGPD.test.tsx`
- RLS policy ja exige `lgpd_consent = true` (E5.S1)

---

### E5.S4 -- Deploy Vercel + E2E + Polish

| Campo | Valor |
|-------|-------|
| ID | E5.S4 |
| Titulo | Deploy no Vercel com teste E2E e polish final |
| User Story | Como owner do produto, quero o app deployado e funcional em producao com teste E2E validando o fluxo completo, para lancar o MVP. |
| Prioridade | P0 |
| Estimativa | 5 SP |
| Dependencias | E5.S2, E5.S3 |

**Criterios de Aceitacao:**

- [ ] `e2e/full-flow.spec.ts` criado com Playwright: Landing -> Scan (5 steps) -> Loading (SSE) -> Report (10 oportunidades) -> CTA -> Lead capture
- [ ] Playwright instalado e configurado (`playwright.config.ts`)
- [ ] `vercel.json` ou `next.config.ts` com `maxDuration: 120` na rota /api/scan
- [ ] Env vars configuradas no Vercel dashboard (documentar quais)
- [ ] Deploy bem-sucedido: `vercel deploy` sem erro
- [ ] Error boundaries em scan e report (fallback UI amigavel)
- [ ] 404 page customizada para report IDs invalidos
- [ ] Loading skeletons no report (por secao)
- [ ] Lighthouse: Performance > 80, Accessibility > 90, Best Practices > 80
- [ ] Fluxo completo funciona em producao (manual verification)
- [ ] `pnpm test` -- TODOS os testes do projeto passam (regressao)
- [ ] `pnpm test:e2e` -- teste E2E passa

**Notas Tecnicas:**
- Arquivos: `e2e/full-flow.spec.ts`, `playwright.config.ts`, `vercel.json`
- Vercel Pro necessario para `maxDuration: 120`
- Documentar env vars necessarias no README ou `.env.example`

---

# Resumo por Epic

| Epic | Stories | SP Total | Prioridade |
|------|---------|----------|------------|
| E0: Test Infra + Guard | 3 | 7 | P0 |
| E1: Foundation | 6 | 16 | P0 |
| E2: AI Engine | 6 | 26 | P0 |
| E3: Scan Form | 4 | 20 | P0 |
| E4a: Landing Page | 2 | 8 | P0/P1 |
| E4b: Report Page | 4 | 19 | P0/P1 |
| E5: Supabase + LGPD + Deploy | 4 | 18 | P0/P1 |
| **TOTAL** | **29** | **112** | — |

---

# Matriz de Prioridade

## P0 -- Must Have (MVP nao funciona sem)

| Story | Titulo |
|-------|--------|
| E0.S1 | Setup Vitest |
| E0.S2 | MSW OpenRouter |
| E0.S3 | Middleware Guard |
| E1.S1 | Tipos + Schemas Zod |
| E1.S2 | YAML Data Loader |
| E1.S3 | Env Vars Config |
| E1.S4 | OpenRouter Client |
| E1.S5 | Prompts dos Agentes |
| E1.S6 | ScanStore Interface + In-Memory |
| E2.S1a | Pipeline Core |
| E2.S1b | Resiliencia (timeout, circuit breaker, fallback) |
| E2.S2 | Validadores + Barreira |
| E2.S3 | Sanitizacao |
| E2.S4 | Rate Limiter |
| E2.S5 | API Routes |
| E3.S1 | Form Multi-Step |
| E3.S2 | Steps 1-2 |
| E3.S3 | Steps 3-4 |
| E3.S4 | Step 5 + Loading SSE |
| E4a.S1 | Landing Hero + How It Works |
| E4b.S1 | Report Estrutura + Estados |
| E4b.S2a | Report Data Sections (Loss Aversion + Tabela + Top 3) |
| E4b.S2b | Report Urgencia + CTA (Custo Inacao + CTA) |
| E5.S1 | Schema Supabase |
| E5.S2 | Store Supabase + Swap |
| E5.S4 | Deploy + E2E |

## P1 -- Should Have (qualidade e compliance)

| Story | Titulo |
|-------|--------|
| E4a.S2 | Value Cards + SEO |
| E4b.S3 | Lead Capture Modal (**tratar como P0 implícito** — sem ele o MVP não valida hipótese de negócio) |
| E5.S3 | LGPD Compliance |

---

# Glossario

| Termo | Definicao |
|-------|-----------|
| SP | Story Point (Fibonacci: 1, 2, 3, 5, 8) |
| SSE | Server-Sent Events (streaming unidirecional) |
| RLS | Row Level Security (Supabase) |
| LGPD | Lei Geral de Protecao de Dados |
| Barreira Estrategica | Mecanismo que impede o report de vazar detalhes de implementacao |
| Dopamine Engineering | Sequencia psicologica do report para maximizar urgencia e conversao |
| Veto Condition | Condicao que rejeita output de uma fase LLM e forca re-run |
| MSW | Mock Service Worker (interceptador de rede para testes) |
| TTL | Time To Live (expiracao de dados no store in-memory) |
