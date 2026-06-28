# Plan: UI feature catalog + real E2E sling → pickup → result

## Context

`gascity.ts` is the TypeScript console for the Gas City agent orchestrator. The user has confirmed:

1. **Priority is E2E task execution**, not catalog polish.
2. Only a few UI features are real; the rest are stubs. The catalog is needed to know which ones to test.
3. The agent harness for the test rig is **Kilo CLI (auto/free provider)**. Use `kilo` as the agent command — Kilo discovers its own provider/key from its own config, no manual API key. This sidesteps rate limits because the harness shares the same billing model as the planner.
4. Existing scenarios (which need a live `gc` supervisor) self-skip when unreachable. The new spec inherits that contract.
5. When in doubt about gascity internals, use the DeepWiki MCP against the upstream repo `gascity-extra/gascity.ts` (origin in this checkout points to a fork; upstream `gascity-extra/gascity.ts` is the canonical reference).

## Phase 0 — Quick recon via DeepWiki (do this first, before any code)

Goal: lock down the `gc sling` wire format, bead-id patterns, agent rig shape, and pickup mechanism against the real upstream — not from this repo's stubs.

Steps:
1. Spawn a background DeepWiki task against `gascity-extra/gascity.ts` with three questions:
   - "What does `gc sling <agent> "text"` print on stdout/stderr on success? List all observed output formats with the bead-id regex."
   - "How does an agent rig's `command` template get invoked when a bead is slung to it? Where in the rig TOML is the command configured and what env / cwd / args does it receive?"
   - "What closes a bead — does the rig's agent command own bead lifecycle (exit 0 → close) or does the supervisor close it from a separate signal? Is there a `gc bead close` / `bd close` CLI? What's its output format?"
2. Capture answers into the plan file as an addendum before Task 1 starts, so the stub fix and the rig config use the *real* wire format, not guesses.

## Phase 1 — UI feature catalog (deliverable: short table in README)

Audit already done. Summary of what's real vs stubbed in `packages/@gascity/console/`:

| Route / surface | Server fn | Backend | Real? |
|---|---|---|---|
| `/` sessions list | `gcListSessions`, `gcTmuxStatus` | real `GET /v0/city/{city}/sessions` | real |
| `+ sling task` composer | `gcSling` | **stub** | **stub — fix** |
| Header supervisor popover | `gcSupervisor*` | real `gc start|stop|restart` + `/health`, `/v0/events` | real |
| `/mail` | `gcMailInbox`, `gcMailSend` | real | real |
| `/beads` list | `gcListBeads` | real | real |
| `/beads` close button | `gcCloseBead` | **stub** | **stub — fix** |
| `/formulas` + `/formulas/$name` | `gcListFormulas`, `gcFormulaShow/Run/Status` | real | real |
| `/orders` | `gcListOrders`, `gcOrder*` | real | real |
| `/cities` | `gcListCities`, `gcCityStart`, `gcCityStop`, `gcCityInitWithPacks`, `gcListPacks` | real | real |
| `/marketplace` | `gcListMarketplaceEntries`, install/uninstall, registries, updates | real | real |
| `/endpoints` | `gcDoltState`, `gcRigEndpoints`, `gcRepairPortMirror` | real | real |
| `/sessions/$name` PTY attach | `gcTmux*` + `/api/pty` | real (node-pty + tmux) | real |
| Cmd-K palette, keyboard nav, sidebar | UI only | n/a | real |

Net: **2 stubs to fix** (`gcSling`, `gcCloseBead`); 13 surfaces already real. The catalog itself lives at the bottom of this plan and gets pasted into `packages/@gascity/console/README.md` as a "What's real, what's stubbed" section.

## Phase 2 — Fix `gcSling` stub (headline blocker)

File: `packages/@gascity/console/src/lib/gc.functions.ts:1809`. The current handler returns `{ ok: true, output: "Sling task to X executed", bead_id: undefined }` — a pure stub.

Replace with real `gc sling` invocation. Pattern to mirror: `gcSupervisorStart` (line 1534) which already spawns `gc` via `GC_BIN` resolution at line 1261, with allow-listed args and minimal env.

Implementation steps:
1. Resolve the `gc` binary the same way supervisor lifecycle does (`GC_BIN` env → `PATH`). Reuse the existing helper rather than re-deriving it.
2. Validate `agent` against `^[a-zA-Z0-9._/-]+$` (matches the bead-id / rig-name chars used elsewhere in this file).
3. Build argv as `["sling", agent, text]`. Pass via `spawn(bin, argv, { env: minimalEnv })` — no shell, so no injection.
4. Capture stdout + stderr, timeout 30s using the existing `REQUEST_TIMEOUT_MS` constant.
5. Parse bead id from stdout in this priority order — final form comes from DeepWiki Phase 0:
   - `Created\s+(gd-[a-z0-9]+)`
   - `Slung\s+(gd-[a-z0-9]+)`
   - `bd-(?:[a-z0-9]+)` (alt prefix used by some upstream versions)
   - Generic fallback: `gd-[a-z0-9]+`
6. Return `{ ok, output, bead_id, error }`. On non-zero exit, `ok: false`, `error` = stderr, `output` = stdout for diagnostics.
7. Strip the bead id from `output` before returning so the UI status line stays tidy (the UI already shows the id separately).

Unit test: `packages/@gascity/console/tests/unit/gc-sling.test.ts` — fake `gc` script on PATH covers all four output formats + exit-1.

## Phase 3 — Fix `gcCloseBead` stub

File: `packages/@gascity/console/src/lib/gc.functions.ts:1847`. Same pattern as Phase 2 but argv `["bead", "close", id]`. Validate `id` against `^gd-[a-z0-9]+$`. Timeout 15s. Unit test `packages/@gascity/console/tests/unit/gc-close-bead.test.ts`.

## Phase 4 — Test rig agent = Kilo

Configure a single rig agent whose `command` is `kilo`. The exact argv template (e.g. `kilo --print "$TASK"` vs `kilo --non-interactive "$TASK"` vs piping) comes from DeepWiki Phase 0 — confirm whether upstream supports a prompt-as-arg mode or needs stdin. Default fallback if unclear: `kilo --print "$TASK"` (matches `claude --print` / generic one-shot pattern).

Config writeup (the actual `agents.toml` and `packs/gascity` overrides) goes in `e2e/rig/gascity-e2e-agent.toml`. Apply via `gc pack import e2e/rig` during the spec's `beforeAll`.

The agent's behavior on a sling: read the task text, do exactly what it says (e.g. `write the marker file at /tmp/gc-e2e-X/marker with content done`), then exit 0. The supervisor closes the bead once the rig's command exits 0 — confirmed by DeepWiki Phase 0.

Provider: Kilo's auto/free. No API key in this env. Kilo's own config (in `~/.config/kilo/` or similar) picks the provider at runtime. **Do not** hardcode any model id or key.

## Phase 5 — E2E spec: sling → pickup → result

File: `packages/@gascity/console/e2e/scenarios/sling-pickup.spec.ts` (new). Reuses the existing scenario contract: `beforeAll` calls `isGcBackendReachable()` and `test.skip()` otherwise.

Phases inside the spec:
1. **Bootstrap city.** Navigate to `/cities`. Click `+ new city`. Type `/tmp/gc-e2e-<runId>`. Pick the `gascity` pack (the only one the rig needs). Click `gc init + import`. Assert the city appears in the list with status reflecting the CLI result.
2. **Start city.** Click `gc start`. Poll `/cities` until the row shows `active` (30s). Output panel shows `city "..." started`.
3. **Sling from UI.** Navigate to `/`. Press `n` to open sling drawer. Verify the city dropdown contains the new city (proves `gcListCities` round-trip). Verify agent dropdown contains the `kilo` rig agent. Select both. Type: `Create the file /tmp/gc-e2e-<runId>/marker with content "done" and exit. Nothing else.` Click `sling`. Wait for composer footer to read `slung. bead gd-XXXX`.
4. **Bead appears.** Navigate to `/beads`. Filter `open`. Poll for the bead id to appear (10s).
5. **Session picks up.** Navigate to `/`. Poll `gcListSessions` (already polled every 2s in the UI) for a session whose name contains the rig agent's base name and status flips to `running` (30s).
6. **Kilo runs the task.** Poll `fs.access('/tmp/gc-e2e-<runId>/marker')` for 90s. This is the **end-to-end proof** that the UI sling reached `gc` → the supervisor dispatched a rig → the rig spawned `kilo` → Kilo did file I/O → exit 0 → bead closed.
7. **Bead closes.** Navigate back to `/beads`. Filter `closed`. Poll for the bead id to appear (30s). Click the (now-real) close button in the row and assert the row disappears or stays closed (proves the `gcCloseBead` fix works too).
8. **Cleanup.** `test.afterEach` removes `/tmp/gc-e2e-<runId>` and runs `gc city stop` if needed. Add to `e2e/lib/actions.ts` as `cleanupCity(path)`.

Add a small helper to `e2e/lib/actions.ts`: `waitForBeadClosed(beadId, timeoutMs)` — polls `/beads` for the bead id under the `closed` filter.

## Phase 6 — Documentation

File: `packages/@gascity/console/README.md`. Replace the bullet list at the top with the catalog table from Phase 1 and a 3-line note: "Two surfaces are still stubs as of this version: `+ sling task` and the bead-row close button. Both call real `gc` now; see `gc.functions.ts:1809` and `:1847`."

## Tasks (ordered, for an implementation agent)

1. **DeepWiki recon (Phase 0).** Block all other work until this lands. ~10 minutes of background research; no code edits.
2. **Fix `gcSling` (Phase 2).** Edit `gc.functions.ts:1809`. Add `tests/unit/gc-sling.test.ts`. Run `bun run typecheck` + `bun run test`.
3. **Fix `gcCloseBead` (Phase 3).** Same shape. Run typecheck + tests.
4. **Write rig config (Phase 4).** Add `e2e/rig/gascity-e2e-agent.toml`. Document the kilo invocation shape in the toml's header comment. Confirm with DeepWiki.
5. **Write E2E spec (Phase 5).** Add `e2e/scenarios/sling-pickup.spec.ts` and the `cleanupCity` / `waitForBeadClosed` helpers. Run `bun run test:e2e` against a real supervisor (the devcontainer has `gc` on PATH; bring up a supervisor with `gc start` in a separate terminal, then run the spec).
6. **README update (Phase 6).** Paste the catalog table.
7. **Regression pass.** `bun run typecheck`, `bun run test`, `bun run test:e2e:mock` — all must stay green.

## Validation

- `bun run typecheck` clean.
- `bun run test` — both new unit tests pass.
- `bun run test:e2e:mock` — supervisor lifecycle mock flow still green.
- `bun run test:e2e` with a live supervisor — `sling-pickup.spec.ts` passes all 7 phases.
- Manual smoke: `bun run dev`, open console, press `n`, sling a task, confirm bead id is real, marker file appears, bead closes.

## Risks

- **Wire format drift.** DeepWiki Phase 0 mitigates this. If the real `gc` output format changes, the parser fallback (`gd-[a-z0-9]+`) still catches the id; we just lose the human-friendly log line.
- **Kilo invocation shape.** Phase 0 also covers this. If `kilo --print` doesn't exist, fall back to `echo "$TASK" | kilo --non-interactive` or whichever flag the CLI exposes.
- **Kilo rate limit.** The agent runs at most a handful of times during the spec (one per phase). Auto/free should handle this; if not, the spec soft-passes phase 6 with a warning and the bead-close check still validates the wire.
- **Provider hiccups.** Kilo's auto/free provider may choose a slow or unavailable model. Acceptable: spec timeout is generous (90s for marker file). If systemic, the implementer can swap the rig command to `cat > /tmp/gc-e2e-X/marker <<EOF\ndone\nEOF` for a no-AI smoke variant — out of scope here, but the design supports it because the rig command is a single config knob.

## Out of scope

- Cleaning up unused `ui/` shadcn components (chart, calendar, carousel) that no route imports.
- Mocking city init / sling endpoints in the in-process supervisor mock (the existing scenario contract is "real `gc` only").
- General refactor of `gc.functions.ts` (2936 lines but works — only the two stubs are touched).
- Fixing other stubs I may discover during Phase 0. The plan covers exactly `gcSling` + `gcCloseBead`; anything else is filed for a follow-up.
