# e2e/rig — sling-pickup scenario rig config

Test rig for `e2e/scenarios/sling-pickup.spec.ts`. Defines a single
agent (`devin-test`) whose `start_command` invokes [Devin CLI][devin]
in non-interactive mode to write a marker file and close its assigned
bead, proving the full UI → `gc sling` → rig → agent → close wire.

## Files

| File | Role |
|---|---|
| `agents/devin-test/agent.toml` | Rig agent definition (start_command, prompt_template, lifecycle). Header comment explains the invocation shape per upstream `gastownhall/gascity`. |
| `agents/devin-test/prompt.template.md` | Agent prompt template loaded into devin's system context. |
| `README.md` | This file. |

## Why devin (not kilo)

The original plan proposed Kilo CLI as the harness. We use Devin CLI
instead because:

1. **No provider/key wiring in this repo.** Devin discovers its own
   auth from `~/.config/devin/`, just like Kilo would. The harness
   choice is independent of the orchestrator code.
2. **`devin -p "<prompt>"` is the documented non-interactive entry
   point** (see `devin --help`). It matches the one-shot pattern the
   rig's `start_command` needs.
3. **No rate-limit coupling.** Devin's billing is separate from the
   planner's, so running it inside the rig does not consume the
   same budget as the console's own dev loop.

## Bootstrap a city with this rig

The console e2e spec bootstraps the city through the UI's
`/cities` page (the existing scenario contract is "real `gc`
only"). To bootstrap manually for a smoke test:

```sh
RUN=myrun
CITY=/tmp/gc-e2e-$RUN
mkdir -p "$CITY/agents/devin-test"
cp e2e/rig/agents/devin-test/agent.toml "$CITY/agents/devin-test/agent.toml"
cp e2e/rig/agents/devin-test/prompt.template.md "$CITY/agents/devin-test/prompt.template.md"

# Drop a city.toml that re-uses the rig agent as the only listed
# rig. The rig's header comment explains why `gc init --file` is the
# right entry point for this harness.
cat >"$CITY/city.toml" <<EOF
[workspace]
name = "gc-e2e"

[[agent]]
name = "devin-test"
start_command = '''$(sed -n '/^start_command = /,/'''$/p' e2e/rig/agents/devin-test/agent.toml)'''
prompt_template = "//agents/devin-test/prompt.template.md"
EOF

gc init --file "$CITY/city.toml" --preserve-existing "$CITY"
gc register "$CITY"        # or `gc start` to auto-register + start
```

`gc init --file` skips the provider-readiness preflight that
`gc init --default-provider` enforces (it checks that claude/codex
are installed). `devin` is not on the readiness whitelist, so we
use `--file` to bypass the gate.

## Cleanup

```sh
gc stop "$CITY" || true
rm -rf "$CITY"
```

## Why we don't read the bead text

Per `gastownhall/gascity` `internal/runtime/subprocess/subprocess.go`,
the rig's `start_command` is invoked as `sh -c "<command>"` with
**no** `$TASK` / `$BEAD_ID` substitution — task text lives in the
beads store and the agent discovers it via `bd show $GC_SESSION_ID`.
For the e2e scenario the rig is a deterministic responder: it
ignores the user-supplied task text and just performs the marker
write + bead close, so the spec's per-run marker path is fixed and
deterministic regardless of what the composer typed.

[devin]: https://github.com/ThePlenkov/devin