# Task: Generate Report

## Metadata
```yaml
name: generate-report
executor: scanner-chief
elicit: false
model_tier: sonnet
estimated_duration: "2-3 min"
```

## Purpose
Montar relatorio final usando RANKED_OPPORTUNITIES + templates. Aplicar barreira estrategica free/paid. Incluir CTA pra consultoria.

## Pre-conditions
- RANKED_OPPORTUNITIES recebido do growth-strategist
- Todas 4 fases anteriores completas

## Execution

### Phase 1: Load Template
Carregar `templates/report-tmpl.md` e `templates/opportunity-card-tmpl.md`.

### Phase 2: Assemble Report

**Secao 1: Executive Summary**
```
# Diagnostico de IA — {Empresa/Setor}

## {total_roi_range}/ano em oportunidades identificadas

Analisamos {N} processos do seu negocio e identificamos
{N} oportunidades onde IA pode gerar resultado imediato.

**Destaque:** {top_opportunity_name} pode economizar
{top_opportunity_roi}/ano com implementacao em {time_to_value}.
```

**Secao 2: ROI Total + Loss Aversion**
```
### O que voce ganha implementando:
R${roi_range}/ano em economia e eficiencia

### O que voce perde NAO implementando:
R${loss_monthly}/mes — em 6 meses = R${loss_6months}
```

**Secao 3: Top 10 Table**
```
| # | Oportunidade | Impacto | Esforco | Score | ROI/ano | Quick Win |
|---|-------------|---------|---------|-------|---------|-----------|
```

**Secao 4: Top 3 Deep Dive (teaser)**
Para cada top 3:
- O que e
- Por que funciona pro seu negocio
- Impacto estimado
- Complexidade
- **NAO incluir:** como implementar, stack tecnico, cronograma detalhado

**Secao 5: CTA**
```
### Proximo Passo

Estas oportunidades foram identificadas com base no diagnostico do seu negocio.
Para implementacao completa com Claude Code:
- Setup personalizado do ambiente
- Prompts customizados pro seu negocio
- Integracao com seus sistemas
- Treinamento da equipe
- Suporte pos-implementacao

→ Agende uma consultoria de implementacao
```

### Phase 3: Strategic Barrier Check

**FREE (este relatorio):**
- [x] O QUE fazer
- [x] POR QUE funciona
- [x] QUANTO impacta (range)
- [x] QUANDO e quick win
- [ ] ~~COMO implementar~~ ← BARREIRA
- [ ] ~~Stack tecnico~~ ← BARREIRA
- [ ] ~~Cronograma detalhado~~ ← BARREIRA
- [ ] ~~ROI preciso~~ ← BARREIRA (so range)
- [ ] ~~Prompts customizados~~ ← BARREIRA

**Se qualquer item BARREIRA aparece no report → VETO e remover.**

## Veto Conditions

- `Report sem ROI total no topo` → Adicionar
- `Report com detalhes de implementacao` → Remover (barreira)
- `Report sem CTA` → Adicionar
- `Report sem loss aversion` → Adicionar secao de perda
- `Menos de 10 oportunidades` → Completar com catalog
- `Top 3 sem deep dive` → Adicionar teaser

## Output Format

Relatorio em Markdown seguindo `templates/report-tmpl.md`.

## Completion Criteria
- [ ] Executive summary com ROI total
- [ ] Loss aversion section
- [ ] Top 10 table completa
- [ ] Top 3 deep dive (teaser only)
- [ ] CTA pra consultoria
- [ ] Barreira free/paid respeitada (zero HOW)
- [ ] Formatacao profissional
