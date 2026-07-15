'use client';

import React from 'react';

export function SectionProgress({ sections, currentSection }: { sections: string[]; currentSection: string }) {
  return (
    <nav aria-label="Section progress" role="navigation">
      <ol>
        {sections.map((section) => (
          <li
            key={section}
            aria-current={section === currentSection ? 'step' : undefined}
            style={{ fontWeight: section === currentSection ? 'bold' : 'normal' }}
          >
            {section}
          </li>
        ))}
      </ol>
    </nav>
  );
}
