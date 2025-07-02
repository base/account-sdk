# React Integration

This guide covers how to use Base Account UI components in React applications.

## Installation

```bash
npm install @base/account-ui
```

## Usage

### Basic Usage

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

### Different Variants

```tsx
import { SignInWithBaseButton } from '@base/account-ui/react';

function VariantExamples() {
  return (
    <div>
      {/* Solid variant */}
      <SignInWithBaseButton 
        onClick={() => console.log('Solid clicked')}
        variant="solid"
        colorScheme="light"
      />
      
      {/* Transparent variant */}
      <SignInWithBaseButton 
        onClick={() => console.log('Transparent clicked')}
        variant="transparent"
        colorScheme="dark"
      />
      
      {/* Left aligned */}
      <SignInWithBaseButton 
        onClick={() => console.log('Left aligned clicked')}
        align="left"
        variant="solid"
      />
    </div>
  );
}
```

## Setup Requirements

React applications typically work out of the box with this package. Make sure you have React 16.8+ for hooks support.

### TypeScript Support

If you're using TypeScript, the package includes full type definitions:

```tsx
import { SignInWithBaseButton } from '@base/account-ui/react';
import type { FC } from 'react';

interface LoginProps {
  onSignIn: () => void;
}

const LoginComponent: FC<LoginProps> = ({ onSignIn }) => {
  return (
    <SignInWithBaseButton 
      onClick={onSignIn}
      align="center"
      variant="solid"
      colorScheme="system"
    />
  );
};
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

The React wrapper is lightweight and only includes the necessary code for React integration. The actual component logic is shared across all frameworks.

### Client Side Render Only

The components work in CSR only.