import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Enforces the generator-purity discipline (substitutes for an ESLint rule):
// generator/engine source must not use nondeterministic APIs, so every instance
// is fully reproducible from (rng, difficulty).

const ENGINE_DIR = join(__dirname);
const BANNED = [/\bMath\.random\b/, /\bDate\.now\b/, /\bnew Date\b/, /\bperformance\.now\b/];

function collect(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collect(full));
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe('engine purity', () => {
  const files = collect(ENGINE_DIR).filter(
    // session.ts is orchestration, not a generator; practice entropy is injected by callers.
    (f) => !f.endsWith('session.ts'),
  );

  it('finds engine source files to scan', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  for (const file of files) {
    it(`${file.split('/engine/')[1]} uses no nondeterministic APIs`, () => {
      const src = readFileSync(file, 'utf8');
      for (const pattern of BANNED) {
        expect(pattern.test(src), `banned ${pattern} in ${file}`).toBe(false);
      }
    });
  }
});
