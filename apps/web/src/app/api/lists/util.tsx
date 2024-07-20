import { UserList } from "@echotab/lists/models";
import createSupabaseClient from "@echotab/supabase/client";
import { ImageResponse } from "next/og";

import { formatDate, pluralize } from "../../util";
import { getPlainText } from "../../util/richText";

export const size = {
  width: 1200,
  height: 630,
};

// const font = readFile(path.join(__dirname, "../../public/Inter-Regular.ttf"));

export async function upsertListOGImage(userId: string, list: UserList & { linkCount: number }) {
  const text = await getPlainText(list.content);

  const generatedImage = new ImageResponse(
    (
      <div tw="h-full w-full flex flex-col bg-[#1E1E1E] text-[#A3A3A3] p-[80px] pb-[120px] text-[32px]">
        <div tw="flex flex-col">
          <div tw="flex justify-between">
            <div tw="flex items-center">
              <div tw="flex rounded-full bg-[#EA580B] h-7 w-7"></div>
              <div tw="py-1 px-6 bg-[#282828] rounded-full ml-4">Echo Tab</div>
            </div>
            <span tw="">{formatDate(list.updated_at)}</span>
          </div>
          <div tw="flex items-center mt-[100px]">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="25" fill="none">
              <path
                fill="#A3A3A3"
                fill-rule="evenodd"
                d="M15.159 2.912c1.443-.98 3.267-1 4.622-.11.308.203.637.523 1.516 1.402.878.879 1.199 1.207 1.401 1.515.89 1.356.871 3.18-.11 4.623-.223.33-.57.682-1.48 1.593l-1.32 1.32a1.067 1.067 0 0 0 1.509 1.508l1.32-1.32.091-.091c.789-.788 1.293-1.293 1.646-1.811 1.44-2.12 1.514-4.88.127-6.993-.338-.515-.831-1.008-1.58-1.757l-.096-.095-.095-.096c-.75-.75-1.242-1.242-1.758-1.58-2.112-1.388-4.872-1.313-6.992.127-.519.352-1.023.857-1.812 1.646l-.091.091-1.32 1.32a1.067 1.067 0 1 0 1.508 1.509l1.32-1.32c.911-.911 1.264-1.258 1.594-1.481Zm-8.947 8.834a1.067 1.067 0 0 0-1.509-1.508l-1.32 1.32-.091.091c-.789.789-1.294 1.293-1.646 1.812-1.44 2.12-1.515 4.88-.128 6.992.339.515.832 1.008 1.581 1.758l.096.095.095.095c.75.75 1.242 1.243 1.757 1.581 2.112 1.387 4.872 1.313 6.993-.128.518-.352 1.023-.857 1.811-1.645l.092-.091 1.32-1.32a1.067 1.067 0 1 0-1.509-1.509l-1.32 1.32c-.91.91-1.264 1.257-1.593 1.48-1.443.981-3.267 1-4.623.11-.308-.202-.636-.523-1.515-1.401-.879-.88-1.2-1.208-1.402-1.516-.89-1.355-.87-3.18.11-4.622.223-.33.57-.683 1.48-1.594l1.32-1.32Zm11.314-2.263a1.067 1.067 0 0 0-1.508-1.509l-7.543 7.543a1.067 1.067 0 1 0 1.509 1.508l7.542-7.542Z"
                clip-rule="evenodd"
              />
            </svg>
            <span tw="ml-5">{pluralize(list.linkCount, "link")}</span>
          </div>

          <span
            tw="text-[60px] text-white mt-[28px]"
            style={{ fontWeight: 400, lineClamp: 2, display: "block" }}>
            {list.title?.slice(0, 100) || "Untitled List"}
          </span>

          <div
            tw="mt-[28px] max-w-[850px]"
            style={{
              lineClamp: 3,
              display: "block",
            }}>
            {text.slice(0, 200)}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      // fonts: [
      //   {
      //     name: "Inter",
      //     data: await font,
      //     style: "normal",
      //     weight: 400,
      //   },
      // ],
    },
  );

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

export async function safeUpsertListOGImage(
  userId: string,
  list: UserList & { linkCount: number },
) {
  try {
    await upsertListOGImage(userId, list);
  } catch (e) {
    console.error(e);
  }
}
