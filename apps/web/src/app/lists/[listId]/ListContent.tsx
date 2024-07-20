import RichTextServerRenderer from "@echotab/ui/RichTextServerRenderer";
import dynamic from "next/dynamic";

import { getHtml } from "../../util/richText";

export default async function ListContent({ content }: { content: string }) {
  const html = await getHtml(content);

  const RichTextRenderer = dynamic(() => import("./RichTextRenderer"), {
    ssr: false,
    loading: () => <RichTextServerRenderer html={html} />,
  });

  return <RichTextRenderer editorState={content} />;
}
