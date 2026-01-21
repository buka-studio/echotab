import { PublicListView } from "@echotab/lists/models";
import { getSupabaseListOGUrl } from "@echotab/supabase/util";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@echotab/ui/Collapsible";
import { Separator } from "@echotab/ui/Separator";
import { ArrowTopRightIcon, CaretSortIcon } from "@radix-ui/react-icons";
import { NoResultError } from "kysely";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { formatLinks } from "~/app/util";
import { isLinkOnlyContent } from "~/app/util/richText";

import { CopyButtonWithTooltip } from "./CopyButton";
import Date from "./Date";
import ListContent from "./ListContent";
import ListContextProvider from "./ListContext";
import ListLinkItem from "./ListLinkItem";
import ListViewLogger from "./ListViewLogger";
import OpenLinksButton from "./OpenLinksButton";
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
    <div className="flex flex-col gap-2">
      <div className="mb-2 flex items-start justify-between gap-3 sm:items-center">
        <h1 className="truncate pl-4 text-2xl">{list.title}</h1>
        <div>
          <ShareDialog list={list} />
        </div>
      </div>
      {list.profileLinkUrl && (
        <div className="text-muted-foreground truncate pl-4 text-base">
          Curated by:{" "}
          <a
            href={list.profileLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground focus-visible:text-foreground group hover:underline focus-visible:underline focus-visible:outline-none">
            {list.profileLinkUrl}
            <ArrowTopRightIcon className="ml-1.5 inline-block opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100" />
          </a>
        </div>
      )}
      <article className="bg-background border-border flex flex-col gap-4 rounded-lg border p-4">
        <ListContextProvider>
          <Collapsible defaultOpen={!isLinkOnlyContent(list.content)}>
            <CollapsibleTrigger className="text-muted-foreground flex w-full items-center gap-2">
              Content <CaretSortIcon className="text-foreground size-4.5" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <ListContent content={list.content} />
            </CollapsibleContent>
          </Collapsible>
          <ListViewLogger listId={listId} />
          <Separator />
          <div className="border-border">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-muted-foreground">Links</h2>
              <div>
                <CopyButtonWithTooltip
                  value={formatLinks(list.links)}
                  variant="ghost"
                  size="icon-sm"></CopyButtonWithTooltip>
                <OpenLinksButton links={list.links} />
              </div>
            </div>
            <ol className="list-inside list-decimal">
              {list.links.map((l, i) => (
                <ListLinkItem link={l} key={l.url + i} />
              ))}
            </ol>
          </div>
        </ListContextProvider>
      </article>
      <div className="text-muted-foreground mt-2 flex flex-1 items-center justify-center gap-2 text-center text-xs">
        <span>
          Last updated at: <Date date={list.updated_at} />
        </span>
        <span className="opacity-50">|</span>
        Views: {list.viewCount}{" "}
      </div>
    </div>
  );
}
