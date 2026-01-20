"use client";

import { PublicList } from "@echotab/lists/models";
import { Button } from "@echotab/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@echotab/ui/Dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@echotab/ui/Drawer";
import { useMatchMedia } from "@echotab/ui/hooks";
import { Share2Icon } from "@radix-ui/react-icons";

import Share from "./Share";

export default function ShareTooltip({ list }: { list: PublicList }) {
  const isXsSreen = useMatchMedia("(max-width: 576px)");

  return isXsSreen ? (
    <Drawer shouldScaleBackground={true}>
      <DrawerTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <Share2Icon /> Share
        </Button>
      </DrawerTrigger>
      <DrawerContent className="border-border">
        <DrawerHeader>
          <DrawerTitle>Share list</DrawerTitle>
          <DrawerDescription className="sr-only">Share this list with others</DrawerDescription>
        </DrawerHeader>
        <Share list={list} />
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <Share2Icon />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-left">Share list</DialogTitle>
          <DialogDescription className="sr-only">Share this list with others</DialogDescription>
        </DialogHeader>
        <Share list={list} />
      </DialogContent>
    </Dialog>
  );
}
