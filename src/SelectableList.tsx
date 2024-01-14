import { Slot } from "@radix-ui/react-slot";
import SelectionArea, { SelectionEvent } from "@viselect/react";
import { ComponentProps } from "react";

import { equals } from "./util/set";

interface Props {
    onResetSelection: () => void;
    getSelected: () => Set<number>;
    onSelectionChange: (ids: Set<number>) => void;
}

export function SelectableList({
    onResetSelection,
    getSelected,
    onSelectionChange,
    ...props
}: Props & ComponentProps<typeof SelectionArea>) {
    const extractIds = (els: Element[]): number[] =>
        els
            .map((v) => v.getAttribute("data-key"))
            .filter(Boolean)
            .map(Number);

    const onStart = ({ event, selection }: SelectionEvent) => {
        if (!(event?.ctrlKey || event?.metaKey)) {
            selection.clearSelection();
            onResetSelection();
        }
    };

    const onMove = ({
        store: {
            changed: { added, removed },
        },
    }: SelectionEvent) => {
        const next = new Set(getSelected());
        extractIds(added).forEach((id) => next.add(id));
        extractIds(removed).forEach((id) => next.delete(id));
        if (equals(getSelected(), next)) {
            return;
        }
        onSelectionChange(next);
    };

    const onBeforeStart = ({ event, ...rest }: SelectionEvent) => {
        if (event && "buttons" in event) {
            const allowedButtons = [
                1, // left click
            ];
            if (!allowedButtons.includes(event.buttons)) {
                return false;
            }
        }

        if (props?.onBeforeStart && !props.onBeforeStart({ event, ...rest })) {
            return false;
        }

        return true;
    };

    return (
        <SelectionArea
            {...props}
            onStart={onStart}
            onMove={onMove}
            selectables=".selectable"
            onBeforeStart={onBeforeStart}
        />
    );
}

export function SelectableItem({
    children,
    id,
    asChild,
}: {
    children: React.ReactNode;
    id: number;
    asChild?: boolean;
}) {
    const Comp = asChild ? Slot : "div";

    return (
        <Comp className="selectable" data-key={id}>
            {children}
        </Comp>
    );
}
