import type { SignInWithBaseButtonProps } from '@base/account-ui-preact';
import * as mountModule from '@base/account-ui-preact';
import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignInWithBaseButton } from './SignInWithBaseButton.js';

// Mock the mount/unmount functions
vi.mock('../preact/mountSignInWithBaseButton.js', () => ({
  mountSignInWithBaseButton: vi.fn(),
  unmountSignInWithBaseButton: vi.fn(),
}));

describe('SignInWithBaseButton (React)', () => {
  let mockMount: ReturnType<typeof vi.fn>;
  let mockUnmount: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockMount = vi.mocked(mountModule.mountSignInWithBaseButton);
    mockUnmount = vi.mocked(mountModule.unmountSignInWithBaseButton);
    mockMount.mockClear();
    mockUnmount.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders a div container', () => {
    const { container } = render(createElement(SignInWithBaseButton) as React.ReactNode);
    const div = container.firstChild;

    expect(div).toBeInTheDocument();
    expect(div?.nodeName).toBe('DIV');
  });

  it('mounts Preact component on render', () => {
    render(createElement(SignInWithBaseButton) as React.ReactNode);

    expect(mockMount).toHaveBeenCalledTimes(1);
    expect(mockMount).toHaveBeenCalledWith(expect.any(HTMLElement), {});
  });

  it('passes props to Preact component', () => {
    const props: SignInWithBaseButtonProps = {
      align: 'center',
      variant: 'transparent',
      colorScheme: 'dark',
      onClick: vi.fn(),
    };

    render(createElement(SignInWithBaseButton, props) as React.ReactNode);

    expect(mockMount).toHaveBeenCalledWith(expect.any(HTMLElement), props);
  });

  it('unmounts Preact component on cleanup', () => {
    const { unmount, container } = render(createElement(SignInWithBaseButton) as React.ReactNode);

    // Component should be mounted
    expect(mockMount).toHaveBeenCalledTimes(1);

    // The React component should render a div container
    const div = container.firstChild;
    expect(div).toBeInTheDocument();
    expect(div?.nodeName).toBe('DIV');

    // Unmount the React component
    unmount();

    // After unmounting, the container should be empty
    expect(container.firstChild).toBeNull();
  });

  it('re-mounts when props change', () => {
    const { rerender } = render(
      createElement(SignInWithBaseButton, { align: 'center' }) as React.ReactNode
    );

    expect(mockMount).toHaveBeenCalledTimes(1);
    expect(mockMount).toHaveBeenLastCalledWith(expect.any(HTMLElement), { align: 'center' });

    // Change props
    rerender(createElement(SignInWithBaseButton, { align: 'left' }) as React.ReactNode);

    // Should unmount old and mount new
    expect(mockUnmount).toHaveBeenCalledTimes(1);
    expect(mockMount).toHaveBeenCalledTimes(2);
    expect(mockMount).toHaveBeenLastCalledWith(expect.any(HTMLElement), { align: 'left' });
  });

  it('handles default props correctly', () => {
    render(createElement(SignInWithBaseButton) as React.ReactNode);

    expect(mockMount).toHaveBeenCalledWith(expect.any(HTMLElement), {});
  });

  it('clones props to avoid extensibility issues', () => {
    const originalProps: SignInWithBaseButtonProps = {
      align: 'center',
      variant: 'solid',
      colorScheme: 'dark',
      onClick: vi.fn(),
    };

    render(createElement(SignInWithBaseButton, originalProps) as React.ReactNode);

    const passedProps = mockMount.mock.calls[0][1];

    // Should be a different object (cloned)
    expect(passedProps).not.toBe(originalProps);
    // But should have same values
    expect(passedProps).toEqual(originalProps);
  });

  it('handles undefined props gracefully', () => {
    render(createElement(SignInWithBaseButton, { onClick: undefined }) as React.ReactNode);

    expect(mockMount).toHaveBeenCalledWith(expect.any(HTMLElement), { onClick: undefined });
  });

  it('preserves function references in props', () => {
    const onClick = vi.fn();
    render(createElement(SignInWithBaseButton, { onClick }) as React.ReactNode);

    const passedProps = mockMount.mock.calls[0][1];
    expect(passedProps.onClick).toBe(onClick);
  });

  it('handles multiple prop updates correctly', () => {
    const { rerender } = render(
      createElement(SignInWithBaseButton, { align: 'center' }) as React.ReactNode
    );

    // First render
    expect(mockMount).toHaveBeenCalledTimes(1);

    // Update props multiple times
    rerender(createElement(SignInWithBaseButton, { align: 'left' }) as React.ReactNode);
    rerender(
      createElement(SignInWithBaseButton, { align: 'left', colorScheme: 'dark' }) as React.ReactNode
    );
    rerender(createElement(SignInWithBaseButton, { variant: 'transparent' }) as React.ReactNode);

    // Should have mounted 4 times total (initial + 3 updates)
    expect(mockMount).toHaveBeenCalledTimes(4);
    // Should have unmounted 3 times (before each update)
    expect(mockUnmount).toHaveBeenCalledTimes(3);
  });
});
