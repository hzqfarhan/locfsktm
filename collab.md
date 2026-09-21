# Collaborator & Project Footer Specification

> **AI Agent Directive:**  
> You are tasked with implementing, adapting, or integrating this **Contributor & Project Footer Component** into the current codebase.  
> Adhere to the design specifications, glassmorphic tokens, responsive behavior, and accessibility standards outlined below. Do not downgrade the visual fidelity or remove micro-interactions.

---

## 1. Overview & Design Aesthetic

This component provides a sleek, modern **Liquid Glassmorphism** footer featuring:
- **Brand & Project Column**: Project branding, icon badge, and description.
- **Collaborators / Contributors Grid**: Interactive profile cards with GitHub avatar loading, lazy loading, fallback image handling, active status indicator ("online dot"), contributor handle in monospace, and hover micro-animations (spring-based lift, border glow, external link nudge).
- **Sub-footer Bar**: Copyright/heart attribution and disclaimer notices.
- **Theme Support**: Seamless native Light & Dark mode support via CSS custom properties.
- **Physics**: Smooth iOS spring transitions (`cubic-bezier(0.32, 0.72, 0, 1)`).

---

## 2. Contributor Data Schema

If your project dynamically renders contributors via JavaScript, TypeScript, React, Vue, or Svelte, use this data schema:

```typescript
export interface Contributor {
  name: string;
  handle: string;
  githubUrl: string;
  avatarUrl: string;
  fallbackAvatarUrl: string;
  active: boolean;
}

export const CONTRIBUTORS: Contributor[] = [
  {
    name: "Yunn",
    handle: "@hzqfarhan",
    githubUrl: "https://github.com/hzqfarhan",
    avatarUrl: "https://github.com/hzqfarhan.png",
    fallbackAvatarUrl: "https://avatars.githubusercontent.com/u/203814306?v=4",
    active: true,
  },
  {
    name: "Kiro",
    handle: "@pwntable",
    githubUrl: "https://github.com/pwntable",
    avatarUrl: "https://github.com/pwntable.png",
    fallbackAvatarUrl: "https://avatars.githubusercontent.com/u/220985859?v=4",
    active: true,
  },
];
```

---

## 3. HTML Markup (Semantic & Accessible)

All text is provided in **English**. If the project uses an i18n system, keep or adapt the `data-i18n` attributes. Inline SVGs are bundled so the component functions with zero external icon dependencies.

```html
<footer class="app-footer" role="contentinfo">
  <div class="footer-top">
    <!-- Brand & Project Info -->
    <div class="footer-brand-col">
      <div class="footer-brand">
        <div class="footer-logo" aria-hidden="true">
          <!-- Calendar / Project Icon -->
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar">
            <path d="M8 2v3"></path>
            <path d="M16 2v3"></path>
            <rect x="3" y="9" width="18" height="18" rx="2"></rect>
            <path d="M3 9h18"></path>
          </svg>
        </div>
        <span class="footer-title">UTHM Timetable Generator</span>
      </div>
      <p class="footer-desc" data-i18n="footerDesc">
        An open-source web application designed to help UTHM students plan and generate their academic class schedules quickly and effortlessly.
      </p>
    </div>

    <!-- Contributors Section -->
    <div class="footer-contributors-col">
      <div class="footer-section-hdr">
        <!-- Users Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <circle cx="9" cy="7" r="4"></circle>
        </svg>
        <span class="footer-section-title" data-i18n="footerContributors">Project Contributors</span>
      </div>

      <div class="contributors-grid">
        <!-- Contributor: Yunn (@hzqfarhan) -->
        <a href="https://github.com/hzqfarhan" target="_blank" rel="noopener noreferrer" class="contributor-card" title="GitHub: hzqfarhan">
          <div class="contributor-avatar-wrap">
            <img 
              src="https://github.com/hzqfarhan.png" 
              alt="hzqfarhan avatar" 
              class="contributor-avatar" 
              loading="lazy" 
              onerror="this.onerror=null; this.src='https://avatars.githubusercontent.com/u/203814306?v=4';" 
            />
            <div class="contributor-online-dot" title="Active Contributor"></div>
          </div>
          <div class="contributor-info">
            <span class="contributor-name">Yunn</span>
            <span class="contributor-handle">@hzqfarhan</span>
          </div>
          <div class="contributor-link-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link">
              <path d="M15 3h6v6"></path>
              <path d="M10 14 21 3"></path>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            </svg>
          </div>
        </a>

        <!-- Contributor: Kiro (@pwntable) -->
        <a href="https://github.com/pwntable" target="_blank" rel="noopener noreferrer" class="contributor-card" title="GitHub: pwntable">
          <div class="contributor-avatar-wrap">
            <img 
              src="https://github.com/pwntable.png" 
              alt="pwntable avatar" 
              class="contributor-avatar" 
              loading="lazy" 
              onerror="this.onerror=null; this.src='https://avatars.githubusercontent.com/u/220985859?v=4';" 
            />
            <div class="contributor-online-dot" title="Active Contributor"></div>
          </div>
          <div class="contributor-info">
            <span class="contributor-name">Kiro</span>
            <span class="contributor-handle">@pwntable</span>
          </div>
          <div class="contributor-link-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link">
              <path d="M15 3h6v6"></path>
              <path d="M10 14 21 3"></path>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            </svg>
          </div>
        </a>
      </div>
    </div>
  </div>

  <!-- Footer Bottom Sub-bar -->
  <div class="footer-bottom">
    <div class="footer-bottom-text" data-i18n="footerMadeWith">
      Built with ❤️ for the student community
    </div>
    <div class="footer-bottom-disclaimer" data-i18n="footerDisclaimer">
      Independent community project. Not officially affiliated with or endorsed by Universiti Tun Hussein Onn Malaysia.
    </div>
  </div>
</footer>
```

---

## 4. CSS Design System & Stylesheet

Include this in your CSS or SCSS stylesheet. If your project already has CSS variables for surfaces, colors, or radius, map them accordingly.

```css
/* ═══════════════════════════════════════════════════════════
   DESIGN TOKENS (LIGHT DEFAULT & DARK THEME)
   ═══════════════════════════════════════════════════════════ */
:root,
:root[data-theme="light"] {
  --font-heading: 'Syne', system-ui, -apple-system, sans-serif;
  --font-mono: 'DM Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
  --font-body: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  /* Surfaces & Glass */
  --s1: rgba(255, 255, 255, 0.64);
  --s2: rgba(255, 255, 255, 0.46);
  --s3: rgba(255, 255, 255, 0.84);
  --border: rgba(255, 255, 255, 0.72);
  --border2: rgba(185, 170, 215, 0.42);

  /* Brand Colors */
  --accent: #6d44f2;
  --accent-rgb: 109, 68, 242;
  --accent2: #d946ef;
  --text: #171228;
  --muted: #5e5478;
  --muted2: #7d729a;
  --green: #059669;

  /* Radii & Timing */
  --radius-lg: 24px;
  --ios-spring: cubic-bezier(0.32, 0.72, 0, 1);
}

:root[data-theme="dark"] {
  /* Surfaces & Glass (Dark Mode) */
  --s1: rgba(20, 15, 34, 0.66);
  --s2: rgba(30, 23, 50, 0.60);
  --s3: rgba(45, 34, 72, 0.76);
  --border: rgba(255, 255, 255, 0.14);
  --border2: rgba(255, 255, 255, 0.22);

  /* Brand Colors (Vibrant on dark) */
  --accent: #8b6dfc;
  --accent-rgb: 139, 109, 252;
  --accent2: #f472b6;
  --text: #f6f3fc;
  --muted: #a69ebd;
  --muted2: #c6bfd8;
  --green: #34d399;
}

/* ═══════════════════════════════════════════════════════════
   FOOTER SHELL & GLASSMORPHISM
   ═══════════════════════════════════════════════════════════ */
.app-footer {
  font-family: var(--font-body);
  margin-top: 36px;
  margin-bottom: 24px;
  padding: 30px 32px 22px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.68) 0%,
    rgba(255, 255, 255, 0.46) 50%,
    rgba(248, 242, 255, 0.58) 100%
  );
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow:
    0 12px 32px -4px rgba(109, 68, 242, 0.08),
    0 4px 12px -2px rgba(45, 25, 80, 0.03),
    inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.85);
  position: relative;
  overflow: hidden;
  transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

[data-theme="dark"] .app-footer {
  background: linear-gradient(
    135deg,
    rgba(22, 16, 38, 0.75) 0%,
    rgba(32, 24, 54, 0.68) 50%,
    rgba(42, 30, 68, 0.78) 100%
  );
  border-color: var(--border);
  box-shadow:
    0 12px 32px -4px rgba(0, 0, 0, 0.45),
    0 4px 12px -2px rgba(0, 0, 0, 0.3),
    inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.14);
}

/* ═══════════════════════════════════════════════════════════
   TOP ROW: BRAND & CONTRIBUTORS
   ═══════════════════════════════════════════════════════════ */
.footer-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 36px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border2);
}

.footer-brand-col {
  flex: 1;
  max-width: 440px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.footer-logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(var(--accent-rgb), 0.32);
  flex-shrink: 0;
  color: #ffffff;
}

.footer-title {
  font-family: var(--font-heading);
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.01em;
}

.footer-desc {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.6;
  margin: 0;
}

/* ═══════════════════════════════════════════════════════════
   CONTRIBUTORS COLUMN & CARDS
   ═══════════════════════════════════════════════════════════ */
.footer-contributors-col {
  flex: 1.35;
}

.footer-section-hdr {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  color: var(--accent);
}

.footer-section-title {
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.01em;
}

.contributors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
}

.contributor-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 14px;
  background: var(--s2);
  border: 1px solid var(--border);
  text-decoration: none;
  color: var(--text);
  transition: all 0.25s var(--ios-spring);
  position: relative;
  overflow: hidden;
}

.contributor-card:hover {
  background: var(--s3);
  border-color: rgba(var(--accent-rgb), 0.45);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px -4px rgba(var(--accent-rgb), 0.18);
}

.contributor-avatar-wrap {
  position: relative;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
}

.contributor-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border);
  background: var(--s3);
  transition: border-color 0.2s ease, transform 0.2s ease;
  display: block;
}

.contributor-card:hover .contributor-avatar {
  border-color: var(--accent);
  transform: scale(1.05);
}

.contributor-online-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 11px;
  height: 11px;
  background: var(--green);
  border-radius: 50%;
  border: 2px solid var(--s1);
  box-shadow: 0 0 6px rgba(5, 150, 105, 0.4);
}

.contributor-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  gap: 2px;
}

.contributor-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contributor-handle {
  font-size: 11.5px;
  font-family: var(--font-mono);
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contributor-link-icon {
  color: var(--muted2);
  transition: all 0.2s ease;
  opacity: 0.6;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.contributor-card:hover .contributor-link-icon {
  color: var(--accent);
  opacity: 1;
  transform: translateX(2px) translateY(-1px);
}

/* ═══════════════════════════════════════════════════════════
   BOTTOM SUB-BAR
   ═══════════════════════════════════════════════════════════ */
.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 18px;
  font-size: 12px;
}

.footer-bottom-text {
  color: var(--muted);
  font-weight: 500;
}

.footer-bottom-disclaimer {
  color: var(--muted2);
  font-size: 11.5px;
}

/* ═══════════════════════════════════════════════════════════
   RESPONSIVE BREAKPOINTS
   ═══════════════════════════════════════════════════════════ */
@media (max-width: 900px) {
  .footer-top {
    flex-direction: column;
    gap: 24px;
  }
  .footer-brand-col,
  .footer-contributors-col {
    max-width: 100%;
    width: 100%;
  }
}

@media (max-width: 600px) {
  .app-footer {
    padding: 22px 16px 18px;
    margin-top: 24px;
    margin-bottom: 24px;
  }
  .contributors-grid {
    grid-template-columns: 1fr;
  }
  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
```

---

## 5. Implementation Instructions for the AI Agent

When integrating this component into a new or existing project, execute the following steps:

1. **Verify or Map Design Variables**:
   - Check if the target project already defines CSS variables for theme surfaces, text, or primary brand color (e.g. `--primary`, `--background`, `--card`, `--text-color`).
   - If present, map `--accent` to the target project's primary accent color and ensure `--text`, `--muted`, and `--border` blend seamlessly with the project's background.
   - If the project does not have theming, paste the `:root` tokens as provided.

2. **Font Integration (Optional but Recommended)**:
   - For optimal typography match, include the Google Fonts in `<head>`:
     ```html
     <link rel="preconnect" href="https://fonts.googleapis.com">
     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
     <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@600;700;800&display=swap" rel="stylesheet">
     ```
   - If the project uses TailwindCSS or an existing font family, replace `var(--font-heading)` and `var(--font-mono)` with the project's fonts.

3. **Placement**:
   - Place `.app-footer` as the outermost footer tag at the bottom of the main page container or layout wrapper (e.g. `App.tsx`, `layout.tsx`, or `index.html`).

4. **Framework Adaptations**:
   - **React / Next.js**:
     - Change `class` to `className`.
     - Replace `data-lucide` or inline SVGs with `lucide-react` icons (`<Calendar />`, `<Users />`, `<ExternalLink />`).
     - Render contributor cards dynamically by mapping `CONTRIBUTORS.map(c => ...)`.
   - **Vue / Nuxt**:
     - Use `<template>` with `v-for="c in contributors" :key="c.handle"`.
   - **Svelte / SvelteKit**:
     - Use `{#each contributors as c (c.handle)}`.

5. **Quality & Verification Checklist**:
   - [ ] Ensure the active online dot displays correctly at the bottom-right corner of each avatar.
   - [ ] Test card hover state: card lifts by `2px`, avatar scales slightly (`scale(1.05)`), external link icon shifts up-right by `2px`, and border illuminates with the accent color.
   - [ ] Verify image fallback (`onerror`) renders safely if a contributor image fails to load.
   - [ ] Verify responsive layout: two columns on desktop (`>900px`), stacked columns on tablet (`<=900px`), and single-column full-width cards on mobile (`<=600px`).