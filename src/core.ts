export function remDeeplink(remId: string): string {
  return `https://www.remnote.com/w/${encodeURIComponent(remId)}`;
}

export function todoistTaskUrl(taskId: string): string {
  return `https://app.todoist.com/app/task/${encodeURIComponent(taskId)}`;
}

// Deterministic and <= 36 bytes so retrying the same Rem is idempotent at Todoist.
export function requestIdForRem(remId: string): string {
  let hash = 2166136261;
  for (const character of remId) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `rn-${(hash >>> 0).toString(16).padStart(8, '0')}-${remId.replace(/[^a-zA-Z0-9]/g, '').slice(-20)}`.slice(0, 36);
}

export function taskDescription(remUrl: string): string {
  return `Source: RemNote\n[Open original Rem](${remUrl})`;
}

export function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/401|unauthor/i.test(message)) return 'Todoist rejected the API token. Check it in Plugin Settings.';
  if (/403|forbidden/i.test(message)) return 'Todoist denied access. Check the token and project ID.';
  if (/network|fetch|load failed/i.test(message)) return 'Network error. Nothing was duplicated; retry when online.';
  return message.length > 180 ? `${message.slice(0, 177)}…` : message;
}
