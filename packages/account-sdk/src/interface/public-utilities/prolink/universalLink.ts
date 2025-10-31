// Copyright (c) 2018-2025 Coinbase, Inc. <https://www.coinbase.com/>

/**
 * Base App universal link utilities for prolinks
 */

/**
 * Base App URLs for different environments
 */
export const BASE_APP_URLS = {
  production: 'https://base.app/base-pay',
  staging: 'https://base-staging.coinbase.com/base-pay', // todo: confirm link
  development: 'https://base-dev.coinbase.com/base-pay', // todo: confirm link
} as const;

/**
 * Environment type for Base App URLs
 */
export type BaseAppEnvironment = keyof typeof BASE_APP_URLS;

/**
 * Convert an encoded prolink to a Base App deeplink / universal link
 *
 * @param prolink - Base64url-encoded prolink payload
 * @param environment - Target environment (defaults to 'production')
 * @returns Base App universal link URL
 *
 * @example
 * ```typescript
 * const prolink = await encodeProlink(request);
 * const deeplink = prolinkToUniversalLink(prolink);
 * // Returns: 'https://base.app/base-pay?p=CAEQ...'
 *
 * // For testing environments
 * const stagingLink = prolinkToUniversalLink(prolink, 'staging');
 * const developmentLink = prolinkToUniversalLink(prolink, 'development');
 * ```
 */
export function prolinkToUniversalLink(
  prolink: string,
  environment: BaseAppEnvironment = 'production'
): string {
  if (!prolink || prolink.trim().length === 0) {
    throw new Error('Prolink cannot be empty');
  }

  const baseUrl = BASE_APP_URLS[environment];
  const url = new URL(baseUrl);
  url.searchParams.set('p', prolink);
  return url.toString();
}
