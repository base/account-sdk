import { useState } from 'react';
import { CodeEditor, Header, Output, QuickTips } from './components';
import { DEFAULT_SUBSCRIBE_CODE, SUBSCRIBE_QUICK_TIPS } from './constants';
import { useCodeExecution } from './hooks';
import styles from './styles/Home.module.css';

function SubscriptionPlayground() {
  const [subscribeCode, setSubscribeCode] = useState(DEFAULT_SUBSCRIBE_CODE);
  const subscribeExecution = useCodeExecution();

  const handleSubscribeExecute = () => {
    subscribeExecution.executeCode(subscribeCode);
  };

  const handleSubscribeReset = () => {
    setSubscribeCode(DEFAULT_SUBSCRIBE_CODE);
    subscribeExecution.reset();
  };

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        {/* subscribe Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>subscribe Function</h2>
          <p className={styles.sectionDescription}>Create spend permissions for recurring USDC payments</p>

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
      </main>
    </div>
  );
}

// Custom layout for this page - no app header
SubscriptionPlayground.getLayout = function getLayout(page) {
  return page;
};

export default SubscriptionPlayground;
