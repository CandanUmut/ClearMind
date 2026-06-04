// Nonogram engine: clue derivation + a solver used to GUARANTEE that generated
// puzzles have exactly one solution. Sizes are small (5–8), so we enumerate row
// candidates and DFS across rows with column pruning, counting solutions (cap 2).

export type Grid = boolean[][];

export function deriveLineClue(line: boolean[]): number[] {
  const clue: number[] = [];
  let run = 0;
  for (const cell of line) {
    if (cell) run += 1;
    else if (run > 0) {
      clue.push(run);
      run = 0;
    }
  }
  if (run > 0) clue.push(run);
  return clue.length ? clue : [0];
}

export function deriveClues(grid: Grid): { rows: number[][]; cols: number[][] } {
  const size = grid.length;
  const rows = grid.map((r) => deriveLineClue(r));
  const cols: number[][] = [];
  for (let c = 0; c < size; c++) {
    cols.push(deriveLineClue(grid.map((r) => r[c])));
  }
  return { rows, cols };
}

/** All boolean rows of `size` matching `clue` (clue [0] means an empty row). */
export function rowCandidates(clue: number[], size: number): boolean[][] {
  const blocks = clue[0] === 0 ? [] : clue;
  const out: boolean[][] = [];

  function place(idx: number, start: number, row: boolean[]) {
    if (idx === blocks.length) {
      out.push(row.slice());
      return;
    }
    const left = blocks.slice(idx);
    const minNeeded = left.reduce((a, b) => a + b, 0) + (left.length - 1); // blocks + gaps
    for (let s = start; s + minNeeded <= size; s++) {
      const row2 = row.slice();
      for (let k = 0; k < blocks[idx]; k++) row2[s + k] = true;
      place(idx + 1, s + blocks[idx] + 1, row2); // +1 for the mandatory gap
    }
  }
  place(0, 0, new Array(size).fill(false));
  return out;
}

/** Count solutions up to `cap` (default 2) — enough to decide uniqueness. */
export function countSolutions(
  rowClues: number[][],
  colClues: number[][],
  size: number,
  cap = 2,
): number {
  const candidatesPerRow = rowClues.map((c) => rowCandidates(c, size));
  const colSums = colClues.map((c) => c.reduce((a, b) => a + b, 0));
  let count = 0;
  const colFilled = new Array(size).fill(0);
  const grid: boolean[][] = [];

  function dfs(r: number): void {
    if (count >= cap) return;
    if (r === size) {
      // Verify every column's full clue matches.
      for (let c = 0; c < size; c++) {
        const colLine = grid.map((row) => row[c]);
        if (JSON.stringify(deriveLineClue(colLine)) !== JSON.stringify(colClues[c])) return;
      }
      count += 1;
      return;
    }
    for (const cand of candidatesPerRow[r]) {
      let ok = true;
      for (let c = 0; c < size; c++) {
        const add = cand[c] ? 1 : 0;
        if (colFilled[c] + add > colSums[c]) {
          ok = false;
          break;
        }
        // Feasibility: remaining rows must still be able to reach the column sum.
        if (colFilled[c] + add + (size - r - 1) < colSums[c]) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      for (let c = 0; c < size; c++) colFilled[c] += cand[c] ? 1 : 0;
      grid[r] = cand;
      dfs(r + 1);
      for (let c = 0; c < size; c++) colFilled[c] -= cand[c] ? 1 : 0;
      if (count >= cap) return;
    }
  }
  dfs(0);
  return count;
}
