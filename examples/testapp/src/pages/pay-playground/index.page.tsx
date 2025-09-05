import { useEffect, useState } from 'react';
import { CodeEditor, Header, Output, QuickTips } from './components';
import {
  DEFAULT_GET_PAYMENT_STATUS_CODE,
  DEFAULT_GET_SUBSCRIPTION_STATUS_CODE,
  DEFAULT_PAY_CODE,
  DEFAULT_SUBSCRIBE_CODE,
  GET_PAYMENT_STATUS_QUICK_TIPS,
  GET_SUBSCRIPTION_STATUS_QUICK_TIPS,
  PAY_CODE_WITH_PAYER_INFO,
  PAY_QUICK_TIPS,
  SUBSCRIBE_QUICK_TIPS,
} from './constants';
import { useCodeExecution } from './hooks';
import styles from './styles/Home.module.css';

function PayPlayground() {
  const [includePayerInfo, setIncludePayerInfo] = useState(false);
  const [payCode, setPayCode] = useState(DEFAULT_PAY_CODE);
  const [getPaymentStatusCode, setGetPaymentStatusCode] = useState(DEFAULT_GET_PAYMENT_STATUS_CODE);
  const [subscribeCode, setSubscribeCode] = useState(DEFAULT_SUBSCRIBE_CODE);
  const [getSubscriptionStatusCode, setGetSubscriptionStatusCode] = useState(DEFAULT_GET_SUBSCRIPTION_STATUS_CODE);

  const payExecution = useCodeExecution();
  const getPaymentStatusExecution = useCodeExecution();
  const subscribeExecution = useCodeExecution();
  const getSubscriptionStatusExecution = useCodeExecution();

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

  const handleSubscribeExecute = () => {
    subscribeExecution.executeCode(subscribeCode);
  };

  const handleSubscribeReset = () => {
    setSubscribeCode(DEFAULT_SUBSCRIBE_CODE);
    subscribeExecution.reset();
  };

  const handleGetSubscriptionStatusExecute = () => {
    getSubscriptionStatusExecution.executeCode(getSubscriptionStatusCode);
  };

  const handleGetSubscriptionStatusReset = () => {
    setGetSubscriptionStatusCode(DEFAULT_GET_SUBSCRIPTION_STATUS_CODE);
    getSubscriptionStatusExecution.reset();
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

  // Watch for successful subscription results and update getSubscriptionStatus code with the subscription ID
  useEffect(() => {
    if (
      subscribeExecution.result &&
      'success' in subscribeExecution.result &&
      subscribeExecution.result.success &&
      subscribeExecution.result.id
    ) {
      const subscriptionId = subscribeExecution.result.id;
      const updatedCode = `import { base } from '@base-org/account'

try {
  const result = await base.subscription.getStatus({
    id: '${subscriptionId}',
    testnet: true
  })
  
  return result;
} catch (error) {
  console.error('Failed to check subscription status:', error.message);
  throw error;
}`;
      setGetSubscriptionStatusCode(updatedCode);
    }
  }, [subscribeExecution.result]);

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

        {/* subscribe Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>base.subscription.subscribe()</h2>
          <p className={styles.sectionDescription}>Create recurring USDC subscriptions on Base</p>

          <div className={styles.playground}>
            <div className={styles.leftColumn}>
              <CodeEditor
                code={subscribeCode}
                onChange={setSubscribeCode}
                onExecute={handleSubscribeExecute}
                onReset={handleSubscribeReset}
                isLoading={subscribeExecution.isLoading}
                includePayerInfo={false}
                onPayerInfoToggle={() => {}}
                showPayerInfoToggle={false}
              />
              <QuickTips tips={SUBSCRIBE_QUICK_TIPS} />
            </div>

            <div className={styles.rightColumn}>
              <Output
                result={subscribeExecution.result}
                error={subscribeExecution.error}
                consoleOutput={subscribeExecution.consoleOutput}
                isLoading={subscribeExecution.isLoading}
              />
            </div>
          </div>
        </section>

        {/* getSubscriptionStatus Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>base.subscription.getStatus()</h2>
          <p className={styles.sectionDescription}>Check the status of a subscription</p>

          <div className={styles.playground}>
            <div className={styles.leftColumn}>
              <CodeEditor
                code={getSubscriptionStatusCode}
                onChange={setGetSubscriptionStatusCode}
                onExecute={handleGetSubscriptionStatusExecute}
                onReset={handleGetSubscriptionStatusReset}
                isLoading={getSubscriptionStatusExecution.isLoading}
                includePayerInfo={false}
                onPayerInfoToggle={() => {}}
                showPayerInfoToggle={false}
              />
              <QuickTips tips={GET_SUBSCRIPTION_STATUS_QUICK_TIPS} />
            </div>

            <div className={styles.rightColumn}>
              <Output
                result={getSubscriptionStatusExecution.result}
                error={getSubscriptionStatusExecution.error}
                consoleOutput={getSubscriptionStatusExecution.consoleOutput}
                isLoading={getSubscriptionStatusExecution.isLoading}
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
