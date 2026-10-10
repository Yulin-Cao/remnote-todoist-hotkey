import test from 'node:test';
import assert from 'node:assert/strict';
import { TodoistClient } from '../src/todoist';

test('creates a task with auth, project and idempotency headers', async () => {
  let seen: { url?: string; init?: RequestInit } = {};
  const fakeFetch: typeof fetch = async (url, init) => {
    seen = { url: String(url), init };
    return new Response(JSON.stringify({ id: 'task-1', content: 'Research' }), { status: 200 });
  };
  const result = await new TodoistClient('secret', fakeFetch).createTask({
    content: 'Research', description: 'Source', projectId: 'project-1', requestId: 'stable-id',
  });
  assert.equal(result.id, 'task-1');
  assert.equal(seen.url, 'https://api.todoist.com/api/v1/tasks');
  assert.equal(new Headers(seen.init?.headers).get('Authorization'), 'Bearer secret');
  assert.equal(new Headers(seen.init?.headers).get('X-Request-Id'), 'stable-id');
  assert.deepEqual(JSON.parse(String(seen.init?.body)), {
    content: 'Research', description: 'Source', project_id: 'project-1',
  });
});

test('recovers an existing task by exact Rem URL', async () => {
  const remUrl = 'https://www.remnote.com/w/rem-1';
  const fakeFetch: typeof fetch = async () => new Response(JSON.stringify({
    results: [{ id: 'existing', content: 'Research', description: `Source: ${remUrl}` }], next_cursor: null,
  }), { status: 200 });
  const task = await new TodoistClient('secret', fakeFetch).findActiveTaskByRemUrl(remUrl);
  assert.equal(task?.id, 'existing');
});
