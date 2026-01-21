import { TrashIcon, UploadIcon } from "@radix-ui/react-icons";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Button } from "../Button";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "../FileUpload";

const meta = {
  title: "ui/FileUpload",
  component: FileUpload,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <FileUpload value={files} onChange={setFiles} className="w-[400px]">
        <FileUploadDropzone className="flex flex-col items-center justify-center gap-2 p-8">
          <UploadIcon className="text-muted-foreground size-8" />
          <p className="text-muted-foreground text-sm">
            Drag and drop files here, or click to browse
          </p>
          <FileUploadTrigger asChild>
            <Button variant="outline" size="sm">
              Browse Files
            </Button>
          </FileUploadTrigger>
        </FileUploadDropzone>
        <FileUploadList className="mt-4">
          {files.map((file) => (
            <FileUploadItem key={file.name} file={file}>
              <FileUploadItemPreview />
              <FileUploadItemMetadata />
              <FileUploadItemDelete asChild>
                <Button variant="ghost" size="icon-sm">
                  <TrashIcon className="size-4" />
                </Button>
              </FileUploadItemDelete>
            </FileUploadItem>
          ))}
        </FileUploadList>
      </FileUpload>
    );
  },
};

export const ImagesOnly: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <FileUpload
        value={files}
        onChange={setFiles}
        accept="image/*"
        className="w-[400px]"
      >
        <FileUploadDropzone className="flex flex-col items-center justify-center gap-2 p-8">
          <UploadIcon className="text-muted-foreground size-8" />
          <p className="text-muted-foreground text-sm">
            Drop images here or click to browse
          </p>
          <p className="text-muted-foreground text-xs">PNG, JPG, GIF up to 10MB</p>
        </FileUploadDropzone>
        <FileUploadList className="mt-4">
          {files.map((file) => (
            <FileUploadItem key={file.name} file={file}>
              <FileUploadItemPreview />
              <FileUploadItemMetadata />
              <FileUploadItemDelete asChild>
                <Button variant="ghost" size="icon-sm">
                  <TrashIcon className="size-4" />
                </Button>
              </FileUploadItemDelete>
            </FileUploadItem>
          ))}
        </FileUploadList>
      </FileUpload>
    );
  },
};

export const MultipleFiles: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <FileUpload
        value={files}
        onChange={setFiles}
        multiple
        maxFiles={5}
        className="w-[400px]"
      >
        <FileUploadDropzone className="flex flex-col items-center justify-center gap-2 p-8">
          <UploadIcon className="text-muted-foreground size-8" />
          <p className="text-muted-foreground text-sm">Upload up to 5 files</p>
        </FileUploadDropzone>
        <FileUploadList className="mt-4">
          {files.map((file) => (
            <FileUploadItem key={file.name} file={file}>
              <FileUploadItemPreview />
              <FileUploadItemMetadata />
              <FileUploadItemDelete asChild>
                <Button variant="ghost" size="icon-sm">
                  <TrashIcon className="size-4" />
                </Button>
              </FileUploadItemDelete>
            </FileUploadItem>
          ))}
        </FileUploadList>
      </FileUpload>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <FileUpload disabled className="w-[400px]">
      <FileUploadDropzone className="flex flex-col items-center justify-center gap-2 p-8">
        <UploadIcon className="text-muted-foreground size-8" />
        <p className="text-muted-foreground text-sm">File upload disabled</p>
      </FileUploadDropzone>
    </FileUpload>
  ),
};
