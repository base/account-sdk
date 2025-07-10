<!-- BasePayButton.vue -->
<template>
  <div ref="mountPoint" :style="{ display: 'block', width: '100%' }" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { BasePayButtonProps } from '../../types.js';
import { mountBasePayButton, unmountBasePayButton } from '../preact/mountBasePayButton.js';

interface Props extends BasePayButtonProps {}

const props = withDefaults(defineProps<Props>(), {
  colorScheme: 'system',
});

const mountPoint = ref<HTMLElement | null>(null);

const mountWidget = () => {
  if (mountPoint.value) {
    // Clone props to avoid extensibility issues
    const clonedProps = { ...props };
    mountBasePayButton(mountPoint.value, clonedProps);
  }
};

const unmountWidget = () => {
  if (mountPoint.value) {
    unmountBasePayButton(mountPoint.value);
  }
};

onMounted(() => {
  mountWidget();
});

onBeforeUnmount(() => {
  unmountWidget();
});

// Watch for prop changes and re-mount the component
watch(
  () => props,
  () => {
    unmountWidget();
    mountWidget();
  },
  { deep: true }
);
</script> 