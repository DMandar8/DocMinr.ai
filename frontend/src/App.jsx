import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import KnowledgeBases from './pages/KnowledgeBases/KnowledgeBases';
import KnowledgeBaseDetail from './pages/KnowledgeBases/KnowledgeBaseDetail';
import Chat from './pages/Chat/Chat';
import styles from './App.module.css';

const ProtectedRoute = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect from /login to /home if authenticated
  if (isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/home" replace />;
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            borderRadius: '12px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#f8fafc' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#f8fafc' },
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Dashboard />} />
          <Route path="knowledge-bases" element={<KnowledgeBases />} />
          <Route path="knowledge-bases/:id" element={<KnowledgeBaseDetail />} />
          <Route path="chat" element={<Chat />} />
          <Route path="chat/:kbId" element={<Chat />} />
          <Route path="settings" element={<div>Settings</div>} />
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </>
  );
}

export default App;