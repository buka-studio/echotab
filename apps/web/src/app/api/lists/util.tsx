import { PublicList, UserList } from "@echotab/lists/models";
import createSupabaseClient from "@echotab/supabase/client";
import { ImageResponse } from "next/og";

import { formatDate, pluralize } from "../../util";
import { getPlainText } from "../../util/richText";

export const size = {
  width: 1200,
  height: 630,
};

type ListOGData = Pick<PublicList, "publicId" | "title" | "content" | "updated_at"> & {
  linkCount: number;
  linkTitles?: string[];
};
type UpsertListOGData = UserList & { linkCount: number; linkTitles?: string[] };

// const font = readFile(path.join(__dirname, "../../public/Inter-Regular.ttf"));

export async function getListOGPlainText(serializedEditorState: string) {
  return getPlainText(serializedEditorState);
}

function normalizeListOGLinkTitles(linkTitles?: string[]) {
  return (linkTitles || [])
    .map((title) => title.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function renderListOGHtml(list: ListOGData, text: string) {
  const linkTitles = normalizeListOGLinkTitles(list.linkTitles);
  const shouldRenderMoreBadge = list.linkCount > 3;
  const visibleLinkTitles = shouldRenderMoreBadge ? linkTitles.slice(0, 2) : linkTitles.slice(0, 3);
  const remainingLinkCount = Math.max(0, list.linkCount - 2);

  return (
    <div tw="h-full w-full flex flex-col bg-[#1E1E1E] text-[#A3A3A3] p-[80px] pb-[120px] text-[32px]">
      <div tw="flex flex-col">
        <div tw="flex justify-between">
          <div tw="flex items-center">
            <div tw="flex rounded-full bg-[#EA580B] h-8 w-8"></div>
            <div tw="py-1 px-6 rounded-full">EchoTab</div>
          </div>
          <span tw="">{formatDate(list.updated_at)}</span>
        </div>
        <div tw="flex items-center mt-[100px]">
          Includes {pluralize(list.linkCount, "link")}
          <span tw="ml-5"></span>
        </div>

        <span
          tw="text-[60px] text-white mt-[28px]"
          style={{ fontWeight: 400, lineClamp: 2, display: "block" }}>
          {list.title?.slice(0, 100) || "Untitled List"}
        </span>

        {visibleLinkTitles.length > 0 ? (
          <div tw="mt-[28px] max-w-[850px] flex flex-col gap-[10px]">
            {visibleLinkTitles.map((linkTitle, index) => (
              <span
                key={`${linkTitle}-${index}`}
                tw="text-[30px] leading-[1.3] text-[#A3A3A3]"
                style={{ lineClamp: 1, display: "block" }}>
                {`• ${linkTitle.slice(0, 100)}`}
              </span>
            ))}
            {shouldRenderMoreBadge ? (
              <span tw="text-[30px] leading-[1.3] text-[#A3A3A3]">{`+ ${remainingLinkCount} more`}</span>
            ) : null}
          </div>
        ) : (
          <div
            tw="mt-[28px] max-w-[850px]"
            style={{
              lineClamp: 3,
              display: "block",
            }}>
            {text.slice(0, 200)}
          </div>
        )}
      </div>
    </div>
  );
}

export async function createListOGImageResponse(list: ListOGData) {
  const linkTitles = normalizeListOGLinkTitles(list.linkTitles);
  const text = linkTitles.length > 0 ? "" : await getListOGPlainText(list.content);

  return new ImageResponse(renderListOGHtml({ ...list, linkTitles }, text), {
    ...size,
    // fonts: [
    //   {
    //     name: "Inter",
    //     data: await font,
    //     style: "normal",
    //     weight: 400,
    //   },
    // ],
  });
}

export async function upsertListOGImage(userId: string, list: UpsertListOGData) {
  const generatedImage = await createListOGImageResponse(list);

  const supabaseClient = await createSupabaseClient();

  // Upload image to storage.
  const { error } = await supabaseClient.storage
    .from("og-images")
    .upload(`lists/${list.publicId}.png`, generatedImage.body!, {
      contentType: "image/png",
      cacheControl: "31536000",
      upsert: true,
      duplex: "half",
    });

  if (error) throw error;
}

export async function safeUpsertListOGImage(userId: string, list: UpsertListOGData) {
  try {
    await upsertListOGImage(userId, list);
  } catch (e) {
    console.error(e);
  }
}
