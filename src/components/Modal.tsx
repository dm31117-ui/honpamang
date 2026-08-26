import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useModal } from '../lib/hooks';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 480px 기본, 'wide'는 520px + overflow hidden (망각하기 연기 연출용) */
  variant?: 'default' | 'pad32' | 'wide';
  labelledBy?: string;
}

export function Modal({ open, onClose, children, variant = 'default', labelledBy }: ModalProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useModal(open, onClose);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;
    boxRef.current?.focus();
    return () => restoreTo.current?.focus?.();
  }, [open]);

  // Tab을 모달 안에 가둔다.
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const box = boxRef.current;
    if (!box) return;
    const items = box.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  if (!open) return null;

  const cls =
    'modal' + (variant === 'pad32' ? ' modal--pad32' : variant === 'wide' ? ' modal--wide' : '');

  return (
    <div className="overlay" onMouseDown={onClose} role="presentation">
      <div
        ref={boxRef}
        className={cls}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
    </div>
  );
}
