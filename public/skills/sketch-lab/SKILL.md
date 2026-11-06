---
name: sketch-lab
description: >-
  Generate Sketch Lab architecture diagrams and open them via a share URL.
  Use when the user asks for a Sketch Lab diagram, sketchlab.app board, 3D floor
  stack diagram, architecture sketch to open in Sketch Lab, or to emit GeneratedGraph
  JSON for Sketch Lab. Not for Mermaid, Excalidraw, or Mission Control diagram modals.
---

# Sketch Lab diagrams

Produce a **GeneratedGraph** JSON object, then open it in Sketch Lab with a `?g=` URL.
Do **not** emit Mermaid, ASCII art, or markdown fences around the JSON when building the URL.

**App origin (private Hestia):** `https://hestia.tail3fb0e0.ts.net:9443`

Requires access to Hunter's private tailnet. Override with `SKETCHLAB_ORIGIN` or a user-provided base for local development (e.g. `http://localhost:5173`). If this origin is unreachable, return the generated link and report the access limit; do not send the diagram to a public fallback.

The query string contains the diagram. Treat the URL as the board content, and share it only with the intended recipients. Boards persist in IndexedDB for the exact browser profile and origin.

## Workflow

1. Draft a `GeneratedGraph` that matches the schema below.
2. Prefer 4–14 nodes unless the user asks for more (hard cap 48 nodes / 96 edges / 48 floors).
3. Build and open:

```text
{ORIGIN}/?g={URI_ENCODED_JSON}
```

Example (shell — works without lz-string):

```bash
ORIGIN="${SKETCHLAB_ORIGIN:-https://hestia.tail3fb0e0.ts.net:9443}"
JSON='{"name":"Demo","layers":[],"nodes":[{"id":"api","label":"API","kind":"icon","icon":"microservice","color":"#0f2740","layer":0}],"edges":[]}'
open "${ORIGIN}/?g=$(python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$JSON")"
```

On Linux use `xdg-open` instead of `open`. On Windows PowerShell:

```powershell
$origin = if ($env:SKETCHLAB_ORIGIN) { $env:SKETCHLAB_ORIGIN.TrimEnd("/") } else { "https://hestia.tail3fb0e0.ts.net:9443" }
$json = '{"name":"Demo","layers":[],"nodes":[{"id":"api","label":"API","kind":"icon","icon":"microservice","color":"#0f2740","layer":0}],"edges":[]}'
$url = "$origin/?g=$([Uri]::EscapeDataString($json))"
Start-Process $url
```

Tell the user the URL if you cannot open a browser.

4. Briefly confirm what you opened (board name + node count). Do not paste the full JSON unless they ask.

## Schema

```json
{
  "name": "string (optional)",
  "layers": [{ "name": "string", "color": "#RRGGBB" }],
  "nodes": [{
    "id": "string",
    "label": "string",
    "kind": "rect | circle | icon | text",
    "icon": "string (icon key when kind is icon)",
    "color": "#RRGGBB",
    "layer": 0
  }],
  "edges": [{
    "from": "node id",
    "to": "node id",
    "label": "string",
    "directed": true
  }]
}
```

Rules:

- `nodes` required, ≥1. `id` unique. Edges must reference existing ids; no self-loops.
- Use `"kind": "icon"` for services, DBs, queues, clouds, users, clients, infra.
- Use `"kind": "text"` only for annotations. Prefer `"kind": "rect"` / `"circle"` sparingly.
- Colors: dark-canvas fills like `#0f2740`; floor accents bright (`#38bdf8`, `#4ade80`, `#fbbf24`, `#fb923c`, `#f472b6`, `#c084fc`).
- Prefer directed edges for request/data/dependency flow.
- **Floors:** `layers` is bottom→top. Each node’s `layer` is a 0-based floor index. Use 2–5 floors when the system has natural tiers (e.g. Data → App → Edge → Client). For a flat diagram: `"layers": []` and `"layer": 0` on every node.
- Icon keys must be from the list below (unknown icons fall back to `microservice`).

## Icon keys

server, container, kubernetes, vm, function, microservice, cpu, memory, router, switch, firewall, load-balancer, gateway, proxy, dns, cdn, wifi, network, vpn, globe, database, cache, table, bucket, disk, archive, file, folder, queue, event-bus, stream, webhook, bell, alert, chat, mail, feed, browser, desktop, laptop, phone, tablet, gauge, chart, logs, dashboard, git, repo, pipeline, package, terminal, code, gear, rocket, bug, bot, neural, search, lock, key, shield, vault, certificate, fingerprint, user, users, id-badge, cloud, datacenter, location, calendar, clock, sync, upload, download, link, tag, flag, toggle, filter, workflow, decision, bolt, check, star, heart

## Examples

### Flat request path

```json
{
  "name": "Checkout API",
  "layers": [],
  "nodes": [
    { "id": "web", "label": "Web", "kind": "icon", "icon": "browser", "color": "#0f2740", "layer": 0 },
    { "id": "api", "label": "API", "kind": "icon", "icon": "microservice", "color": "#0f2740", "layer": 0 },
    { "id": "db", "label": "Postgres", "kind": "icon", "icon": "database", "color": "#0f2740", "layer": 0 }
  ],
  "edges": [
    { "from": "web", "to": "api", "label": "HTTPS", "directed": true },
    { "from": "api", "to": "db", "label": "SQL", "directed": true }
  ]
}
```

### Floored stack

```json
{
  "name": "SaaS stack",
  "layers": [
    { "name": "Data", "color": "#38bdf8" },
    { "name": "App", "color": "#4ade80" },
    { "name": "Edge", "color": "#fbbf24" }
  ],
  "nodes": [
    { "id": "db", "label": "DB", "kind": "icon", "icon": "database", "color": "#0f2740", "layer": 0 },
    { "id": "api", "label": "API", "kind": "icon", "icon": "microservice", "color": "#0f2740", "layer": 1 },
    { "id": "cdn", "label": "CDN", "kind": "icon", "icon": "cdn", "color": "#0f2740", "layer": 2 }
  ],
  "edges": [
    { "from": "cdn", "to": "api", "label": "", "directed": true },
    { "from": "api", "to": "db", "label": "", "directed": true }
  ]
}
```

## Install this skill

Agents with tailnet access can install from the live site after deployment. For Codex, use `~/.codex/skills/sketch-lab/SKILL.md` (or `$CODEX_HOME/skills/sketch-lab/SKILL.md`); for a repository-scoped Codex skill use `.agents/skills/sketch-lab/SKILL.md`. Claude Code installation:

```bash
mkdir -p ~/.claude/skills/sketch-lab
curl -fsSL https://hestia.tail3fb0e0.ts.net:9443/skills/sketch-lab/SKILL.md \
  -o ~/.claude/skills/sketch-lab/SKILL.md
```

Or point Claude Code at the folder URL / raw `SKILL.md` and ask it to install into `~/.claude/skills/sketch-lab/`.

Project-local copy:

```bash
mkdir -p .claude/skills/sketch-lab
curl -fsSL https://hestia.tail3fb0e0.ts.net:9443/skills/sketch-lab/SKILL.md \
  -o .claude/skills/sketch-lab/SKILL.md
```

Restart the Claude Code session after installing.

## Do not

- Emit Mermaid for Sketch Lab (wrong product format).
- Use invented icon names.
- Put more than 48 nodes or hardcode layouts/x,y (Sketch Lab auto-layouts).
- Use the Mission Control `/api/diagram` Mermaid skill for Sketch Lab boards.
