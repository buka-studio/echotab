export function zip<T, U>(a: T[], b: U[]) {
  return a.map((_, i) => [a[i], b[i]]);
}
