import type {
  AnalyzeOverlapRequest,
  AnalyzeOverlapResponse,
  ApiError,
  ApiInfo,
  CleanupResponse,
  CollageJob,
  CreateCollageRequest,
  CreateCollageResponse,
  GridOptimizationRequest,
  GridOptimizationResponse,
  HealthCheckResponse,
  RateLimitError,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        const error = (await response.json()) as RateLimitError;
        throw new Error(error.error);
      }

      const error = (await response.json()) as ApiError;
      throw new Error(error.detail);
    }

    return response.json();
  }

  async createCollage(
    data: CreateCollageRequest,
  ): Promise<CreateCollageResponse> {
    const formData = new FormData();

    // Add files
    data.files.forEach((file, index) => {
      formData.append("files", file);
    });

    // Add configuration
    Object.entries(data).forEach(([key, value]) => {
      if (key !== "files") {
        formData.append(key, String(value));
      }
    });

    return this.request<CreateCollageResponse>("/api/collage/create", {
      method: "POST",
      body: formData,
    });
  }

  async analyzeOverlaps(
    data: AnalyzeOverlapRequest,
  ): Promise<AnalyzeOverlapResponse> {
    const formData = new FormData();

    // Add files
    data.files.forEach((file, index) => {
      formData.append("files", file);
    });

    // Add configuration
    Object.entries(data).forEach(([key, value]) => {
      if (key !== "files") {
        formData.append(key, String(value));
      }
    });

    return this.request<AnalyzeOverlapResponse>(
      "/api/collage/analyze-overlaps",
      {
        method: "POST",
        body: formData,
      },
    );
  }

  async getJobStatus(jobId: string): Promise<CollageJob> {
    return this.request<CollageJob>(`/api/collage/status/${jobId}`);
  }

  async downloadCollage(jobId: string): Promise<Blob> {
    const url = `${API_BASE_URL}/api/collage/download/${jobId}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) {
        const error = (await response.json()) as RateLimitError;
        throw new Error(error.error);
      }

      const error = (await response.json()) as ApiError;
      throw new Error(error.detail);
    }

    return response.blob();
  }

  async getJobs(): Promise<CollageJob[]> {
    return this.request<CollageJob[]>("/api/collage/jobs");
  }

  async cleanupJob(jobId: string): Promise<CleanupResponse> {
    return this.request<CleanupResponse>(`/api/collage/cleanup/${jobId}`, {
      method: "DELETE",
    });
  }

  async getApiInfo(): Promise<ApiInfo> {
    return this.request<ApiInfo>("/");
  }

  async healthCheck(): Promise<HealthCheckResponse> {
    return this.request<HealthCheckResponse>("/health");
  }

  async optimizeGrid(
    data: GridOptimizationRequest,
  ): Promise<GridOptimizationResponse> {
    const formData = new FormData();

    // Add parameters
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    });

    return this.request<GridOptimizationResponse>(
      "/api/collage/optimize-grid",
      {
        method: "POST",
        body: formData,
      },
    );
  }
}

export const apiClient = new ApiClient();
