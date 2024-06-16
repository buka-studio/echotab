import {
    $applyNodeReplacement,
    TextNode,
    type DOMConversionMap,
    type DOMConversionOutput,
    type DOMExportOutput,
    type EditorConfig,
    type LexicalNode,
    type NodeKey,
    type SerializedTextNode,
    type Spread,
} from "lexical";

export type SerializedMentionNode = Spread<
    {
        mentionValue: string;
    },
    SerializedTextNode
>;

function $convertMentionElement(domNode: HTMLElement): DOMConversionOutput | null {
    const textContent = domNode.textContent;
    const mentionValue = domNode.getAttribute("data-mention-name");

    if (textContent !== null && mentionValue !== null) {
        const node = $createMentionNode(mentionValue, textContent);
        return {
            node,
        };
    }

    return null;
}

const mentionStyle = `
background-color: hsla(var(--surface-4));
border: 1px solid hsla(var(--border));
border-radius: 0.25rem;
padding: 1px 8px;
font-size: 0.825rem;
`.replace(/\s+/g, " ");

export class MentionNode extends TextNode {
    __mention: string;

    static getType(): string {
        return "mention";
    }

    static clone(node: MentionNode): MentionNode {
        return new MentionNode(node.__mention, node.__text, node.__key);
    }
    static importJSON(serializedNode: SerializedMentionNode): MentionNode {
        const node = $createMentionNode(serializedNode.mentionValue, serializedNode.text);
        node.setTextContent(serializedNode.text);
        node.setFormat(serializedNode.format);
        node.setDetail(serializedNode.detail);
        node.setMode(serializedNode.mode);
        node.setStyle(serializedNode.style);
        return node;
    }

    constructor(mentionValue: string, text?: string, key?: NodeKey) {
        super(text ?? mentionValue, key);
        console.log({ mentionValue, text, key });
        this.__mention = mentionValue;
    }

    exportJSON(): SerializedMentionNode {
        return {
            ...super.exportJSON(),
            mentionValue: this.__mention,
            type: "mention",
            version: 1,
        };
    }

    createDOM(config: EditorConfig): HTMLElement {
        const dom = super.createDOM(config);
        dom.style.cssText = mentionStyle;
        dom.className = "mention";
        return dom;
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement("span");
        element.setAttribute("data-lexical-mention", "true");
        element.setAttribute("data-mention-name", this.__mention);
        element.textContent = this.__text;
        return { element };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            span: (domNode: HTMLElement) => {
                if (!domNode.hasAttribute("data-lexical-mention")) {
                    return null;
                }
                return {
                    conversion: $convertMentionElement,
                    priority: 1,
                };
            },
        };
    }

    isTextEntity(): true {
        return true;
    }

    canInsertTextBefore(): boolean {
        return false;
    }

    canInsertTextAfter(): boolean {
        return false;
    }
}

export function $createMentionNode(value: string, label: string): MentionNode {
    const mentionNode = new MentionNode(value, label);
    mentionNode.setMode("segmented").toggleDirectionless();
    return $applyNodeReplacement(mentionNode);
}

export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
    return node instanceof MentionNode;
}
