"use client";

import { FileIcon } from "@phosphor-icons/react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "./util";

class FileUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileUploadError";
  }
}

class FileUploadSizeError extends FileUploadError {
  constructor(message: string) {
    super(message);
    this.name = "FileUploadSizeError";
  }
}

class FileUploadMaxFilesError extends FileUploadError {
  constructor(message: string) {
    super(message);
    this.name = "FileUploadMaxFilesError";
  }
}

class FileUploadAcceptError extends FileUploadError {
  constructor(message: string) {
    super(message);
    this.name = "FileUploadAcceptError";
  }
}

function useMergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (value: T) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref) {
        ref.current = value;
      }
    }
  };
}

const isImage = (file: File) => {
  return file.type.startsWith("image/");
};

const isAcceptedType = (file: File, accept?: string) => {
  if (!accept) return true;

  const acceptTypes = accept.split(",").map((t) => t.trim());
  const fileType = file.type;
  const parts = file.name.split(".");
  const ext = parts.length > 1 ? `.${parts.pop()!.toLowerCase()}` : "";

  return acceptTypes.some((type) => {
    if (type.endsWith("/*")) {
      const prefix = type.slice(0, -1);
      return fileType.startsWith(prefix);
    }
    return type === fileType || (!!ext && type.toLowerCase() === ext);
  });
};

export type RejectedFile = File & { cause: FileUploadError };

interface FileUploadProps {
  defaultValue?: File[];
  value?: File[];
  onChange?: (files: File[]) => void;
  onReject?: (files: RejectedFile[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  required?: boolean;
  multiple?: boolean;
  children?: React.ReactNode;
  id?: string;
  ref?: React.Ref<HTMLInputElement>;
  name?: string;
}

interface FileUploadContextValue {
  isDragOver: boolean;
  setIsDragOver: (isDragOver: boolean) => void;
  value: File[];
  onChange?: (files: File[]) => void;
  onFileRemove: (file: File) => void;

  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  required?: boolean;
  multiple?: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const FileUploadContext = createContext<FileUploadContextValue | null>(null);

const useFileUploadContext = () => {
  const context = useContext(FileUploadContext);
  if (!context) {
    throw new Error("useFileUploadContext must be used within a FileUpload");
  }
  return context;
};

const FileUpload = ({
  defaultValue,
  value: controlledValue,
  onChange,
  onReject,
  accept,
  maxFiles,
  maxSize,
  disabled,
  required,
  multiple,
  children,
  id,
  ref,
  name,
}: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const defaultInputId = useId();
  const inputId = id ?? defaultInputId;
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergeRefs(ref, inputRef);
  const [internalValue, setInternalValue] = useState(defaultValue ?? []);
  const value = controlledValue ?? internalValue;
  const isControlled = controlledValue !== undefined;

  const onFileRemove = useCallback(
    (file: File) => {
      const next = value.filter((f) => f !== file);
      if (!isControlled) {
        setInternalValue(next);
      }
      onChange?.(next);
    },
    [value, onChange, isControlled],
  );

  const contextValue: FileUploadContextValue = useMemo(
    () => ({
      isDragOver,
      setIsDragOver,
      value,
      onChange,
      onFileRemove,
      accept,
      maxFiles,
      maxSize,
      disabled,
      required,
      multiple,
      inputRef,
    }),
    [
      isDragOver,
      value,
      onChange,
      onFileRemove,
      accept,
      maxFiles,
      maxSize,
      disabled,
      required,
      multiple,
    ],
  );

  const processFiles = useCallback(
    (inputFiles: File[]) => {
      if (disabled) {
        return { acceptedFiles: [], rejectedFiles: [] as RejectedFile[] };
      }

      const acceptedFiles = new Set<File>();
      const rejectedFiles = new Set<RejectedFile>();

      const hasMaxFiles = typeof maxFiles === "number" && maxFiles > 0;
      const effectiveMaxFiles = hasMaxFiles ? maxFiles : multiple ? Number.POSITIVE_INFINITY : 1;

      let totalFiles = value.length;

      for (const file of inputFiles) {
        if (totalFiles >= effectiveMaxFiles) {
          rejectedFiles.add({
            ...file,
            cause: new FileUploadMaxFilesError("Max files reached."),
          });
          continue;
        }

        if (maxSize && file.size > maxSize) {
          rejectedFiles.add({
            ...file,
            cause: new FileUploadSizeError("File size exceeds the maximum allowed size."),
          });
          continue;
        }

        if (accept) {
          const isValidType = isAcceptedType(file, accept);
          if (!isValidType) {
            rejectedFiles.add({
              ...file,
              cause: new FileUploadAcceptError("File type not accepted."),
            });
            continue;
          }
        }

        acceptedFiles.add(file);
        totalFiles++;
      }

      return {
        acceptedFiles: Array.from(acceptedFiles),
        rejectedFiles: Array.from(rejectedFiles),
      };
    },
    [disabled, maxFiles, maxSize, value, accept, multiple],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const { acceptedFiles, rejectedFiles } = processFiles(files);

    e.preventDefault();

    if (acceptedFiles.length) {
      if (!isControlled) {
        setInternalValue([...value, ...acceptedFiles]);
      }
      onChange?.([...value, ...acceptedFiles]);
    }

    if (rejectedFiles.length) {
      onReject?.(rejectedFiles);
    }

    e.target.value = "";
  };

  return (
    <FileUploadContext.Provider value={contextValue}>
      {children}
      <input
        type="file"
        id={inputId}
        ref={mergedRef}
        tabIndex={-1}
        accept={accept}
        name={name}
        className="sr-only"
        disabled={disabled}
        multiple={multiple}
        required={required}
        onChange={handleInputChange}
      />
    </FileUploadContext.Provider>
  );
};

const FileUploadDropzoneOutline = ({
  isAnimating = false,
  className = "",
  strokeWidth = 1,
  dashLength = 4,
  gapLength = 4,
  speed = 40,
  radius = 4,
}) => {
  const dashOffset = useMotionValue(0);
  const totalDashLength = dashLength + gapLength;

  useAnimationFrame((_, delta) => {
    if (!isAnimating) {
      return;
    }

    const currentOffset = dashOffset.get();
    const increment = (delta / 1000) * speed;
    dashOffset.set((currentOffset + increment) % totalDashLength);
  });

  return (
    <svg
      className={cn(className)}
      width="100%"
      height="100%"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <motion.rect
        x={strokeWidth / 2}
        y={strokeWidth / 2}
        width={`calc(100% - ${strokeWidth}px)`}
        height={`calc(100% - ${strokeWidth}px)`}
        rx={radius}
        ry={radius}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${dashLength} ${gapLength}`}
        className="stroke-current"
        style={{ strokeDashoffset: dashOffset }}
      />
    </svg>
  );
};

interface FileUploadDropzoneProps {
  children?: React.ReactNode;
  asChild?: boolean;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

const FileUploadDropzone = ({
  children,
  asChild,
  className,
  ref,
  ...props
}: FileUploadDropzoneProps) => {
  const { isDragOver, setIsDragOver, inputRef, disabled } = useFileUploadContext();

  const handleOnDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }

      e.preventDefault();
      setIsDragOver(true);
    },
    [setIsDragOver, disabled],
  );

  const handleOnDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }

      e.preventDefault();
      setIsDragOver(false);
    },
    [setIsDragOver, disabled],
  );

  const handleOnDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }

      e.preventDefault();

      const files = Array.from(e.dataTransfer.files);
      const inputElement = inputRef.current;
      if (!inputElement) {
        return;
      }

      const dataTransfer = new DataTransfer();
      for (const file of files) {
        dataTransfer.items.add(file);
      }

      inputElement.files = dataTransfer.files;
      inputElement.dispatchEvent(new Event("change", { bubbles: true }));

      setIsDragOver(false);
    },
    [setIsDragOver, inputRef, disabled],
  );

  const handleOnDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }

      e.preventDefault();
      setIsDragOver(true);
    },
    [setIsDragOver, disabled],
  );

  const handleOnClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }

      if (e.defaultPrevented) {
        return;
      }

      const target = e.target as HTMLElement;
      if (target.closest('[data-slot="file-upload-trigger"]')) {
        return;
      }

      e.preventDefault();
      inputRef?.current?.click();
    },
    [inputRef, disabled],
  );

  const handleOnKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        inputRef?.current?.click();
      }
    },
    [inputRef, disabled],
  );

  const handleOnPaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }

      e.preventDefault();

      const items = e.clipboardData?.items;
      if (!items) {
        return;
      }

      const files: File[] = [];
      for (const item of items) {
        if (item?.kind === "file") {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }

      if (files.length === 0) {
        return;
      }

      const inputElement = inputRef?.current;
      if (!inputElement) {
        return;
      }

      const dataTransfer = new DataTransfer();
      for (const file of files) {
        dataTransfer.items.add(file);
      }
      inputElement.files = dataTransfer.files;
      inputElement.dispatchEvent(new Event("change", { bubbles: true }));

      setIsDragOver(false);
    },
    [inputRef, setIsDragOver, disabled],
  );

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      className={cn(
        "focus-within:bg-muted/50 relative flex flex-col items-center gap-1 rounded-lg transition-colors duration-300 select-none focus-visible:outline-0",
        "hover:bg-muted/50 bg-muted/20 aria-disabled:cursor-default aria-disabled:opacity-50 aria-disabled:focus-within:bg-transparent aria-disabled:hover:bg-transparent",
        {
          "bg-muted": isDragOver,
        },
        className,
      )}
      ref={ref}
      data-slot="file-upload-dropzone"
      onDragOver={handleOnDragOver}
      onDragLeave={handleOnDragLeave}
      onDrop={handleOnDrop}
      onDragEnter={handleOnDragEnter}
      onClick={handleOnClick}
      onKeyDown={handleOnKeyDown}
      onPaste={handleOnPaste}
      role="button"
      data-state={isDragOver ? "over" : "default"}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      {...props}>
      <FileUploadDropzoneOutline
        isAnimating={isDragOver}
        className={cn("pointer-events-none absolute inset-0 transition-all", {
          "text-primary": isDragOver,
          "text-border": !isDragOver,
        })}
      />
      <Slottable>{children}</Slottable>
    </Comp>
  );
};

interface FileUploadTriggerProps extends React.ComponentPropsWithoutRef<"button"> {
  asChild?: boolean;
}

const FileUploadTrigger = (props: FileUploadTriggerProps) => {
  const { asChild, onClick: onClick, ...triggerProps } = props;
  const context = useFileUploadContext();

  const handleOnClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);

      if (e.defaultPrevented) {
        return;
      }

      context.inputRef.current?.click();
    },
    [context.inputRef, onClick],
  );

  const TriggerPrimitive = asChild ? Slot : "button";

  return (
    <TriggerPrimitive
      type="button"
      data-disabled={context.disabled ? "" : undefined}
      data-slot="file-upload-trigger"
      {...triggerProps}
      disabled={context.disabled}
      onClick={handleOnClick}
    />
  );
};

interface FileUploadItemContextValue {
  file: File;
}

const FileUploadItemContext = createContext<FileUploadItemContextValue | null>(null);

const useFileUploadItemContext = () => {
  const context = useContext(FileUploadItemContext);
  if (!context) {
    throw new Error("useFileUploadItemContext must be used within a FileUploadItem");
  }
  return context;
};

const FileUploadList = ({
  className,
  children,
  asChild,
  ...props
}: React.ComponentPropsWithoutRef<"ul"> & { asChild?: boolean }) => {
  const Comp = asChild ? Slot : "ul";

  return (
    <Comp
      className={cn("flex flex-col gap-1 empty:hidden", className)}
      data-slot="file-upload-list"
      {...props}>
      {children}
    </Comp>
  );
};

const FileUploadItem = ({
  children,
  className,
  asChild,
  file,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & {
  file: File;
  asChild?: boolean;
}) => {
  const value = useMemo(
    () => ({
      file,
    }),
    [file],
  );

  const Comp = asChild ? Slot : "li";

  return (
    <FileUploadItemContext.Provider value={value}>
      <Comp
        className={cn("border-border flex items-center gap-2 rounded-lg border p-1", className)}
        data-slot="file-upload-item"
        {...props}>
        {children}
      </Comp>
    </FileUploadItemContext.Provider>
  );
};

const FileUploadItemPreview = ({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div">) => {
  const itemContext = useFileUploadItemContext();

  const [objectURL, setObjectURL] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    if (isImage(itemContext.file)) {
      url = URL.createObjectURL(itemContext.file);
      setObjectURL(url);
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [itemContext.file]);

  return (
    <div
      className={cn(
        "border-border relative flex size-10 items-center justify-center overflow-clip rounded-md border",
        className,
      )}
      data-slot="file-upload-item-preview"
      {...props}>
      {objectURL ? (
        <img src={objectURL} alt="" className="size-full object-cover" />
      ) : (
        <FileIcon name="file" className="size-5" />
      )}
      {children}
    </div>
  );
};

const FileUploadItemMetadata = ({
  className,
  unit = "MB",
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { unit?: "MB" | "KB" }) => {
  const itemContext = useFileUploadItemContext();

  const fileSizeLabel = useMemo(() => {
    const fileSize = itemContext.file.size;
    const unitSize = Math.pow(1024, unit === "KB" ? 1 : 2);
    const fileSizeInUnit = fileSize / unitSize;
    return `${fileSizeInUnit.toFixed(2)} ${unit}`;
  }, [itemContext.file, unit]);

  const fileNameLabel = useMemo(() => {
    return itemContext.file.name;
  }, [itemContext.file]);

  return (
    <div
      className={cn("mr-auto flex flex-col overflow-auto", className)}
      data-slot="file-upload-item-metadata"
      {...props}>
      <span className="text-foreground truncate text-sm font-medium">{fileNameLabel}</span>
      <span className="text-muted-foreground text-xs">{fileSizeLabel}</span>
    </div>
  );
};

const FileUploadItemDelete = ({
  children,
  className,
  asChild,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) => {
  const context = useFileUploadContext();
  const itemContext = useFileUploadItemContext();

  const handleOnClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      context.onFileRemove(itemContext.file);
    },
    [context, itemContext],
  );

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn("flex flex-col gap-1", className)}
      data-slot="file-upload-item-delete"
      onClick={handleOnClick}
      {...props}>
      {children}
    </Comp>
  );
};

export {
  FileUpload,
  FileUploadDropzone,
  FileUploadDropzoneOutline,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
  useFileUploadContext,
  useFileUploadItemContext,
};
