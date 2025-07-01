// biome-ignore lint/correctness/noUnusedImports: preact
import { h } from 'preact';
import { TheSquare } from '../../assets/base-logo.js';
import { BLACK, DARK_MODE_BOARDER, LIGHT_MODE_BOARDER, WHITE } from '../../assets/colors.js';
import { SignInWithBaseButtonProps } from '../../types.js';

export const SignInWithBaseButton = ({
  centered = true,
  transparent = false,
  darkMode = false,
  onClick,
}: SignInWithBaseButtonProps) => {
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
        backgroundColor: transparent ? 'transparent' : darkMode ? BLACK : WHITE,
        color: darkMode ? WHITE : BLACK,
        border: transparent
          ? `1px solid ${darkMode ? DARK_MODE_BOARDER : LIGHT_MODE_BOARDER}`
          : 'none',
      }}
      onClick={onClick}
    >
      <div
        style={{
          display: 'flex',
          gap: centered ? '8px' : '16px',
          alignItems: 'center',
          justifyContent: centered ? 'center' : 'flex-start',
        }}
      >
        <TheSquare darkMode={darkMode} />
        Sign in with Base
      </div>
    </button>
  );
};
