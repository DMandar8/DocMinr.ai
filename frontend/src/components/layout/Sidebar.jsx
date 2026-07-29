import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Settings, 
  Sparkles,
  LogOut,
  ChevronDown,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react';
import minr from '/assets/main_logo.jpg'
import { kbApi } from '../../api/api';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    loadKnowledgeBases();
  }, [location.pathname]); // ✅ Reload when navigating

  const loadKnowledgeBases = async () => {
    try {
      const response = await kbApi.getAll();
      if (response.success) {
        setKnowledgeBases(response.data.knowledgeBases || []);
      }
    } catch (error) {
      console.error('Failed to load KBs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        {/* <Sparkles className={styles.brandIcon} /> */}
        <img src={minr} alt="" height={140} width={200}/>
        {/* <span className={styles.brandName}>DocMinr</span>
        <span className={styles.brandTag}>ai</span> */}
      </div>

      <nav className={styles.nav}>
        <NavLink 
          to="/home" 
          className={({ isActive }) => 
            `${styles.navLink} ${isActive ? styles.active : ''}`
          }
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink 
          to="/knowledge-bases" 
          className={({ isActive }) => 
            `${styles.navLink} ${isActive ? styles.active : ''}`
          }
        >
          <FolderOpen size={20} />
          <span>Knowledge Bases</span>
        </NavLink>
      </nav>

      <div className={styles.kbSection}>
        <button 
          className={styles.kbToggle}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span>Your KBs</span>
        </button>
        
        {expanded && (
          <div className={styles.kbList}>
            {loading ? (
              <div className={styles.kbLoading}>Loading...</div>
            ) : knowledgeBases.length === 0 ? (
              <div className={styles.kbEmpty}>No KBs yet</div>
            ) : (
              knowledgeBases.map((kb) => (
                <NavLink
                  key={kb.kbId}
                  to={`/knowledge-bases/${kb.kbId}`}
                  className={({ isActive }) => 
                    `${styles.kbLink} ${isActive ? styles.active : ''}`
                  }
                >
                  <span className={styles.kbIcon}>📁</span>
                  <span className={styles.kbName}>{kb.name}</span>
                </NavLink>
              ))
            )}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <NavLink 
          to="/settings" 
          className={({ isActive }) => 
            `${styles.navLink} ${isActive ? styles.active : ''}`
          }
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
        
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}