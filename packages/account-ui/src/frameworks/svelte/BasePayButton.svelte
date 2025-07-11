<script>
import { afterUpdate, onDestroy, onMount } from 'svelte';
import { mountBasePayButton, unmountBasePayButton } from '../preact/mountBasePayButton.js';

// Props with defaults
export let colorScheme = 'system';
export let onClick = undefined;

let mountPoint;
let previousProps = {};

const mountWidget = () => {
  if (mountPoint) {
    // Clone props to avoid extensibility issues
    const clonedProps = { colorScheme, onClick };
    mountBasePayButton(mountPoint, clonedProps);
    previousProps = { ...clonedProps };
  }
};

const unmountWidget = () => {
  if (mountPoint) {
    unmountBasePayButton(mountPoint);
  }
};

const hasPropsChanged = () => {
  const currentProps = { colorScheme, onClick };
  return JSON.stringify(currentProps) !== JSON.stringify(previousProps);
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