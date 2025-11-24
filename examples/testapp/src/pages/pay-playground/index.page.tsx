import { useEffect, useState } from 'react';
import { CodeEditor, Header, Output, QuickTips } from './components';
import {
  DEFAULT_GET_PAYMENT_STATUS_CODE,
  DEFAULT_PAY_CODE,
  DEFAULT_PAY_WITH_TOKEN_CODE,
  GET_PAYMENT_STATUS_QUICK_TIPS,
  PAY_CODE_WITH_PAYER_INFO,
  PAY_QUICK_TIPS,
  PAY_WITH_TOKEN_CODE_WITH_PAYER_INFO,
  PAY_WITH_TOKEN_PRESETS,
  PAY_WITH_TOKEN_QUICK_TIPS,
} from './constants';
import { useCodeExecution } from './hooks';
import { togglePayerInfoInCode, extractPaymasterUrl, updatePaymasterUrl } from './utils';
import styles from './styles/Home.module.css';

function PayPlayground() {
  const [includePayerInfo, setIncludePayerInfo] = useState(false);
  const [payCode, setPayCode] = useState(DEFAULT_PAY_CODE);
  const [getPaymentStatusCode, setGetPaymentStatusCode] = useState(DEFAULT_GET_PAYMENT_STATUS_CODE);
  const [includePayerInfoToken, setIncludePayerInfoToken] = useState(false);
  const [payWithTokenCode, setPayWithTokenCode] = useState(DEFAULT_PAY_WITH_TOKEN_CODE);
  const [paymasterUrl, setPaymasterUrl] = useState('');

  const payExecution = useCodeExecution();
  const getPaymentStatusExecution = useCodeExecution();
  const payWithTokenExecution = useCodeExecution();

  const handlePayExecute = () => {
    payExecution.executeCode(payCode);
  };

  const handlePayReset = () => {
    setIncludePayerInfo(false);
    setPayCode(DEFAULT_PAY_CODE);
    payExecution.reset();
  };

  const handlePayerInfoToggle = (checked: boolean) => {
    setIncludePayerInfo(checked);
    const newCode = checked ? PAY_CODE_WITH_PAYER_INFO : DEFAULT_PAY_CODE;
    setPayCode(newCode);
    payExecution.reset();
  };

  const handleGetPaymentStatusExecute = () => {
    getPaymentStatusExecution.executeCode(getPaymentStatusCode);
  };

  const handleGetPaymentStatusReset = () => {
    setGetPaymentStatusCode(DEFAULT_GET_PAYMENT_STATUS_CODE);
    getPaymentStatusExecution.reset();
  };

  const handlePayWithTokenExecute = () => {
    payWithTokenExecution.executeCode(payWithTokenCode);
  };

  const handlePayWithTokenReset = () => {
    setIncludePayerInfoToken(false);
    setPaymasterUrl('');
    setPayWithTokenCode(DEFAULT_PAY_WITH_TOKEN_CODE);
    payWithTokenExecution.reset();
  };

  const handlePayerInfoTokenToggle = (checked: boolean) => {
    setIncludePayerInfoToken(checked);
    // Modify existing code to add/remove payerInfo instead of replacing it
    const modifiedCode = togglePayerInfoInCode(payWithTokenCode, checked);
    setPayWithTokenCode(modifiedCode);
    payWithTokenExecution.reset();
  };

  const handlePaymasterUrlChange = (url: string) => {
    setPaymasterUrl(url);
    // Update the code with the new paymaster URL
    const updatedCode = updatePaymasterUrl(payWithTokenCode, url);
    setPayWithTokenCode(updatedCode);
  };

  const handlePayWithTokenCodeChange = (code: string) => {
    setPayWithTokenCode(code);
    // Extract paymaster URL from code and sync the textbox
    const extractedUrl = extractPaymasterUrl(code);
    if (extractedUrl && extractedUrl !== paymasterUrl) {
      setPaymasterUrl(extractedUrl);
    }
  };

  const handlePayWithTokenPresetChange = (code: string) => {
    // Apply the current paymasterUrl to the preset code (keep paymasterUrl intact)
    const updatedCode = paymasterUrl ? updatePaymasterUrl(code, paymasterUrl) : code;
    setPayWithTokenCode(updatedCode);
  };

  // Watch for successful payment results and update getPaymentStatus code with the transaction ID
  useEffect(() => {
    if (
      payExecution.result &&
      'success' in payExecution.result &&
      payExecution.result.success &&
      payExecution.result.id
    ) {
      const transactionId = payExecution.result.id;
      const updatedCode = `import { base } from '@base-org/account'

try {
  const result = await base.getPaymentStatus({
    id: '${transactionId}', // Automatically filled with your recent transaction
    testnet: true
  })
  
  return result;
} catch (error) {
  // This will catch network errors if any occur
  console.error('Failed to check payment status:', error.message);
  throw error;
}`;
      setGetPaymentStatusCode(updatedCode);
    }
  }, [payExecution.result]);

  // Watch for successful payWithToken results and update getPaymentStatus code with the transaction ID
  useEffect(() => {
    if (
      payWithTokenExecution.result &&
      'success' in payWithTokenExecution.result &&
      payWithTokenExecution.result.success &&
      payWithTokenExecution.result.id
    ) {
      const transactionId = payWithTokenExecution.result.id;
      const updatedCode = `import { base } from '@base-org/account'

try {
  const result = await base.getPaymentStatus({
    id: '${transactionId}', // Automatically filled with your recent transaction
    testnet: true
  })
  
  return result;
} catch (error) {
  // This will catch network errors if any occur
  console.error('Failed to check payment status:', error.message);
  throw error;
}`;
      setGetPaymentStatusCode(updatedCode);
    }
  }, [payWithTokenExecution.result]);

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        {/* pay Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>pay Function</h2>
          <p className={styles.sectionDescription}>Send USDC payments on Base</p>

          <div className={styles.playground}>
            <div className={styles.leftColumn}>
              <CodeEditor
                code={payCode}
                onChange={setPayCode}
                onExecute={handlePayExecute}
                onReset={handlePayReset}
                isLoading={payExecution.isLoading}
                includePayerInfo={includePayerInfo}
                onPayerInfoToggle={handlePayerInfoToggle}
                showPayerInfoToggle={true}
              />
              <QuickTips tips={PAY_QUICK_TIPS} />
            </div>

            <div className={styles.rightColumn}>
              <Output
                result={payExecution.result}
                error={payExecution.error}
                consoleOutput={payExecution.consoleOutput}
                isLoading={payExecution.isLoading}
              />
            </div>
          </div>
        </section>

        {/* payWithToken Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>payWithToken Function</h2>
          <p className={styles.sectionDescription}>Send ERC20 token payments on any supported chain</p>

          <div className={styles.playground}>
            <div className={styles.leftColumn}>
              <CodeEditor
                code={payWithTokenCode}
                onChange={handlePayWithTokenCodeChange}
                onExecute={handlePayWithTokenExecute}
                onReset={handlePayWithTokenReset}
                isLoading={payWithTokenExecution.isLoading}
                includePayerInfo={includePayerInfoToken}
                onPayerInfoToggle={handlePayerInfoTokenToggle}
                showPayerInfoToggle={true}
                presets={PAY_WITH_TOKEN_PRESETS}
                transformPresetCode={togglePayerInfoInCode}
                paymasterUrl={paymasterUrl}
                onPaymasterUrlChange={handlePaymasterUrlChange}
                showPaymasterUrl={true}
                onPresetChange={handlePayWithTokenPresetChange}
              />
              <QuickTips tips={PAY_WITH_TOKEN_QUICK_TIPS} />
            </div>

            <div className={styles.rightColumn}>
              <Output
                result={payWithTokenExecution.result}
                error={payWithTokenExecution.error}
                consoleOutput={payWithTokenExecution.consoleOutput}
                isLoading={payWithTokenExecution.isLoading}
              />
            </div>
          </div>
        </section>

        {/* getPaymentStatus Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>getPaymentStatus Function</h2>
          <p className={styles.sectionDescription}>Check the status of a payment</p>

          <div className={styles.playground}>
            <div className={styles.leftColumn}>
              <CodeEditor
                code={getPaymentStatusCode}
                onChange={setGetPaymentStatusCode}
                onExecute={handleGetPaymentStatusExecute}
                onReset={handleGetPaymentStatusReset}
                isLoading={getPaymentStatusExecution.isLoading}
                includePayerInfo={false}
                onPayerInfoToggle={() => {}}
                showPayerInfoToggle={false}
              />
              <QuickTips tips={GET_PAYMENT_STATUS_QUICK_TIPS} />
            </div>

            <div className={styles.rightColumn}>
              <Output
                result={getPaymentStatusExecution.result}
                error={getPaymentStatusExecution.error}
                consoleOutput={getPaymentStatusExecution.consoleOutput}
                isLoading={getPaymentStatusExecution.isLoading}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// Custom layout for this page - no app header
PayPlayground.getLayout = function getLayout(page) {
  return page;
};

export default PayPlayground;
