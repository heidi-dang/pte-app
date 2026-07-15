'use client';
import React from 'react';

interface MasteryLevelDisplay {
  skillName: string;
  level: number | null;
  status: string;
  confidence: number;
  evidenceCount: number;
}

export function SkillMastery({ levels }: { levels: MasteryLevelDisplay[] }) {
  return (
    <section aria-label="Skill mastery">
      <h2>Skill Mastery</h2>
      {levels.length === 0 ? (
        <p>Insufficient evidence for mastery calculation</p>
      ) : (
        <ul>
          {levels.map((l) => (
            <li key={l.skillName}>
              {l.skillName}: {l.level !== null ? `Level ${l.level}` : 'Insufficient evidence'} ({l.status})
              {l.status === 'insufficient' && <span role="alert"> — insufficient evidence</span>}
              <span>
                {' '}
                — confidence: {l.confidence.toFixed(2)}, evidence: {l.evidenceCount}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
