'use client';
import React from 'react';
interface Props {
  studentId: string;
}
export function StudentReport({ studentId }: Props) {
  return (
    <section aria-label="Student report">
      <h2>Report for {studentId}</h2>
    </section>
  );
}
