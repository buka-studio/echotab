export function zip<T, U>(a: T[], b: U[]) {
  return a.map((_, i) => [a[i], b[i]]);
}

export function toggle<T>(array: T[], item: T) {
  if (array.includes(item)) {
    return array.filter((i) => i !== item);
  }
  return [...array, item];
}

export function intersection<T>(a: T[], b: T[]) {
  const aSet = new Set(a);
  const bSet = new Set(b);
  return Array.from(aSet.intersection(bSet));
}

export function difference<T>(a: T[], b: T[]) {
  const aSet = new Set(a);
  const bSet = new Set(b);
  return Array.from(aSet.difference(bSet));
}

export function equals<T>(a: T[], b: T[]) {
  const aDiff = difference(a, b);
  const bDiff = difference(b, a);
  return aDiff.length === 0 && bDiff.length === 0;
}
