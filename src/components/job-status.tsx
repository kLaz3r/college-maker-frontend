"use client";

import { CheckCircle, Clock, Download, RefreshCw, XCircle } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";

import type { CollageJob } from "~/lib/types";

interface JobStatusProps {
  job: CollageJob;
  onDownload: () => void;
  onReset: () => void;
}

export function JobStatus({ job, onDownload, onReset }: JobStatusProps) {
  const getStatusIcon = () => {
    switch (job.status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "processing":
        return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case "pending":
        return "text-yellow-600";
      case "processing":
        return "text-blue-600";
      case "completed":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getStatusIcon()}
          <span>Job Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Job ID */}
        <div>
          <p className="text-sm text-gray-600">Job ID</p>
          <p className="font-mono text-sm">{job.job_id}</p>
        </div>

        {/* Status */}
        <div>
          <p className="text-sm text-gray-600">Status</p>
          <p className={`font-medium capitalize ${getStatusColor()}`}>
            {job.status}
          </p>
        </div>

        {/* Progress */}
        {job.status === "processing" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{job.progress}%</span>
            </div>
            <Progress value={job.progress} className="w-full" />
          </div>
        )}

        {/* Created At */}
        <div>
          <p className="text-sm text-gray-600">Created</p>
          <p className="text-sm">{formatDate(job.created_at)}</p>
        </div>

        {/* Completed At */}
        {job.completed_at && (
          <div>
            <p className="text-sm text-gray-600">
              {job.status === "completed" ? "Completed" : "Failed"}
            </p>
            <p className="text-sm">{formatDate(job.completed_at)}</p>
          </div>
        )}

        {/* Error Message */}
        {job.error_message && (
          <div>
            <p className="text-sm text-gray-600">Error</p>
            <p className="text-sm text-red-600">{job.error_message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2 pt-4">
          {job.status === "completed" && job.output_file && (
            <Button onClick={onDownload} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download Collage
            </Button>
          )}

          {(job.status === "completed" || job.status === "failed") && (
            <Button variant="outline" onClick={onReset} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Create New Collage
            </Button>
          )}
        </div>

        {/* Processing Message */}
        {job.status === "processing" && (
          <div className="text-center text-sm text-gray-600">
            <p>Processing your images... This may take a few minutes.</p>
            <p className="mt-1">Please don't close this page.</p>
          </div>
        )}

        {/* Success Message */}
        {job.status === "completed" && (
          <div className="text-center text-sm text-green-600">
            <p>🎉 Your collage has been created successfully!</p>
            <p className="mt-1">
              Click the download button to save your collage.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
