'use client';
import React from 'react';

interface StudyPlanProgressProps {
  completedActivities: number;
  totalActivities: number;
  percentage: number;
  updatedAt: string;
  loading?: boolean;
}

export function StudyPlanProgress({
  completedActivities,
  totalActivities,
  percentage,
  updatedAt,
  loading,
}: StudyPlanProgressProps) {
  if (loading)
    return (
      <section aria-label="Study plan progress">
        <p>Loading progress...</p>
      </section>
    );
  if (totalActivities === 0)
    return (
      <section aria-label="Study plan progress">
        <p>No study plan assigned</p>
      </section>
    );
  return (
    <section aria-label="Study plan progress">
      <h2>Study Plan Progress</h2>
      <progress value={percentage} max={100} aria-label={`${percentage}% complete`}>
        {percentage}%
      </progress>
      <p>
        {completedActivities} of {totalActivities} activities completed
      </p>
      <p>
        Last updated: <time dateTime={updatedAt}>{updatedAt}</time>
      </p>
    </section>
  );
}
