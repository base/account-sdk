import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SignInWithBaseButtonProps } from '../../types.js';
import * as mountModule from '../preact/mountSignInWithBaseButton.js';
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
    const { container } = render(createElement(SignInWithBaseButton as any));
    const div = container.firstChild;

    expect(div).toBeInTheDocument();
    expect(div?.nodeName).toBe('DIV');
  });

  it('mounts Preact component on render', () => {
    render(createElement(SignInWithBaseButton as any));

    expect(mockMount).toHaveBeenCalledTimes(1);
    expect(mockMount).toHaveBeenCalledWith(expect.any(HTMLElement), {});
  });

  it('passes props to Preact component', () => {
    const props: SignInWithBaseButtonProps = {
      centered: false,
      transparent: true,
      darkMode: true,
      onClick: vi.fn(),
    };

    render(createElement(SignInWithBaseButton as any, props));

    expect(mockMount).toHaveBeenCalledWith(expect.any(HTMLElement), props);
  });

  it('re-mounts when props change', () => {
    const { rerender } = render(createElement(SignInWithBaseButton as any, { centered: true }));

    expect(mockMount).toHaveBeenCalledTimes(1);
    expect(mockMount).toHaveBeenLastCalledWith(expect.any(HTMLElement), { centered: true });

    // Change props
    rerender(createElement(SignInWithBaseButton as any, { centered: false }));

    // Should unmount old and mount new
    expect(mockUnmount).toHaveBeenCalledTimes(1);
    expect(mockMount).toHaveBeenCalledTimes(2);
    expect(mockMount).toHaveBeenLastCalledWith(expect.any(HTMLElement), { centered: false });
  });

  it('handles default props correctly', () => {
    render(createElement(SignInWithBaseButton as any));

    expect(mockMount).toHaveBeenCalledWith(expect.any(HTMLElement), {});
  });

  it('clones props to avoid extensibility issues', () => {
    const originalProps: SignInWithBaseButtonProps = {
      centered: true,
      transparent: false,
      darkMode: true,
      onClick: vi.fn(),
    };

    render(createElement(SignInWithBaseButton as any, originalProps));

    const passedProps = mockMount.mock.calls[0][1];

    // Should be a different object (cloned)
    expect(passedProps).not.toBe(originalProps);
    // But should have same values
    expect(passedProps).toEqual(originalProps);
  });

  it('handles undefined props gracefully', () => {
    render(createElement(SignInWithBaseButton as any, { onClick: undefined }));

    expect(mockMount).toHaveBeenCalledWith(expect.any(HTMLElement), { onClick: undefined });
  });

  it('preserves function references in props', () => {
    const onClick = vi.fn();
    render(createElement(SignInWithBaseButton as any, { onClick }));

    const passedProps = mockMount.mock.calls[0][1];
    expect(passedProps.onClick).toBe(onClick);
  });

  it('handles multiple prop updates correctly', () => {
    const { rerender } = render(createElement(SignInWithBaseButton as any, { centered: true }));

    // First render
    expect(mockMount).toHaveBeenCalledTimes(1);

    // Update props multiple times
    rerender(createElement(SignInWithBaseButton as any, { centered: false }));
    rerender(createElement(SignInWithBaseButton as any, { centered: false, darkMode: true }));
    rerender(createElement(SignInWithBaseButton as any, { transparent: true }));

    // Should have mounted 4 times total (initial + 3 updates)
    expect(mockMount).toHaveBeenCalledTimes(4);
    // Should have unmounted 3 times (before each update)
    expect(mockUnmount).toHaveBeenCalledTimes(3);
  });
});
