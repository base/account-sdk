// Copyright (c) 2018-2025 Coinbase, Inc. <https://www.coinbase.com/>

import { FunctionComponent, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import QRCode from 'qrcode';

export type ProlinkDialogProps = {
  payload: string;
  title?: string;
  message?: string;
  onClose?: () => void;
};

/**
 * Dialog component for displaying a prolink QR code
 */
export const ProlinkDialog: FunctionComponent<ProlinkDialogProps> = ({
  payload,
  title = 'Scan to Connect',
  message = 'Scan this QR code with a prolink compatible wallet to complete the transaction.',
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        // Generate QR code as data URL
        const dataUrl = await QRCode.toDataURL(payload, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
        setError('Failed to generate QR code');
      }
    };

    generateQR();
  }, [payload]);

  return (
    <div class="-base-acc-sdk-prolink-dialog">
      <style>{styles}</style>
      <div class="-base-acc-sdk-prolink-dialog-content">
        <div class="-base-acc-sdk-prolink-dialog-title">{title}</div>
        <div class="-base-acc-sdk-prolink-dialog-message">{message}</div>
        {error ? (
          <div class="-base-acc-sdk-prolink-dialog-error">{error}</div>
        ) : qrDataUrl ? (
          <div class="-base-acc-sdk-prolink-dialog-qr-container">
            <img
              src={qrDataUrl}
              alt="QR Code"
              class="-base-acc-sdk-prolink-dialog-qr-image"
            />
          </div>
        ) : (
          <div class="-base-acc-sdk-prolink-dialog-loading">Generating QR code...</div>
        )}
      </div>
      {onClose && (
        <div class="-base-acc-sdk-prolink-dialog-actions">
          <button class="-base-acc-sdk-prolink-dialog-button" onClick={onClose}>
            Close
          </button>
        </div>
      )}
    </div>
  );
};

const styles = `
.-base-acc-sdk-prolink-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}

.-base-acc-sdk-prolink-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.-base-acc-sdk-prolink-dialog-title {
  font-size: 20px;
  font-weight: 600;
  color: #000;
  text-align: center;
}

.-base-acc-sdk-prolink-dialog-message {
  font-size: 14px;
  color: #666;
  text-align: center;
  max-width: 400px;
}

.-base-acc-sdk-prolink-dialog-qr-container {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.-base-acc-sdk-prolink-dialog-qr-image {
  display: block;
  width: 300px;
  height: 300px;
}

.-base-acc-sdk-prolink-dialog-loading {
  padding: 40px;
  font-size: 14px;
  color: #666;
}

.-base-acc-sdk-prolink-dialog-error {
  padding: 16px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c00;
  font-size: 14px;
}

.-base-acc-sdk-prolink-dialog-payload-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
}

.-base-acc-sdk-prolink-dialog-payload-label {
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.-base-acc-sdk-prolink-dialog-payload-text {
  font-family: monospace;
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  word-break: break-all;
}

.-base-acc-sdk-prolink-dialog-actions {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.-base-acc-sdk-prolink-dialog-button {
  padding: 12px 24px;
  background: #0052ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.-base-acc-sdk-prolink-dialog-button:hover {
  background: #0040cc;
}

/* Mobile optimizations */
@media (max-width: 600px) {
  .-base-acc-sdk-prolink-dialog {
    padding: 16px;
  }

  .-base-acc-sdk-prolink-dialog-qr-image {
    width: 250px;
    height: 250px;
  }
}
`;

let dialogRoot: HTMLDivElement | null = null;

/**
 * Show a prolink dialog with QR code
 * @param payload - Base64url-encoded prolink payload
 * @param options - Optional title and message
 */
export function showProlinkDialog(
  payload: string,
  options?: { title?: string; message?: string }
): void {
  // Create root element if it doesn't exist
  if (!dialogRoot) {
    dialogRoot = document.createElement('div');
    dialogRoot.className = '-base-acc-sdk-prolink-modal-root';
    document.body.appendChild(dialogRoot);
  }

  // Create backdrop and wrapper
  const handleClose = () => {
    if (dialogRoot) {
      render(null, dialogRoot);
    }
  };

  render(
    <div class="-base-acc-sdk-prolink-modal-container">
      <style>{modalStyles}</style>
      <div class="-base-acc-sdk-prolink-modal-backdrop" onClick={handleClose}>
        <div class="-base-acc-sdk-prolink-modal-content" onClick={(e) => e.stopPropagation()}>
          <ProlinkDialog
            payload={payload}
            title={options?.title}
            message={options?.message}
            onClose={handleClose}
          />
        </div>
      </div>
    </div>,
    dialogRoot
  );
}

const modalStyles = `
.-base-acc-sdk-prolink-modal-root {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999999;
  pointer-events: none;
}

.-base-acc-sdk-prolink-modal-root > * {
  pointer-events: all;
}

.-base-acc-sdk-prolink-modal-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999999;
}

.-base-acc-sdk-prolink-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.-base-acc-sdk-prolink-modal-content {
  background: #fff;
  border-radius: 16px;
  max-width: 90%;
  max-height: 90%;
  overflow: auto;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 600px) {
  .-base-acc-sdk-prolink-modal-content {
    max-width: 95%;
    max-height: 95%;
  }
}
`;

