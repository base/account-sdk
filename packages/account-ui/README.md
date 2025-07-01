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
import { SignInWithBaseButton } from '@base/account-ui/react';

function App() {
  return (
    <SignInWithBaseButton 
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
import { SignInWithBaseButton } from '@base/account-ui/preact';

function App() {
  return (
    <SignInWithBaseButton 
      onClick={() => console.log('Sign in clicked!')}
      centered={true}
      darkMode={false}
      transparent={false}
    />
  );
}
```


## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `centered` | `boolean` | `true` | Center the button horizontally |
| `transparent` | `boolean` | `false` | Use transparent background with border |
| `darkMode` | `boolean` | `false` | Use dark theme colors |
| `onClick` | `() => void` | `undefined` | Click handler |
