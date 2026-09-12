# ADR-007: Standardized Dark Theme Design System & Component Library

## Context
As FolderMate grew across multiple views (Dashboard, Search, Review Queue, Rules, Clients, Settings), ad-hoc styles, differing button paddings, and fragmented color codes risked visual drift. Furthermore, vibrant, saturated colors across the entire UI cause eye strain during 8-hour office workflows.

## Decision
We established a strict, unified design token architecture in `index.css` and a central library of reusable UI primitives in `apps/desktop/src/renderer/components/ui/`:

1. **Dark Surface Hierarchy**:
   - `bg-primary`: Deep Obsidian (`#0b0f19`)
   - `bg-surface`: Midnight Charcoal (`#111827`)
   - `bg-surface-elevated`: Slate (`#1f2937`)
   - `bg-elevated`: Deep Gray (`#283548`)
2. **Warm Amber Primary Accent Restraint**:
   - Primary accent: Warm Amber / Gold (`#f59e0b` / `#fbbf24`)
   - Area Constraint: Strictly constrained to **2–5% of visible UI area** (primary buttons, active tabs, focus rings, selected badges).
   - Prevents overwhelming bright yellow interfaces while delivering a distinctive, premium identity.
3. **Dedicated Semantic Colors**:
   - Success: Emerald (`#10b981`)
   - Warning: Amber (`#f59e0b`)
   - Danger: Rose (`#ef4444`)
   - Info: Sky Blue (`#3b82f6`)
4. **Shared Reusable Component Inventory**:
   - `Button`, `IconButton`, `Input`, `SearchBar`, `Select`, `Badge`, `Card`, `Modal`, `Toast`, `EmptyState`, `FolderColorPicker`, `CommandPalette`.
5. **Keyboard-First Command Center**:
   - Global `Ctrl+K` command palette with search filtering across navigation routes, actions, and fast file queries.

## Consequences
- **Positive**: Cohesive visual identity across all views with 0 component duplication.
- **Positive**: Strict design token enforcement guarantees consistent heights, border radii, and spacing scales.
- **Positive**: High contrast compliance (WCAG AA/AAA) and comfortable dark mode ergonomics for prolonged daily office use.
