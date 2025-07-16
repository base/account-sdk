import {
  BASEPAY_DARK,
  BASEPAY_DARK_ACTIVE,
  BASEPAY_DARK_HOVER,
  BASEPAY_LIGHT,
  BASEPAY_LIGHT_ACTIVE,
  BASEPAY_LIGHT_HOVER,
  BasePayLogoColored,
  BasePayLogoWhite,
} from '@base-org/account-sdk/ui-assets';
import { clsx } from 'clsx';
import { BasePayButtonProps } from '../../types.js';
import css from './BasePayButton-css.js';

export const BasePayButton = ({ colorScheme = 'system', onClick }: BasePayButtonProps) => {
  const isDarkMode =
    colorScheme === 'dark' ||
    (colorScheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const backgroundColor = isDarkMode ? BASEPAY_DARK : BASEPAY_LIGHT;

  // Hover states
  const hoverBackgroundColor = isDarkMode ? BASEPAY_DARK_HOVER : BASEPAY_LIGHT_HOVER;

  // Active states
  const activeBackgroundColor = isDarkMode ? BASEPAY_DARK_ACTIVE : BASEPAY_LIGHT_ACTIVE;

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
