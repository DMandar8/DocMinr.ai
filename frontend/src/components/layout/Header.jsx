import { Bell, Search, Menu } from 'lucide-react';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.menuBtn}>
          <Menu size={20} />
        </button>
        <div className={styles.search}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search..."
            className={styles.searchInput}
          />
        </div>
      </div>
      <div className={styles.right}>
        <button className={styles.notificationBtn}>
          <Bell size={20} />
          <span className={styles.badge}>3</span>
        </button>
      </div>
    </header>
  );
}