'use client';
import React from 'react';

export function SkillMastery({
  levels,
}: {
  levels: Array<{ skillName: string; status: string; level: number; confidence: number }>;
}) {
  return (
    <section aria-label="Skill mastery">
      <h2>Skill Mastery</h2>
      {levels.length === 0 ? (
        <p>Insufficient evidence for mastery calculation</p>
      ) : (
        <ul>
          {levels.map((l) => (
            <li key={l.skillName}>
              {l.skillName}: Level {l.level} ({l.status})
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
