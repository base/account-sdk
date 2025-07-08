// Copyright (c) 2018-2025 Coinbase, Inc. <https://www.coinbase.com/>

import { clsx } from 'clsx';
import { FunctionComponent, render } from 'preact';
// biome-ignore lint/correctness/noUnusedImports: preact
import { h } from 'preact';

import { useEffect, useState } from 'preact/hooks';

import { BaseLogo } from ':ui/assets/BaseLogo.js';
import { closeIcon } from ':ui/assets/icons.js';
import css from './Dialogue-css.js';

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

export const DialogueContainer: FunctionComponent = (props) => (
  <div class={clsx('-cbwsdk-dialogue-container')}>
    <style>{css}</style>
    <div class="-cbwsdk-dialogue-backdrop">
      <div class="-cbwsdk-dialogue">{props.children}</div>
    </div>
  </div>
);

export const DialogueInstance: FunctionComponent<DialogueInstanceProps> = ({
  title,
  message,
  actionItems,
  handleClose,
}) => {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHidden(false);
    }, 1);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div class={clsx('-cbwsdk-dialogue-instance', hidden && '-cbwsdk-dialogue-instance-hidden')}>
      <div class="-cbwsdk-dialogue-instance-header">
        <div class="-cbwsdk-dialogue-instance-header-icon">
          <BaseLogo />
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
