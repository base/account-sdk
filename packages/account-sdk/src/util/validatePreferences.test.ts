import { describe, expect, it } from 'vitest';
import { validatePreferences } from './validatePreferences.js';

describe('validatePreferences', () => {
  describe('walletUrl validation', () => {
    it('accepts a valid https URL', () => {
      expect(() =>
        validatePreferences({ walletUrl: 'https://wallet.example.com' })
      ).not.toThrow();
    });

    it('accepts a valid http URL', () => {
      expect(() =>
        validatePreferences({ walletUrl: 'http://localhost:3000' })
      ).not.toThrow();
    });

    it('accepts a URL with port', () => {
      expect(() =>
        validatePreferences({ walletUrl: 'https://wallet.example.com:8080/path' })
      ).not.toThrow();
    });

    it('rejects an invalid URL', () => {
      expect(() =>
        validatePreferences({ walletUrl: 'not-a-valid-url' })
      ).toThrow('walletUrl must be a valid URL');
    });

    it('rejects empty string', () => {
      expect(() => validatePreferences({ walletUrl: '' })).toThrow(
        'walletUrl must be a valid URL'
      );
    });

    it('rejects ftp protocol URL', () => {
      expect(() =>
        validatePreferences({ walletUrl: 'ftp://example.com' })
      ).toThrow('walletUrl must be a valid URL');
    });

    it('accepts when walletUrl is undefined', () => {
      expect(() => validatePreferences({ walletUrl: undefined })).not.toThrow();
    });

    it('accepts when walletUrl is not provided', () => {
      expect(() => validatePreferences({})).not.toThrow();
    });
  });
});