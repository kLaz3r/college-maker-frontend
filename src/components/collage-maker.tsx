"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { apiClient } from "~/lib/api";
import type {
  CollageFormConfig,
  CollageJob,
  CreateCollagePixelsRequest,
  CreateCollageRequest,
  FileWithPreview,
  GridOptimizationData,
  GridOptimizationRequest,
} from "~/lib/types";

import { Button } from "~/components/ui/button";
import { ConfigurationPanel } from "./configuration-panel";
import { FileUpload } from "./file-upload";
import { JobStatus } from "./job-status";

export function CollageMaker() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [currentJob, setCurrentJob] = useState<CollageJob | null>(null);
  const [currentOutputFormat, setCurrentOutputFormat] =
    useState<string>("jpeg");

  const [gridOptimization, setGridOptimization] =
    useState<GridOptimizationData | null>(null);
  const [showGridOptimization, setShowGridOptimization] = useState(false);

  // Refs for auto-scroll sections
  const gridOptimizationRef = useRef<HTMLDivElement | null>(null);
  const jobStatusRef = useRef<HTMLDivElement | null>(null);

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

  // Grid optimization mutation
  const optimizeGridMutation = useMutation({
    mutationFn: (data: GridOptimizationRequest) => apiClient.optimizeGrid(data),
    onSuccess: (response) => {
      setGridOptimization(response.optimization);
      setShowGridOptimization(true);
      toast.success("Grid optimization completed!");
    },
    onError: (error) => {
      toast.error(`Grid optimization failed: ${error.message}`);
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

  // Auto-scroll to Grid Optimization when shown
  useEffect(() => {
    if (showGridOptimization && gridOptimizationRef.current) {
      gridOptimizationRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [showGridOptimization]);

  // Auto-scroll to Job Status when a job is set
  useEffect(() => {
    if (currentJob && jobStatusRef.current) {
      jobStatusRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [currentJob]);

  const handleCreateCollage = (config: CollageFormConfig) => {
    if (files.length < 2) {
      toast.error("Please upload at least 2 images");
      return;
    }

    // Store the output format for download
    setCurrentOutputFormat(config.output_format ?? "jpeg");

    if (config.mode === "px") {
      const collageData: CreateCollagePixelsRequest = {
        width_px: config.width_px!,
        height_px: config.height_px!,
        dpi: config.dpi,
        layout_style: config.layout_style,
        spacing: config.spacing,
        background_color: config.background_color,
        maintain_aspect_ratio: config.maintain_aspect_ratio,
        apply_shadow: config.apply_shadow,
        output_format: config.output_format,
        face_aware_cropping: config.face_aware_cropping,
        face_margin: config.face_margin,
        pretrim_borders: config.pretrim_borders,
        files: files.map((f) => f.file),
      };
      apiClient
        .createCollageByPixels(collageData)
        .then((response) => {
          toast.success("Collage creation started!");
          setCurrentJob({
            job_id: response.job_id,
            status: "pending",
            created_at: new Date().toISOString(),
            progress: 0,
          });
        })
        .catch((error: Error) =>
          toast.error(`Failed to create collage: ${error.message}`),
        );
    } else {
      const collageData: CreateCollageRequest = {
        width_mm: config.width_mm!,
        height_mm: config.height_mm!,
        dpi: config.dpi,
        layout_style: config.layout_style,
        spacing: config.spacing,
        background_color: config.background_color,
        maintain_aspect_ratio: config.maintain_aspect_ratio,
        apply_shadow: config.apply_shadow,
        output_format: config.output_format,
        face_aware_cropping: config.face_aware_cropping,
        face_margin: config.face_margin,
        pretrim_borders: config.pretrim_borders,
        files: files.map((f) => f.file),
      };
      createCollageMutation.mutate(collageData);
    }
  };

  const handleDownload = async () => {
    if (!currentJob?.job_id) return;

    try {
      const blob = await apiClient.downloadCollage(currentJob.job_id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `collage-${currentJob.job_id}.${currentOutputFormat}`;
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
    setCurrentJob(null);
    setCurrentOutputFormat("jpeg");
    setGridOptimization(null);
    setShowGridOptimization(false);
  };

  const handleOptimizeGrid = (config: CollageFormConfig) => {
    if (files.length < 2) {
      toast.error("Please upload at least 2 images");
      return;
    }

    // Convert px to mm if needed: mm = (px / dpi) * 25.4
    const isPx = config.mode === "px";
    const width_mm = isPx
      ? (config.width_px! / config.dpi) * 25.4
      : config.width_mm!;
    const height_mm = isPx
      ? (config.height_px! / config.dpi) * 25.4
      : config.height_mm!;

    const optimizationData: GridOptimizationRequest = {
      num_images: files.length,
      width_mm,
      height_mm,
      dpi: config.dpi,
      spacing: config.spacing,
    };

    optimizeGridMutation.mutate(optimizationData);
  };

  const handleAddImagesForOptimization = () => {
    if (!gridOptimization?.closest_perfect_grid.images_needed) return;

    const imagesNeeded = gridOptimization.closest_perfect_grid.images_needed;
    const currentTotal = files.length + imagesNeeded;

    if (currentTotal > 200) {
      toast.error("Cannot add images", {
        description: `Adding ${imagesNeeded} images would exceed the 200 image limit. Current: ${files.length}/200`,
      });
      return;
    }

    toast.info(`Please add ${imagesNeeded} more image(s) for perfect grid`, {
      description: `This will create a perfect ${gridOptimization.closest_perfect_grid.cols}×${gridOptimization.closest_perfect_grid.rows} grid`,
    });
    // Reset optimization results to allow re-optimization after adding images
    setGridOptimization(null);
    setShowGridOptimization(false);
  };

  const handleRemoveImagesForOptimization = () => {
    if (!gridOptimization?.closest_perfect_grid.images_to_remove) return;

    const imagesToRemove =
      gridOptimization.closest_perfect_grid.images_to_remove;
    const newFiles = files.slice(0, files.length - imagesToRemove);
    setFiles(newFiles);
    setGridOptimization(null);
    setShowGridOptimization(false);
    toast.success(`Removed ${imagesToRemove} image(s) for perfect grid`);
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
            onOptimizeGrid={handleOptimizeGrid}
            onCreateCollage={handleCreateCollage}
            isLoading={createCollageMutation.isPending}
            disabled={!!currentJob}
            isOptimizingGrid={optimizeGridMutation.isPending}
            hasGridOptimization={showGridOptimization}
          />
        </div>
      )}

      {/* Grid Optimization Results */}
      {showGridOptimization && gridOptimization && (
        <div className="space-y-4" ref={gridOptimizationRef}>
          <h2 className="text-2xl font-semibold text-gray-900">
            Grid Optimization
          </h2>
          <div className="rounded-lg border p-6">
            <div
              className={`rounded-md p-4 ${gridOptimization.current_grid.is_perfect ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}`}
            >
              <h3
                className={`text-lg font-semibold ${gridOptimization.current_grid.is_perfect ? "text-green-800" : "text-blue-800"}`}
              >
                {gridOptimization.current_grid.is_perfect
                  ? "✅ Perfect Grid!"
                  : "💡 Grid Optimization Suggestions"}
              </h3>
              <p className="mt-2 text-sm">
                Current: {gridOptimization.current_grid.total_images} images in{" "}
                {gridOptimization.current_grid.cols}×
                {gridOptimization.current_grid.rows} grid
                {!gridOptimization.current_grid.is_perfect &&
                  ` (${gridOptimization.current_grid.images_in_last_row} in last row)`}
              </p>
              {!gridOptimization.current_grid.is_perfect && (
                <p className="mt-1 text-sm font-medium">
                  Suggested:{" "}
                  {gridOptimization.closest_perfect_grid.total_images} images in{" "}
                  {gridOptimization.closest_perfect_grid.cols}×
                  {gridOptimization.closest_perfect_grid.rows} grid
                </p>
              )}
            </div>

            {!gridOptimization.current_grid.is_perfect && (
              <div className="mt-4">
                <h4 className="text-md font-medium">Optimization Options:</h4>
                <div className="mt-3 space-y-2">
                  {gridOptimization.closest_perfect_grid.type ===
                    "add_images" && (
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="text-sm font-medium">
                          Add{" "}
                          {gridOptimization.closest_perfect_grid.images_needed}{" "}
                          image(s)
                        </p>
                        <p className="text-xs text-gray-600">
                          Perfect {gridOptimization.closest_perfect_grid.cols}×
                          {gridOptimization.closest_perfect_grid.rows} grid
                        </p>
                      </div>
                      <Button
                        onClick={handleAddImagesForOptimization}
                        variant="outline"
                        size="sm"
                      >
                        Add Images
                      </Button>
                    </div>
                  )}

                  {gridOptimization.closest_perfect_grid.type ===
                    "remove_images" && (
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="text-sm font-medium">
                          Remove{" "}
                          {
                            gridOptimization.closest_perfect_grid
                              .images_to_remove
                          }{" "}
                          image(s)
                        </p>
                        <p className="text-xs text-gray-600">
                          Perfect {gridOptimization.closest_perfect_grid.cols}×
                          {gridOptimization.closest_perfect_grid.rows} grid
                        </p>
                      </div>
                      <Button
                        onClick={handleRemoveImagesForOptimization}
                        variant="outline"
                        size="sm"
                      >
                        Remove Images
                      </Button>
                    </div>
                  )}

                  {/* Alternative options */}
                  {gridOptimization.recommendations.add_images.filter(
                    (option) => option.total_images <= 200,
                  ).length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-700">
                        Alternative: Add Images
                      </h5>
                      <div className="mt-2 space-y-1">
                        {gridOptimization.recommendations.add_images
                          .filter((option) => option.total_images <= 200)
                          .slice(0, 2)
                          .map((option, index) => (
                            <div key={index} className="text-xs text-gray-600">
                              Add {option.images_needed} → {option.cols}×
                              {option.rows} grid ({option.total_images} total)
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {gridOptimization.recommendations.remove_images.length >
                    0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-700">
                        Alternative: Remove Images
                      </h5>
                      <div className="mt-2 space-y-1">
                        {gridOptimization.recommendations.remove_images
                          .slice(0, 2)
                          .map((option, index) => (
                            <div key={index} className="text-xs text-gray-600">
                              Remove {option.images_to_remove} → {option.cols}×
                              {option.rows} grid ({option.total_images} total)
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex space-x-2">
                  <Button
                    onClick={() => setShowGridOptimization(false)}
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
        <div className="space-y-4" ref={jobStatusRef}>
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
