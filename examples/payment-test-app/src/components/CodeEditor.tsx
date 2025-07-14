import styles from './CodeEditor.module.css';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onExecute: () => void;
  onReset: () => void;
  isLoading: boolean;
  includePayerInfo: boolean;
  onPayerInfoToggle: (checked: boolean) => void;
  showPayerInfoToggle?: boolean;
}

export const CodeEditor = ({ 
  code, 
  onChange, 
  onExecute, 
  onReset, 
  isLoading, 
  includePayerInfo, 
  onPayerInfoToggle,
  showPayerInfoToggle = true
}: CodeEditorProps) => {
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
        <button onClick={onReset} className={styles.resetButton} disabled={isLoading}>
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
