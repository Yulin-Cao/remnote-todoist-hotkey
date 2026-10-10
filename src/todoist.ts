import { TODOIST_API_BASE } from './constants';

export interface TodoistTask {
  id: string;
  content: string;
  description?: string | null;
}

type FetchLike = typeof fetch;

export class TodoistClient {
  constructor(private readonly token: string, private readonly fetcher: FetchLike = fetch) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.fetcher(`${TODOIST_API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    if (!response.ok) {
      const details = (await response.text()).slice(0, 300);
      throw new Error(`Todoist API ${response.status}: ${details || response.statusText}`);
    }
    return (await response.json()) as T;
  }

  createTask(input: { content: string; description: string; projectId?: string; requestId: string }) {
    return this.request<TodoistTask>('/tasks', {
      method: 'POST',
      headers: { 'X-Request-Id': input.requestId },
      body: JSON.stringify({
        content: input.content,
        description: input.description,
        ...(input.projectId ? { project_id: input.projectId } : {}),
      }),
    });
  }

  async findActiveTaskByRemUrl(remUrl: string, maxPages = 5): Promise<TodoistTask | undefined> {
    let cursor: string | undefined;
    for (let page = 0; page < maxPages; page += 1) {
      const query = new URLSearchParams({ limit: '200' });
      if (cursor) query.set('cursor', cursor);
      const data = await this.request<{ results: TodoistTask[]; next_cursor?: string | null }>(`/tasks?${query}`);
      const match = data.results.find((task) => task.description?.includes(remUrl));
      if (match) return match;
      cursor = data.next_cursor || undefined;
      if (!cursor) return undefined;
    }
    return undefined;
  }
}
