import * as injectFontModule from '@base-org/account-sdk/ui-assets';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mountSignInWithBaseButton,
  unmountSignInWithBaseButton,
} from './mountSignInWithBaseButton.js';

// Mock the ui-assets module with all required exports
vi.mock('@base-org/account-sdk/ui-assets', () => ({
  injectFontStyle: vi.fn(),
  WHITE: '#FFF',
  BLACK: '#000',
  LIGHT_MODE_BOARDER: '#1E2025',
  DARK_MODE_BOARDER: '#282B31',
  BUTTON_HOVER_LIGHT_SOLID: '#2A2A2A',
  BUTTON_HOVER_DARK_SOLID: '#F5F5F5',
  BUTTON_HOVER_LIGHT_TRANSPARENT: 'rgba(0, 0, 0, 0.02)',
  BUTTON_HOVER_DARK_TRANSPARENT: 'rgba(255, 255, 255, 0.05)',
  BUTTON_ACTIVE_LIGHT_SOLID: '#3A3A3A',
  BUTTON_ACTIVE_DARK_SOLID: '#EEEEEE',
  BUTTON_ACTIVE_LIGHT_TRANSPARENT: 'rgba(0, 0, 0, 0.04)',
  BUTTON_ACTIVE_DARK_TRANSPARENT: 'rgba(255, 255, 255, 0.08)',
  BUTTON_HOVER_BORDER_LIGHT: '#1A1A1A',
  BUTTON_HOVER_BORDER_DARK: '#FFFFFF',
  BUTTON_ACTIVE_BORDER_LIGHT: '#2A2A2A',
  BUTTON_ACTIVE_BORDER_DARK: '#FFFFFF',
  BaseLogo: ({ fill }: { fill: string }) => `<svg fill="${fill}">Mock Logo</svg>`,
}));

// Mock window.matchMedia for system color scheme tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('mountSignInWithBaseButton', () => {
  let container: HTMLElement;
  let mockInjectFontStyle: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    mockInjectFontStyle = vi.mocked(injectFontModule.injectFontStyle);
    mockInjectFontStyle.mockClear();
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('mounts the SignInWithBaseButton component', () => {
    const props = {
      align: 'center' as const,
      variant: 'solid' as const,
      colorScheme: 'light' as const,
      onClick: vi.fn(),
    };

    mountSignInWithBaseButton(container, props);

    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Sign in with Base');
  });

  it('injects font styles when mounting', () => {
    const props = {};

    mountSignInWithBaseButton(container, props);

    expect(mockInjectFontStyle).toHaveBeenCalledTimes(1);
  });

  it('passes props correctly to the component', () => {
    const onClick = vi.fn();
    const props = {
      align: 'left' as const,
      variant: 'transparent' as const,
      colorScheme: 'dark' as const,
      onClick,
    };

    mountSignInWithBaseButton(container, props);

    const button = container.querySelector('button');
    const buttonDiv = button?.querySelector('div');

    expect(buttonDiv).toHaveClass('-base-ui-sign-in-button-content-left');

    const buttonStyle = button?.getAttribute('style');
    expect(buttonStyle).toContain('--button-bg-color: transparent');
    expect(buttonStyle).toContain('--button-text-color: #FFF');
    expect(buttonStyle).toContain('--button-border: 1px solid #282B31');
  });

  it('handles click events on mounted component', () => {
    const onClick = vi.fn();
    const props = { onClick };

    mountSignInWithBaseButton(container, props);

    const button = container.querySelector('button');
    button?.click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('mounts with default props when none provided', () => {
    mountSignInWithBaseButton(container, {});

    const button = container.querySelector('button');
    const buttonDiv = button?.querySelector('div');

    expect(button).toBeInTheDocument();
    expect(buttonDiv).toHaveClass('-base-ui-sign-in-button-content');

    // Default is system theme, and our mock returns light mode
    const buttonStyle = button?.getAttribute('style');
    expect(buttonStyle).toContain('--button-bg-color: #000');
    expect(buttonStyle).toContain('--button-text-color: #FFF');
  });

  it('mounts with light mode styles', () => {
    const props = {
      colorScheme: 'light' as const,
    };

    mountSignInWithBaseButton(container, props);

    const button = container.querySelector('button');
    const buttonStyle = button?.getAttribute('style');
    expect(buttonStyle).toContain('--button-bg-color: #000');
    expect(buttonStyle).toContain('--button-text-color: #FFF');
  });

  it('mounts with dark mode styles', () => {
    const props = {
      colorScheme: 'dark' as const,
    };

    mountSignInWithBaseButton(container, props);

    const button = container.querySelector('button');
    const buttonStyle = button?.getAttribute('style');
    expect(buttonStyle).toContain('--button-bg-color: #FFF');
    expect(buttonStyle).toContain('--button-text-color: #000');
  });

  it('mounts with transparent variant', () => {
    const props = {
      variant: 'transparent' as const,
      colorScheme: 'light' as const,
    };

    mountSignInWithBaseButton(container, props);

    const button = container.querySelector('button');
    const buttonStyle = button?.getAttribute('style');

    expect(buttonStyle).toContain('--button-bg-color: transparent');
    expect(buttonStyle).toContain('--button-border: 1px solid #1E2025');
  });

  it('mounts with left alignment', () => {
    const props = {
      align: 'left' as const,
    };

    mountSignInWithBaseButton(container, props);

    const button = container.querySelector('button');
    const buttonDiv = button?.querySelector('div');

    expect(buttonDiv).toHaveClass('-base-ui-sign-in-button-content-left');
  });
});

describe('unmountSignInWithBaseButton', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('unmounts the component from container', () => {
    // First mount a component
    mountSignInWithBaseButton(container, {});
    expect(container.querySelector('button')).toBeInTheDocument();

    // Then unmount it
    unmountSignInWithBaseButton(container);
    expect(container.querySelector('button')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('does not throw when unmounting empty container', () => {
    expect(() => unmountSignInWithBaseButton(container)).not.toThrow();
  });

  it('clears all content from container', () => {
    // Mount component
    mountSignInWithBaseButton(container, {});
    expect(container.children.length).toBeGreaterThan(0);

    // Unmount
    unmountSignInWithBaseButton(container);
    expect(container.children.length).toBe(0);
  });
});
