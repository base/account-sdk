import { injectFontStyle } from '@base-org/account-sdk/ui-assets';
import { render } from 'preact';
import { SignInWithBaseButtonProps } from '../../types.js';
import { SignInWithBaseButton } from './SignInWithBaseButton.js';

export function mountSignInWithBaseButton(
  container: HTMLElement,
  props: SignInWithBaseButtonProps
) {
  injectFontStyle();

  const element = SignInWithBaseButton(props);
  render(element, container);
}

export function unmountSignInWithBaseButton(container: HTMLElement) {
  render(null, container);
}
