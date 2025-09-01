// Enums
export type LayoutStyle = "masonry" | "grid" | "random" | "spiral";
export type JobStatus = "pending" | "processing" | "completed" | "failed";

// Request/Configuration Types
export interface CollageConfig {
  width_inches: number; // 4-48
  height_inches: number; // 4-48
  dpi: number; // 72-300
  layout_style: LayoutStyle;
  spacing: number; // 0-50
  background_color: string; // Hex color, e.g., "#FFFFFF"
  maintain_aspect_ratio: boolean;
  apply_shadow: boolean;
}

export interface CreateCollageRequest extends CollageConfig {
  files: File[]; // 2-100 files
}

// Response Types
export interface CreateCollageResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface CollageJob {
  job_id: string;
  status: JobStatus;
  created_at: string; // ISO 8601 timestamp
  completed_at?: string; // ISO 8601 timestamp or null
  output_file?: string; // Filename or null
  error_message?: string; // Error description or null
  progress: number; // 0-100
  overlap_analysis?: OverlapAnalysis;
}

export interface ApiInfo {
  name: string;
  version: string;
  endpoints: {
    create_collage: string;
    get_status: string;
    download: string;
    list_jobs: string;
  };
}

export interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    filesystem: {
      temp_dir: string;
      temp_space_gb: number;
      output_dir: string;
      output_space_gb: number;
      healthy: boolean;
    };
    jobs: {
      total_jobs: number;
      active_jobs: number;
      healthy: boolean;
    };
    dependencies: {
      magic_available: boolean;
      healthy: boolean;
    };
  };
}

export interface CleanupResponse {
  message: string;
}

// Error Response Types
export interface ApiError {
  detail: string;
}

export interface RateLimitError {
  error: string;
}

// Frontend-specific types
export interface FileWithPreview {
  file: File;
  preview: string;
  id: string;
}

export interface JobWithPolling extends CollageJob {
  pollingInterval?: NodeJS.Timeout;
}

// Overlap Analysis Types
export interface OverlapDetail {
  image1_index: number;
  image2_index: number;
  image1_name: string;
  image2_name: string;
  overlap_area: number;
}

export interface OverlapRecommendation {
  action: "none" | "remove_images" | "moderate" | "adjust_layout";
  type?: "low" | "moderate" | "high";
  message: string;
  images_to_remove?: number;
  new_total_images?: number;
  overlap_density?: number;
}

export interface SuggestedRemoval {
  index: number;
  filename: string;
  overlap_count: number;
}

export interface OverlapAnalysis {
  has_overlaps: boolean;
  overlap_count: number;
  overlapping_images: number;
  details: OverlapDetail[];
  recommendation: OverlapRecommendation;
  recommended_removals?: SuggestedRemoval[];
}

export interface AnalyzeOverlapRequest extends CollageConfig {
  files: File[];
}

export type AnalyzeOverlapResponse = OverlapAnalysis;
