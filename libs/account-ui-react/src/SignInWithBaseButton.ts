import {
  SignInWithBaseButtonProps,
  mountSignInWithBaseButton,
  unmountSignInWithBaseButton,
} from '@base/account-ui-preact';
import { FC, createElement, useEffect, useRef } from 'react';

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
