'use client';
import React from 'react';
interface Props {
  beforeScore: number;
  afterScore: number;
  delta: number;
  classification: string;
  missingData: boolean;
}
export function StudyPlanEffectiveness({ beforeScore, afterScore, delta, classification, missingData }: Props) {
  return (
    <section aria-label="Study plan effectiveness">
      <h2>Study Plan Effectiveness</h2>
      {missingData && <p role="alert">Some data missing — results are observational</p>}
      <p>Before: {beforeScore.toFixed(2)}</p>
      <p>After: {afterScore.toFixed(2)}</p>
      <p>
        Delta: {delta > 0 ? '+' : ''}
        {delta.toFixed(2)}
      </p>
      <p>Observational classification: {classification}</p>
    </section>
  );
}
