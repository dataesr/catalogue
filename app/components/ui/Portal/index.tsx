import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
  container?: Element | null;
}

export function Portal({ children, container }: PortalProps) {
  const [mountNode, setMountNode] = useState<Element | null>(null);

  useEffect(() => {
    setMountNode(container ?? document.body);
  }, [container]);

  if (!mountNode) return null;

  return createPortal(children, mountNode);
}
