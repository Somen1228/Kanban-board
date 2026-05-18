// Powerful search: multi-keyword AND, has:image / has:done filters,
// per-board match counts, ordered match list for jump-to-next navigation.

import { isHtml, htmlToText } from './htmlEditor';

export function parseQuery(input) {
  const raw = (input || '').trim();
  const tokens = raw.split(/\s+/).filter(Boolean);
  const terms = [];
  const filters = { hasImage: false, hasDone: false };

  for (const tok of tokens) {
    const lower = tok.toLowerCase();
    if (lower === 'has:image' || lower === 'has:images' || lower === 'has:attachment') {
      filters.hasImage = true;
    } else if (lower === 'has:done' || lower === 'is:done') {
      filters.hasDone = true;
    } else {
      terms.push(tok);
    }
  }

  const hasFilter = filters.hasImage || filters.hasDone;
  return {
    raw,
    terms,
    filters,
    isEmpty: terms.length === 0 && !hasFilter,
  };
}

function plainText(value) {
  if (!value) return '';
  return isHtml(value) ? htmlToText(value) : String(value);
}

export function matchesTask(task, query) {
  if (!task) return false;
  if (query.isEmpty) return true;

  if (query.filters.hasImage && !(Array.isArray(task.images) && task.images.length > 0)) {
    return false;
  }
  if (query.filters.hasDone && !task.done) {
    return false;
  }

  if (query.terms.length === 0) return true;

  const text = plainText(task.value).toLowerCase();
  const id   = (task.id || '').toLowerCase();
  for (const term of query.terms) {
    const t = term.toLowerCase();
    if (!text.includes(t) && !id.includes(t)) return false;
  }
  return true;
}

export function matchesCardTitle(card, query) {
  if (!card?.title || query.terms.length === 0) return false;
  const title = card.title.toLowerCase();
  return query.terms.every((t) => title.includes(t.toLowerCase()));
}

// Per-board breakdown: { boardId, title, matchCount, taskIds[] (in display order) }
export function searchBoards(boards, query) {
  return boards.map((b) => {
    const taskIds = [];
    for (const card of b.cards || []) {
      const cardMatchesTitle = matchesCardTitle(card, query);
      for (const task of Object.values(card.tasks || {})) {
        if (cardMatchesTitle || matchesTask(task, query)) {
          taskIds.push(task.id);
        }
      }
    }
    return { boardId: b.id, title: b.title, matchCount: taskIds.length, taskIds };
  });
}
