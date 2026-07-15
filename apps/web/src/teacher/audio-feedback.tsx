'use client';
import React from 'react';
interface Props {
  mediaId?: string;
  onUpload: (file: File) => void;
  uploading?: boolean;
}
export function AudioFeedback({ mediaId, onUpload, uploading }: Props) {
  return (
    <section aria-label="Audio feedback">
      {mediaId ? <audio controls src={mediaId} aria-label="Feedback audio" /> : <p>No audio recorded</p>}
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        disabled={uploading}
        aria-label="Upload audio feedback"
      />
    </section>
  );
}
