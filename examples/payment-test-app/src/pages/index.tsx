import { useEffect, useState } from 'react'
import { CodeEditor, Header, Output, QuickTips } from '../components'
import { DEFAULT_PAY_CODE } from '../constants'
import { useCodeExecution } from '../hooks'
import styles from '../styles/Home.module.css'

export default function Home() {
  const [payCode, setPayCode] = useState(DEFAULT_PAY_CODE)
  
  const payExecution = useCodeExecution()

  const handlePayExecute = () => {
    payExecution.executeCode(payCode)
  }

  const handlePayReset = () => {
    setPayCode(DEFAULT_PAY_CODE)
    payExecution.reset()
  }

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        {/* pay Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>pay Function</h2>
          <p className={styles.sectionDescription}>
            Send USDC payments to any address on Base
          </p>
          
          <div className={styles.playground}>
            <CodeEditor
              code={payCode}
              onChange={setPayCode}
              onExecute={handlePayExecute}
              onReset={handlePayReset}
              isLoading={payExecution.isLoading}
            />

            <Output
              result={payExecution.result}
              error={payExecution.error}
              consoleOutput={payExecution.consoleOutput}
              isLoading={payExecution.isLoading}
            />
          </div>

          <QuickTips activeTab="pay" />
        </section>
      </main>
    </div>
  )
} 