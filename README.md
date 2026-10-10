# RemNote → Todoist Hotkey (private plugin)

An individual-Rem workflow: focus a Rem, run **Create focused Rem in Todoist**, and the plugin:

1. reads that Rem's original text;
2. creates a Todoist task containing the text and a link to the exact Rem;
3. converts the same Rem into a native, unfinished RemNote TODO;
4. appends a clickable `Todoist ↗` link without moving the Rem or changing its children;
5. records a hidden mapping so repeated runs do not create duplicates.

## Install on macOS

1. Download `PluginZip.zip` from the release/build output. Do not unzip it.
2. In RemNote desktop, open **Settings → Plugins → Build → Upload plugin**.
3. Select `PluginZip.zip` and approve the requested RemNote permission.
4. In Todoist, open **Settings → Integrations → Developer** and copy the personal API token.
5. In RemNote, open **Plugin Settings → RemNote → Todoist Hotkey** and paste the token. Optionally add a Todoist project ID; blank means Inbox.
6. Focus a normal Rem and run **Create focused Rem in Todoist** from the command palette once as a smoke test.
7. The default shortcut is `Cmd+Shift+T`. To customize it, open RemNote **Settings → Keyboard Shortcuts**, search for **Create focused Rem in Todoist**, and assign the shortcut you prefer.

The public repository contains source code only. Your Todoist token is entered after installation and is held by RemNote's persistent plugin-settings store; it is never committed to GitHub, placed in a Rem, task description, source file, or log.

The token is held by RemNote's persistent plugin-settings store. It is never placed in a Rem, task description, source file, or log. The current public SDK does not expose macOS Keychain/secure-secret storage; use a Todoist personal token you can revoke, and do not distribute your configured plugin data.

## Duplicate and error behavior

- A hidden per-Rem powerup stores the Todoist task ID/URL.
- Todoist receives a deterministic `X-Request-Id` for the Rem.
- If a previous request timed out after Todoist created the task, a retry searches active tasks for the exact Rem link and repairs the local mapping.
- API errors appear as RemNote toasts. A failed Todoist request does not convert the Rem or append a link.
- If Todoist succeeded but a later RemNote write failed, run the command again; recovery finds the existing task.

## Build and test from source

Requires Node.js 18 or newer:

```sh
npm install
npm test
npm run check-types
npm run build
```

The build creates `PluginZip.zip`.

## Todoist → RemNote completion sync feasibility

It is feasible, but not as a truly always-running feature inside a private RemNote plugin alone:

- While RemNote desktop is open, a later version can poll Todoist's completed-task endpoint and call RemNote's official `setTodoStatus('Finished')` method using the stored task mapping.
- True push sync while RemNote is closed needs an externally reachable HTTPS webhook receiver (and normally a registered Todoist OAuth app). A local front-end plugin cannot receive Todoist webhooks.
- Todoist recurring tasks need explicit semantics because "complete" advances the occurrence rather than permanently closing the task.

For those reasons, completion sync is deliberately excluded from this MVP. The next safe feature should be **manual Sync Now + optional polling while RemNote is open**, tested before considering a hosted webhook service.

## API choices verified for this MVP

- RemNote SDK `0.0.46`: `focus.getFocusedRem()`, `Rem.setIsTodo()`, `Rem.setTodoStatus()`, powerup slots, rich-text parsing, persistent settings, and command shortcuts.
- Todoist API v1: `POST /api/v1/tasks`, Bearer token auth, `X-Request-Id`, cursor pagination, and task URLs in the documented `https://app.todoist.com/app/task/{id}` form.
