import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Send, 
  Loader2, 
  ChevronLeft,
  Zap,
  CheckCircle,
  AlertCircle,
  FolderArchive
} from 'lucide-react';
import { kbApi, documentApi, chatApi } from '../../api/api';
import toast from 'react-hot-toast';
import styles from './KnowledgeBaseDetail.module.css';

export default function KnowledgeBaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kb, setKb] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [processingDocs, setProcessingDocs] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadKnowledgeBase();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadKnowledgeBase = async () => {
    try {
      const response = await kbApi.getOne(id);
      if (response.success) {
        setKb(response.data.knowledgeBase);
      }
    } catch (error) {
      toast.error('Failed to load knowledge base');
      navigate('/knowledge-bases');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatApi.ask({
        query: input,
        kb_id: parseInt(id),
        top_k: 5,
        template: 'qa'
      });

      if (response.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.answer,
          sources: response.sources || [],
          chunks_used: response.chunks_used
        }]);
      } else {
        toast.error(response.error || 'Failed to get response');
      }
    } catch (error) {
      toast.error(error.message || 'Chat failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    const isZip = file.name.toLowerCase().endsWith('.zip');
    formData.append(isZip ? 'file' : 'files', file);

    setUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadResult(null);

    try {
      let response;
      if (isZip) {
        response = await documentApi.uploadZip(parseInt(id), formData, (progress) => {
          setUploadProgress(progress);
        });
      } else {
        response = await documentApi.upload(parseInt(id), formData, (progress) => {
          setUploadProgress(progress);
        });
      }

      if (response.success) {
        setUploadStatus('processing');
        setUploadResult(response.data);
        
        const docIds = response.data.uploaded?.map(d => d.docId) || [];
        
        if (docIds.length > 0) {
          setProcessingDocs(docIds);
          
          for (const docId of docIds) {
            try {
              await documentApi.triggerProcessing(docId);
            } catch (err) {
              console.error(`Failed to trigger processing for doc ${docId}:`, err);
            }
          }
          
          setTimeout(() => {
            setUploadStatus('complete');
            setProcessingDocs([]);
            toast.success('All documents processed successfully!');
          }, 3000);
        } else {
          setUploadStatus('complete');
        }
        
        setTimeout(() => {
          setShowUpload(false);
          setUploadStatus(null);
          setUploadProgress(0);
        }, 3000);
      }
    } catch (error) {
      setUploadStatus('error');
      toast.error(error.message || 'Upload failed');
      setTimeout(() => {
        setUploadStatus(null);
        setUploadProgress(0);
      }, 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    e.target.value = '';
  };

  if (!kb) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            className={styles.backBtn}
            onClick={() => navigate('/knowledge-bases')}
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <div className={styles.headerInfo}>
            <h1>{kb.name}</h1>
            <p>{kb.description || 'No description'}</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.uploadBtn}
            onClick={() => setShowUpload(true)}
          >
            <Upload size={18} />
            Upload Files
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className={styles.chatContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyChat}>
            <Zap size={48} />
            <h3>Ask about your documents</h3>
            <p>Upload documents and start asking questions</p>
          </div>
        ) : (
          <div className={styles.messages}>
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`${styles.message} ${msg.role === 'user' ? styles.user : styles.assistant}`}
              >
                <div className={styles.messageAvatar}>
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className={styles.messageContent}>
                  <div className={styles.messageText}>{msg.content}</div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className={styles.sources}>
                      <details>
                        <summary>📚 Sources ({msg.sources.length})</summary>
                        {msg.sources.map((source, i) => (
                          <div key={i} className={styles.source}>
                            <span className={styles.sourceScore}>
                              {Math.round(source.score * 100)}%
                            </span>
                            <span className={styles.sourceText}>
                              {source.text.slice(0, 150)}...
                            </span>
                          </div>
                        ))}
                      </details>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className={`${styles.message} ${styles.assistant}`}>
                <div className={styles.messageAvatar}>🤖</div>
                <div className={styles.messageContent}>
                  <div className={styles.typing}>
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input */}
        <div className={styles.inputArea}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question about your documents..."
            disabled={loading}
          />
          <button 
            onClick={handleSend} 
            disabled={!input.trim() || loading}
          >
            {loading ? <Loader2 size={20} className={styles.spinner} /> : <Send size={20} />}
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className={styles.modalOverlay} onClick={() => {
          if (!uploading) setShowUpload(false);
        }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Upload Documents</h2>
              {!uploading && (
                <button onClick={() => setShowUpload(false)}>✕</button>
              )}
            </div>

            {uploadStatus === null && (
              <div className={styles.uploadOptions}>
                <div className={styles.uploadArea}>
                  <input
                    type="file"
                    id="fileInput"
                    onChange={handleFileSelect}
                    accept=".pdf,.docx,.txt"
                    disabled={uploading}
                  />
                  <label htmlFor="fileInput" className={styles.uploadDropzone}>
                    <Upload size={32} />
                    <span>Drop files here or click to browse</span>
                    <span className={styles.uploadHint}>PDF, DOCX, TXT (Max 50MB each)</span>
                  </label>
                </div>

                <div className={styles.uploadDivider}>
                  <span>OR</span>
                </div>

                <div className={styles.uploadArea}>
                  <input
                    type="file"
                    id="zipInput"
                    onChange={handleFileSelect}
                    accept=".zip"
                    disabled={uploading}
                  />
                  <label htmlFor="zipInput" className={styles.uploadDropzone}>
                    <FolderArchive size={32} />
                    <span>Upload ZIP file</span>
                    <span className={styles.uploadHint}>Upload multiple files at once</span>
                  </label>
                </div>
              </div>
            )}

            {uploadStatus === 'uploading' && (
              <div className={styles.progressContainer}>
                <div className={styles.progressHeader}>
                  <Loader2 size={24} className={styles.spinner} />
                  <span>Uploading...</span>
                  <span className={styles.progressPercent}>{uploadProgress}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadStatus === 'processing' && (
              <div className={styles.progressContainer}>
                <div className={styles.progressHeader}>
                  <Loader2 size={24} className={styles.spinner} />
                  <span>Processing documents...</span>
                  <span className={styles.progressPercent}>
                    {processingDocs.length} files
                  </span>
                </div>
                <div className={styles.processingStatus}>
                  <div className={styles.processingItem}>
                    <span>📄 Extracting text</span>
                    <Loader2 size={16} className={styles.spinner} />
                  </div>
                  <div className={styles.processingItem}>
                    <span>🧠 Generating embeddings</span>
                    <Loader2 size={16} className={styles.spinner} />
                  </div>
                  <div className={styles.processingItem}>
                    <span>💾 Indexing in Qdrant</span>
                    <Loader2 size={16} className={styles.spinner} />
                  </div>
                </div>
              </div>
            )}

            {uploadStatus === 'complete' && (
              <div className={styles.completeContainer}>
                <CheckCircle size={48} className={styles.completeIcon} />
                <h3>Upload Complete!</h3>
                <p>
                  {uploadResult?.totalUploaded || 0} files uploaded and indexed successfully
                </p>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className={styles.completeContainer}>
                <AlertCircle size={48} className={styles.errorIcon} />
                <h3>Upload Failed</h3>
                <p>Please try again or check the file format</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}