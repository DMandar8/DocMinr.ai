import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, FileText, Hash } from 'lucide-react';
import { kbApi } from '../../api/api';
import toast from 'react-hot-toast';
import styles from './KnowledgeBases.module.css';

export default function KnowledgeBases() {
  const navigate = useNavigate();
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  const loadKnowledgeBases = async () => {
    try {
      const response = await kbApi.getAll();
      if (response.success) {
        setKnowledgeBases(response.data.knowledgeBases || []);
      }
    } catch (error) {
      toast.error('Failed to load knowledge bases', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    setSubmitting(true);
    try {
      const response = await kbApi.create({
        name: formData.name,
        description: formData.description || '',
      });
      
      if (response.success) {
        toast.success('Knowledge Base created!');
        setShowModal(false);
        setFormData({ name: '', description: '' });
        loadKnowledgeBases();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create KB');
    } finally {
      setSubmitting(false);
    }
  };

  const getStats = (kb) => {
    // This could be enhanced with actual stats from API
    return {
      documents: 0,
      chunks: 0,
    };
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Knowledge Bases</h1>
          <p>Manage your document collections</p>
        </div>
        <button 
          className={styles.addBtn}
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} />
          New Knowledge Base
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : knowledgeBases.length === 0 ? (
        <div className={styles.empty}>
          <FolderOpen size={48} />
          <h3>No Knowledge Bases</h3>
          <p>Create your first knowledge base to get started</p>
          <button onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Create One
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {knowledgeBases.map((kb) => (
            <div 
              key={kb.kbId} 
              className={styles.card}
              onClick={() => navigate(`/knowledge-bases/${kb.kbId}`)}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>📁</div>
                <div className={styles.cardInfo}>
                  <h3>{kb.name}</h3>
                  <p>{kb.description || 'No description'}</p>
                </div>
              </div>
              <div className={styles.cardStats}>
                <span>
                  <FileText size={14} />
                  {getStats(kb).documents} Documents
                </span>
                <span>
                  <Hash size={14} />
                  {getStats(kb).chunks} Chunks
                </span>
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.status}>Ready</span>
                <span className={styles.created}>
                  {new Date(kb.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Create Knowledge Base</h2>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className={styles.formGroup}>
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., MySQL Documentation"
                  required
                  autoFocus
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this knowledge base"
                  rows={3}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}