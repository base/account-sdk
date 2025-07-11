import {
  BLACK,
  BUTTON_ACTIVE_BORDER_DARK,
  BUTTON_ACTIVE_BORDER_LIGHT,
  BUTTON_ACTIVE_DARK_SOLID,
  BUTTON_ACTIVE_DARK_TRANSPARENT,
  BUTTON_ACTIVE_LIGHT_SOLID,
  BUTTON_ACTIVE_LIGHT_TRANSPARENT,
  BUTTON_HOVER_BORDER_DARK,
  BUTTON_HOVER_BORDER_LIGHT,
  BUTTON_HOVER_DARK_SOLID,
  BUTTON_HOVER_DARK_TRANSPARENT,
  BUTTON_HOVER_LIGHT_SOLID,
  BUTTON_HOVER_LIGHT_TRANSPARENT,
  BaseLogo,
  DARK_MODE_BOARDER,
  LIGHT_MODE_BOARDER,
  WHITE,
} from '@base-org/account-sdk/ui-assets';
import { SignInWithBaseButtonProps } from '../../types.js';
import css from './SignInWithBaseButton-css.js';

// Simple clsx implementation for conditional classes
const clsx = (...classes: (string | undefined | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const SignInWithBaseButton = ({
  align = 'center',
  variant = 'solid',
  colorScheme = 'system',
  onClick,
}: SignInWithBaseButtonProps) => {
  const isDarkMode =
    colorScheme === 'dark' ||
    (colorScheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const foregroundColor =
    variant === 'transparent' ? (isDarkMode ? WHITE : BLACK) : isDarkMode ? BLACK : WHITE;

  const backgroundColor = variant === 'transparent' ? 'transparent' : isDarkMode ? WHITE : BLACK;

  const borderColor =
    variant === 'transparent'
      ? `1px solid ${isDarkMode ? DARK_MODE_BOARDER : LIGHT_MODE_BOARDER}`
      : 'none';

  const logoFill =
    variant === 'transparent' ? (isDarkMode ? 'white' : 'blue') : isDarkMode ? 'blue' : 'white';

  // Hover states
  const hoverBackgroundColor =
    variant === 'transparent'
      ? isDarkMode
        ? BUTTON_HOVER_DARK_TRANSPARENT
        : BUTTON_HOVER_LIGHT_TRANSPARENT
      : isDarkMode
        ? BUTTON_HOVER_DARK_SOLID
        : BUTTON_HOVER_LIGHT_SOLID;

  const hoverForegroundColor = variant === 'transparent' ? foregroundColor : foregroundColor;

  const hoverBorderColor =
    variant === 'transparent'
      ? isDarkMode
        ? BUTTON_HOVER_BORDER_DARK
        : BUTTON_HOVER_BORDER_LIGHT
      : 'none';

  // Active states
  const activeBackgroundColor =
    variant === 'transparent'
      ? isDarkMode
        ? BUTTON_ACTIVE_DARK_TRANSPARENT
        : BUTTON_ACTIVE_LIGHT_TRANSPARENT
      : isDarkMode
        ? BUTTON_ACTIVE_DARK_SOLID
        : BUTTON_ACTIVE_LIGHT_SOLID;

  const activeForegroundColor = variant === 'transparent' ? foregroundColor : foregroundColor;

  const activeBorderColor =
    variant === 'transparent'
      ? isDarkMode
        ? BUTTON_ACTIVE_BORDER_DARK
        : BUTTON_ACTIVE_BORDER_LIGHT
      : 'none';

  return (
    <div class="-base-ui-sign-in-css-reset">
      <style>{css}</style>
      <button
        class={clsx(
          '-base-ui-sign-in-button',
          variant === 'transparent' && '-base-ui-sign-in-button-transparent',
          variant === 'solid' && '-base-ui-sign-in-button-solid'
        )}
        style={{
          '--button-bg-color': backgroundColor,
          '--button-text-color': foregroundColor,
          '--button-border': borderColor,
          '--button-bg-color-hover': hoverBackgroundColor,
          '--button-text-color-hover': hoverForegroundColor,
          '--button-border-color-hover': hoverBorderColor,
          '--button-bg-color-active': activeBackgroundColor,
          '--button-text-color-active': activeForegroundColor,
          '--button-border-color-active': activeBorderColor,
        }}
        onClick={onClick}
      >
        <div
          class={clsx(
            '-base-ui-sign-in-button-content',
            align === 'left' && '-base-ui-sign-in-button-content-left'
          )}
        >
          <BaseLogo fill={logoFill} />
          Sign in with Base
        </div>
      </button>
    </div>
  );
};
