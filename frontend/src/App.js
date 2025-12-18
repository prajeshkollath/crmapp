import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Auth Callback Component
function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/session?session_id=${sessionId}`, {
          method: 'POST',
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Auth failed');

        const userData = await response.json();
        navigate('/dashboard', { state: { user: userData }, replace: true });
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/login');
      }
    };

    processSession();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Authenticating...</p>
      </div>
    </div>
  );
}

// Login Page
function LoginPage() {
  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="max-w-md w-full mx-4">
        <div className="glass-effect rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">CRM Platform</h1>
            <p className="text-gray-600">Production-ready multi-tenant CRM</p>
          </div>
          
          <button
            onClick={handleLogin}
            data-testid="google-login-btn"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Sign in with Google
          </button>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Multi-tenant • RBAC • Audit Logs • Webhooks</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.user) {
      setIsAuthenticated(true);
      setUser(location.state.user);
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Not authenticated');
        const userData = await response.json();
        setIsAuthenticated(true);
        setUser(userData);
      } catch (error) {
        setIsAuthenticated(false);
        navigate('/login');
      }
    };

    checkAuth();
  }, [location, navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return React.cloneElement(children, { user });
}

// Dashboard Component
function Dashboard({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="glass-effect border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              CRM Platform
            </h1>
            <nav className="flex space-x-1">
              {['dashboard', 'contacts', 'audit'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  data-testid={`${tab}-tab`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            {user?.picture && (
              <img
                src={user.picture}
                alt={user.name}
                className="w-10 h-10 rounded-full ring-2 ring-purple-200"
              />
            )}
            <button
              onClick={handleLogout}
              data-testid="logout-btn"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <DashboardView user={user} />}
        {activeTab === 'contacts' && <ContactsView user={user} />}
        {activeTab === 'audit' && <AuditView user={user} />}
      </main>
    </div>
  );
}

// Dashboard View
function DashboardView({ user }) {
  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name?.split(' ')[0]}</h2>
        <p className="text-gray-600">Here's what's happening with your CRM today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Contacts', value: '0', icon: '👥', color: 'from-purple-500 to-purple-600' },
          { label: 'Active Deals', value: '0', icon: '💼', color: 'from-blue-500 to-blue-600' },
          { label: 'Tasks Today', value: '0', icon: '✓', color: 'from-green-500 to-green-600' },
          { label: 'Revenue', value: '$0', icon: '💰', color: 'from-orange-500 to-orange-600' }
        ].map((stat, index) => (
          <div key={index} className="glass-effect rounded-2xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{stat.icon}</span>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} opacity-20`}></div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="glass-effect rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Add Contact', icon: '➕', desc: 'Create new contact' },
            { label: 'New Deal', icon: '💼', desc: 'Start a new deal' },
            { label: 'Schedule Task', icon: '📅', desc: 'Add to calendar' },
            { label: 'Send Email', icon: '📧', desc: 'Email template' }
          ].map((action, index) => (
            <button
              key={index}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
            >
              <div className="text-3xl mb-2">{action.icon}</div>
              <p className="font-semibold text-gray-900 group-hover:text-purple-700">{action.label}</p>
              <p className="text-xs text-gray-500 mt-1">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Contacts View
function ContactsView() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/contacts`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="contacts-list">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Contacts</h2>
          <p className="text-gray-600 mt-1">{contacts.length} total contacts</p>
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all" data-testid="add-contact-btn">
          + Add Contact
        </button>
      </div>

      <div className="glass-effect rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Company</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tags</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {contacts.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  <div className="text-5xl mb-4">📋</div>
                  <p className="text-lg font-medium">No contacts yet</p>
                  <p className="text-sm mt-2">Add your first contact to get started</p>
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-purple-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{contact.first_name} {contact.last_name}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{contact.email}</td>
                  <td className="px-6 py-4 text-gray-600">{contact.company || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {contact.tags?.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">⋮</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Audit View
function AuditView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/audit/logs`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Audit Logs</h2>
        <p className="text-gray-600 mt-1">{logs.length} recent activities</p>
      </div>

      <div className="glass-effect rounded-2xl p-6">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg font-medium">No audit logs yet</p>
            <p className="text-sm mt-2">Activity will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-purple-50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  log.action === 'CREATE' ? 'bg-green-100 text-green-600' :
                  log.action === 'UPDATE' ? 'bg-blue-100 text-blue-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {log.action === 'CREATE' ? '➕' : log.action === 'UPDATE' ? '✏️' : '🗑️'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {log.action} {log.entity_type}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// App Router
function AppRouter() {
  const location = useLocation();
  
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Main App
function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
