import { render } from 'preact';
import { injectFontStyle } from '../../fonts/injectFontStyle.js';
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
