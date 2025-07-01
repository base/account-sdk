import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as injectFontModule from '../../fonts/injectFontStyle.js';
import {
  mountSignInWithBaseButton,
  unmountSignInWithBaseButton,
} from './mountSignInWithBaseButton.js';

// Mock the font injection module
vi.mock('../../fonts/injectFontStyle.js', () => ({
  injectFontStyle: vi.fn(),
}));

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
      centered: true,
      transparent: false,
      darkMode: false,
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
      centered: false,
      transparent: true,
      darkMode: true,
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
    expect(button).toHaveStyle({
      backgroundColor: '#FFF',
      color: '#000',
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
