import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BasePayButtonProps } from '../../types.js';
import * as mountModule from '../preact/mountBasePayButton.js';
import { BasePayButton } from './BasePayButton.js';

// Mock the mount/unmount functions
vi.mock('../preact/mountBasePayButton.js', () => ({
  mountBasePayButton: vi.fn(),
  unmountBasePayButton: vi.fn(),
}));

describe('BasePayButton (React)', () => {
  let mockMount: ReturnType<typeof vi.fn>;
  let mockUnmount: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockMount = vi.mocked(mountModule.mountBasePayButton);
    mockUnmount = vi.mocked(mountModule.unmountBasePayButton);
    mockMount.mockClear();
    mockUnmount.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders a div container with correct styles', () => {
    const { container } = render(createElement(BasePayButton) as React.ReactNode);
    const div = container.firstChild as HTMLElement;

    expect(div).toBeInTheDocument();
    expect(div.nodeName).toBe('DIV');
    expect(div.style.display).toBe('block');
    expect(div.style.width).toBe('100%');
  });

  it('mounts Preact component on render', () => {
    render(createElement(BasePayButton) as React.ReactNode);

    expect(mockMount).toHaveBeenCalledTimes(1);
    expect(mockMount).toHaveBeenCalledWith(expect.any(HTMLElement), {});
  });

  it('passes props to Preact component', () => {
    const props: BasePayButtonProps = {
      colorScheme: 'dark',
      onClick: vi.fn(),
    };

    render(createElement(BasePayButton, props) as React.ReactNode);

    expect(mockMount).toHaveBeenCalledWith(expect.any(HTMLElement), props);
  });

  it('unmounts Preact component on cleanup', () => {
    const { unmount, container } = render(createElement(BasePayButton) as React.ReactNode);

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
      createElement(BasePayButton, { colorScheme: 'light' }) as React.ReactNode
    );

    expect(mockMount).toHaveBeenCalledTimes(1);
    expect(mockMount).toHaveBeenLastCalledWith(expect.any(HTMLElement), { colorScheme: 'light' });

    // Change props
    rerender(createElement(BasePayButton, { colorScheme: 'dark' }) as React.ReactNode);

    // Should unmount old and mount new
    expect(mockUnmount).toHaveBeenCalledTimes(1);
    expect(mockMount).toHaveBeenCalledTimes(2);
    expect(mockMount).toHaveBeenLastCalledWith(expect.any(HTMLElement), { colorScheme: 'dark' });
  });

  it('handles default props correctly', () => {
    render(createElement(BasePayButton) as React.ReactNode);

    expect(mockMount).toHaveBeenCalledWith(expect.any(HTMLElement), {});
  });

  it('clones props to avoid extensibility issues', () => {
    const originalProps: BasePayButtonProps = {
      colorScheme: 'dark',
      onClick: vi.fn(),
    };

    render(createElement(BasePayButton, originalProps) as React.ReactNode);

    const passedProps = mockMount.mock.calls[0][1];

    // Should be a different object (cloned)
    expect(passedProps).not.toBe(originalProps);
    // But should have same values
    expect(passedProps).toEqual(originalProps);
  });

  it('handles undefined props gracefully', () => {
    render(createElement(BasePayButton, { onClick: undefined }) as React.ReactNode);

    expect(mockMount).toHaveBeenCalledWith(expect.any(HTMLElement), { onClick: undefined });
  });

  it('preserves function references in props', () => {
    const onClick = vi.fn();
    render(createElement(BasePayButton, { onClick }) as React.ReactNode);

    const passedProps = mockMount.mock.calls[0][1];
    expect(passedProps.onClick).toBe(onClick);
  });

  it('handles multiple prop updates correctly', () => {
    const { rerender } = render(
      createElement(BasePayButton, { colorScheme: 'light' }) as React.ReactNode
    );

    // First render
    expect(mockMount).toHaveBeenCalledTimes(1);

    // Update props multiple times
    rerender(createElement(BasePayButton, { colorScheme: 'dark' }) as React.ReactNode);
    rerender(createElement(BasePayButton, { colorScheme: 'system' }) as React.ReactNode);
    rerender(createElement(BasePayButton, { onClick: vi.fn() }) as React.ReactNode);

    // Should have mounted 4 times total (initial + 3 updates)
    expect(mockMount).toHaveBeenCalledTimes(4);
    // Should have unmounted 3 times (before each update)
    expect(mockUnmount).toHaveBeenCalledTimes(3);
  });

  it('handles all color scheme options', () => {
    const schemes: Array<BasePayButtonProps['colorScheme']> = ['light', 'dark', 'system'];

    schemes.forEach((colorScheme) => {
      const { unmount } = render(createElement(BasePayButton, { colorScheme }) as React.ReactNode);

      expect(mockMount).toHaveBeenLastCalledWith(expect.any(HTMLElement), { colorScheme });
      unmount();
    });
  });
});
