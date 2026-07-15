'use client';
import React from 'react';
interface Props {
  onImport: (file: File) => void;
  importing?: boolean;
}
export function ImportTool({ onImport, importing }: Props) {
  return (
    <section aria-label="Import tool">
      <h2>Import Content</h2>
      <input
        type="file"
        onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
        disabled={importing}
        aria-label="Import file"
      />
    </section>
  );
}
