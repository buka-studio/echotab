import { createHeadlessEditor as _createHeadlessEditor } from "@lexical/headless";

import { defaultNodes } from "./constants";
import theme from "./theme";

export const createHeadlessEditor = ({ namespace }: { namespace?: string }) => {
  return _createHeadlessEditor({
    namespace,
    nodes: [...defaultNodes],
    theme,
    onError(error: any) {
      throw error;
    },
  });
};

export default async function RichTextServerRenderer({ html }: { html: string }) {
  return (
    <div className="text-foreground text-left font-normal leading-5">
      <div
        className="caret-muted-foreground relative resize-none space-x-1 rounded-b-lg text-sm outline-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
