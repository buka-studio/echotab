export function toggle<T>(set: Set<T>, item: T) {
    if (set.has(item)) {
        set.delete(item);
    } else {
        set.add(item);
    }
}

export function intersection<T>(s1: Iterable<T>, s2: Iterable<T>): Set<T> {
    const int = new Set<T>();
    const _s2 = s2 instanceof Set ? s2 : new Set(s2);
    for (const s of s1) {
        if (_s2.has(s)) {
            int.add(s);
        }
    }
    return int;
}

export function difference<T>(s1: Iterable<T>, s2: Iterable<T>): Set<T> {
    const diff = new Set<T>();
    const _s2 = s2 instanceof Set ? s2 : new Set(s2);
    for (const s of s1) {
        if (!_s2.has(s)) {
            diff.add(s);
        }
    }
    return diff;
}

export function equals<T>(s1: Iterable<T>, s2: Iterable<T>): boolean {
    return difference(s1, s2).size === 0 && difference(s2, s1).size === 0;
}
