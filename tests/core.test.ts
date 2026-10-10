import test from 'node:test';
import assert from 'node:assert/strict';
import { remDeeplink, requestIdForRem, taskDescription, todoistTaskUrl } from '../src/core';

test('builds exact-item links', () => {
  assert.equal(remDeeplink('abc 123'), 'https://www.remnote.com/w/abc%20123');
  assert.equal(todoistTaskUrl('6XGgmFVcrG5RRjVr'), 'https://app.todoist.com/app/task/6XGgmFVcrG5RRjVr');
});

test('request ID is stable and accepted length', () => {
  const first = requestIdForRem('a-rem-id-with-symbols_123');
  assert.equal(first, requestIdForRem('a-rem-id-with-symbols_123'));
  assert.ok(first.length <= 36);
  assert.notEqual(first, requestIdForRem('another-rem'));
});

test('description includes exact Rem link', () => {
  assert.match(taskDescription(remDeeplink('xyz')), /https:\/\/www\.remnote\.com\/w\/xyz/);
});
