// Copyright (c) 2018-2025 Coinbase, Inc. <https://www.coinbase.com/>

/**
 * Base App universal link utilities for prolinks
 */

/**
 * Create a link with an encoded prolink query parameter and additional query parameters
 *
 * @param prolink - Base64url-encoded prolink payload
 * @param baseUrl - Base URL to use for the link, defaults to https://base.app/base-pay
 * @param additionalQueryParams - Additional query parameters to add to the link
 * @returns { link: string } - Object containing the full link
 *
 * @example
 * ```typescript
 * const prolink = await encodeProlink(request);
 * const link = createProlinkUrl(prolink);
 * // Returns: { link: 'https://base.app/base-pay?p=CAEQ...' }
 *
 * const linkWithAdditionalParams = createProlinkUrl(prolink, 'https://base.app/base-pay', {
 *   foo: 'bar',
 *   baz: 'qux',
 * });
 * // Returns: { link: 'https://base.app/base-pay?p=CAEQ...&foo=bar&baz=qux' }
 * ```
 */
export function createProlinkUrl(
  prolink: string,
  baseUrl: string = 'https://base.app/base-pay',
  additionalQueryParams?: Record<string, string>
): { link: string } {
  if (!prolink || prolink.trim().length === 0) {
    throw new Error('Prolink cannot be empty');
  }
  if (!baseUrl || baseUrl.trim().length === 0) {
    throw new Error('baseUrl cannot be empty');
  }

  const url = new URL(baseUrl);
  url.searchParams.set('p', prolink);
  Object.entries(additionalQueryParams ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return { link: url.toString() };
}
