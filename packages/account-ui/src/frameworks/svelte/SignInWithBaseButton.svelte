<script>
import { afterUpdate, onDestroy, onMount } from 'svelte';
import {
  mountSignInWithBaseButton,
  unmountSignInWithBaseButton,
} from '../preact/mountSignInWithBaseButton.js';

// Props with defaults
export let align = 'center';
export let variant = 'solid';
export let colorScheme = 'system';
export let onClick = undefined;

let mountPoint;
let previousProps = {};

const mountWidget = () => {
  if (mountPoint) {
    // Clone props to avoid extensibility issues
    const clonedProps = { align, variant, colorScheme, onClick };
    mountSignInWithBaseButton(mountPoint, clonedProps);
    previousProps = { ...clonedProps };
  }
};

const unmountWidget = () => {
  if (mountPoint) {
    unmountSignInWithBaseButton(mountPoint);
  }
};

const hasPropsChanged = () => {
  return (
    align !== previousProps.align ||
    variant !== previousProps.variant ||
    colorScheme !== previousProps.colorScheme ||
    onClick !== previousProps.onClick
  );
};

onMount(() => {
  mountWidget();
});

afterUpdate(() => {
  if (mountPoint && hasPropsChanged()) {
    unmountWidget();
    mountWidget();
  }
});

onDestroy(() => {
  unmountWidget();
});
</script>

<div bind:this={mountPoint} style="display: block; width: 100%;"></div>
