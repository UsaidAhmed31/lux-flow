# Lux Flow — Phase 1 (Connect) · UI/UX prototype

A clickable prototype of the Lux Flow member app (mobile and web) and its admin console (Integrity · Trust & Safety).
Everything runs in the browser. All data is sample data; verification, moderation, notifications and AI are **simulated**. Nothing is a real backend or production security.

## View it

| File | What it is |
| --- | --- |
| **`index.html`** | The whole prototype in one self-contained file (about 10 MB, works offline). On a laptop or desktop a bar at the top switches between **Web view**, **Mobile view** and **Admin**. On a phone it opens straight into the member app. |
| `portable/` | The same prototype as separate pages: `index.html` (member app), `admin.html` (admin console), `foundations.html` (living design system), `brand.html` (brand exploration and website mock). Works offline from a double-click. |

**GitHub Pages:** in the repo settings, turn on Pages for the `main` branch (root). The prototype is then served at the Pages URL. Pages on private repos needs a paid GitHub plan.

**Admin sign-in:** pick an account (Quinn = admin and primary reviewer, Dana Ruiz = reviewer, Ops support = view-only operator), then type any 6 digits.

## Folder structure

```
index.html              Single-file build (web / mobile / admin switch)
portable/               Multi-page offline export
source/
  Main.dc.html          Member app (mobile + responsive web)
  Desktop.dc.html       Desktop board wrapper for the member app
  Admin.dc.html         Admin console (generated from admin-src/)
  Foundations.dc.html   Design system (tokens, spacing, components)
  Brand.dc.html         Brand exploration + website mock
  components/           Flower (Ten Systems flower) and Logo components
  admin-src/            Admin console source: tpl.html, admin.css, data.js, logic.js, icons.js, build.py
  assets/               Images: people, scenes, Ten Systems figure, System banners, brand flower SVG
tools/
  build_export.py       Builds portable/
  build_final.py        Builds index.html (single file)
  theme_light.py        Generates the light-theme CSS block inside Main.dc.html
  dc-runtime.js         Runtime that renders the .dc.html components
  *.js                  Playwright journey tests used during development
docs/                   Change log and open decisions
```

`.dc.html` files are design-canvas components: an HTML template with `{{holes}}`, `sc-if` and `sc-for`, plus a `class Component extends DCLogic` script.
The build scripts in `tools/` were written for the original working folder; adjust the paths at the top of each script before running them here.

## Notes

- Photography is under the Pexels License. Replace identifiable people with owned or model-released images before production. System banner artwork was supplied by the client.
- The prototype stores its demo state in the browser's local storage. Use **Reset demo data** (member app: Prototype controls; admin: Settings) to start over.
- Journals and unreported chats are never visible to reviewers. Legal identity stays with the verification provider.
