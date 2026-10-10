import { declareIndexPlugin, type ReactRNPlugin } from '@remnote/plugin-sdk';
import { DEFAULT_SHORTCUT, LINK_POWERUP, SETTINGS } from './constants';
import { friendlyError, remDeeplink, requestIdForRem, taskDescription, todoistTaskUrl } from './core';
import { TodoistClient, type TodoistTask } from './todoist';

async function linkedTaskId(rem: Awaited<ReturnType<ReactRNPlugin['focus']['getFocusedRem']>>) {
  return rem?.getPowerupProperty(LINK_POWERUP.code, LINK_POWERUP.taskId);
}

async function appendTaskLink(plugin: ReactRNPlugin, rem: NonNullable<Awaited<ReturnType<ReactRNPlugin['focus']['getFocusedRem']>>>, url: string) {
  const currentText = rem.text ?? [];
  const existingUrls = await plugin.richText.findAllExternalURLs(currentText);
  if (existingUrls.includes(url)) return;
  const link = await plugin.richText.parseFromMarkdown(` · [Todoist ↗](${url})`);
  await rem.setText([...currentText, ...link]);
}

async function saveMapping(rem: NonNullable<Awaited<ReturnType<ReactRNPlugin['focus']['getFocusedRem']>>>, task: TodoistTask, requestId: string) {
  await rem.addPowerup(LINK_POWERUP.code);
  await rem.setPowerupProperty(LINK_POWERUP.code, LINK_POWERUP.taskId, [String(task.id)]);
  await rem.setPowerupProperty(LINK_POWERUP.code, LINK_POWERUP.taskUrl, [todoistTaskUrl(String(task.id))]);
  await rem.setPowerupProperty(LINK_POWERUP.code, LINK_POWERUP.requestId, [requestId]);
}

async function createTodoistTaskFromFocusedRem(plugin: ReactRNPlugin) {
  try {
    const token = (await plugin.settings.getSetting<string>(SETTINGS.token))?.trim();
    if (!token) throw new Error('Add your Todoist API token in Plugin Settings first.');

    const rem = await plugin.focus.getFocusedRem();
    if (!rem) throw new Error('Focus a Rem/bullet first, then run the command again.');

    const existingId = await linkedTaskId(rem);
    if (existingId) {
      await appendTaskLink(plugin, rem, todoistTaskUrl(existingId));
      await rem.setIsTodo(true);
      await plugin.app.toast('Already linked to Todoist — no duplicate created.');
      return;
    }

    const originalText = (await plugin.richText.toString(rem.text ?? [])).trim();
    if (!originalText) throw new Error('The focused Rem is empty.');

    const projectId = (await plugin.settings.getSetting<string>(SETTINGS.projectId))?.trim();
    const remUrl = remDeeplink(rem._id);
    const requestId = requestIdForRem(rem._id);
    const client = new TodoistClient(token);

    // Recovery check covers a prior timeout after Todoist accepted the task but before RemNote saved the mapping.
    let task = await client.findActiveTaskByRemUrl(remUrl);
    if (!task) {
      task = await client.createTask({
        content: originalText,
        description: taskDescription(remUrl),
        projectId: projectId || undefined,
        requestId,
      });
    }

    await saveMapping(rem, task, requestId);
    await rem.setIsTodo(true);
    await rem.setTodoStatus('Unfinished');
    await appendTaskLink(plugin, rem, todoistTaskUrl(String(task.id)));
    await plugin.app.toast('Created and linked Todoist task.');
  } catch (error) {
    console.error('RemNote → Todoist failed', error instanceof Error ? error.message : error);
    await plugin.app.toast(`RemNote → Todoist: ${friendlyError(error)}`);
  }
}

async function onActivate(plugin: ReactRNPlugin) {
  await plugin.settings.registerStringSetting({
    id: SETTINGS.token,
    title: 'Todoist API token',
    description: 'Todoist → Settings → Integrations → Developer. Stored by RemNote plugin settings; never written into a Rem or console.',
    defaultValue: '',
  });
  await plugin.settings.registerStringSetting({
    id: SETTINGS.projectId,
    title: 'Todoist project ID (optional)',
    description: 'Leave blank to use Todoist Inbox.',
    defaultValue: '',
  });
  await plugin.settings.registerStringSetting({
    id: SETTINGS.shortcut,
    title: 'Shortcut shown here for reference',
    description: 'Change the actual shortcut in RemNote Settings → Keyboard Shortcuts by searching for the command name.',
    defaultValue: DEFAULT_SHORTCUT,
  });

  await plugin.app.registerPowerup({
    name: 'Todoist Link',
    code: LINK_POWERUP.code,
    description: 'Private mapping between a Rem and Todoist task.',
    options: {
      slots: [
        { code: LINK_POWERUP.taskId, name: 'Todoist task ID', hidden: true, onlyProgrammaticModifying: true },
        { code: LINK_POWERUP.taskUrl, name: 'Todoist task URL', hidden: true, onlyProgrammaticModifying: true },
        { code: LINK_POWERUP.requestId, name: 'Todoist request ID', hidden: true, onlyProgrammaticModifying: true },
      ],
    },
  });

  await plugin.app.registerCommand({
    id: 'create-focused-rem-in-todoist',
    name: 'Create focused Rem in Todoist',
    description: 'Make the focused Rem a TODO, create a Todoist task, and add both exact-item links.',
    keywords: 'todo task send export',
    keyboardShortcut: DEFAULT_SHORTCUT,
    action: () => createTodoistTaskFromFocusedRem(plugin),
  });
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
