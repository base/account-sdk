# Base Account SDK UI Components

This package provides UI components for **React**, **Preact**, and **Vue** applications.

## Features

- 🎯 **Multi-framework support**: React, Preact, and Vue components
- 🛠️ **TypeScript support**: Full type safety for all frameworks
- 📦 **Single package**: Import from one package, use with any framework
- 🎨 **Consistent API**: Same props interface across frameworks

## Installation

```bash
npm install @base/account-ui
```

## Usage

### React

```tsx
import { SignInWithBaseButton } from '@base/account-ui/react';

function App() {
  return (
    <SignInWithBaseButton 
      onClick={() => console.log('Sign in clicked!')}
      align="center"
      variant="solid"
      colorScheme="light"
    />
  );
}
```

### Preact

```tsx
import { SignInWithBaseButton } from '@base/account-ui/preact';

function App() {
  return (
    <SignInWithBaseButton 
      onClick={() => console.log('Sign in clicked!')}
      align="center"
      variant="solid"
      colorScheme="light"
    />
  );
}
```

### Vue

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

### Preact with Mounting Utilities

```tsx
import { mountSignInWithBaseButton, unmountSignInWithBaseButton } from '@base/account-ui/preact';

// Mount to a DOM element
const container = document.getElementById('button-container');
mountSignInWithBaseButton(container, {
  onClick: () => console.log('Sign in clicked!'),
  align: 'center',
  variant: 'solid',
  colorScheme: 'light',
});

// Cleanup when done
unmountSignInWithBaseButton(container);
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `align` | `'left' \| 'center'` | `'center'` | Button alignment |
| `variant` | `'solid' \| 'transparent'` | `'solid'` | Button style variant |
| `colorScheme` | `'light' \| 'dark' \| 'system'` | `'system'` | Color theme |
| `onClick` | `() => void` | `undefined` | Click handler |

## Vue Setup Requirements

For Vue applications, make sure your build tool can process `.vue` files. Most Vue setups (Vite, Vue CLI, Nuxt) handle this automatically.

If using a custom webpack setup, ensure you have `vue-loader` configured:

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin()
  ]
}
```

## Development

### Build Commands

```bash
# Build all frameworks
npm run build

# TypeScript checking
npm run typecheck

# Run tests
npm run test

# Lint
npm run lint
```

## Architecture

This package provides:
- **Framework-specific exports**: `/react`, `/preact`, `/vue`
- **Shared component logic**: Preact components as the base implementation
- **Framework wrappers**: React and Vue components that mount Preact components
- **Type definitions**: Full TypeScript support for all frameworks 