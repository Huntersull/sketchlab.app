# Sketch Lab

A fast, browser-only diagram tool (think a tiny Figma/Excalidraw). Draw shapes,
connect them with auto-snapping lines, drop in icons, and everything auto-saves
locally. No backend — boards live in IndexedDB and are shareable via a single URL.

## Stack

- **Rendering:** [PixiJS v8](https://pixijs.com) (WebGL) — GPU-accelerated, render-on-demand.
- **State:** [nanostores](https://github.com/nanostores/nanostores) — tiny reactive atoms. **No React.**
- **Persistence:** IndexedDB via `idb-keyval`.
- **Sharing:** board JSON → `lz-string` compression → query string.
- **Build:** Vite + TypeScript. Ships as static files (served by nginx in the Dockerfile).

## Commands

```bash
npm install
npm run dev       # local dev server (http://localhost:5173)
npm run build     # type-check + production build to dist/
npm run preview   # serve the production build
```

## Agent skill (generate diagrams into Sketch Lab)

Agents can emit Sketch Lab `GeneratedGraph` JSON and open it with a `?g=` URL.
The fork uses the existing private Hestia origin, preserving browser-local boards. It requires tailnet access. The skill is hosted with the app:

- Skill file: https://hestia.tail3fb0e0.ts.net:9443/skills/sketch-lab/SKILL.md

Install into Claude Code:

```bash
mkdir -p ~/.claude/skills/sketch-lab
curl -fsSL https://hestia.tail3fb0e0.ts.net:9443/skills/sketch-lab/SKILL.md \
  -o ~/.claude/skills/sketch-lab/SKILL.md
```

Then restart Claude Code and ask for a Sketch Lab diagram. The agent builds
`https://hestia.tail3fb0e0.ts.net:9443/?g=<uri-encoded-json>` and opens it.

For Codex, the repository includes `.agents/skills/sketch-lab/SKILL.md`. Install the same file into `~/.codex/skills/sketch-lab/SKILL.md` for use across projects. The in-app Skill dialog always links to its current deployment, including local development. `SKETCHLAB_ORIGIN` can override the skill example's default origin.

The upstream analytics tag is removed to keep private board activity private. The optional OpenAI panel still contacts OpenAI only when deliberately used.

Deployment preparation and rollback: [Hestia](deploy/hestia/README.md).

## How performance is kept flat with many shapes

- **Dirty-set updates, not full diffs.** Actions mutate the nanostore *and* tell the
  renderer exactly which node/edge ids changed (`scene.updateNode(id)`). Dragging one
  of thousands of shapes touches only that node + its incident edges.
- **Render-on-demand.** The Pixi ticker is stopped; `app.render()` is scheduled once
  per animation frame only when something is dirty.
- **Per-view redraw guards.** A shape's `Graphics` is only re-tessellated when its
  geometry/style actually changes; moving it just sets a container transform.
- **All hit-testing in world space** (not Pixi's event tree), so selection/marquee/
  connect/resize are O(changed), and the camera is a single container transform.

## Architecture

```
src/
  state/        types, nanostore atoms (store.ts), mutation actions (actions.ts)
  render/       Pixi scene singleton (scene.ts), shape/edge view builders,
                geometry/snapping math, vector icon registry
  interaction/  controller.ts (pointer/keyboard state machine), camera, viewport,
                text-editor overlay, "/" icon palette
  persistence/  IndexedDB (db.ts), autosave, URL share encode/decode
  ui/           dashboard, editor chrome (toolbar/colors/zoom), DOM helpers, router
  main.ts       hash router: editor (#/board/:id), ?b= board share, ?g= GeneratedGraph import
```

## Shortcuts

`V` select · `T` text · `R` rectangle · `O` circle · `L` connector line ·
`A` arrow (directed edge) · `M` move / pan · `/` icon palette (~80 architecture icons) ·
`⌫`/`Delete` delete selection · `⌘/Ctrl+C/X/V` copy / cut / paste · `⌘/Ctrl+Z` undo ·
`⌘/Ctrl+Shift+Z` (or `Ctrl+Y`) redo · scroll to pan · ⌘/Ctrl+scroll to zoom · space-drag to pan.

Double-click empty canvas to drop a text object · double-click a shape/line to edit
its text/label · drop an image file onto the canvas to add it · drag a selected line's
center handle to bend it · resize handles keep a locked aspect ratio (square for shapes,
natural ratio for images).
