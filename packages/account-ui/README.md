# Base Account SDK UI Components

This package provides UI components for both **React** and **Preact** applications.

## Features

- 🎯 **Framework-specific builds**: Separate compilation for React and Preact
- 🛠️ **TypeScript support**: Full type safety for both frameworks
- 📦 **Single package**: Import from one package, use with any framework
- 🎨 **Consistent API**: Same props interface across frameworks

## Installation

```bash
npm install @base/account-ui
```

## Usage

### React

```tsx
import { ReactSignInWithBaseButton } from '@base/account-ui';

function App() {
  return (
    <ReactSignInWithBaseButton 
      onClick={() => console.log('Sign in clicked!')}
      centered={true}
      darkMode={false}
      transparent={false}
    />
  );
}
```

### Preact

```tsx
import { PreactSignInWithBaseButton } from '@base/account-ui';

function App() {
  return (
    <PreactSignInWithBaseButton 
      onClick={() => console.log('Sign in clicked!')}
      centered={true}
      darkMode={false}
      transparent={false}
    />
  );
}
```

### Preact with Mounting Utilities

```tsx
import { mountSignInWithBaseButton, unmountSignInWithBaseButton } from '@base/account-ui';

// Mount to a DOM element
const container = document.getElementById('button-container');
mountSignInWithBaseButton(container, {
  onClick: () => console.log('Sign in clicked!'),
  centered: true,
  darkMode: false,
  transparent: false,
});

// Cleanup when done
unmountSignInWithBaseButton(container);
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `centered` | `boolean` | `true` | Center the button horizontally |
| `transparent` | `boolean` | `false` | Use transparent background with border |
| `darkMode` | `boolean` | `false` | Use dark theme colors |
| `onClick` | `() => void` | `undefined` | Click handler |

## Development

This package uses separate TypeScript configurations for each framework:

- `tsconfig.preact.json` - Preact-specific compilation
- `tsconfig.react.json` - React-specific compilation  
- `tsconfig.base.json` - Shared base configuration

### Build Commands

```bash
# Build all frameworks
npm run build

# Build specific framework
npm run build:preact
npm run build:react

# TypeScript checking
npm run typecheck
npm run typecheck:preact
npm run typecheck:react
```

## Architecture

This setup allows:
- **Preact components** compiled with `jsxImportSource: "preact"`
- **React components** compiled with `jsxImportSource: "react"`
- **No JSX conflicts** between frameworks
- **Optimized bundles** for each framework 