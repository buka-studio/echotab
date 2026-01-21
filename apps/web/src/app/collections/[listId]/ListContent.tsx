import RichTextServerRenderer from "@echotab/ui/RichTextServerRenderer";

import { getHtml } from "../../util/richText";
import RichTextClient from "./RichTextClient";

export default async function ListContent({ content }: { content: string }) {
  const html = await getHtml(content);

  return (
    <RichTextClient editorState={content}>
      <RichTextServerRenderer html={html} />
    </RichTextClient>
  );
}
