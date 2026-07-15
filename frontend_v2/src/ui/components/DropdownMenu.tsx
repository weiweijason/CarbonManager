import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";

const Menu = styled.ul`
  position: fixed;
  background: #fff;
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  border: 1.5px solid var(--line);
  list-style: none;
  padding: 8px 0;
  min-width: 180px;
  z-index: 3000;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    font-size: 17px;
    font-weight: 500;
    color: var(--text);
    cursor: pointer;
    transition: background 140ms;
    min-height: var(--touch-target);

    &:hover {
      background: var(--accent-bg);
      color: var(--accent-ink);
    }

    &:active {
      background: var(--chip);
    }

    &:focus-visible {
      outline: 3px solid var(--accent);
      outline-offset: -3px;
    }

    &.danger {
      color: var(--warn);

      &:hover {
        background: var(--warn-bg);
        color: var(--warn);
      }
    }
  }

  /* 分隔線 */
  li + li {
    border-top: 1px solid #f0f4ef;
  }
`;

export default function DropdownMenu({
  open,
  onClose,
  anchorRef,
  children,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: { current: HTMLElement | null };
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  const rect = anchorRef.current?.getBoundingClientRect();
  const style: React.CSSProperties = rect
    ? {
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      }
    : {};

  return ReactDOM.createPortal(
    <Menu ref={ref} style={style} role="menu">
      {children}
    </Menu>,
    document.body
  );
}
