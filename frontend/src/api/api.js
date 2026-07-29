/**
 * API Client - Complete
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8001';

import toast from 'react-hot-toast';

// ============================================
// Token Management
// ============================================

export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};
export const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));
export const removeUser = () => localStorage.removeItem('user');

export const isAuthenticated = () => !!getToken();

// ============================================
// API Client
// ============================================

export const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
        removeUser();
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      }
      const errorMessage = data.message || data.detail || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      toast.error('Network error. Please check your connection.');
    }
    throw error;
  }
};

// ============================================
// Auth API
// ============================================

export const authApi = {
  register: async (data) => {
    const response = await apiFetch('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.success) {
      toast.success('Registration successful! Please login.');
    }
    return response;
  },

  login: async (data) => {
  try {
    const response = await apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // ✅ Check if response has the expected structure
    if (response && response.success && response.data) {
      const { token, user } = response.data;
      
      if (token && user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        toast.success(`Welcome back, ${user.firstName || 'User'}!`);
        return { success: true, data: response.data };
      } else {
        throw new Error('Invalid response: missing token or user');
      }
    } else {
      throw new Error(response.message || 'Login failed');
    }
  } catch (error) {
    toast.error(error.message || 'Login failed. Please check your credentials.');
    throw error;
  }
},
  logout: () => {
    removeToken();
    removeUser();
    toast.success('Logged out successfully');
    window.location.href = '/login';
  },

  getMe: () => apiFetch('/api/v1/auth/me'),
};

// ============================================
// Knowledge Base API
// ============================================

export const kbApi = {
  getAll: () => apiFetch('/api/v1/knowledge-bases'),
  create: (data) => apiFetch('/api/v1/knowledge-bases', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getOne: (id) => apiFetch(`/api/v1/knowledge-bases/${id}`),
  update: (id, data) => apiFetch(`/api/v1/knowledge-bases/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiFetch(`/api/v1/knowledge-bases/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================
// Document API
// ============================================

export const documentApi = {
  // Upload multiple files
  upload: async (kbId, formData, onProgress) => {
    const token = getToken();
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              toast.success(`Uploaded ${response.data.totalUploaded} file(s) successfully`);
            }
            resolve(response);
          } catch (e) {
            reject(new Error('Invalid response from server',e));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || 'Upload failed'));
          } catch (e) {
            reject(new Error(`Upload failed with status ${xhr.status}`,e));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', `${API_BASE_URL}/api/v1/documents/upload/${kbId}`);
      xhr.setRequestHeader('Authorization', token ? `Bearer ${token}` : '');
      xhr.send(formData);
    });
  },

  // Upload ZIP file
  uploadZip: async (kbId, formData, onProgress) => {
    const token = getToken();
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              toast.success(`ZIP imported: ${response.data.totalUploaded} files`);
            }
            resolve(response);
          } catch (e) {
            reject(new Error('Invalid response from server',e));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || 'ZIP upload failed'));
          } catch (e) {
            reject(new Error(`ZIP upload failed with status ${xhr.status}`, e));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', `${API_BASE_URL}/api/v1/documents/import/zip/${kbId}`);
      xhr.setRequestHeader('Authorization', token ? `Bearer ${token}` : '');
      xhr.send(formData);
    });
  },

  getByKB: (kbId) => apiFetch(`/api/v1/documents/${kbId}`),
  getStats: (kbId) => apiFetch(`/api/v1/documents/stats/${kbId}`),
  delete: (docId) => apiFetch(`/api/v1/documents/${docId}`, {
    method: 'DELETE',
  }),
  
  // Trigger AI processing for a document
  triggerProcessing: (docId) => apiFetch(`/api/v1/ai/process/${docId}`, {
    method: 'POST',
  }),
  
  // Get processing status
  getProcessingStatus: (docId) => apiFetch(`/api/v1/ai/status/${docId}`),
};

// ============================================
// Chat API
// ============================================

export const chatApi = {
  ask: async (data) => {
    const token = getToken();
    
    const response = await fetch(`${AI_SERVICE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.detail || result.message || 'Chat failed');
    }
    return result;
  },
  
  search: async (data) => {
    const token = getToken();
    
    const response = await fetch(`${AI_SERVICE_URL}/api/v1/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.detail || result.message || 'Search failed');
    }
    return result;
  },
  
  buildPrompt: async (data) => {
    const token = getToken();
    
    const response = await fetch(`${AI_SERVICE_URL}/api/v1/build-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.detail || result.message || 'Build prompt failed');
    }
    return result;
  },
};