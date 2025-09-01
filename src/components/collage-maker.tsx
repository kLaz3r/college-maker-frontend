"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { apiClient } from "~/lib/api";
import type {
  CollageJob,
  CreateCollageRequest,
  FileWithPreview,
} from "~/lib/types";

import { ConfigurationPanel } from "./configuration-panel";
import { FileUpload } from "./file-upload";
import { JobStatus } from "./job-status";

export function CollageMaker() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [currentJob, setCurrentJob] = useState<CollageJob | null>(null);

  // Create collage mutation
  const createCollageMutation = useMutation({
    mutationFn: (data: CreateCollageRequest) => apiClient.createCollage(data),
    onSuccess: (response) => {
      toast.success("Collage creation started!");
      setCurrentJob({
        job_id: response.job_id,
        status: "pending",
        created_at: new Date().toISOString(),
        progress: 0,
      });
    },
    onError: (error) => {
      toast.error(`Failed to create collage: ${error.message}`);
    },
  });

  // Job status polling
  const { data: jobStatus } = useQuery({
    queryKey: ["job", currentJob?.job_id],
    queryFn: () => apiClient.getJobStatus(currentJob!.job_id),
    enabled: !!currentJob,
    refetchInterval: (data) => {
      if (data?.status === "completed" || data?.status === "failed") {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });

  // Update current job when status changes
  useEffect(() => {
    if (jobStatus) {
      setCurrentJob(jobStatus);
      if (jobStatus.status === "completed") {
        toast.success("Collage completed successfully!");
      } else if (jobStatus.status === "failed") {
        toast.error(`Collage creation failed: ${jobStatus.error_message}`);
      }
    }
  }, [jobStatus]);

  const handleCreateCollage = (config: Omit<CreateCollageRequest, "files">) => {
    if (files.length < 2) {
      toast.error("Please upload at least 2 images");
      return;
    }

    const collageData: CreateCollageRequest = {
      ...config,
      files: files.map((f) => f.file),
    };

    createCollageMutation.mutate(collageData);
  };

  const handleDownload = async () => {
    if (!currentJob?.job_id) return;

    try {
      const blob = await apiClient.downloadCollage(currentJob.job_id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `collage-${currentJob.job_id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Collage downloaded successfully!");
    } catch (error) {
      toast.error(
        `Failed to download collage: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleReset = () => {
    setFiles([]);
    setCurrentJob(null);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* File Upload Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Upload Images</h2>
        <FileUpload files={files} onFilesChange={setFiles} />
      </div>

      {/* Configuration Panel */}
      {files.length >= 2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Configure Collage
          </h2>
          <ConfigurationPanel
            onCreateCollage={handleCreateCollage}
            isLoading={createCollageMutation.isPending}
            disabled={!!currentJob}
          />
        </div>
      )}

      {/* Job Status */}
      {currentJob && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Job Status</h2>
          <JobStatus
            job={jobStatus || currentJob}
            onDownload={handleDownload}
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  );
}
