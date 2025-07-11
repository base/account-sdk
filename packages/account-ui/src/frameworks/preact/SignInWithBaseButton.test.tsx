import { fireEvent } from '@testing-library/dom';
import { render } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { SignInWithBaseButton } from './SignInWithBaseButton.js';

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

describe('SignInWithBaseButton (Preact)', () => {
  it('renders with default props', () => {
    const { container } = render(<SignInWithBaseButton />);
    const button = container.querySelector('button');

    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Sign in with Base');
  });

  it('renders with centered layout by default', () => {
    const { container } = render(<SignInWithBaseButton />);
    const button = container.querySelector('button');
    const buttonDiv = button?.querySelector('div');

    expect(buttonDiv).toHaveClass('-base-ui-sign-in-button-content');
    expect(buttonDiv).not.toHaveClass('-base-ui-sign-in-button-content-left');
  });

  it('renders with left-aligned layout when align="left"', () => {
    const { container } = render(<SignInWithBaseButton align="left" />);
    const button = container.querySelector('button');
    const buttonDiv = button?.querySelector('div');

    expect(buttonDiv).toHaveClass('-base-ui-sign-in-button-content-left');
  });

  it('applies transparent style when variant="transparent"', () => {
    const { container } = render(<SignInWithBaseButton variant="transparent" />);
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('--button-bg-color: transparent');
    expect(style).toContain('--button-border: 1px solid #1E2025');
  });

  it('applies dark mode transparent style when variant="transparent" and colorScheme="dark"', () => {
    const { container } = render(<SignInWithBaseButton variant="transparent" colorScheme="dark" />);
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('--button-bg-color: transparent');
    expect(style).toContain('--button-border: 1px solid #282B31');
  });

  it('applies dark mode styles when colorScheme="dark"', () => {
    const { container } = render(<SignInWithBaseButton colorScheme="dark" />);
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('--button-bg-color: #FFF');
    expect(style).toContain('--button-text-color: #000');
  });

  it('applies light mode styles when colorScheme="light"', () => {
    const { container } = render(<SignInWithBaseButton colorScheme="light" />);
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('--button-bg-color: #000');
    expect(style).toContain('--button-text-color: #FFF');
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

    const { container } = render(<SignInWithBaseButton colorScheme="system" />);
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('--button-bg-color: #FFF');
    expect(style).toContain('--button-text-color: #000');
  });

  it('has correct button CSS classes', () => {
    const { container } = render(<SignInWithBaseButton />);
    const button = container.querySelector('button');

    expect(button).toHaveClass('-base-ui-sign-in-button');
    expect(button).toHaveClass('-base-ui-sign-in-button-solid');
    expect(button).not.toHaveClass('-base-ui-sign-in-button-transparent');
  });

  it('calls onClick handler when clicked', () => {
    const onClick = vi.fn();
    const { container } = render(<SignInWithBaseButton onClick={onClick} />);
    const button = container.querySelector('button');

    fireEvent.click(button!);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders BaseLogo component with correct dimensions', () => {
    const { container } = render(<SignInWithBaseButton colorScheme="dark" />);
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
  });

  it('renders BaseLogo with blue fill in dark mode solid variant', () => {
    const { container } = render(<SignInWithBaseButton colorScheme="dark" />);
    const path = container.querySelector('path');

    expect(path).toHaveAttribute('fill', '#0000FF');
  });

  it('renders BaseLogo with white fill in light mode solid variant', () => {
    const { container } = render(<SignInWithBaseButton colorScheme="light" />);
    const path = container.querySelector('path');

    expect(path).toHaveAttribute('fill', '#FFF');
  });

  it('renders BaseLogo with blue fill in transparent light mode', () => {
    const { container } = render(
      <SignInWithBaseButton variant="transparent" colorScheme="light" />
    );
    const path = container.querySelector('path');

    expect(path).toHaveAttribute('fill', '#0000FF');
  });

  it('renders BaseLogo with white fill in transparent dark mode', () => {
    const { container } = render(<SignInWithBaseButton variant="transparent" colorScheme="dark" />);
    const path = container.querySelector('path');

    expect(path).toHaveAttribute('fill', '#FFF');
  });

  it('does not call onClick when not provided', () => {
    const { container } = render(<SignInWithBaseButton />);
    const button = container.querySelector('button');

    // Should not throw when clicking without onClick handler
    expect(() => fireEvent.click(button!)).not.toThrow();
  });

  it('combines transparent and dark mode styles correctly', () => {
    const { container } = render(<SignInWithBaseButton variant="transparent" colorScheme="dark" />);
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('--button-bg-color: transparent');
    expect(style).toContain('--button-text-color: #FFF');
    expect(style).toContain('--button-border: 1px solid #282B31');
  });

  it('combines transparent and light mode styles correctly', () => {
    const { container } = render(
      <SignInWithBaseButton variant="transparent" colorScheme="light" />
    );
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('--button-bg-color: transparent');
    expect(style).toContain('--button-text-color: #000');
    expect(style).toContain('--button-border: 1px solid #1E2025');
  });
});
