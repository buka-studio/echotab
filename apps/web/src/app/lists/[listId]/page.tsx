import { getSupabaseListOGUrl } from "@echotab/supabase/util";
import { NoResultError } from "kysely";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Date from "./Date";
import ListContent from "./ListContent";
import ListContextProvider from "./ListContext";
import ListLinkItem from "./ListLinkItem";
import ListViewLogger from "./ListViewLogger";
import { fetchPublicList } from "./queries";
import ShareDialog from "./ShareDialog";

export const dynamic = "force-dynamic";

interface Params {
  listId: string;
}

export async function generateMetadata({
  params: { listId },
}: {
  params: Params;
}): Promise<Metadata | null> {
  const list = await fetchPublicList(listId as string).catch(() => null);
  if (!list) {
    return null;
  }

  return {
    title: `EchoTab - ${list.title}`,
    description: "A list of links curated by the EchoTab community.",
    openGraph: {
      images: {
        url: getSupabaseListOGUrl(listId),
        type: "image/png",
        width: 1200,
        height: 630,
      },
    },
  };
}

export default async function Page({ params: { listId } }: { params: Params }) {
  let list;

  try {
    list = await fetchPublicList(listId as string);
  } catch (e) {
    if (e instanceof NoResultError) {
      return notFound();
    }

    throw e;
  }

  return (
    <div className="space-y-5">
      <article className="bg-background border-border rounded-lg border p-5 sm:p-10">
        <div className="border-border mb-8 border-b pb-5">
          <div className="mb-2 flex items-start gap-3 sm:items-center">
            <div className="text-muted-foreground smitems-center flex flex-1 flex-col items-start gap-2 text-xs sm:flex-row sm:gap-5">
              <div className="">
                Last updated at: <Date date={list.updated_at} />
              </div>
              <div>Views: {list.viewCount}</div>
            </div>
            <ShareDialog list={list} />
          </div>
          <h1 className="text-2xl">{list.title}</h1>
        </div>
        <ListContextProvider>
          <ListContent content={list.content} />
          <ListViewLogger listId={listId} />
          <div className="border-border mt-8 border-t pt-5">
            <h2 className="text-muted-foreground">Links:</h2>
            <ol className="list-inside list-decimal">
              {list.links.map((l, i) => (
                <ListLinkItem link={l} key={l.url + i} />
              ))}
            </ol>
          </div>
        </ListContextProvider>
      </article>
    </div>
  );
}
