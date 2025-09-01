"use client";

import { Image as ImageIcon, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

import type { FileWithPreview } from "~/lib/types";

interface FileUploadProps {
  files: FileWithPreview[];
  onFilesChange: (files: FileWithPreview[]) => void;
}

const MAX_FILES = 100;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const TOTAL_MAX_SIZE = 500 * 1024 * 1024; // 500MB
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/webp",
];

export function FileUpload({ files, onFilesChange }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Invalid file type: ${file.type}. Only JPEG, PNG, GIF, BMP, TIFF, and WebP are allowed.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File too large: ${file.name}. Maximum size is 10MB.`;
    }

    return null;
  };

  const processFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: FileWithPreview[] = [];
      const errors: string[] = [];

      // Check total file count
      if (files.length + fileList.length > MAX_FILES) {
        toast.error(`Too many files. Maximum ${MAX_FILES} files allowed.`);
        return;
      }

      // Check total size
      const currentTotalSize = files.reduce((sum, f) => sum + f.file.size, 0);
      const newFilesSize = Array.from(fileList).reduce(
        (sum, f) => sum + f.size,
        0,
      );

      if (currentTotalSize + newFilesSize > TOTAL_MAX_SIZE) {
        toast.error("Total file size exceeds 500MB limit.");
        return;
      }

      Array.from(fileList).forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
        } else {
          const id = `${file.name}-${Date.now()}-${Math.random()}`;
          const preview = URL.createObjectURL(file);
          newFiles.push({ file, preview, id });
        }
      });

      if (errors.length > 0) {
        errors.forEach((error) => toast.error(error));
      }

      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles]);
        toast.success(`Added ${newFiles.length} file(s)`);
      }
    },
    [files, onFilesChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const { files: droppedFiles } = e.dataTransfer;
      if (droppedFiles.length > 0) {
        processFiles(droppedFiles);
      }
    },
    [processFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  });

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  });

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files: selectedFiles } = e.target;
      if (selectedFiles && selectedFiles.length > 0) {
        processFiles(selectedFiles);
      }
      // Reset input
      e.target.value = "";
    },
    [processFiles],
  );

  const removeFile = useCallback(
    (id: string) => {
      const updatedFiles = files.filter((f) => {
        if (f.id === id) {
          URL.revokeObjectURL(f.preview);
          return false;
        }
        return true;
      });
      onFilesChange(updatedFiles);
      toast.success("File removed");
    },
    [files, onFilesChange],
  );

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed p-8 text-center transition-colors ${
          isDragOver
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center space-y-4">
          <Upload className="h-12 w-12 text-gray-400" />
          <div>
            <p className="text-lg font-medium text-gray-900">
              Drop images here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Support: JPEG, PNG, GIF, BMP, TIFF, WebP (max 10MB each, up to{" "}
              {MAX_FILES} files)
            </p>
          </div>
          <Button asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
              Choose Files
              <input
                id="file-upload"
                type="file"
                multiple
                accept={ACCEPTED_TYPES.join(",")}
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </Button>
        </div>
      </Card>

      {/* File Preview Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {files.map((fileWithPreview) => (
            <div key={fileWithPreview.id} className="group relative">
              <div className="aspect-square overflow-hidden rounded-lg border bg-gray-100">
                <img
                  src={fileWithPreview.preview}
                  alt={fileWithPreview.file.name}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => removeFile(fileWithPreview.id)}
                  className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 truncate text-xs text-gray-500">
                {fileWithPreview.file.name}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* File Count Info */}
      {files.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <ImageIcon className="h-4 w-4" />
            <span>{files.length} file(s) uploaded</span>
          </div>
          <div>
            Total size:{" "}
            {(
              files.reduce((sum, f) => sum + f.file.size, 0) /
              (1024 * 1024)
            ).toFixed(1)}{" "}
            MB
          </div>
        </div>
      )}
    </div>
  );
}
