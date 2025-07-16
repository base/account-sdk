import { fireEvent } from '@testing-library/dom';
import { render } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { BasePayButton } from './BasePayButton.js';

// Mock window.matchMedia for system color scheme tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('BasePayButton (Preact)', () => {
  it('renders with default props', () => {
    const { container } = render(<BasePayButton />);
    const button = container.querySelector('button');

    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('-base-ui-pay-button');
    expect(button).toHaveClass('-base-ui-pay-button-solid');
  });

  it('renders with system color scheme by default', () => {
    const { container } = render(<BasePayButton />);
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    // Default should be system theme (light mode in our mocked matchMedia)
    expect(style).toContain('--button-bg-color: #0000FF');
  });

  it('applies dark mode styles when colorScheme="dark"', () => {
    const { container } = render(<BasePayButton colorScheme="dark" />);
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('--button-bg-color: #FFF');
    expect(style).toContain('--button-bg-color-hover: #EEF0F3');
    expect(style).toContain('--button-bg-color-active: #CED2DB');
  });

  it('applies light mode styles when colorScheme="light"', () => {
    const { container } = render(<BasePayButton colorScheme="light" />);
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('--button-bg-color: #0000FF');
    expect(style).toContain('--button-bg-color-hover: #0A0AE6');
    expect(style).toContain('--button-bg-color-active: #0000D0');
  });

  it('detects system dark mode when colorScheme="system"', () => {
    // Mock dark mode preference
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(<BasePayButton colorScheme="system" />);
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('--button-bg-color: #FFF');
    expect(style).toContain('--button-bg-color-hover: #EEF0F3');
    expect(style).toContain('--button-bg-color-active: #CED2DB');
  });

  it('detects system light mode when colorScheme="system"', () => {
    // Mock light mode preference
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query !== '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(<BasePayButton colorScheme="system" />);
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('--button-bg-color: #0000FF');
    expect(style).toContain('--button-bg-color-hover: #0A0AE6');
    expect(style).toContain('--button-bg-color-active: #0000D0');
  });

  it('has correct button CSS classes', () => {
    const { container } = render(<BasePayButton />);
    const button = container.querySelector('button');

    expect(button).toHaveClass('-base-ui-pay-button');
    expect(button).toHaveClass('-base-ui-pay-button-solid');
  });

  it('calls onClick handler when clicked', () => {
    const onClick = vi.fn();
    const { container } = render(<BasePayButton onClick={onClick} />);
    const button = container.querySelector('button');

    fireEvent.click(button!);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when not provided', () => {
    const { container } = render(<BasePayButton />);
    const button = container.querySelector('button');

    // Should not throw when clicking without onClick handler
    expect(() => fireEvent.click(button!)).not.toThrow();
  });

  it('renders BasePayLogoColored in dark mode', () => {
    const { container } = render(<BasePayButton colorScheme="dark" />);
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '112');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('renders BasePayLogoWhite in light mode', () => {
    const { container } = render(<BasePayButton colorScheme="light" />);
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '112');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('renders with CSS reset wrapper', () => {
    const { container } = render(<BasePayButton />);
    const wrapper = container.querySelector('.-base-ui-pay-css-reset');

    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toContainHTML('<button');
  });

  it('includes CSS styles in the component', () => {
    const { container } = render(<BasePayButton />);
    const styleElement = container.querySelector('style');

    expect(styleElement).toBeInTheDocument();
    expect(styleElement?.textContent).toBeTruthy();
  });

  it('renders button content with correct class', () => {
    const { container } = render(<BasePayButton />);
    const buttonContent = container.querySelector('.-base-ui-pay-button-content');

    expect(buttonContent).toBeInTheDocument();
    expect(buttonContent).toContainHTML('<svg');
  });

  it('handles all color scheme options correctly', () => {
    const schemes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];

    schemes.forEach((colorScheme) => {
      const { container } = render(<BasePayButton colorScheme={colorScheme} />);
      const button = container.querySelector('button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('-base-ui-pay-button');
      expect(button).toHaveClass('-base-ui-pay-button-solid');
    });
  });

  it('preserves onClick function reference', () => {
    const onClick = vi.fn();
    const { container } = render(<BasePayButton onClick={onClick} />);
    const button = container.querySelector('button');

    // Click multiple times
    fireEvent.click(button!);
    fireEvent.click(button!);

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('applies hover styles correctly', () => {
    const { container } = render(<BasePayButton colorScheme="light" />);
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('--button-bg-color-hover: #0A0AE6');
  });

  it('applies active styles correctly', () => {
    const { container } = render(<BasePayButton colorScheme="light" />);
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('--button-bg-color-active: #0000D0');
  });

  it('uses correct logo for light mode', () => {
    const { container } = render(<BasePayButton colorScheme="light" />);
    const svg = container.querySelector('svg');

    // Should render BasePayLogoWhite for light mode
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '112');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('uses correct logo for dark mode', () => {
    const { container } = render(<BasePayButton colorScheme="dark" />);
    const svg = container.querySelector('svg');

    // Should render BasePayLogoColored for dark mode
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '112');
    expect(svg).toHaveAttribute('height', '24');
  });
});
