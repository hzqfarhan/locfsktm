# Centralized Versioning & Build Metadata Standard (VERSION.md)

> **Purpose for AI Assistants**: This document specifies our standardized, centralized versioning and build-metadata architecture. When this document (or prompt) is provided to an AI in any project, the AI must follow the protocols described here to implement, maintain, and bump versions consistently across the codebase.

---

## 📋 Copy-Paste Prompt for Other AI Assistants

If you are initializing or porting this versioning system into a new project, copy and paste the block below directly into your AI chat or add it to your project instructions (`CLAUDE.md`, `.cursorrules`, `AGENTS.md`, or `.gemini/rules/version_bumping.md`):

```markdown
You must implement and adhere to our Centralized Versioning & Build Metadata Standard:

1. Create a centralized version configuration file in the project (e.g., `src/config/version.js` or `src/config/version.ts`).
2. Define the core metadata constants:
   - `APP_VERSION`: Semantic version string with a `v` prefix (e.g., `v1.0.0`).
   - `APP_BUILD_DATE`: Build release date formatted as `YYYY.MM.DD`.
   - `APP_BUILD_TIME`: Build release time formatted as `HH:MM AM/PM` (or 24h format).
   - `APP_ENV`: Application environment (e.g., `development`, `staging`, `production`).
3. Export standardized helpers:
   - `getFullVersionString()`: Returns `${APP_VERSION} • Build ${APP_BUILD_DATE}`.
   - `getVersionBadgeHtml()` or `<VersionBadge />`: A UI badge component rendering a monospace pill with a pulsating emerald status indicator dot and tooltip.
4. Mount the version badge in visible UI locations:
   - Login / Authentication view footer or header.
   - App navigation sidebar / drawer bottom footer.
   - Settings / About / Modal dialogs.
5. MANDATORY AI AGENT RULE:
   - Whenever making ANY code change, bug fix, or feature enhancement, you MUST bump the version in the version config file in the same change:
     - Patch bump (`v1.0.0` -> `v1.0.1`) for fixes, refactors, copy/style tweaks.
     - Minor bump (`v1.0.0` -> `v1.1.0`) for new features, screens, endpoints.
     - Major bump (`v1.0.0` -> `v2.0.0`) for breaking changes or architectural overhauls.
     - Always update `APP_BUILD_DATE` and `APP_BUILD_TIME` to the current local timestamp.
   - Ensure the version badge remains visible and never broken across UI layouts.
```

---

## 1. Why We Use This System

Traditional `package.json` versioning often gets out of sync with actual deployments, is invisible to non-technical users, and cannot be easily verified during QA or client demonstrations.

Our centralized system solves this by:
1. **Instant Visual Verification**: Both users and developers can look at the screen (login screen, sidebar, modals) and immediately verify which build is active, eliminating stale browser cache misunderstandings.
2. **Build Traceability**: Versioning couples SemVer with precise build dates (`YYYY.MM.DD`) and times (`HH:MM AM/PM`).
3. **Single Source of Truth**: All UI components, footer widgets, API headers, and telemetry import from one single configuration file.
4. **Autonomous AI Discipline**: Gives AI coding agents an unbending rule to maintain clear audit trails of every modification.

---

## 2. Core Metadata Specification

Every implementation must define the following four attributes and two helper functions:

| Attribute / Helper | Type | Format / Example | Description |
| :--- | :--- | :--- | :--- |
| `APP_VERSION` | `string` | `'v1.6.14'` | Semantic version prefixed with `v` (`vMAJOR.MINOR.PATCH`). |
| `APP_BUILD_DATE` | `string` | `'2026.09.11'` | Date of the latest build in `YYYY.MM.DD` format. |
| `APP_BUILD_TIME` | `string` | `'10:20 AM'` | Time of the latest build (12-hour or 24-hour with zone). |
| `APP_ENV` | `string` | `'production'` | Runtime mode (`development`, `staging`, `production`). |
| `getFullVersionString()` | `function` | `'v1.6.14 • Build 2026.09.11'` | Combined version and date for tooltips and logs. |
| `getVersionBadgeHtml()` / `<VersionBadge />` | `function / component` | HTML / JSX / Vue | Renderable UI pill badge with live status indicator dot. |

---

## 3. Reference Implementations by Tech Stack

### A. Vanilla JavaScript / Vite / ESM (Current Reference)

Create `src/config/version.js`:

```javascript
// src/config/version.js
// Centralized System Version & Build Metadata Control

export const APP_VERSION = 'v1.0.0';
export const APP_BUILD_DATE = '2026.09.11';
export const APP_BUILD_TIME = '10:00 AM';
export const APP_ENV = typeof import.meta !== 'undefined' && import.meta.env?.MODE ? import.meta.env.MODE : 'production';

export function getFullVersionString() {
  return `${APP_VERSION} • Build ${APP_BUILD_DATE}`;
}

export function getVersionBadgeHtml(extraClass = '') {
  return `
    <span class="inline-flex items-center gap-1.5 font-mono text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/90 shadow-2xs ${extraClass}" title="System Build Version: ${getFullVersionString()} (${APP_BUILD_TIME})">
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
      <span>${getFullVersionString()}</span>
    </span>
  `;
}
```

---

### B. React / Next.js / TypeScript

Create `src/config/version.ts`:

```typescript
// src/config/version.ts
export const APP_VERSION = 'v1.0.0';
export const APP_BUILD_DATE = '2026.09.11';
export const APP_BUILD_TIME = '10:00 AM';
export const APP_ENV = process.env.NODE_ENV || 'production';

export function getFullVersionString(): string {
  return `${APP_VERSION} • Build ${APP_BUILD_DATE}`;
}
```

Create `src/components/VersionBadge.tsx`:

```tsx
// src/components/VersionBadge.tsx
import React from 'react';
import { APP_VERSION, APP_BUILD_TIME, getFullVersionString } from '../config/version';

interface VersionBadgeProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export const VersionBadge: React.FC<VersionBadgeProps> = ({ className = '', variant = 'light' }) => {
  const baseClasses = "inline-flex items-center gap-1.5 font-mono text-[10px] font-extrabold px-2.5 py-0.5 rounded-md transition-colors";
  const themeClasses = variant === 'dark'
    ? "bg-slate-900/80 text-slate-300 border border-slate-700/80"
    : "bg-slate-100 text-slate-600 border border-slate-200/90 shadow-2xs";

  return (
    <span 
      className={`${baseClasses} ${themeClasses} ${className}`}
      title={`System Build Version: ${getFullVersionString()} (${APP_BUILD_TIME})`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" aria-hidden="true" />
      <span>${getFullVersionString()}</span>
    </span>
  );
};

export default VersionBadge;
```

---

### C. Vue 3 / Nuxt

Create `src/config/version.js` (or `.ts`) as shown above, then create `src/components/VersionBadge.vue`:

```vue
<template>
  <span 
    :class="['inline-flex items-center gap-1.5 font-mono text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/90 shadow-2xs', extraClass]"
    :title="`System Build Version: ${fullVersionString} (${buildTime})`"
  >
    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
    <span>{{ fullVersionString }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { APP_BUILD_TIME, getFullVersionString } from '../config/version';

defineProps({
  extraClass: { type: String, default: '' }
});

const fullVersionString = computed(() => getFullVersionString());
const buildTime = APP_BUILD_TIME;
</script>
```

---

### D. Backend / REST API (Node.js / Express / Fastify / Python)

For backend projects without a frontend UI, expose the metadata via a standardized `/api/health` or `/api/version` endpoint:

**Node.js / Express:**
```javascript
// src/config/version.js
export const APP_VERSION = 'v1.0.0';
export const APP_BUILD_DATE = '2026.09.11';
export const APP_BUILD_TIME = '10:00 AM';
export const APP_ENV = process.env.NODE_ENV || 'production';

// In routes / health controller:
app.get('/api/version', (req, res) => {
  res.json({
    version: APP_VERSION,
    buildDate: APP_BUILD_DATE,
    buildTime: APP_BUILD_TIME,
    env: APP_ENV,
    uptime: process.uptime()
  });
});
```

**Python (FastAPI):**
```python
# app/config/version.py
APP_VERSION = "v1.0.0"
APP_BUILD_DATE = "2026.09.11"
APP_BUILD_TIME = "10:00 AM"
APP_ENV = "production"

# In main.py:
@app.get("/api/version")
def get_version():
    return {
        "version": APP_VERSION,
        "build_date": APP_BUILD_DATE,
        "build_time": APP_BUILD_TIME,
        "env": APP_ENV
    }
```

---

## 4. UI Placement Guidelines

The version badge must be rendered in at least two easily accessible locations:

1. **Authentication / Login Screen**:
   - Placed in the card header, footer, or bottom-centered container.
   - Allows users or support staff to check build versions before authenticating.
2. **Main Application Shell (Sidebar or Bottom Bar)**:
   - Placed at the very bottom of the navigation drawer or sidebar (below the user profile card).
   - Allows logged-in users to verify the build during normal operation.
3. **Modals / System Info Dialog**:
   - Displayed in registration confirmation dialogs, system setting dialogs, or "About" tabs.

---

## 5. Strict AI Agent Workflow Rules

When an AI assistant is operating on the codebase, it MUST enforce the following protocol:

### Rule 1: Mandatory Version Bump
Whenever modifying code (features, bug fixes, refactoring, UI updates):
- The AI **must** edit the version configuration file in the same turn/commit.
- Never leave a code change without an updated version and build timestamp.

### Rule 2: Semantic Bumping Matrix
- **Patch Increment** (`v1.2.3` -> `v1.2.4`):
  - Bug fixes
  - Minor visual/CSS polishes
  - Copy/text corrections
  - Small refactorings with no API or UI layout shifts
- **Minor Increment** (`v1.2.3` -> `v1.3.0`):
  - New screen, view, or modal added
  - New business logic, database table, or API endpoint
  - Significant feature enhancement
  - Patch number resets to `0`
- **Major Increment** (`v1.2.3` -> `v2.0.0`):
  - Breaking database schema change
  - Complete architecture overhaul or redesign
  - Incompatible API or authentication system migration
  - Minor and Patch numbers reset to `0`

### Rule 3: Timestamp Refresh
- Update `APP_BUILD_DATE` to the current date (`YYYY.MM.DD`).
- Update `APP_BUILD_TIME` to the current local time (`HH:MM AM/PM`).

### Rule 4: Visual Integrity Check
- Never delete or obscure the `VersionBadge` component from navigation shells or login pages.
- Ensure that badge styles do not cause horizontal scrolling or overflow on mobile screens.

---

## 6. Verification Checklist for AI Agents

Before concluding any task, verify:
- [ ] Has the centralized version file been updated?
- [ ] Did SemVer bump appropriately (patch vs. minor vs. major)?
- [ ] Are `APP_BUILD_DATE` and `APP_BUILD_TIME` set to current timestamps?
- [ ] Does `getVersionBadgeHtml()` or `<VersionBadge />` render without errors?
- [ ] Is the version badge visible on the login screen and sidebar?
