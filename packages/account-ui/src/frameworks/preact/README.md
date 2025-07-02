# Preact Integration

This guide covers how to use Base Account UI components in Preact applications.

## Installation

```bash
npm install @base/account-ui
```

## Usage

### Basic Usage

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

### Different Variants

```tsx
import { SignInWithBaseButton } from '@base/account-ui/preact';

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

Preact applications work out of the box with this package. This package uses Preact as the base implementation, so it has the smallest bundle size for Preact applications.

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `align` | `'left' \| 'center'` | `'center'` | Button alignment |
| `variant` | `'solid' \| 'transparent'` | `'solid'` | Button style variant |
| `colorScheme` | `'light' \| 'dark' \| 'system'` | `'system'` | Color theme |
| `onClick` | `() => void` | `undefined` | Click handler |

## Common Issues

### Bundle Size

Since this package uses Preact as the base implementation, Preact applications get the most optimized bundle size.
