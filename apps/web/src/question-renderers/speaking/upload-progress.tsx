'use client';

import React from 'react';

export function UploadProgress({ uploadedChunks, totalChunks }: { uploadedChunks: number; totalChunks: number }) {
  const pct = totalChunks > 0 ? Math.round((uploadedChunks / totalChunks) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Upload progress: ${pct}%`}
    >
      Uploading… {uploadedChunks}/{totalChunks} chunks ({pct}%)
    </div>
  );
}
