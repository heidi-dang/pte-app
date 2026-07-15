'use client';
import React from 'react';

interface MasteryLevelDisplay {
  subject: { subjectType: string; subjectName: string };
  level: number | null;
  status: string;
  confidence: number;
  evidenceCount: number;
  warnings: string[];
}

export function SkillMastery({ levels }: { levels: MasteryLevelDisplay[] }) {
  return (
    <section aria-label="Skill mastery">
      <h2>Skill Mastery</h2>
      {levels.length === 0 ? (
        <p>Insufficient evidence for mastery calculation</p>
      ) : (
        <ul>
          {levels.map((l, i) => (
            <li key={l.subject.subjectName + i}>
              {l.subject.subjectName} ({l.subject.subjectType}):{' '}
              {l.level !== null ? `Level ${l.level}` : 'Insufficient evidence'} ({l.status})
              {l.status === 'insufficient' && <span role="alert"> — insufficient evidence</span>}
              {l.warnings.map((w, j) => (
                <p key={j} role="alert">
                  {w}
                </p>
              ))}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
