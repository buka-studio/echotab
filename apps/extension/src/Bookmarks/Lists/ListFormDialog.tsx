import Button from "@echotab/ui/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@echotab/ui/Dialog";
import Input from "@echotab/ui/Input";
import { Label } from "@echotab/ui/Label";
import { PopoverContent } from "@echotab/ui/Popover";
import RichEditor, {
  MentionsLookupServiceProvider,
  MentionsPopoverPlugin,
  RichEditorRef,
} from "@echotab/ui/RichEditor";
import { toast } from "@echotab/ui/Toast";
import { ComponentProps, ReactNode, useMemo, useRef, useState } from "react";

import TabItem, { Favicon } from "~/src/components/TabItem";
import TagChipCombobox from "~/src/components/tag/TagChipCombobox";
import TagStore from "~/src/TagStore";
import { useUIStore } from "~/src/UIStore";

import { List, SavedTab } from "../../models";
import { formatDate } from "../../util/date";
import BookmarkStore, { filterTabs, useBookmarkStore } from "../BookmarkStore";
import { useUpdateListMutation } from "./queries";

function useItemLookupService() {
  const bookmarkStore = useBookmarkStore();

  const ItemLookupService = useMemo(() => {
    const tabsById = new Map(bookmarkStore.tabs.map((t) => [t.id, t]));

    return {
      search: (query: string, cb: (results: { value: string; label: string }[]) => void) => {
        const results = filterTabs(bookmarkStore.tabs, { keywords: [query], tags: [] });

        const tabs = Array.from(results).map((id) => {
          const tab = tabsById.get(id) as SavedTab;
          return {
            value: tab!.id,
            label: tab!.title,
            hint: tab!.url,
          };
        });

        cb(tabs);
      },
    };
  }, [bookmarkStore.tabs]);

  return ItemLookupService;
}

type Props = {
  list?: List;
  defaultLinks?: SavedTab[];
  trigger?: ReactNode;
  className?: string;
  children?: ReactNode;
  onSubmit?: (list: List) => void;
} & ComponentProps<typeof Dialog>;

export default function ListFormDialog({
  list,
  defaultLinks,
  trigger,
  className,
  children,
  onSubmit,
  ...props
}: Props) {
  const contentRef = useRef<string | undefined>(list?.content);
  const editorRef = useRef<RichEditorRef>(null);
  const [open, setOpen] = useState(false);

  const {
    settings: { disableListSharing },
  } = useUIStore();

  const ItemLookupService = useItemLookupService();

  const updateMutation = useUpdateListMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = contentRef.current;
    if (!content) {
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);

    const title = formData.get("list-title") as string;
    if (!title) {
      return;
    }

    const tabIds = editorRef.current!.getMentions();

    const result = BookmarkStore.upsertList({
      ...list,
      title,
      content,
      tabIds,
    });

    setOpen(false);
    onSubmit?.(result);

    toast.success(`List ${list ? "updated" : "created"} succesfully!`);

    if (list && list.sync && !disableListSharing) {
      updateMutation.mutate(result);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} {...props}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{list ? "Edit" : "New"} List</DialogTitle>
          <DialogDescription>Add tabs to a list to keep them organized.</DialogDescription>
        </DialogHeader>
        <div>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="row flex flex-col gap-2">
              <Label htmlFor="list-title">Title*</Label>
              <Input id="list-title" name="list-title" defaultValue={list?.title} required />
            </div>
            <div className="row flex flex-col gap-2">
              <Label asChild>
                <span
                  id="list-content-label"
                  onClick={() => (document.querySelector("#list-content") as HTMLElement)?.focus()}>
                  Content*
                </span>
              </Label>
              <MentionsLookupServiceProvider service={ItemLookupService}>
                <RichEditor
                  config={{
                    editable: Boolean(!list),
                  }}
                  ref={editorRef}
                  aria-labelledby="list-content-label"
                  id="list-content"
                  defaultState={list?.content}
                  defaultMentions={defaultLinks?.map((l) => ({
                    value: l.id,
                    label: l.title,
                  }))}
                  onStateChange={(v) => (contentRef.current = v)}
                  plugins={
                    <>
                      <MentionsPopoverPlugin>
                        {({ mention }) => {
                          const tab = BookmarkStore.tabs.find((t) => t.id === mention);
                          if (!tab) {
                            return null;
                          }

                          const tags = tab.tagIds.flatMap((t) => {
                            const tag = TagStore.tags.get(t);
                            return tag ? [tag] : [];
                          });

                          return (
                            <PopoverContent className="max-w-[200px] border-none p-0">
                              <TabItem
                                className="rounded-lg"
                                tab={tab}
                                icon={
                                  <Favicon
                                    src={tab.url}
                                    className="transition-opacity duration-150 group-focus-within:opacity-0 group-hover:opacity-0"
                                  />
                                }
                                link={
                                  <a
                                    className="overflow-hidden text-ellipsis whitespace-nowrap rounded-sm focus-visible:underline focus-visible:outline-none"
                                    target="_blank"
                                    href={tab.url}>
                                    {tab.url}
                                  </a>
                                }
                                linkPreview={false}
                                actions={<TagChipCombobox editable={false} tags={tags} />}
                              />
                            </PopoverContent>
                          );
                        }}
                      </MentionsPopoverPlugin>
                    </>
                  }
                />
              </MentionsLookupServiceProvider>
              <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
                {list?.updatedAt && (
                  <div className="text-muted-foreground">
                    Last updated: {formatDate(list.updatedAt)}
                  </div>
                )}
                {list?.sync && !disableListSharing && (
                  <div className="text-muted-foreground">
                    Updates to this list are published automatically.
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button className="" variant="ghost" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button variant="outline" type="submit">
                Save
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
