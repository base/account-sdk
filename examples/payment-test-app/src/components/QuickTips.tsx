import { PAY_QUICK_TIPS } from '../constants/playground';
import styles from './QuickTips.module.css';

// Helper function to safely render tips with links
const renderTip = (tip: string) => {
  // Check if the tip contains an HTML link
  const linkMatch = tip.match(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/);
  
  if (linkMatch) {
    const [fullMatch, href, text] = linkMatch;
    const parts = tip.split(fullMatch);
    
    return (
      <>
        {parts[0]}
        <a href={href} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
        {parts[1]}
      </>
    );
  }
  
  return tip;
};

export const QuickTips = () => {
  return (
    <div className={styles.infoSection}>
      <div className={styles.infoCard}>
        <h3 className={styles.infoTitle}>
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          Quick Tips
        </h3>
        <ul className={styles.infoList}>
          {PAY_QUICK_TIPS.map((tip, index) => (
            <li key={index}>{renderTip(tip)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
