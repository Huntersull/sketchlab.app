# Hestia replacement deployment

This prepares the existing SketchLab service for `Huntersull/sketchlab.app`.
It is not evidence that a deployment has run.

- Keep `https://hestia.tail3fb0e0.ts.net:9443/` and loopback `127.0.0.1:8788` unchanged.
- Keep the existing Tailscale Serve route and all other services unchanged. No Funnel, firewall, certificate bypass, or SSH setting changes are needed.
- Keep the old `/srv/infra/sketchlab` checkout for rollback. The fork gets a separate `/srv/infra/sketchlab.app` checkout with no new deploy key.
- The Docker definition preserves the existing digest-pinned images, user `101:101`, read-only root, dropped capabilities, no-new-privileges, health check, bounded logs, and query-free nginx logging.
- Boards are browser IndexedDB data for this origin, not a server volume. Do not clear site data. Share URLs embed the board content.
- The inherited AWS workflow and Launch Pad configuration are removed. Hestia deployment does not use the upstream author's AWS role or public domain.

## Prerequisites and rollback capture

Read the current Hestia infrastructure instructions and service runbook. Confirm live identity with `hostname`, `findmnt /`, and `findmnt /boot/firmware`: normal Hestia must boot from the external SSD. Stop if identity or the current stack differs from the recorded deployment.

Before changing anything, inspect the live stack and container. Capture the complete `/srv/stacks/sketchlab` directory, its current resolved Compose configuration, container inspection, current source commit, and `tailscale serve status --json` into a dated admin-only backup. Do not commit the capture. Record the exact current image ID and tag it `sketchlab:rollback-<timestamp>` so a later build cannot displace it. Keep the original stack files and image until replacement and rollback are verified.

Confirm the existing endpoint's `/healthz`, main page, and skill resource before the change. Check free disk space and Hestia temperature/throttling; do not overlap native image builds with other heavy work.

## Prepare the fork

Clone the public fork using HTTPS without creating credentials, then detach at the exact reviewed full commit SHA. Verify the checkout is clean and that the commit exists on the fork's remote. Do not overwrite an existing dirty checkout.

```bash
git clone https://github.com/Huntersull/sketchlab.app.git /srv/infra/sketchlab.app
git -C /srv/infra/sketchlab.app checkout --detach <reviewed-full-commit-sha>
git -C /srv/infra/sketchlab.app status --short
```

Install `Dockerfile`, `compose.yaml`, and `nginx.conf` from this directory into the existing `/srv/stacks/sketchlab` only after the backup above. Preserve permissions. Create `/srv/stacks/sketchlab/.env` containing `SKETCHLAB_SOURCE_COMMIT=<reviewed-full-commit-sha>`; it is a source revision, not a secret. Do not retain stale override files unless they were reviewed against the new definition.

```bash
cd /srv/stacks/sketchlab
docker compose config --quiet
docker compose build --pull app
docker compose up -d --no-build
curl -fsS http://127.0.0.1:8788/healthz
curl -fsS https://hestia.tail3fb0e0.ts.net:9443/healthz
```

No Tailscale command is required. If the existing route is absent or access is blocked, stop and resolve the precise problem rather than creating a new exposure path.

## Verify before calling it deployed

- Exact source SHA, image revision label, healthy status, restart count, loopback-only port binding, user and security flags.
- Same Tailscale Serve/Funnel configuration as before; all existing routes unchanged.
- Main page and `/skills/sketch-lab/SKILL.md` return successfully with normal certificate verification. The skill uses Hestia and the Skill modal copies the current origin.
- A real browser imports a small `?g=` diagram, reloads with the same shapes, generates and imports a `?b=` share URL in a clean context, and opens/closes/reopens the Skill modal. No unexpected external requests or browser errors.
- Install the verified `public/skills/sketch-lab/SKILL.md` into Hestia's personal Codex skills and its infrastructure-managed source, backing up any existing file. Compare hashes. Do not update a managed plugin cache.
- Reconcile the private Hestia infrastructure inventory, stack source and release manifest with the actual deployed fork SHA; do not claim success from source preparation alone.

## Roll back

If any check fails, retain diagnostics and restore the captured stack directory, including its previous `.env` and any Compose overrides. Use the recorded old image ID/rollback tag, then `docker compose up -d --no-build --pull never`. Verify the old image, health, board reload and unchanged private URL. Do not prune the rollback image, remove the old source checkout, run `tailscale serve reset`, or clear browser storage.
