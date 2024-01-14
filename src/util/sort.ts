export enum SortDir {
    Asc = "Asc",
    Desc = "Desc",
}

export function stringComparator(a: string, b: string, dir: SortDir) {
    if (dir === SortDir.Asc) {
        return a.localeCompare(b);
    } else {
        return b.localeCompare(a);
    }
}

export function numberComparator(a: number, b: number, dir: SortDir) {
    if (dir === SortDir.Asc) {
        return a - b;
    } else {
        return b - a;
    }
}
