// Copyright (c) 2018-2025 Coinbase, Inc. <https://www.coinbase.com/>

import { clsx } from 'clsx';
import { FunctionComponent, render } from 'preact';
// biome-ignore lint/correctness/noUnusedImports: preact
import { h } from 'preact';

import { getDisplayableUsername } from ':core/username/getDisplayableUsername.js';
import { store } from ':store/store.js';
import { BaseLogo } from ':ui/assets/BaseLogo.js';
import { closeIcon } from ':ui/assets/icons.js';
import { useEffect, useMemo, useState } from 'preact/hooks';
import css from './Dialogue-css.js';

// Helper function to detect phone portrait mode
function isPhonePortrait(): boolean {
  return window.innerWidth <= 600 && window.innerHeight > window.innerWidth;
}

// Handle bar component for mobile bottom sheet
const DialogueHandleBar: FunctionComponent = () => {
  const [showHandleBar, setShowHandleBar] = useState(false);

  useEffect(() => {
    // Only show handle bar on phone portrait mode
    const checkOrientation = () => {
      setShowHandleBar(isPhonePortrait());
    };

    // Initial check
    checkOrientation();

    // Listen for orientation/resize changes
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!showHandleBar) {
    return null;
  }

  return <div class="-cbwsdk-dialogue-handle-bar" />;
};

export type DialogueProps = {
  title: string;
  message: string;
  actionItems?: DialogueActionItem[];
  onClose?: () => void;
};

export type DialogueInstanceProps = Omit<DialogueProps, 'onClose'> & {
  handleClose: () => void;
};

export type DialogueActionItem = {
  text: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
};

export class Dialogue {
  private readonly items = new Map<number, DialogueProps>();

  private nextItemKey = 0;
  private root: Element | null = null;

  constructor() {}

  public attach(el: Element): void {
    this.root = document.createElement('div');

    this.root.className = '-cbwsdk-dialogue-root';
    el.appendChild(this.root);

    this.render();
  }

  public presentItem(itemProps: DialogueProps): void {
    const key = this.nextItemKey++;
    this.items.set(key, itemProps);
    this.render();
  }

  public clear(): void {
    this.items.clear();
    if (this.root) {
      render(null, this.root);
    }
  }

  private render(): void {
    if (this.root) {
      render(
        <div>
          <DialogueContainer>
            {Array.from(this.items.entries()).map(([key, itemProps]) => (
              <DialogueInstance
                {...itemProps}
                key={key}
                handleClose={() => {
                  this.clear();
                  itemProps.onClose?.();
                }}
              />
            ))}
          </DialogueContainer>
        </div>,
        this.root
      );
    }
  }
}

export const DialogueContainer: FunctionComponent = (props) => {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);

  // Touch event handlers for drag-to-dismiss (entire dialogue area)
  const handleTouchStart = (e: any) => {
    // Only enable drag on mobile portrait mode
    if (!isPhonePortrait()) return;

    const touch = e.touches[0];
    setStartY(touch.clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: any) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - startY;

    // Only allow dragging down (positive deltaY)
    if (deltaY > 0) {
      setDragY(deltaY);
      e.preventDefault(); // Prevent scrolling
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    // Dismiss if dragged down more than 100px
    if (dragY > 100) {
      // Find the dialogue instance and trigger its close handler
      const closeButton = document.querySelector(
        '.-cbwsdk-dialogue-instance-header-close'
      ) as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
    } else {
      // Animate back to original position
      setDragY(0);
    }
  };

  return (
    <div class={clsx('-cbwsdk-dialogue-container')}>
      <style>{css}</style>
      <div
        class="-cbwsdk-dialogue-backdrop"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          class="-cbwsdk-dialogue"
          style={{
            transform: `translateY(${dragY}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          <DialogueHandleBar />
          {props.children}
        </div>
      </div>
    </div>
  );
};

export const DialogueInstance: FunctionComponent<DialogueInstanceProps> = ({
  title,
  message,
  actionItems,
  handleClose,
}) => {
  const [hidden, setHidden] = useState(true);
  const [isLoadingUsername, setIsLoadingUsername] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHidden(false);
    }, 1);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const fetchEnsName = async () => {
      const address = store.account.get().accounts?.[0];

      if (address) {
        const username = await getDisplayableUsername(address);
        setUsername(username);
      }

      setIsLoadingUsername(false);
    };
    fetchEnsName();
  }, []);

  const headerTitle = useMemo(() => {
    return username ? `Signed in as ${username}` : 'Base Account';
  }, [username]);

  const shouldShowHeaderTitle = !isLoadingUsername;

  return (
    <div class={clsx('-cbwsdk-dialogue-instance', hidden && '-cbwsdk-dialogue-instance-hidden')}>
      <div class="-cbwsdk-dialogue-instance-header">
        <div class="-cbwsdk-dialogue-instance-header-icon-and-title">
          <BaseLogo fill="blue" />
          {shouldShowHeaderTitle && (
            <div class="-cbwsdk-dialogue-instance-header-icon-and-title-title">{headerTitle}</div>
          )}
        </div>
        <div class="-cbwsdk-dialogue-instance-header-close" onClick={handleClose}>
          <img src={closeIcon} class="-cbwsdk-dialogue-instance-header-close-icon" />
        </div>
      </div>
      <div class="-cbwsdk-dialogue-instance-content">
        <div class="-cbwsdk-dialogue-instance-content-title">{title}</div>
        <div class="-cbwsdk-dialogue-instance-content-message">{message}</div>
      </div>
      {actionItems && actionItems.length > 0 && (
        <div class="-cbwsdk-dialogue-instance-actions">
          {actionItems.map((action, i) => (
            <button
              class={clsx(
                '-cbwsdk-dialogue-instance-button',
                action.variant === 'primary' && '-cbwsdk-dialogue-instance-button-primary',
                action.variant === 'secondary' && '-cbwsdk-dialogue-instance-button-secondary'
              )}
              onClick={action.onClick}
              key={i}
            >
              {action.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
