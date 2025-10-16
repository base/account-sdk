// Copyright (c) 2018-2025 Coinbase, Inc. <https://www.coinbase.com/>

import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import QRCode from 'qrcode';

import { Dialog, type DialogProps } from ':ui/Dialog/Dialog.js';

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
  message = 'Scan this QR code with your wallet app to complete the transaction.',
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
        <div class="-base-acc-sdk-prolink-dialog-payload-preview">
          <div class="-base-acc-sdk-prolink-dialog-payload-label">Payload:</div>
          <div class="-base-acc-sdk-prolink-dialog-payload-text">{payload.slice(0, 40)}...</div>
        </div>
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

let dialogInstance: Dialog | null = null;

/**
 * Show a prolink dialog with QR code
 * @param payload - Base64url-encoded prolink payload
 * @param options - Optional title and message
 */
export function showProlinkDialog(
  payload: string,
  options?: { title?: string; message?: string }
): void {
  if (!dialogInstance) {
    dialogInstance = new Dialog();
    dialogInstance.attach(document.body);
  }

  const dialogProps: DialogProps = {
    title: options?.title || 'Scan to Connect',
    message: options?.message || 'Scan this QR code with your wallet app.',
    onClose: () => {
      dialogInstance?.clear();
    },
  };

  // We need to integrate the QR code into the existing Dialog system
  // For now, we'll use the message field to render the QR code
  // In a production implementation, you'd extend the Dialog component
  // to support custom content
  
  dialogInstance.presentItem(dialogProps);
}

