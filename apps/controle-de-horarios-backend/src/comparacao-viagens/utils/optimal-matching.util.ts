// Minimal Hungarian algorithm implementation for rectangular matrices
// Returns an array of pairs [i, j] indicating left index i matched to right index j
// Cost matrix: rows = left items, cols = right items
// Based on classic O(n^3) approach; suitable for moderate group sizes

export function hungarian(cost: number[][]): Array<[number, number]> {
  const n = cost.length;
  const m = cost[0]?.length ?? 0;
  if (n === 0 || m === 0) return [];

  const u = new Array(n + 1).fill(0);
  const v = new Array(m + 1).fill(0);
  const p = new Array(m + 1).fill(0);
  const way = new Array(m + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(m + 1).fill(Infinity);
    const used = new Array(m + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= m; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }
      for (let j = 0; j <= m; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const result: Array<[number, number]> = [];
  for (let j = 1; j <= m; j++) {
    if (p[j] !== 0) {
      // p[j] is the row matched to column j
      result.push([p[j] - 1, j - 1]);
    }
  }
  return result;
}

export function buildCostMatrix<TLeft, TRight>(
  left: TLeft[],
  right: TRight[],
  getCost: (l: TLeft, r: TRight) => number
): number[][] {
  const n = left.length;
  const m = right.length;
  const matrix: number[][] = new Array(n);
  for (let i = 0; i < n; i++) {
    const row: number[] = new Array(m);
    for (let j = 0; j < m; j++) {
      row[j] = getCost(left[i], right[j]);
    }
    matrix[i] = row;
  }
  return matrix;
}

