"use client";

import { PublicList } from "@echotab/lists/models";
import Button from "@echotab/ui/Button";
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
        <Button variant="ghost">
          <Share2Icon className="mr-2" /> Share
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Share list</DrawerTitle>
          <DrawerDescription>Share this list with others</DrawerDescription>
        </DrawerHeader>
        <Share list={list} />
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <Share2Icon className="mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share list</DialogTitle>
          <DialogDescription>Share this list with others</DialogDescription>
        </DialogHeader>
        <Share list={list} />
      </DialogContent>
    </Dialog>
  );
}
