<!-- SignInWithBaseButton.vue -->
<template>
  <div ref="mountPoint" :style="{ display: 'block', width: '100%' }" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { SignInWithBaseButtonProps } from '../../types.js';
import {
  mountSignInWithBaseButton,
  unmountSignInWithBaseButton,
} from '../preact/mountSignInWithBaseButton.js';

interface Props extends SignInWithBaseButtonProps {}

const props = withDefaults(defineProps<Props>(), {
  align: 'center',
  variant: 'solid',
  colorScheme: 'system',
});

const mountPoint = ref<HTMLElement | null>(null);

const mountWidget = () => {
  if (mountPoint.value) {
    // Clone props to avoid extensibility issues
    const clonedProps = { ...props };
    mountSignInWithBaseButton(mountPoint.value, clonedProps);
  }
};

const unmountWidget = () => {
  if (mountPoint.value) {
    unmountSignInWithBaseButton(mountPoint.value);
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