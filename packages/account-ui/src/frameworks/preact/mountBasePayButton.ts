import { injectFontStyle } from '@base-org/account-sdk/ui-assets';
import { render } from 'preact';
import { BasePayButtonProps } from '../../types.js';
import { BasePayButton } from './BasePayButton.js';

export function mountBasePayButton(container: HTMLElement, props: BasePayButtonProps) {
  injectFontStyle();

  const element = BasePayButton(props);
  render(element, container);
}

export function unmountBasePayButton(container: HTMLElement) {
  render(null, container);
}
