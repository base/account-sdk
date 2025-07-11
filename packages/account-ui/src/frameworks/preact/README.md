# Preact Integration

This guide covers how to use Base Account UI components in Preact applications.

## Installation

```bash
npm install @base-org/account-ui
```

## Usage

### SignInWithBaseButton

#### Basic Usage

```tsx
import { SignInWithBaseButton } from '@base-org/account-ui/preact';

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

#### Different Variants

```tsx
import { SignInWithBaseButton } from '@base-org/account-ui/preact';

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

### BasePayButton

#### Basic Usage

```tsx
import { BasePayButton } from '@base-org/account-ui/preact';

function App() {
  return (
    <BasePayButton 
      onClick={() => console.log('Pay with Base clicked!')}
      colorScheme="light"
    />
  );
}
```

#### Different Color Schemes

```tsx
import { BasePayButton } from '@base-org/account-ui/preact';

function ColorSchemeExamples() {
  return (
    <div>
      {/* Light mode */}
      <BasePayButton 
        onClick={() => console.log('Light mode clicked')}
        colorScheme="light"
      />
      
      {/* Dark mode */}
      <BasePayButton 
        onClick={() => console.log('Dark mode clicked')}
        colorScheme="dark"
      />
      
      {/* System theme (adapts to user's preference) */}
      <BasePayButton 
        onClick={() => console.log('System theme clicked')}
        colorScheme="system"
      />
    </div>
  );
}
```

## Setup Requirements

Preact applications work out of the box with this package. This package uses Preact as the base implementation, so it has the smallest bundle size for Preact applications.

## Props Reference

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

## Common Issues

### Bundle Size

Since this package uses Preact as the base implementation, Preact applications get the most optimized bundle size.
