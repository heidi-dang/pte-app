'use client';
import React from 'react';
interface Props {
  status: string;
  attempts: number;
  lastError?: string;
}
export function DeliveryStatus({ status, attempts, lastError }: Props) {
  return (
    <p role="status">
      Delivery: {status} (attempts: {attempts}){lastError && <span role="alert"> Error: {lastError}</span>}
    </p>
  );
}
