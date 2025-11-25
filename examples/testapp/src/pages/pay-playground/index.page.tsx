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
  PAY_WITH_TOKEN_QUICK_TIPS,
} from './constants';
import { useCodeExecution } from './hooks';
import styles from './styles/Home.module.css';

function PayPlayground() {
  const [includePayerInfo, setIncludePayerInfo] = useState(false);
  const [includePayWithTokenPayerInfo, setIncludePayWithTokenPayerInfo] = useState(false);
  const [payCode, setPayCode] = useState(DEFAULT_PAY_CODE);
  const [payWithTokenCode, setPayWithTokenCode] = useState(DEFAULT_PAY_WITH_TOKEN_CODE);
  const [getPaymentStatusCode, setGetPaymentStatusCode] = useState(DEFAULT_GET_PAYMENT_STATUS_CODE);

  const payExecution = useCodeExecution();
  const payWithTokenExecution = useCodeExecution();
  const getPaymentStatusExecution = useCodeExecution();

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

  const handlePayWithTokenExecute = () => {
    payWithTokenExecution.executeCode(payWithTokenCode);
  };

  const handlePayWithTokenReset = () => {
    setIncludePayWithTokenPayerInfo(false);
    setPayWithTokenCode(DEFAULT_PAY_WITH_TOKEN_CODE);
    payWithTokenExecution.reset();
  };

  const handlePayWithTokenPayerInfoToggle = (checked: boolean) => {
    setIncludePayWithTokenPayerInfo(checked);
    const newCode = checked ? PAY_WITH_TOKEN_CODE_WITH_PAYER_INFO : DEFAULT_PAY_WITH_TOKEN_CODE;
    setPayWithTokenCode(newCode);
    payWithTokenExecution.reset();
  };

  const handleGetPaymentStatusExecute = () => {
    getPaymentStatusExecution.executeCode(getPaymentStatusCode);
  };

  const handleGetPaymentStatusReset = () => {
    setGetPaymentStatusCode(DEFAULT_GET_PAYMENT_STATUS_CODE);
    getPaymentStatusExecution.reset();
  };

  // Watch for successful payment results and update getPaymentStatus code with the transaction ID
  useEffect(() => {
    const result = payExecution.result || payWithTokenExecution.result;
    if (result && 'success' in result && result.success && result.id) {
      const transactionId = result.id;
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
  }, [payExecution.result, payWithTokenExecution.result]);

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
          <p className={styles.sectionDescription}>
            Send any ERC20 token payment on Base with paymaster sponsorship
          </p>

          <div className={styles.playground}>
            <div className={styles.leftColumn}>
              <CodeEditor
                code={payWithTokenCode}
                onChange={setPayWithTokenCode}
                onExecute={handlePayWithTokenExecute}
                onReset={handlePayWithTokenReset}
                isLoading={payWithTokenExecution.isLoading}
                includePayerInfo={includePayWithTokenPayerInfo}
                onPayerInfoToggle={handlePayWithTokenPayerInfoToggle}
                showPayerInfoToggle={true}
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
