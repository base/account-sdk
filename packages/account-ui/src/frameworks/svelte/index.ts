export type { BasePayButtonProps, SignInWithBaseButtonProps } from '../../types.js';

// Export the Svelte component with proper typing
import SignInWithBaseButtonSvelte from './SignInWithBaseButton.svelte';
export const SignInWithBaseButton = SignInWithBaseButtonSvelte;

import BasePayButtonSvelte from './BasePayButton.svelte';
export const BasePayButton = BasePayButtonSvelte;
