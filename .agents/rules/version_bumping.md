# Centralized Versioning & Build Metadata Standard Rule

You must implement and adhere to our Centralized Versioning & Build Metadata Standard:

1. Centralized version configuration file: `src/config/version.ts`.
2. Core metadata constants:
   - `APP_VERSION`: Semantic version string with a `v` prefix (e.g., `v1.1.0`).
   - `APP_BUILD_DATE`: Build release date formatted as `YYYY.MM.DD`.
   - `APP_BUILD_TIME`: Build release time formatted as `HH:MM AM/PM` (or 24h format).
   - `APP_ENV`: Application environment (e.g., `development`, `staging`, `production`).
3. Standardized helpers:
   - `getFullVersionString()`: Returns `${APP_VERSION} • Build ${APP_BUILD_DATE}`.
   - `<VersionBadge />`: A UI badge component rendering a monospace pill with a pulsating emerald status indicator dot and tooltip.
4. Mount the version badge in visible UI locations:
   - Navigation header / Navbar.
   - App footer / ProjectFooter.
   - SearchModal / Dialogs.
5. MANDATORY AI AGENT RULE:
   - Whenever making ANY code change, bug fix, or feature enhancement, you MUST bump the version in `src/config/version.ts` in the same change:
     - Patch bump (`v1.1.0` -> `v1.1.1`) for fixes, refactors, copy/style tweaks.
     - Minor bump (`v1.1.0` -> `v1.2.0`) for new features, screens, endpoints.
     - Major bump (`v1.1.0` -> `v2.0.0`) for breaking changes or architectural overhauls.
     - Always update `APP_BUILD_DATE` and `APP_BUILD_TIME` to the current local timestamp.
   - Ensure the version badge remains visible and never broken across UI layouts.
