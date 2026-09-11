# ADR-005: Multi-Tier Classification & Confidence Pipeline

## Status
`ACCEPTED` (2026-09-11)

## Context
Files saved in creative offices have varying degrees of naming consistency: some are well-structured (`ABC School ID Card 2026.cdr`), while others are messy and cryptic (`new final 2.cdr`).

Relying purely on LLMs/AI for every file is slow, expensive, non-deterministic, and breaks offline workflows. Conversely, relying purely on rigid regexes fails for fuzzy variations.

## Decision
We implement a **Multi-Tier Classification Scoring Pipeline**:
1. **Tier 1 (Exact Rules)**: User-configured regex and conditional triggers ($100\%$ confidence).
2. **Tier 2 (Client Dictionaries & Aliases)**: Exact, code, alias, and Levenshtein distance ($\le 1$) matching.
3. **Tier 3 (Project Context)**: Matching against active client projects and category tokens.
4. **Tier 4 (Temporal & Version Parsing)**: Explicit year and canonical integer version extraction.
5. **Tier 5 (Document Metadata & Preview)**: CorelDRAW XML, PDF info dictionary, or OCR.
6. **Composite Scorer**: Weighted confidence formula $C = 0.40 S_c + 0.35 S_p + 0.15 S_y + 0.10 S_v$.
7. **Threshold Actions**:
   - $C \ge 85\% \implies$ Automatic Organization.
   - $60\% \le C < 85\% \implies$ Review Queue with Pre-Selected Recommendations.
   - $C < 60\% \implies$ Review Queue Manual Resolution.

## Consequences
### Positive
- Predictable, explainable, sub-millisecond classification.
- 100% offline-first; no external API calls required.
- Human review queue acts as a safety valve for ambiguous files.

### Negative / Mitigations
- Requires users to seed client and project names (or approve them during first encounter).
- *Mitigation*: The Review Queue features an "Auto-Learn Alias" option that automatically updates dictionaries when a user resolves an unclassified file.
