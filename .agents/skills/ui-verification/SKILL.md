---
name: UI Verification
description: Verify FutureMail UI changes in a real browser using headless agent-browser. Use whenever a task requires checking rendered output, accessibility tree, computed styles, geometry, layout, or interactive behavior after a UI change. Never substitute a visible terminal-browser pane for this.
---

# UI verification with headless agent-browser

Verify rendered UI with `agent-browser`. It is headless by default, takes no
terminal pane, and does not steal the user's input. Use it for every automated
UI check in this project.

This project does **not** use `terminal-browser` (`open`, `new-tab`, `--split`,
or `terminal-browser action`) for verification. Only reach for it when the user
explicitly asks for a visible browser, and never as a fallback when
agent-browser fails.

## 1. Locate the binary

Use `~/.local/bin/agent-browser`. It is a symlink into the terminal-browser
install directory, so upgrades keep it valid:

```bash
AB="$HOME/.local/bin/agent-browser"
"$AB" --version    # expect 0.33.x
```

- If that path is missing or not executable, report visual verification as
  **unverified** and tell the user to recreate the link:

  ```bash
  ln -sfn ~/.local/share/terminal-browser/app/agent-browser/bin/agent-browser ~/.local/bin/agent-browser
  ```

  Never silently fall back to `terminal-browser`.
- Chrome is provisioned by agent-browser itself under `~/.agent-browser/browsers`,
  not from the system. If a launch reports Chrome missing, run `"$AB" install`
  once and retry. If install fails, report the check as unverified.

## 2. Run the check

Always pass `--headed false` explicitly so a user config cannot make the browser
visible, use one task-unique session name, and close it at the end.

```bash
AB="$HOME/.local/bin/agent-browser"
S=futuremail-ui-$(date +%s)

"$AB" --session "$S" --headed false open http://localhost:3000
"$AB" --session "$S" snapshot -i --urls
# ... act and re-check ...
"$AB" --session "$S" close
```

Useful commands:

| Goal | Command |
| --- | --- |
| Structure / refs | `snapshot -i --urls` (refs like `@e12`) |
| Act on an element | `click @e12`, `fill @e12 "text"`, `press Enter` |
| Text, value, attr | `get text <sel>`, `get value <sel>`, `get attr href <sel>` |
| Computed style | `get styles <sel>` |
| Bounding box | `get box <sel>` |
| Visibility / state | `is visible <sel>`, `is enabled <sel>` |
| Arbitrary assertions | `eval "<js>"` (`--stdin` for multiline) |
| Wait for readiness | `wait <sel>`, `wait <ms>` |

Prefer `snapshot` refs over hand-written selectors; they stay correct when the
DOM shifts.

## 3. Dev server

```bash
bun run dev     # http://localhost:3000
```

Read the actual port from the output: if 3000 is taken, Nuxt falls back to 3001.
Never assume the port. Stop any dev server you started when the check is done.

## 4. Judging results

- Assert on the accessibility tree, computed styles, and geometry. Those are
  objective and survive a model without image input.
- Do **not** claim a pixel-level or "looks right" verdict from a screenshot when
  you cannot see images. Say what you measured instead.
- Delete any throwaway route or preview page you added for the check.

## 5. Gotchas

- `network route --body` drops the `Content-Type` header, so `ofetch` will not
  parse JSON responses. Patch `window.fetch` via `eval` to re-add
  `application/json`, or stub the response inside the page instead.
- The board polls every 5s; after mutating data, wait for the next poll or
  reload rather than snapshotting immediately.
- In-transit emails must never expose subject or body through the API. If you
  seed data for a check, respect that invariant.
