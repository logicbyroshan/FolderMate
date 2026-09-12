# FolderMate Design System Specification

## 1. Overview & Visual Philosophy
FolderMate employs a refined, professional **Dark Theme** engineered for prolonged daily office use. The visual language is calm, modern, and structured, eliminating visual clutter and eye strain.

The primary accent is a **Warm Amber / Gold**, strictly constrained to **2–5% of visible UI area** for focal actions, active selections, and key indicators.

---

## 2. Design Tokens

### 2.1 Color Palette

| Token | CSS Variable | Hex / Value | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Background** | `--bg-primary` | `#0b0f19` | Main application backdrop |
| **Surface** | `--bg-surface` | `#111827` | Content panels, inputs, sidebars |
| **Surface Elevated** | `--bg-surface-elevated`| `#1f2937` | Header cards, active list items |
| **Border Subtle** | `--border-subtle` | `rgba(255, 255, 255, 0.08)` | Dividers, card borders |
| **Border Medium** | `--border-medium` | `rgba(255, 255, 255, 0.15)` | Interactive control borders |
| **Border Focus** | `--border-focus` | `#f59e0b` | Focused input & active selection border |
| **Text Primary** | `--text-primary` | `#f8fafc` | Headings, primary file titles |
| **Text Secondary** | `--text-secondary` | `#94a3b8` | Subtitles, labels, descriptions |
| **Text Muted** | `--text-muted` | `#64748b` | Timestamps, file extensions, hints |

### 2.2 Accent & Semantic Tokens

| Semantic Role | CSS Variable | Value | Description |
| :--- | :--- | :--- | :--- |
| **Primary Accent** | `--accent-amber` | `#f59e0b` | Primary buttons, active tabs, highlights |
| **Accent Glow / Subtle**| `--accent-amber-subtle`| `rgba(245, 158, 11, 0.12)`| Hover states, selected rows |
| **Success** | `--status-success` | `#10b981` | Organized files, active rules, healthy state |
| **Warning** | `--status-warning` | `#f59e0b` | Review queue warnings, locked files |
| **Danger** | `--status-danger` | `#ef4444` | Errors, unrecoverable actions, failed parsing |
| **Info** | `--status-info` | `#3b82f6` | Informational badges, codes, project links |

### 2.3 Spacing Scale

| Token | Value | Recommended Usage |
| :--- | :--- | :--- |
| `--space-1` | `4px` | Badge padding, icon gaps |
| `--space-2` | `8px` | Form field spacing, button icon gaps |
| `--space-3` | `12px` | Card internal padding, list item gaps |
| `--space-4` | `16px` | Section padding, modal form gap |
| `--space-5` | `20px` | View grid gap, main layout gutters |
| `--space-6` | `24px` | Major card padding, modal dialog inset |
| `--space-8` | `32px` | Dashboard section separators |

### 2.4 Typography Hierarchy

| Level | Size | Weight | Line Height | Color Token |
| :--- | :--- | :--- | :--- | :--- |
| **Display / Page Title** | `20px` | `700` (Bold) | `1.25` | `--text-primary` |
| **Section Title** | `16px` | `700` (Bold) | `1.3` | `--text-primary` |
| **Card Header** | `14px` | `600` (SemiBold) | `1.4` | `--text-primary` |
| **Body Primary** | `13px` | `400` (Regular) | `1.5` | `--text-primary` |
| **Body Secondary / Hint**| `12px` | `400` (Regular) | `1.4` | `--text-secondary` |
| **Caption / Badge** | `11px` | `600` (SemiBold) | `1.3` | `--text-muted` |
| **Monospace / Path** | `12px` | `500` (Medium) | `1.4` | JetBrains Mono / Consolas |

---

## 3. Standard Component Inventory

Every UI screen in FolderMate consumes components from `apps/desktop/src/renderer/components/ui/`:

### 3.1 Button (`Button.tsx`)
- **Variants**: `primary` (Amber fill with dark text), `secondary` (Glass surface with subtle border), `danger` (Red fill), `ghost` (Transparent).
- **Sizes**: `sm` (28px height), `md` (36px height), `lg` (42px height).
- **Features**: Built-in loading spinner, left/right icon slots, disabled state.

### 3.2 SearchBar (`SearchBar.tsx`)
- Standardized height (`38px`), search icon, clear button (`X`), and keyboard shortcut hint badge (`/`).
- Supports instant debounce and auto-focus.

### 3.3 Select / Dropdown (`Select.tsx`)
- Custom styled native select with custom chevron, matching input height and radius.
- Consistent focus ring (`--accent-amber-glow`).

### 3.4 Badge & StatusBadge (`Badge.tsx`)
- **Variants**: `amber`, `success`, `warning`, `danger`, `info`, `neutral`.
- **Sizes**: `sm` (11px text), `md` (12px text).
- **StatusBadge**: Automatically maps states (`organized`, `review`, `archived`, `failed`) to semantic colors with pulsing status dots.

### 3.5 Modal Dialog (`Modal.tsx`)
- Centered glass overlay with backdrop blur (`6px`).
- Escape key listener, click-outside dismissal, standardized header, scrollable body, and action footer.

### 3.6 Toast Notification (`Toast.tsx`)
- Bottom-right non-intrusive floating toasts.
- Auto-dismisses after 4000ms with manual close action and semantic icon indicator.

### 3.7 FolderColorPicker (`FolderColorPicker.tsx`)
- 7 Windows Shell color presets: Amber, Blue, Green, Red, Purple, Cyan, Gray.
- Interactive swatch selector with active border indicator.

### 3.8 Command Palette (`CommandPalette.tsx`)
- Global `Ctrl+K` trigger.
- Instant keyboard navigation across views, actions (Add Client, Quick Search, Configure Rules, Refresh), and files.

---

## 4. Windows Folder Customization Rules

FolderMate allows mapping metadata and client status to Windows Explorer folder colors and icons:

```text
Rule Scope (Client / Project / Priority)
        ↓
Folder Appearance Engine
        ↓
Writes desktop.ini [ShellClassInfo]
        ↓
Sets attrib +r <Folder>
        ↓
Sets attrib +h +s <desktop.ini>
        ↓
Windows Explorer renders custom folder color/icon
```

### Supported Color Presets
| Preset | Color | Explorer Resource | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| **Amber** | `#f59e0b` | `shell32.dll,3` | Active Client / High Value |
| **Blue** | `#3b82f6` | `shell32.dll,4` | Active Design Project |
| **Green** | `#10b981` | `shell32.dll,298` | Completed / Approved Deliverable |
| **Red** | `#ef4444` | `shell32.dll,238` | High Priority / Rush Order |
| **Purple** | `#8b5cf6` | `shell32.dll,152` | Special Event / VIP Client |
| **Cyan** | `#06b6d4` | `shell32.dll,14` | Digital Assets / Print Ready |
| **Gray** | `#64748b` | `shell32.dll,234` | Archived / Inactive |

---

## 5. UI Consistency Matrix

| View | Search Bar | Action Buttons | Cards / Panels | Badges | Toast Feedback |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | Shared SearchBar | Standardized Buttons | Standardized Cards | StatusBadge | Connected |
| **Search** | Shared SearchBar | Standardized Buttons | Standardized Cards | StatusBadge + Amber | Connected |
| **Review Queue** | — | Standardized Buttons | Standardized Cards | StatusBadge + Danger | Connected |
| **Rules & Appearance** | Shared SearchBar | Standardized Buttons | Standardized Cards | StatusBadge + Amber | Connected |
| **Clients & Projects** | Shared SearchBar | Standardized Buttons | Standardized Cards | StatusBadge + Amber | Connected |
| **Settings** | — | Standardized Buttons | Standardized Cards | StatusBadge + Amber | Connected |
