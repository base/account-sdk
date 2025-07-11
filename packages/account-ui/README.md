# Base Account SDK UI Components

This package provides UI components for **React**, **Preact**, **Vue**, and **Svelte** applications.

## Features

- 🎯 **Multi-framework support**: React, Preact, Vue, and Svelte components
- 🛠️ **TypeScript support**: Full type safety for all frameworks
- 📦 **Single package**: Import from one package, use with any framework
- 🎨 **Consistent API**: Same props interface across frameworks

## Installation

```bash
npm install @base-org/account-ui
```

## Framework-Specific Documentation

For detailed usage examples and setup instructions for each framework:

- **[React](./react/README.md)** - React-specific documentation and examples
- **[Preact](./preact/README.md)** - Preact-specific documentation and examples
- **[Vue](./vue/README.md)** - Vue-specific documentation and examples
- **[Svelte](./svelte/README.md)** - Svelte-specific documentation and examples

## Quick Start - React

### SignInWithBaseButton

```tsx
import { SignInWithBaseButton } from '@base-org/account-ui/react';

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

### BasePayButton

```tsx
import { BasePayButton } from '@base-org/account-ui/react';

function App() {
  return (
    <BasePayButton 
      onClick={() => console.log('Pay with Base clicked!')}
      colorScheme="light"
    />
  );
}
```

## Props

### SignInWithBaseButton

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `align` | `'left' \| 'center'` | `'center'` | Button alignment |
| `variant` | `'solid' \| 'transparent'` | `'solid'` | Button style variant |
| `colorScheme` | `'light' \| 'dark' \| 'system'` | `'system'` | Color theme |
| `onClick` | `() => void` | `undefined` | Click handler |

### BasePayButton

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `colorScheme` | `'light' \| 'dark' \| 'system'` | `'system'` | Color theme |
| `onClick` | `() => void` | `undefined` | Click handler |

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
- **Framework-specific exports**: `/react`, `/preact`, `/vue`, `/svelte`
- **Shared component logic**: Preact components as the base implementation
- **Framework wrappers**: React, Vue, and Svelte components that mount Preact components
- **Type definitions**: Full TypeScript support for all frameworks 