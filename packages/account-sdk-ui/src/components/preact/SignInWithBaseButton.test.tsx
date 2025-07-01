import { fireEvent } from '@testing-library/dom';
import { render } from '@testing-library/preact';
// biome-ignore lint/correctness/noUnusedImports: preact
import { h } from 'preact';
import { describe, expect, it, vi } from 'vitest';
import { SignInWithBaseButton } from './SignInWithBaseButton.js';

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

  it('renders with non-centered layout when centered=false', () => {
    const { container } = render(<SignInWithBaseButton centered={false} />);
    const button = container.querySelector('button');
    const buttonDiv = button?.querySelector('div');

    expect(buttonDiv).toHaveStyle({
      justifyContent: 'flex-start',
      gap: '16px',
    });
  });

  it('applies transparent style when transparent=true', () => {
    const { container } = render(<SignInWithBaseButton transparent={true} />);
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('background-color: transparent');
    expect(style).toContain('border: 1px solid #1e2025');
  });

  it('applies dark mode transparent style when transparent=true and darkMode=true', () => {
    const { container } = render(<SignInWithBaseButton transparent={true} darkMode={true} />);
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('background-color: transparent');
    expect(style).toContain('border: 1px solid #282b31');
  });

  it('applies dark mode styles when darkMode=true', () => {
    const { container } = render(<SignInWithBaseButton darkMode={true} />);
    const button = container.querySelector('button');

    expect(button).toHaveStyle({
      backgroundColor: '#000',
      color: '#FFF',
    });
  });

  it('applies light mode styles by default', () => {
    const { container } = render(<SignInWithBaseButton />);
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

  it('renders TheSquare component with correct props', () => {
    const { container } = render(<SignInWithBaseButton darkMode={true} />);
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '17');
  });

  it('renders TheSquare with dark mode styling', () => {
    const { container } = render(<SignInWithBaseButton darkMode={true} />);
    const path = container.querySelector('path');

    expect(path).toHaveAttribute('fill', 'white');
  });

  it('renders TheSquare with light mode styling', () => {
    const { container } = render(<SignInWithBaseButton darkMode={false} />);
    const path = container.querySelector('path');

    expect(path).toHaveAttribute('fill', '#0000FF');
  });

  it('does not call onClick when not provided', () => {
    const { container } = render(<SignInWithBaseButton />);
    const button = container.querySelector('button');

    // Should not throw when clicking without onClick handler
    expect(() => fireEvent.click(button!)).not.toThrow();
  });

  it('combines transparent and dark mode styles correctly', () => {
    const { container } = render(<SignInWithBaseButton transparent={true} darkMode={true} />);
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('background-color: transparent');
    expect(style).toContain('color: rgb(255, 255, 255)');
    expect(style).toContain('border: 1px solid #282b31');
  });

  it('combines transparent and light mode styles correctly', () => {
    const { container } = render(<SignInWithBaseButton transparent={true} darkMode={false} />);
    const button = container.querySelector('button');
    const style = button?.getAttribute('style');

    expect(style).toContain('background-color: transparent');
    expect(style).toContain('color: rgb(0, 0, 0)');
    expect(style).toContain('border: 1px solid #1e2025');
  });
});
