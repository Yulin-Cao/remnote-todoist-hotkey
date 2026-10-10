export const SETTINGS = {
  token: 'todoist-api-token',
  projectId: 'todoist-project-id',
  shortcut: 'create-task-shortcut',
} as const;

export const LINK_POWERUP = {
  code: 'privateTodoistLink',
  taskId: 'taskId',
  taskUrl: 'taskUrl',
  requestId: 'requestId',
} as const;

export const TODOIST_API_BASE = 'https://api.todoist.com/api/v1';
export const DEFAULT_SHORTCUT = 'cmd+shift+t';
