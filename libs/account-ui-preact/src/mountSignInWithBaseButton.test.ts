import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as injectFontModule from './fonts/injectFontStyle.js';
import {
  mountSignInWithBaseButton,
  unmountSignInWithBaseButton,
} from './mountSignInWithBaseButton.js';

// Mock the font injection module
vi.mock('./fonts/injectFontStyle.js', () => ({
  injectFontStyle: vi.fn(),
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

    expect(buttonDiv).toHaveStyle({
      justifyContent: 'flex-start',
      gap: '16px',
    });

    const buttonStyle = button?.getAttribute('style');
    expect(buttonStyle).toContain('background-color: transparent');
    expect(buttonStyle).toContain('color: rgb(255, 255, 255)');
    expect(buttonStyle).toContain('border: 1px solid #282b31');
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
    expect(buttonDiv).toHaveStyle({
      justifyContent: 'center',
      gap: '8px',
    });
    // Default is system theme, and our mock returns light mode
    expect(button).toHaveStyle({
      backgroundColor: '#000',
      color: '#FFF',
    });
  });

  it('mounts with light mode styles', () => {
    const props = {
      colorScheme: 'light' as const,
    };

    mountSignInWithBaseButton(container, props);

    const button = container.querySelector('button');
    expect(button).toHaveStyle({
      backgroundColor: '#000',
      color: '#FFF',
    });
  });

  it('mounts with dark mode styles', () => {
    const props = {
      colorScheme: 'dark' as const,
    };

    mountSignInWithBaseButton(container, props);

    const button = container.querySelector('button');
    expect(button).toHaveStyle({
      backgroundColor: '#FFF',
      color: '#000',
    });
  });

  it('mounts with transparent variant', () => {
    const props = {
      variant: 'transparent' as const,
      colorScheme: 'light' as const,
    };

    mountSignInWithBaseButton(container, props);

    const button = container.querySelector('button');
    const buttonStyle = button?.getAttribute('style');

    expect(buttonStyle).toContain('background-color: transparent');
    expect(buttonStyle).toContain('border: 1px solid #1e2025');
  });

  it('mounts with left alignment', () => {
    const props = {
      align: 'left' as const,
    };

    mountSignInWithBaseButton(container, props);

    const button = container.querySelector('button');
    const buttonDiv = button?.querySelector('div');

    expect(buttonDiv).toHaveStyle({
      justifyContent: 'flex-start',
      gap: '16px',
    });
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
