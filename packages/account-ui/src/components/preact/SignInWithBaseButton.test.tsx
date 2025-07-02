import { fireEvent } from '@testing-library/dom';
import { render } from '@testing-library/preact';
// biome-ignore lint/correctness/noUnusedImports: preact
import { h } from 'preact';
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

    expect(buttonDiv).toHaveStyle({
      justifyContent: 'center',
      gap: '8px',
    });
  });

  it('renders with left-aligned layout when align="left"', () => {
    const { container } = render(<SignInWithBaseButton align="left" />);
    const button = container.querySelector('button');
    const buttonDiv = button?.querySelector('div');

    expect(buttonDiv).toHaveStyle({
      justifyContent: 'flex-start',
      gap: '16px',
    });
  });

  it('applies transparent style when variant="transparent"', () => {
    const { container } = render(<SignInWithBaseButton variant="transparent" />);
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('background-color: transparent');
    expect(style).toContain('border: 1px solid #1e2025');
  });

  it('applies dark mode transparent style when variant="transparent" and colorScheme="dark"', () => {
    const { container } = render(<SignInWithBaseButton variant="transparent" colorScheme="dark" />);
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('background-color: transparent');
    expect(style).toContain('border: 1px solid #282b31');
  });

  it('applies dark mode styles when colorScheme="dark"', () => {
    const { container } = render(<SignInWithBaseButton colorScheme="dark" />);
    const button = container.querySelector('button');

    expect(button).toHaveStyle({
      backgroundColor: '#FFF',
      color: '#000',
    });
  });

  it('applies light mode styles when colorScheme="light"', () => {
    const { container } = render(<SignInWithBaseButton colorScheme="light" />);
    const button = container.querySelector('button');

    expect(button).toHaveStyle({
      backgroundColor: '#000',
      color: '#FFF',
    });
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

    expect(button).toHaveStyle({
      backgroundColor: '#FFF',
      color: '#000',
    });
  });

  it('has correct button dimensions and styling', () => {
    const { container } = render(<SignInWithBaseButton />);
    const button = container.querySelector('button');

    expect(button).toHaveStyle({
      width: '327px',
      height: '56px',
      padding: '16px 24px',
      borderRadius: '8px',
      fontSize: '17px',
      fontWeight: '400',
      fontFamily: 'BaseSans-Regular',
      cursor: 'pointer',
    });
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
    expect(svg).toHaveAttribute('height', '17');
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

    expect(style).toContain('background-color: transparent');
    expect(style).toContain('color: rgb(255, 255, 255)');
    expect(style).toContain('border: 1px solid #282b31');
  });

  it('combines transparent and light mode styles correctly', () => {
    const { container } = render(
      <SignInWithBaseButton variant="transparent" colorScheme="light" />
    );
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('background-color: transparent');
    expect(style).toContain('color: rgb(0, 0, 0)');
    expect(style).toContain('border: 1px solid #1e2025');
  });
});
