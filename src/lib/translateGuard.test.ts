// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest';
import { installTranslationGuard } from './translateGuard';

describe('translation guard', () => {
  beforeAll(() => installTranslationGuard());

  it('removeChild does not throw when the node was reparented (as Google Translate does)', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    const child = document.createElement('span');
    a.appendChild(child);
    // Simulate the translator moving the node into a <font> elsewhere.
    b.appendChild(child);
    expect(child.parentNode).toBe(b);
    // React would now call a.removeChild(child) → normally NotFoundError.
    expect(() => a.removeChild(child)).not.toThrow();
  });

  it('insertBefore does not throw when the reference node was moved', () => {
    const parent = document.createElement('div');
    const ref = document.createElement('span');
    const elsewhere = document.createElement('div');
    elsewhere.appendChild(ref); // ref is not a child of `parent`
    const node = document.createElement('em');
    expect(() => parent.insertBefore(node, ref)).not.toThrow();
    expect(parent.contains(node)).toBe(true);
  });

  it('still removes a genuine child normally', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);
    parent.removeChild(child);
    expect(parent.contains(child)).toBe(false);
  });
});
