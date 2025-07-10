import { FC, createElement, useEffect, useRef } from 'react';
import { BasePayButtonProps } from '../../types.js';
import { mountBasePayButton, unmountBasePayButton } from '../preact/mountBasePayButton.js';

export const BasePayButton: FC<BasePayButtonProps> = (props: BasePayButtonProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      // Clone props to avoid extensibility issues between React and Preact
      const clonedProps = { ...props };
      mountBasePayButton(ref.current, clonedProps);
    }

    return () => {
      if (ref.current) {
        unmountBasePayButton(ref.current);
      }
    };
  }, [props]);

  return createElement('div', {
    ref,
    style: {
      display: 'block',
      width: '100%',
    },
  });
};
