import { waitFor } from '@testing-library/preact';
import { Mock, vi } from 'vitest';

import { PACKAGE_NAME, PACKAGE_VERSION } from ':core/constants.js';
import { store } from ':store/store.js';
import { getCrossOriginOpenerPolicy } from './checkCrossOriginOpenerPolicy.js';
import { closePopup, openPopup } from './web.js';

vi.mock('./checkCrossOriginOpenerPolicy');
(getCrossOriginOpenerPolicy as Mock).mockReturnValue('null');

// Mock Snackbar class
const mockPresentItem = vi.fn().mockReturnValue(() => {});
const mockClear = vi.fn();
const mockAttach = vi.fn();
const mockInstance = {
  presentItem: mockPresentItem,
  clear: mockClear,
  attach: mockAttach,
};

vi.mock(':ui/Dialog/index.js', () => ({
  initDialog: vi.fn().mockImplementation(() => mockInstance),
}));

const mockOrigin = 'http://localhost';

vi.mock(':store/store.js', () => ({
  store: {
    config: {
      get: vi.fn().mockReturnValue({ metadata: { appName: 'Test App' } }),
    },
  },
}));

describe('PopupManager', () => {
  beforeAll(() => {
    global.window = Object.create(window);
    Object.defineProperties(window, {
      innerWidth: { value: 1024 },
      innerHeight: { value: 768 },
      screenX: { value: 0 },
      screenY: { value: 0 },
      open: { value: vi.fn() },
      close: { value: vi.fn() },
      location: { value: { origin: mockOrigin } },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should open a popup with correct settings and focus it', async () => {
    const url = new URL('https://example.com');
    (window.open as Mock).mockReturnValue({ focus: vi.fn() });

    const popup = await openPopup(url, 'popup');

    expect(window.open).toHaveBeenNthCalledWith(
      1,
      url,
      expect.stringContaining('wallet_'),
      'width=420, height=700, left=302, top=34'
    );
    expect(popup.focus).toHaveBeenCalledTimes(1);

    expect(url.searchParams.get('sdkName')).toBe(PACKAGE_NAME);
    expect(url.searchParams.get('sdkVersion')).toBe(PACKAGE_VERSION);
    expect(url.searchParams.get('origin')).toBe(mockOrigin);
    expect(url.searchParams.get('coop')).toBe('null');
  });

  it('should not duplicate parameters when opening a popup with existing params', async () => {
    const url = new URL('https://example.com');
    url.searchParams.append('sdkName', PACKAGE_NAME);
    url.searchParams.append('sdkVersion', PACKAGE_VERSION);
    url.searchParams.append('origin', mockOrigin);
    url.searchParams.append('coop', 'null');

    (window.open as Mock).mockReturnValue({ focus: vi.fn() });

    await openPopup(url, 'popup');

    const paramCount = url.searchParams.toString().split('&').length;
    expect(paramCount).toBe(4);
  });

  it('should include externalCorrelationId in URL when present in store config', async () => {
    const externalCorrelationId = 'external_correlation_id_12345';
    (store.config.get as Mock).mockReturnValue({
      metadata: { appName: 'Test App' },
      externalCorrelationId,
    });

    const url = new URL('https://example.com');
    (window.open as Mock).mockReturnValue({ focus: vi.fn() });

    await openPopup(url, 'popup');

    expect(url.searchParams.get('externalCorrelationId')).toBe(externalCorrelationId);
    expect(url.searchParams.get('sdkName')).toBe(PACKAGE_NAME);
    expect(url.searchParams.get('sdkVersion')).toBe(PACKAGE_VERSION);
    expect(url.searchParams.get('origin')).toBe(mockOrigin);
    expect(url.searchParams.get('coop')).toBe('null');
  });

  it('should show snackbar with retry button when popup is blocked and retry successfully', async () => {
    const url = new URL('https://example.com');
    const mockPopup = { focus: vi.fn() };
    (window.open as Mock).mockReturnValueOnce(null).mockReturnValueOnce(mockPopup);

    const promise = openPopup(url, 'popup');

    await waitFor(() => {
      expect(mockPresentItem).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test App wants to continue in Base Account',
          message: 'This action requires your permission to open a new window.',
          actionItems: expect.arrayContaining([
            expect.objectContaining({
              text: 'Try again',
              variant: 'primary',
            }),
          ]),
        })
      );
    });

    const retryButton = mockPresentItem.mock.calls[0][0].actionItems[0];
    retryButton.onClick();

    const popup = await promise;
    expect(popup).toBe(mockPopup);
    expect(mockClear).toHaveBeenCalled();
    expect(window.open).toHaveBeenCalledTimes(2);
  });

  it('should show snackbar with retry button when popup is blocked and reject if retry fails', async () => {
    const url = new URL('https://example.com');
    (window.open as Mock).mockReturnValue(null);

    const promise = openPopup(url, 'popup');

    await waitFor(() => {
      expect(mockPresentItem).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test App wants to continue in Base Account',
          message: 'This action requires your permission to open a new window.',
          actionItems: expect.arrayContaining([
            expect.objectContaining({
              text: 'Try again',
              variant: 'primary',
            }),
          ]),
        })
      );
    });

    const retryButton = mockPresentItem.mock.calls[0][0].actionItems[0];
    retryButton.onClick();

    await expect(promise).rejects.toThrow('Popup window was blocked');
    expect(mockClear).toHaveBeenCalled();
  });

  describe('embedded mode', () => {
    beforeEach(() => {
      // Mock document.createElement and document.body.appendChild
      const mockDocument = {
        createElement: vi.fn(),
        body: {
          appendChild: vi.fn(),
        },
        getElementById: vi.fn(),
      };
      global.document = mockDocument as any;
    });

    it('should create an embedded iframe with correct properties', async () => {
      const url = new URL('https://example.com');
      const mockIframe = {
        id: '',
        allowFullscreen: false,
        allow: '',
        style: { cssText: '' },
        src: '',
        contentWindow: { focus: vi.fn() },
      };

      (document.createElement as Mock).mockReturnValue(mockIframe);

      const window = await openPopup(url, 'embedded');

      expect(document.createElement).toHaveBeenCalledWith('iframe');
      expect(mockIframe.id).toBe('keys-frame');
      expect(mockIframe.allowFullscreen).toBe(true);
      expect(mockIframe.allow).toBe(
        'publickey-credentials-get; publickey-credentials-create; clipboard-write'
      );
      expect(mockIframe.style.cssText).toContain('border:none');
      expect(mockIframe.style.cssText).toContain('position:absolute');
      expect(mockIframe.style.cssText).toContain('z-index:1000');
      expect(mockIframe.src).toBe(url.toString());
      expect(document.body.appendChild).toHaveBeenCalledWith(mockIframe);
      expect(window).toBe(mockIframe.contentWindow);
    });

    it('should throw error when iframe contentWindow is null', () => {
      const url = new URL('https://example.com');
      const mockIframe = {
        id: '',
        allowFullscreen: false,
        allow: '',
        style: { cssText: '' },
        src: '',
        contentWindow: null,
      };

      (document.createElement as Mock).mockReturnValue(mockIframe);

      expect(() => openPopup(url, 'embedded')).toThrow('iframe failed to initialize');
    });
  });

  describe('closePopup', () => {
    it('should close an open popup window', () => {
      const mockPopup = { close: vi.fn(), closed: false } as any as Window;

      closePopup(mockPopup);

      expect(mockPopup.close).toHaveBeenCalledTimes(1);
    });

    it('should not try to close an already closed popup window', () => {
      const mockPopup = { close: vi.fn(), closed: true } as any as Window;

      closePopup(mockPopup);

      expect(mockPopup.close).not.toHaveBeenCalled();
    });

    it('should remove iframe when closing an embedded window', () => {
      const mockIframe = {
        contentWindow: { focus: vi.fn() },
        remove: vi.fn(),
      };
      const mockPopup = mockIframe.contentWindow as any as Window;

      (document.getElementById as Mock).mockReturnValue(mockIframe);

      closePopup(mockPopup);

      expect(document.getElementById).toHaveBeenCalledWith('keys-frame');
      expect(mockIframe.remove).toHaveBeenCalledTimes(1);
    });

    it('should do nothing when popup is null', () => {
      closePopup(null);

      expect(document.getElementById).not.toHaveBeenCalled();
    });

    it('should fall back to popup close when iframe not found', () => {
      const mockPopup = { close: vi.fn(), closed: false } as any as Window;

      (document.getElementById as Mock).mockReturnValue(null);

      closePopup(mockPopup);

      expect(document.getElementById).toHaveBeenCalledWith('keys-frame');
      expect(mockPopup.close).toHaveBeenCalledTimes(1);
    });
  });
});
