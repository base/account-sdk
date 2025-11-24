import React from 'react';
import styles from './CodeEditor.module.css';

export interface Preset {
  name: string;
  description: string;
  code: string;
}

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onExecute: () => void;
  onReset: () => void;
  isLoading: boolean;
  includePayerInfo: boolean;
  onPayerInfoToggle: (checked: boolean) => void;
  showPayerInfoToggle?: boolean;
  presets?: Preset[];
  transformPresetCode?: (code: string, includePayerInfo: boolean) => string;
  paymasterUrl?: string;
  onPaymasterUrlChange?: (url: string) => void;
  showPaymasterUrl?: boolean;
  onPresetChange?: (code: string) => void;
}

export const CodeEditor = ({
  code,
  onChange,
  onExecute,
  onReset,
  isLoading,
  includePayerInfo,
  onPayerInfoToggle,
  showPayerInfoToggle = true,
  presets,
  transformPresetCode,
  paymasterUrl,
  onPaymasterUrlChange,
  showPaymasterUrl = false,
  onPresetChange,
}: CodeEditorProps) => {
  const presetSelectRef = React.useRef<HTMLSelectElement>(null);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPreset = presets?.find((p) => p.name === e.target.value);
    if (selectedPreset) {
      let presetCode = selectedPreset.code;
      // Apply payerInfo transformation if toggle is enabled and transform function is provided
      if (includePayerInfo && transformPresetCode) {
        presetCode = transformPresetCode(presetCode, includePayerInfo);
      }
      // Use onPresetChange if provided, otherwise use onChange
      // onPresetChange will apply the current paymasterUrl to the preset code
      if (onPresetChange) {
        onPresetChange(presetCode);
      } else {
        onChange(presetCode);
      }
      // Presets don't control payer info toggle - it's independent
      // Paymaster URL stays intact when switching presets
    }
  };

  const handleReset = () => {
    if (presetSelectRef.current) {
      presetSelectRef.current.value = '';
    }
    onReset();
  };

  return (
    <div className={styles.editorPanel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2l6 6v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2h8z" />
            <path d="M14 2v6h6" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
            <path d="M10 9H8" />
          </svg>
          Code Editor
        </h2>
        <button onClick={handleReset} className={styles.resetButton} disabled={isLoading}>
          <svg
            className={styles.buttonIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M1 4v6h6" />
            <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
          </svg>
          Reset
        </button>
      </div>

      {showPaymasterUrl && (
        <div className={styles.presetContainer}>
          <label htmlFor="paymaster-url" className={styles.presetLabel}>
            <svg
              className={styles.presetIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            Paymaster URL:
          </label>
          <input
            id="paymaster-url"
            type="text"
            value={paymasterUrl || ''}
            onChange={(e) => onPaymasterUrlChange?.(e.target.value)}
            disabled={isLoading}
            className={styles.presetSelect}
          />
        </div>
      )}

      {presets && presets.length > 0 && (
        <div className={styles.presetContainer}>
          <label htmlFor="preset-select" className={styles.presetLabel}>
            <svg
              className={styles.presetIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Preset:
          </label>
          <select
            ref={presetSelectRef}
            id="preset-select"
            className={styles.presetSelect}
            onChange={handlePresetChange}
            disabled={isLoading}
            defaultValue=""
          >
            <option value="">Select a preset...</option>
            {presets.map((preset) => (
              <option key={preset.name} value={preset.name}>
                {preset.name} - {preset.description}
              </option>
            ))}
          </select>
        </div>
      )}

      {showPayerInfoToggle && (
        <div className={styles.checkboxContainer}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={includePayerInfo}
              onChange={(e) => onPayerInfoToggle(e.target.checked)}
              disabled={isLoading}
              className={styles.checkbox}
            />
            <span className={styles.checkboxText}>Include payer info</span>
          </label>
        </div>
      )}

      <div className={styles.editorWrapper}>
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          className={styles.codeEditor}
          spellCheck={false}
          disabled={isLoading}
          placeholder="Enter your code here..."
        />
        <div className={styles.editorOverlay}></div>
      </div>

      <div className={styles.securityDisclaimer}>
        <svg
          className={styles.warningIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div className={styles.disclaimerText}>
          Intended for testing purposes only. Never paste code from untrusted sources. Coinbase is
          not responsible for any loss of funds that you incur. Testnet funds hold no real value.
        </div>
      </div>

      <button onClick={onExecute} disabled={isLoading} className={styles.executeButton}>
        {isLoading ? (
          <>
            <span className={styles.spinner}></span>
            Executing...
          </>
        ) : (
          <>
            <svg
              className={styles.buttonIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Execute Code
          </>
        )}
      </button>
    </div>
  );
};
