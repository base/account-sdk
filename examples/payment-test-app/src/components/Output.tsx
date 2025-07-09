import type { PaymentResult } from '@base/account-sdk';
import styles from './Output.module.css';

interface OutputProps {
  result: PaymentResult | null;
  error: string | null;
  consoleOutput: string[];
  isLoading: boolean;
}

export const Output = ({ result, error, consoleOutput, isLoading }: OutputProps) => {
  return (
    <div className={styles.outputPanel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <path d="M9 9l6 6" />
            <path d="M15 9l-6 6" />
          </svg>
          Output
        </h2>
      </div>

      <div className={styles.outputContent}>
        {result && (
          <div className={`${styles.resultCard} ${result.success ? styles.success : styles.error}`}>
            <div className={styles.resultHeader}>
              {result.success ? (
                <>
                  <svg
                    className={styles.resultIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span className={styles.resultTitle}>Payment Successful!</span>
                </>
              ) : (
                <>
                  <svg
                    className={styles.resultIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span className={styles.resultTitle}>Payment Failed</span>
                </>
              )}
            </div>

            <div className={styles.resultBody}>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Amount</span>
                <span className={styles.resultValue}>{result.amount} USDC</span>
              </div>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Recipient</span>
                <code className={styles.resultValue}>{result.recipient}</code>
              </div>
              {result.id && (
                <div className={styles.resultRow}>
                  <span className={styles.resultLabel}>Transaction ID</span>
                  <code className={styles.resultValue}>{result.id}</code>
                </div>
              )}
              {result.error && (
                <div className={styles.resultRow}>
                  <span className={styles.resultLabel}>Error</span>
                  <span className={styles.errorMessage}>{result.error}</span>
                </div>
              )}
            </div>

            {result.infoResponses && (
              <div className={styles.userDataSection}>
                <div className={styles.userDataHeader}>
                  <svg
                    className={styles.userDataIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>User Info</span>
                </div>
                <div className={styles.userDataBody}>
                  {result.infoResponses.name && (
                    <div className={styles.userDataRow}>
                      <span className={styles.userDataLabel}>Name</span>
                      <span className={styles.userDataValue}>
                        {(() => {
                          const name = result.infoResponses.name as unknown as {
                            firstName: string;
                            familyName: string;
                          };
                          return `${name.firstName} ${name.familyName}`;
                        })()}
                      </span>
                    </div>
                  )}
                  {result.infoResponses.email && (
                    <div className={styles.userDataRow}>
                      <span className={styles.userDataLabel}>Email</span>
                      <span className={styles.userDataValue}>{result.infoResponses.email}</span>
                    </div>
                  )}
                  {result.infoResponses.phoneNumber && (
                    <div className={styles.userDataRow}>
                      <span className={styles.userDataLabel}>Phone</span>
                      <span className={styles.userDataValue}>
                        {result.infoResponses.phoneNumber.number} ({result.infoResponses.phoneNumber.country})
                      </span>
                    </div>
                  )}
                  {result.infoResponses.physicalAddress && (
                    <div className={styles.userDataRow}>
                      <span className={styles.userDataLabel}>Address</span>
                      <span className={styles.userDataValue}>
                        {(() => {
                          const addr = result.infoResponses.physicalAddress as unknown as {
                            address1: string;
                            address2?: string;
                            city: string;
                            state: string;
                            postalCode: string;
                            countryCode: string;
                            name?: {
                              firstName: string;
                              familyName: string;
                            };
                          };
                          const parts = [
                            addr.name ? `${addr.name.firstName} ${addr.name.familyName}` : null,
                            addr.address1,
                            addr.address2,
                            `${addr.city}, ${addr.state} ${addr.postalCode}`,
                            addr.countryCode
                          ].filter(Boolean);
                          return parts.join(', ');
                        })()}
                      </span>
                    </div>
                  )}
                  {result.infoResponses.onchainAddress && (
                    <div className={styles.userDataRow}>
                      <span className={styles.userDataLabel}>On-chain Address</span>
                      <span className={styles.userDataValue}>{result.infoResponses.onchainAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className={`${styles.resultCard} ${styles.error}`}>
            <div className={styles.resultHeader}>
              <svg
                className={styles.resultIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className={styles.resultTitle}>Execution Error</span>
            </div>
            <div className={styles.resultBody}>
              <div className={styles.errorMessage}>{error}</div>
            </div>
          </div>
        )}

        {consoleOutput.length > 0 && (
          <div className={styles.consoleCard}>
            <div className={styles.consoleHeader}>
              <svg
                className={styles.icon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
              Console Output
            </div>
            <pre className={styles.consoleBody}>{consoleOutput.join('\n')}</pre>
          </div>
        )}

        {!result && !error && !isLoading && consoleOutput.length === 0 && (
          <div className={styles.emptyState}>
            <svg
              className={styles.emptyIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <path d="M9 9h6v6H9z" />
            </svg>
            <p>Click &quot;Execute Code&quot; to run your code</p>
          </div>
        )}
      </div>
    </div>
  );
};
