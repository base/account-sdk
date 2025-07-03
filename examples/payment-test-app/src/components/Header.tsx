import styles from './Header.module.css';

export const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.title}>Payment SDK Playground</h1>
        <p className={styles.subtitle}>Test USDC payments on Base network</p>
      </div>
    </header>
  );
};
