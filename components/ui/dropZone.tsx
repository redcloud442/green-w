import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils"; // Utility for merging classes, or replace with classNames if preferred
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";

type FileUploadProps = {
  label?: string;
  onFileChange: (file: File | null) => void;
};

const FileUpload: React.FC<FileUploadProps> = ({
  label = "File",
  onFileChange,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFileChange(acceptedFiles[0] || null);
    },
    [onFileChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    multiple: false,
  });

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        {...getRootProps()}
        className={cn(
          "bg-white rounded-md p-16 flex flex-col items-center justify-center text-center cursor-pointer",
          isDragActive && "border-blue-500 bg-blue-50"
        )}
      >
        <Input {...getInputProps()} className="hidden" type="file" />

        <h1 className="text-3xl   font-bold">TAP HERE TO UPLOAD</h1>
      </div>
    </div>
  );
};

export default FileUpload;
