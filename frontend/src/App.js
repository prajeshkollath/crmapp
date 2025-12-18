import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Demo Login Page
function LoginPage() {
  const navigate = useNavigate();

  const handleDemoLogin = () => {
    // Skip OAuth for demo, go straight to dashboard
    navigate('/dashboard');
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
            onClick={handleDemoLogin}
            data-testid="demo-login-btn"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            View Demo Dashboard
          </button>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p className="mb-2">Multi-tenant • RBAC • Audit Logs • Webhooks</p>
            <p className="text-xs">Demo Mode - Configure PostgreSQL for full features</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Component
function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user] = useState({
    name: 'Demo User',
    email: 'demo@example.com',
    picture: 'https://via.placeholder.com/150'
  });

  const handleLogout = () => {
    navigate('/login');
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
            <img
              src={user.picture}
              alt={user.name}
              className="w-10 h-10 rounded-full ring-2 ring-purple-200"
            />
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
        {activeTab === 'contacts' && <ContactsView />}
        {activeTab === 'audit' && <AuditView />}
      </main>
    </div>
  );
}

// Dashboard View
function DashboardView({ user }) {
  return (
    <div className="space-y-6 fade-in" data-testid="dashboard-view">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name?.split(' ')[0]}</h2>
        <p className="text-gray-600">Here's what's happening with your CRM today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Contacts', value: '2', icon: '👥', color: 'from-purple-500 to-purple-600' },
          { label: 'Active Deals', value: '5', icon: '💼', color: 'from-blue-500 to-blue-600' },
          { label: 'Tasks Today', value: '8', icon: '✓', color: 'from-green-500 to-green-600' },
          { label: 'Revenue', value: '$45K', icon: '💰', color: 'from-orange-500 to-orange-600' }
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
      // Fallback to demo data
      setContacts([
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          company: 'Acme Corp',
          tags: ['prospect', 'enterprise']
        },
        {
          id: '2',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          company: 'Tech Inc',
          tags: ['customer', 'vip']
        }
      ]);
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
            {contacts.map((contact) => (
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
            ))}
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
      // Fallback to demo data
      setLogs([
        {
          id: '1',
          action: 'CREATE',
          entity_type: 'contact',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          action: 'UPDATE',
          entity_type: 'contact',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '3',
          action: 'CREATE',
          entity_type: 'contact',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        }
      ]);
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
      </div>
    </div>
  );
}

// Main App
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
