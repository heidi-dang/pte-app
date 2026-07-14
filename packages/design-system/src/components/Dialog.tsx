'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} className="ds-dialog" onClose={onClose}>
      <div className="ds-dialog__header">
        <h2 className="ds-dialog__title">{title}</h2>
        <button className="ds-dialog__close" onClick={onClose} aria-label="Close dialog">
          &times;
        </button>
      </div>
      <div className="ds-dialog__body">{children}</div>
    </dialog>
  );
}
