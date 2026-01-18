import { getSupabaseListOGUrl } from "@echotab/supabase/util";
import { NoResultError } from "kysely";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicLink, PublicListView } from "@echotab/lists/models";
import CopyButton from "./CopyButton";
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
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata | null> {

  const { listId } = await params;

  const list = await fetchPublicList(listId as string).catch(() => null);
  if (!list) {
    return null;
  }

  return {
    title: `EchoTab - ${list.title}`,
    description: "A collection of links curated by the EchoTab community.",
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


const formatLinks = (links: PublicLink[]) => {
  return links.map((link) => link.url).join("\n");
}


export default async function Page({ params }: { params: Promise<Params> }) {
  const { listId } = await params;

  let list: PublicListView | null = null;

  try {
    list = await fetchPublicList(listId as string);
  } catch (e) {
    if (e instanceof NoResultError) {
      return notFound();
    }

    throw e;
  }

  return (
    <div className="gap-3 flex flex-col">
      <div className="mb-2 flex items-start justify-between gap-3 sm:items-center">
        <h1 className="text-2xl pl-4">{list.title}</h1>
        <div>
          <CopyButton value={formatLinks(list.links)} variant="ghost" >
            Copy Links
          </CopyButton>
          <ShareDialog list={list} />
        </div>
      </div>
      <article className="bg-background border-border rounded-lg border p-4">

        <ListContextProvider>
          <ListContent content={list.content} />
          <ListViewLogger listId={listId} />
          <div className="border-border mt-6 border-t pt-5">
            <h2 className="text-muted-foreground mb-2">Links:</h2>
            <ol className="list-inside list-decimal">
              {list.links.map((l, i) => (
                <ListLinkItem link={l} key={l.url + i} />
              ))}
            </ol>
          </div>
        </ListContextProvider>
      </article>
      <div className="text-muted-foreground items-center flex flex-1 flex-col  gap-2 text-xs sm:flex-row sm:gap-5 text-center justify-center mt-2">
        <div className="">
          Last updated at: <Date date={list.updated_at} />
        </div>
        <div>Views: {list.viewCount}</div>
      </div>
    </div>
  );
}
