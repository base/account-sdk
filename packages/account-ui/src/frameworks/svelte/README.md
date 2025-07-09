# Svelte Integration

This guide covers how to use Base Account UI components in Svelte applications.

## Installation

```bash
npm install @base-org/account-ui
```

## Usage

### Basic Usage

```svelte
<script>
  import { SignInWithBaseButton } from '@base-org/account-ui/svelte';

  const handleClick = () => {
    console.log('Sign in clicked!');
  };
</script>

<SignInWithBaseButton 
  onClick={handleClick}
  align="center"
  variant="solid"
  colorScheme="light"
/>
```

### Different Variants

```svelte
<script>
  import { SignInWithBaseButton } from '@base-org/account-ui/svelte';

  const handleClick = (type) => {
    console.log(`${type} button clicked`);
  };
</script>

<div class="button-examples">
  <!-- Solid variant -->
  <SignInWithBaseButton 
    onClick={() => handleClick('solid')}
    variant="solid"
    colorScheme="light"
  />
  
  <!-- Transparent variant -->
  <SignInWithBaseButton 
    onClick={() => handleClick('transparent')}
    variant="transparent"
    colorScheme="dark"
  />
  
  <!-- Left aligned -->
  <SignInWithBaseButton 
    onClick={() => handleClick('left-aligned')}
    align="left"
    variant="solid"
  />
</div>

<style>
  .button-examples {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 300px;
  }
</style>
```

### TypeScript Support

```svelte
<script lang="ts">
  import { SignInWithBaseButton } from '@base-org/account-ui/svelte';

  interface User {
    id: string;
    name: string;
  }

  let currentUser: User | null = null;
  let isLoading: boolean = false;

  const handleSignIn = async (): Promise<void> => {
    isLoading = true;
    try {
      // Type-safe sign-in logic
      console.log('Signing in...');
      // const user = await signInUser();
      // currentUser = user;
    } catch (error: unknown) {
      console.error('Sign-in failed:', error);
    } finally {
      isLoading = false;
    }
  };
</script>

<SignInWithBaseButton 
  onClick={handleSignIn}
  align="center"
  variant="solid"
  colorScheme="system"
/>

{#if isLoading}
  <p>Loading...</p>
{:else if currentUser}
  <p>Welcome, {currentUser.name}!</p>
{/if}
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

The Svelte wrapper is lightweight and only includes the necessary code for Svelte integration.
