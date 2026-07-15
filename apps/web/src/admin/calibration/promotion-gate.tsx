'use client';
import React from 'react';
interface Props {
  result: { passed: boolean; failures: string[] } | null;
  onEvaluate: () => void;
}
export function PromotionGate({ result, onEvaluate }: Props) {
  return (
    <section aria-label="Promotion gate">
      <h2>Promotion Gate</h2>
      <button onClick={onEvaluate}>Evaluate</button>
      {result &&
        (result.passed ? (
          <p role="status">All checks passed</p>
        ) : (
          <ul>
            {result.failures.map((f, i) => (
              <li key={i} role="alert">
                {f}
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
