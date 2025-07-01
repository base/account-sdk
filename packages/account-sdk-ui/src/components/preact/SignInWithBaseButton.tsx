// biome-ignore lint/correctness/noUnusedImports: preact
import { h } from 'preact';
import { BaseLogo } from '../../assets/BaseLogo.js';
import { BLACK, DARK_MODE_BOARDER, LIGHT_MODE_BOARDER, WHITE } from '../../assets/colors.js';
import { SignInWithBaseButtonProps } from '../../types.js';

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

  return (
    <button
      style={{
        width: '327px',
        height: '56px',
        padding: '16px 24px',
        borderRadius: '8px',
        fontSize: '17px',
        fontWeight: '400',
        fontFamily: 'BaseSans-Regular',
        cursor: 'pointer',
        backgroundColor,
        color: foregroundColor,
        border: borderColor,
      }}
      onClick={onClick}
    >
      <div
        style={{
          display: 'flex',
          gap: align === 'center' ? '8px' : '16px',
          alignItems: 'center',
          justifyContent: align === 'center' ? 'center' : 'flex-start',
        }}
      >
        <BaseLogo fill={logoFill} />
        Sign in with Base
      </div>
    </button>
  );
};
