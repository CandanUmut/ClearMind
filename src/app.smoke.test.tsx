// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { render, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import App from './App';

afterEach(() => { cleanup(); localStorage.clear(); });

async function click(c: HTMLElement, re: RegExp) {
  const el = Array.from(c.querySelectorAll('button')).find(
    (b) => re.test(b.textContent || '') || re.test(b.getAttribute('aria-label') || ''),
  );
  if (el) { await act(async () => { fireEvent.click(el); }); return true; }
  return false;
}

const boundary = (c: HTMLElement) => /went sideways|Something went/.test(c.textContent || '');

it('mounts and navigates Home → Settings → Stats → Explore without crashing', async () => {
  const { container } = render(<App />);
  // onboarding
  for (let i = 0; i < 6; i++) if (!(await click(container, /Next|Begin/))) break;
  expect(boundary(container)).toBe(false);

  await click(container, /Settings/);
  await waitFor(() => expect(container.textContent).toMatch(/Appearance|Challenge|Theme/), { timeout: 2000 });
  expect(boundary(container)).toBe(false);
  await click(container, /Back|←/);

  await click(container, /Statistics|progress/);
  await waitFor(() => expect(container.textContent).toMatch(/Your progress|Activity|Achievements/), { timeout: 2000 });
  expect(boundary(container)).toBe(false);
  await click(container, /Home|←/);

  await click(container, /Explore all/);
  await waitFor(() => expect(container.textContent).toMatch(/Explore|Warmups|Practice/), { timeout: 2000 });
  expect(boundary(container)).toBe(false);
});
