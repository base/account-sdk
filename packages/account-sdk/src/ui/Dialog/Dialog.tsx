// Copyright (c) 2018-2025 Coinbase, Inc. <https://www.coinbase.com/>

import { clsx } from 'clsx';
import { FunctionComponent, render } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';

import { BaseLogo } from ':ui/assets/BaseLogo.js';
import { useDragToDismiss, usePhonePortrait, useUsername } from '../hooks/index.js';
import css from './Dialog-css.js';

const closeIcon = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQiIGhlaWdodD0iMTQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEzIDFMMSAxM20wLTEyTDEzIDEzIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+`;

// Handle bar component for mobile bottom sheet
const DialogHandleBar: FunctionComponent = () => {
  const isPhonePortrait = usePhonePortrait();

  return isPhonePortrait ? <div class="-base-acc-sdk-dialog-handle-bar" /> : null;
};

export type DialogProps = {
  title: string;
  message: string;
  actionItems?: DialogActionItem[];
  onClose?: () => void;
};

export type DialogInstanceProps = Omit<DialogProps, 'onClose'> & {
  handleClose: () => void;
};

export type DialogActionItem = {
  text: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
};

export class Dialog {
  private readonly items = new Map<number, DialogProps>();

  private nextItemKey = 0;
  private root: Element | null = null;

  constructor() {}

  public attach(el: Element): void {
    this.root = document.createElement('div');

    this.root.className = '-base-acc-sdk-dialog-root';
    el.appendChild(this.root);

    this.render();
  }

  public presentItem(itemProps: DialogProps): void {
    const key = this.nextItemKey++;
    this.items.set(key, itemProps);
    this.render();
  }

  public dismissItem(key: number): void {
    const item = this.items.get(key);
    this.items.delete(key);
    this.render();
    item?.onClose?.();
  }

  public clear(): void {
    // Call onClose for all items before clearing
    for (const [, item] of this.items) {
      item.onClose?.();
    }
    this.items.clear();
    if (this.root) {
      render(null, this.root);
    }
  }

  private render(): void {
    if (!this.root) return;

    render(
      <div>
        <DialogContainer>
          {Array.from(this.items.entries()).map(([key, itemProps]) => (
            <DialogInstance
              {...itemProps}
              key={key}
              handleClose={() => {
                this.dismissItem(key);
              }}
            />
          ))}
        </DialogContainer>
      </div>,
      this.root
    );
  }
}

export const DialogContainer: FunctionComponent = ({ children }) => {
  const handleDismiss = useCallback(() => {
    // Find the dialog instance and trigger its close handler
    const closeButton = document.querySelector(
      '.-base-acc-sdk-dialog-instance-header-close'
    ) as HTMLElement;
    if (closeButton) {
      closeButton.click();
    }
  }, []);

  const { dragY, isDragging, handlers } = useDragToDismiss(handleDismiss);

  return (
    <div class={clsx('-base-acc-sdk-dialog-container')}>
      <style>{css}</style>
      <div
        class="-base-acc-sdk-dialog-backdrop"
        onTouchStart={handlers.onTouchStart}
        onTouchMove={handlers.onTouchMove}
        onTouchEnd={handlers.onTouchEnd}
      >
        <div
          class="-base-acc-sdk-dialog"
          style={{
            transform: `translateY(${dragY}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          <DialogHandleBar />
          {children}
        </div>
      </div>
    </div>
  );
};

export const DialogInstance: FunctionComponent<DialogInstanceProps> = ({
  title,
  message,
  actionItems,
  handleClose,
}) => {
  const [hidden, setHidden] = useState(true);
  const { isLoading: isLoadingUsername, username } = useUsername();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHidden(false);
    }, 1);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const headerTitle = useMemo(() => {
    return username ? `Signed in as ${username}` : 'Base Account';
  }, [username]);

  const shouldShowHeaderTitle = !isLoadingUsername;

  // Memoize action buttons
  const actionButtons = useMemo(() => {
    if (!actionItems?.length) return null;

    return (
      <div class="-base-acc-sdk-dialog-instance-actions">
        {actionItems.map((action, i) => (
          <button
            class={clsx(
              '-base-acc-sdk-dialog-instance-button',
              action.variant === 'primary' && '-base-acc-sdk-dialog-instance-button-primary',
              action.variant === 'secondary' && '-base-acc-sdk-dialog-instance-button-secondary'
            )}
            onClick={action.onClick}
            key={i}
            type="button"
          >
            {action.text}
          </button>
        ))}
      </div>
    );
  }, [actionItems]);

  return (
    <div
      class={clsx(
        '-base-acc-sdk-dialog-instance',
        hidden && '-base-acc-sdk-dialog-instance-hidden'
      )}
    >
      <div class="-base-acc-sdk-dialog-instance-header">
        <div class="-base-acc-sdk-dialog-instance-header-icon-and-title">
          <BaseLogo fill="blue" />
          {shouldShowHeaderTitle && (
            <div class="-base-acc-sdk-dialog-instance-header-icon-and-title-title">
              {headerTitle}
            </div>
          )}
        </div>
        <button
          class="-base-acc-sdk-dialog-instance-header-close"
          onClick={handleClose}
          type="button"
          aria-label="Close dialog"
        >
          <img
            src={closeIcon}
            class="-base-acc-sdk-dialog-instance-header-close-icon"
            alt="Close"
          />
        </button>
      </div>

      <div class="-base-acc-sdk-dialog-instance-content">
        <div class="-base-acc-sdk-dialog-instance-content-title">{title}</div>
        <div class="-base-acc-sdk-dialog-instance-content-message">{message}</div>
      </div>

      {actionButtons}
    </div>
  );
};
