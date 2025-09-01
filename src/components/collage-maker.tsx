"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { apiClient } from "~/lib/api";
import type {
  AnalyzeOverlapResponse,
  CollageJob,
  CreateCollageRequest,
  FileWithPreview,
  OverlapRecommendation,
} from "~/lib/types";

import { Button } from "~/components/ui/button";
import { ConfigurationPanel } from "./configuration-panel";
import { FileUpload } from "./file-upload";
import { JobStatus } from "./job-status";

export function CollageMaker() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [currentJob, setCurrentJob] = useState<CollageJob | null>(null);
  const [overlapAnalysis, setOverlapAnalysis] =
    useState<AnalyzeOverlapResponse | null>(null);
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);

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

  // Analyze overlaps mutation
  const analyzeOverlapsMutation = useMutation({
    mutationFn: (
      data: Omit<CreateCollageRequest, "files"> & { files: File[] },
    ) => apiClient.analyzeOverlaps(data),
    onSuccess: (response) => {
      setOverlapAnalysis(response);
      setShowAnalysisResults(true);
      toast.success("Overlap analysis completed!");
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  // Job status polling
  const { data: jobStatus } = useQuery({
    queryKey: ["job", currentJob?.job_id],
    queryFn: () => apiClient.getJobStatus(currentJob!.job_id),
    enabled: !!currentJob,
    refetchInterval: (query) => {
      if (
        query.state.data?.status === "completed" ||
        query.state.data?.status === "failed"
      ) {
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
    setOverlapAnalysis(null);
    setShowAnalysisResults(false);
  };

  const handleAnalyze = (config: Omit<CreateCollageRequest, "files">) => {
    if (files.length < 2) {
      toast.error("Please upload at least 2 images");
      return;
    }

    const analysisData = {
      ...config,
      files: files.map((f) => f.file),
    };

    analyzeOverlapsMutation.mutate(analysisData);
  };

  const handleRemoveSuggested = () => {
    if (!overlapAnalysis?.recommended_removals) return;

    const indicesToRemove = overlapAnalysis.recommended_removals.map(
      (r) => r.index,
    );
    const newFiles = files.filter(
      (_, index) => !indicesToRemove.includes(index),
    );
    setFiles(newFiles);
    setOverlapAnalysis(null);
    setShowAnalysisResults(false);
    toast.success(`Removed ${indicesToRemove.length} suggested images`);
  };

  const handleCreateWithCleanFiles = (
    config: Omit<CreateCollageRequest, "files">,
  ) => {
    if (!overlapAnalysis?.recommended_removals) {
      handleCreateCollage(config);
      return;
    }

    const indicesToRemove = overlapAnalysis.recommended_removals.map(
      (r) => r.index,
    );
    const cleanFiles = files.filter(
      (_, index) => !indicesToRemove.includes(index),
    );

    const collageData: CreateCollageRequest = {
      ...config,
      files: cleanFiles.map((f) => f.file),
    };

    createCollageMutation.mutate(collageData);
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
            onAnalyze={handleAnalyze}
            onCreateCollage={
              overlapAnalysis ? handleCreateWithCleanFiles : handleCreateCollage
            }
            isLoading={createCollageMutation.isPending}
            disabled={!!currentJob}
            isAnalyzing={analyzeOverlapsMutation.isPending}
            hasAnalysisResults={showAnalysisResults}
          />
        </div>
      )}

      {/* Analysis Results */}
      {showAnalysisResults && overlapAnalysis && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Analysis Results
          </h2>
          <div className="rounded-lg border p-6">
            <div
              className={`rounded-md p-4 ${overlapAnalysis.has_overlaps ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}
            >
              <h3
                className={`text-lg font-semibold ${overlapAnalysis.has_overlaps ? "text-red-800" : "text-green-800"}`}
              >
                {overlapAnalysis.has_overlaps
                  ? "⚠️ Overlaps Detected"
                  : "✅ No Overlaps Found"}
              </h3>
              <p className="mt-2 text-sm">
                {overlapAnalysis.overlap_count} overlapping pairs found in{" "}
                {overlapAnalysis.overlapping_images} images.
              </p>
              <p className="mt-1 text-sm font-medium">
                Recommendation: {overlapAnalysis.recommendation.message}
              </p>
            </div>

            {overlapAnalysis.recommended_removals &&
              overlapAnalysis.recommended_removals.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium">Suggested Removals:</h4>
                  <ul className="mt-2 space-y-1">
                    {overlapAnalysis.recommended_removals.map((removal) => (
                      <li key={removal.index} className="text-sm">
                        • {removal.filename} (overlaps: {removal.overlap_count})
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex space-x-2">
                    <Button
                      onClick={handleRemoveSuggested}
                      variant="outline"
                      size="sm"
                    >
                      Remove Suggested Images
                    </Button>
                    <Button
                      onClick={() => setShowAnalysisResults(false)}
                      variant="outline"
                      size="sm"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Job Status */}
      {currentJob && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Job Status</h2>
          <JobStatus
            job={jobStatus ?? currentJob}
            onDownload={handleDownload}
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  );
}
