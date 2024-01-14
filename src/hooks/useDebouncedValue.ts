import { useEffect, useState } from "react";

export default function useDebouncedValue<T>(value: T, delayMs: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (debouncedValue !== value) {
                setDebouncedValue(value);
            }
        }, delayMs);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delayMs]);

    return debouncedValue;
}
