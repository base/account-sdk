# Vue Integration

This guide covers how to use Base Account UI components in Vue applications.

## Installation

```bash
npm install @base/account-ui
```

## Usage

### Basic Usage

```vue
<template>
  <SignInWithBaseButton 
    :onClick="handleClick"
    align="center"
    variant="solid"
    colorScheme="light"
  />
</template>

<script setup>
import { SignInWithBaseButton } from '@base/account-ui/vue';

const handleClick = () => {
  console.log('Sign in clicked!');
};
</script>
```

### Different Variants

```vue
<template>
  <div class="button-examples">
    <!-- Solid variant -->
    <SignInWithBaseButton 
      :onClick="() => handleClick('solid')"
      variant="solid"
      colorScheme="light"
    />
    
    <!-- Transparent variant -->
    <SignInWithBaseButton 
      :onClick="() => handleClick('transparent')"
      variant="transparent"
      colorScheme="dark"
    />
    
    <!-- Left aligned -->
    <SignInWithBaseButton 
      :onClick="() => handleClick('left-aligned')"
      align="left"
      variant="solid"
    />
  </div>
</template>

<script setup>
import { SignInWithBaseButton } from '@base/account-ui/vue';

const handleClick = (type) => {
  console.log(`${type} button clicked`);
};
</script>

<style scoped>
.button-examples {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 300px;
}
</style>
```

## Setup Requirements

### Vue 3

This package is designed for Vue 3. Make sure your build tool can process `.vue` files. Most Vue setups (Vite, Vue CLI, Nuxt) handle this automatically.

### TypeScript Support

If you're using TypeScript with Vue, the package includes full type definitions:

```vue
<template>
  <SignInWithBaseButton 
    :onClick="handleSignIn"
    align="center"
    variant="solid"
    colorScheme="system"
  />
</template>

<script setup lang="ts">
import { SignInWithBaseButton } from '@base/account-ui/vue';
import type { Ref } from 'vue';

interface User {
  id: string;
  name: string;
}

const currentUser: Ref<User | null> = ref(null);

const handleSignIn = async (): Promise<void> => {
  try {
    // Type-safe sign-in logic
    console.log('Signing in...');
  } catch (error: unknown) {
    console.error('Sign-in failed:', error);
  }
};
</script>
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `align` | `'left' \| 'center'` | `'center'` | Button alignment |
| `variant` | `'solid' \| 'transparent'` | `'solid'` | Button style variant |
| `colorScheme` | `'light' \| 'dark' \| 'system'` | `'system'` | Color theme |
| `onClick` | `() => void` | `undefined` | Click handler |

## Common Issues

### Bundle Size

The Vue wrapper is lightweight and only includes the necessary code for Vue integration.
