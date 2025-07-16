import {
  BLACK,
  BUTTON_DARK_SOLID,
  BUTTON_DARK_SOLID_ACTIVE,
  BUTTON_DARK_SOLID_ACTIVE_BORDER,
  BUTTON_DARK_SOLID_BORDER,
  BUTTON_DARK_SOLID_HOVER,
  BUTTON_DARK_SOLID_HOVER_BORDER,
  BUTTON_DARK_TRANSPARENT,
  BUTTON_DARK_TRANSPARENT_ACTIVE,
  BUTTON_DARK_TRANSPARENT_ACTIVE_BORDER,
  BUTTON_DARK_TRANSPARENT_BORDER,
  BUTTON_DARK_TRANSPARENT_HOVER,
  BUTTON_DARK_TRANSPARENT_HOVER_BORDER,
  BUTTON_LIGHT_SOLID,
  BUTTON_LIGHT_SOLID_ACTIVE,
  BUTTON_LIGHT_SOLID_ACTIVE_BORDER,
  BUTTON_LIGHT_SOLID_BORDER,
  BUTTON_LIGHT_SOLID_HOVER,
  BUTTON_LIGHT_SOLID_HOVER_BORDER,
  BUTTON_LIGHT_TRANSPARENT,
  BUTTON_LIGHT_TRANSPARENT_ACTIVE,
  BUTTON_LIGHT_TRANSPARENT_ACTIVE_BORDER,
  BUTTON_LIGHT_TRANSPARENT_BORDER,
  BUTTON_LIGHT_TRANSPARENT_HOVER,
  BUTTON_LIGHT_TRANSPARENT_HOVER_BORDER,
  BaseLogo,
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

  // Updated color logic for solid variant (inverted)
  const foregroundColor =
    variant === 'transparent' 
      ? (isDarkMode ? WHITE : BLACK) 
      : isDarkMode ? WHITE : BLACK; // Inverted: dark mode = white text, light mode = black text

  const backgroundColor = 
    variant === 'transparent' 
      ? isDarkMode ? BUTTON_DARK_TRANSPARENT : BUTTON_LIGHT_TRANSPARENT
      : isDarkMode ? BUTTON_DARK_SOLID : BUTTON_LIGHT_SOLID; // Inverted: dark mode = black bg, light mode = white bg

  const borderColor =
    variant === 'transparent'
      ? `1px solid ${isDarkMode ? BUTTON_DARK_TRANSPARENT_BORDER : BUTTON_LIGHT_TRANSPARENT_BORDER}`
      : `1px solid ${isDarkMode ? BUTTON_DARK_SOLID_BORDER : BUTTON_LIGHT_SOLID_BORDER}`;

  const logoFill =
    variant === 'transparent' 
      ? (isDarkMode ? 'white' : 'blue') 
      : isDarkMode ? 'white' : 'blue'; // Inverted: dark mode = white logo, light mode = blue logo

  // Hover states
  const hoverBackgroundColor =
    variant === 'transparent'
      ? isDarkMode ? BUTTON_DARK_TRANSPARENT_HOVER : BUTTON_LIGHT_TRANSPARENT_HOVER
      : isDarkMode ? BUTTON_DARK_SOLID_HOVER : BUTTON_LIGHT_SOLID_HOVER;

  const hoverForegroundColor = variant === 'transparent' ? foregroundColor : foregroundColor;

  const hoverBorderColor =
    variant === 'transparent'
      ? `1px solid ${isDarkMode ? BUTTON_DARK_TRANSPARENT_HOVER_BORDER : BUTTON_LIGHT_TRANSPARENT_HOVER_BORDER}`
      : `1px solid ${isDarkMode ? BUTTON_DARK_SOLID_HOVER_BORDER : BUTTON_LIGHT_SOLID_HOVER_BORDER}`;

  // Active states
  const activeBackgroundColor =
    variant === 'transparent'
      ? isDarkMode ? BUTTON_DARK_TRANSPARENT_ACTIVE : BUTTON_LIGHT_TRANSPARENT_ACTIVE
      : isDarkMode ? BUTTON_DARK_SOLID_ACTIVE : BUTTON_LIGHT_SOLID_ACTIVE;

  const activeForegroundColor = variant === 'transparent' ? foregroundColor : foregroundColor;

  const activeBorderColor =
    variant === 'transparent'
      ? `1px solid ${isDarkMode ? BUTTON_DARK_TRANSPARENT_ACTIVE_BORDER : BUTTON_LIGHT_TRANSPARENT_ACTIVE_BORDER}`
      : `1px solid ${isDarkMode ? BUTTON_DARK_SOLID_ACTIVE_BORDER : BUTTON_LIGHT_SOLID_ACTIVE_BORDER}`;

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
