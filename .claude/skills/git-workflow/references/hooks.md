# Hooks

**These ship with the plugin.** `hooks/hooks.json` at the plugin root is loaded automatically
by Claude Code on install — there is nothing to paste into `settings.json` and no absolute path
to keep in sync across plugin updates. Installing the plugin is the opt-in.

Every script exits 0 outside a git repo and honours the per-repo kill switch, so this is safe
with the plugin enabled globally.

## What ships

| Hook | What it does | Why it is reliable | Cost |
|---|---|---|---|
| `SessionStart` | Runs `git-context.sh`; its stdout is injected as context. Branch, divergence, dirty counts, open PRs, `work`/`solo`, `package`/`app`, and warnings for detached HEAD, dirty default branch, no upstream. | Fires once per session, output goes straight into context. Nothing to misfire. | one `gh` call, ~300 ms |
| `PreToolUse` on `Bash` | Runs `guard-git.sh`. Exit 2 blocks the call and hands the reason to the model, which then has to ask you. Covers force-push without a lease, force-push to the default branch, `reset --hard`, `clean -fd`, `checkout --`, `--no-verify`, `filter-branch`, `merge --admin`, `stash drop`, `reflog expire`. | Pure regex — no model judgment between the command and the block. **This is the hook that actually enforces the Never list.** | ~5 ms per Bash call |
| `Stop` | Runs `stop-check.sh`. Blocks the turn ending on an uncommitted diff past the checkpoint threshold. | Gated on a per-HEAD stamp file and on `stop_hook_active`, so it fires once per checkpoint and cannot loop. | two `git` calls |

Three hooks, three distinct failure modes: not knowing what you walked into, doing something
irreversible, and walking away from work.

## What deliberately does not ship

**`PostToolUse` on `Edit|Write`** — a diff budget that nudges mid-task rather than at the end.
It fires on *every* write and is largely redundant with the `Stop` hook. Add it to your own
`settings.json` if you want the earlier signal:

```jsonc
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" skills/git-workflow/scripts/stop-check.sh",
            "shell": "bash"
          }
        ]
      }
    ]
  }
}
```

**`SessionEnd`** — it cannot block, and its output never reaches the model. By the time it runs,
nothing can act on what it says. It can only write a log file. `Stop` is what actually protects
end-of-work; `SessionEnd` would be theatre.

## Windows

Hook commands run through `hooks/run-hook.cmd`, a cmd/bash polyglot: `cmd.exe` executes the
batch half, which locates Git Bash and re-invokes the script; a POSIX shell reads the same file
as a shell script. Its argument is a path relative to the plugin root, so hook scripts stay next
to the skill that owns them.

If no bash is found anywhere, the wrapper exits 0 rather than 1 — a missing shell must never
block every Bash tool call through the `PreToolUse` hook. You lose the hooks, not the session.

`*.cmd` and `*.sh` are pinned to LF in `.gitattributes`. CRLF breaks the polyglot: the heredoc
terminator reads as `CMDBLOCK\r`, never matches, and bash swallows the entire file.

## Turning it off

- **One repo:** `mkdir -p .claude && touch .claude/git-workflow-off`. Every script exits early.
- **Everywhere:** `/plugin disable toolkit@skills`, or delete `hooks/hooks.json` from your
  local plugin cache. Disabling the plugin also unloads the skill.

## Verifying

```sh
P=~/.claude/plugins/cache/skills/toolkit/*/   # or your dev junction

bash "$P"hooks/run-hook.cmd skills/git-workflow/scripts/git-context.sh

echo '{"tool_input":{"command":"git reset --hard"}}' \
  | bash "$P"hooks/run-hook.cmd skills/git-workflow/scripts/guard-git.sh; echo $?   # 2

echo '{"tool_input":{"command":"git status"}}' \
  | bash "$P"hooks/run-hook.cmd skills/git-workflow/scripts/guard-git.sh; echo $?   # 0
```
