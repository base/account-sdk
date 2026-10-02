import { cleanup, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountBasePayButton, unmountBasePayButton } from '../preact/mountBasePayButton.js';
import {
  mountSignInWithBaseButton,
  unmountSignInWithBaseButton,
} from '../preact/mountSignInWithBaseButton.js';
import BasePayButton from './BasePayButton.svelte';
import SignInWithBaseButton from './SignInWithBaseButton.svelte';

vi.mock('../preact/mountBasePayButton.js', () => ({
  mountBasePayButton: vi.fn(),
  unmountBasePayButton: vi.fn(),
}));

vi.mock('../preact/mountSignInWithBaseButton.js', () => ({
  mountSignInWithBaseButton: vi.fn(),
  unmountSignInWithBaseButton: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Svelte button callback updates', () => {
  it('passes a replacement onClick to BasePayButton without changing visual props', async () => {
    const firstClick = vi.fn();
    const nextClick = vi.fn();
    const { rerender } = render(BasePayButton, { colorScheme: 'light', onClick: firstClick });
    await tick();

    expect(mountBasePayButton).toHaveBeenCalledTimes(1);
    await rerender({ colorScheme: 'light', onClick: nextClick });

    expect(unmountBasePayButton).toHaveBeenCalledTimes(1);
    expect(mountBasePayButton).toHaveBeenCalledTimes(2);
    expect(mountBasePayButton).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ onClick: nextClick })
    );
  });

  it('does not remount BasePayButton when props are unchanged', async () => {
    const onClick = vi.fn();
    const { rerender } = render(BasePayButton, { colorScheme: 'light', onClick });
    await tick();

    await rerender({ colorScheme: 'light', onClick });

    expect(mountBasePayButton).toHaveBeenCalledTimes(1);
    expect(unmountBasePayButton).not.toHaveBeenCalled();
  });

  it('still remounts BasePayButton when a visual prop changes', async () => {
    const onClick = vi.fn();
    const { rerender } = render(BasePayButton, { colorScheme: 'light', onClick });
    await tick();

    await rerender({ colorScheme: 'dark', onClick });

    expect(unmountBasePayButton).toHaveBeenCalledTimes(1);
    expect(mountBasePayButton).toHaveBeenCalledTimes(2);
  });

  it('passes a replacement onClick to SignInWithBaseButton without changing visual props', async () => {
    const firstClick = vi.fn();
    const nextClick = vi.fn();
    const { rerender } = render(SignInWithBaseButton, { onClick: firstClick });
    await tick();

    expect(mountSignInWithBaseButton).toHaveBeenCalledTimes(1);
    await rerender({ onClick: nextClick });

    expect(unmountSignInWithBaseButton).toHaveBeenCalledTimes(1);
    expect(mountSignInWithBaseButton).toHaveBeenCalledTimes(2);
    expect(mountSignInWithBaseButton).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ onClick: nextClick })
    );
  });

  it('remounts SignInWithBaseButton when its callback is removed', async () => {
    const onClick = vi.fn();
    const { rerender } = render(SignInWithBaseButton, { onClick });
    await tick();

    await rerender({ onClick: undefined });

    expect(unmountSignInWithBaseButton).toHaveBeenCalledTimes(1);
    expect(mountSignInWithBaseButton).toHaveBeenCalledTimes(2);
    expect(mountSignInWithBaseButton).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ onClick: undefined })
    );
  });

  it('still remounts SignInWithBaseButton when a visual prop changes', async () => {
    const onClick = vi.fn();
    const { rerender } = render(SignInWithBaseButton, { variant: 'solid', onClick });
    await tick();

    await rerender({ variant: 'transparent', onClick });

    expect(unmountSignInWithBaseButton).toHaveBeenCalledTimes(1);
    expect(mountSignInWithBaseButton).toHaveBeenCalledTimes(2);
  });
});
