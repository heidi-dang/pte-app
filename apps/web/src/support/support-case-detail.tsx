'use client';
import React from 'react';
interface Props {
  caseDetail: { id: string; subject: string; description: string; status: string } | null;
}
export function SupportCaseDetail({ caseDetail }: Props) {
  if (!caseDetail)
    return (
      <section aria-label="Case detail">
        <p>Select a case</p>
      </section>
    );
  return (
    <section aria-label="Case detail">
      <h2>{caseDetail.subject}</h2>
      <p>{caseDetail.description}</p>
      <p>Status: {caseDetail.status}</p>
    </section>
  );
}
