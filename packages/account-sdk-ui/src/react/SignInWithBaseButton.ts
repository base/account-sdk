import { FC, createElement, useEffect, useRef } from 'react';
import {
  mountSignInWithBaseButton,
  unmountSignInWithBaseButton,
} from '../preact/mountSignInWithBaseButton.js';
import { SignInWithBaseButtonProps } from '../types.js';

export const SignInWithBaseButton: FC<SignInWithBaseButtonProps> = (
  props: SignInWithBaseButtonProps
) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      // Clone props to avoid extensibility issues between React and Preact
      const clonedProps = { ...props };
      mountSignInWithBaseButton(ref.current, clonedProps);
    }

    return () => {
      if (ref.current) {
        unmountSignInWithBaseButton(ref.current);
      }
    };
  }, [props]);

  return createElement('div', { ref });
};
