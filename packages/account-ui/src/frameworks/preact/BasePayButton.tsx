import {
  BRAND_BLUE,
  BUTTON_ACTIVE_DARK_SOLID,
  BUTTON_HOVER_DARK_SOLID,
  BasePayLogoColored,
  BasePayLogoWhite,
  WHITE,
} from '@base-org/account-sdk/ui-assets';
import { clsx } from 'clsx';
import { BasePayButtonProps } from '../../types.js';
import css from './BasePayButton-css.js';

export const BasePayButton = ({ colorScheme = 'system', onClick }: BasePayButtonProps) => {
  const isDarkMode =
    colorScheme === 'dark' ||
    (colorScheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const backgroundColor = isDarkMode ? WHITE : BRAND_BLUE;

  // Hover states
  const hoverBackgroundColor = isDarkMode ? BUTTON_HOVER_DARK_SOLID : '#3333FF';

  // Active states
  const activeBackgroundColor = isDarkMode ? BUTTON_ACTIVE_DARK_SOLID : '#1A1AFF';

  return (
    <div class="-base-ui-pay-css-reset">
      <style>{css}</style>
      <button
        class={clsx('-base-ui-pay-button', '-base-ui-pay-button-solid')}
        style={{
          '--button-bg-color': backgroundColor,
          '--button-bg-color-hover': hoverBackgroundColor,
          '--button-bg-color-active': activeBackgroundColor,
        }}
        onClick={onClick}
      >
        <div class={clsx('-base-ui-pay-button-content')}>
          {isDarkMode ? <BasePayLogoColored /> : <BasePayLogoWhite />}
        </div>
      </button>
    </div>
  );
};
