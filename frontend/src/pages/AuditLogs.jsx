import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { FileText, Plus, Edit, Trash2, Search, Filter } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

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
      } else if (response.status === 401) {
        // Demo mode - show sample data
        setLogs([
          {
            id: '1',
            action: 'CREATE',
            entity_type: 'Contact',
            entity_id: 'demo-1',
            timestamp: new Date().toISOString(),
            user_email: 'demo@example.com',
            changes: { first_name: { old: null, new: 'John' }, last_name: { old: null, new: 'Doe' } }
          },
          {
            id: '2',
            action: 'UPDATE',
            entity_type: 'Contact',
            entity_id: 'demo-2',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            user_email: 'demo@example.com',
            changes: { email: { old: 'old@email.com', new: 'new@email.com' } }
          },
          {
            id: '3',
            action: 'DELETE',
            entity_type: 'Contact',
            entity_id: 'demo-3',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            user_email: 'demo@example.com',
            changes: {}
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE':
        return <Plus className="h-4 w-4" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4" />;
      case 'DELETE':
        return <Trash2 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionStyles = (action) => {
    switch (action) {
      case 'CREATE':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' };
      case 'UPDATE':
        return { bg: 'bg-blue-100', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700 hover:bg-blue-100' };
      case 'DELETE':
        return { bg: 'bg-red-100', text: 'text-red-700', badge: 'bg-red-100 text-red-700 hover:bg-red-100' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700 hover:bg-gray-100' };
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.action === filter;
    const matchesSearch = !search || 
      log.entity_type.toLowerCase().includes(search.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Audit Logs"
        subtitle={`${filteredLogs.length} activities recorded`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Audit Logs' },
        ]}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by entity or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="CREATE">Create</SelectItem>
            <SelectItem value="UPDATE">Update</SelectItem>
            <SelectItem value="DELETE">Delete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No audit logs</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Activity will appear here as changes are made to your CRM data.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const styles = getActionStyles(log.action);
            return (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${styles.bg} ${styles.text} shrink-0`}>
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="secondary" className={styles.badge}>
                          {log.action}
                        </Badge>
                        <span className="font-medium">{log.entity_type}</span>
                        <span className="text-muted-foreground text-sm">#{log.entity_id?.slice(0, 8)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{log.user_email || 'System'}</span>
                        <span>•</span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      {log.changes && Object.keys(log.changes).length > 0 && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Changes</p>
                          <div className="space-y-1">
                            {Object.entries(log.changes).map(([key, value]) => (
                              <div key={key} className="text-sm font-mono">
                                <span className="text-muted-foreground">{key}:</span>{' '}
                                <span className="text-red-600 line-through">{value.old || 'null'}</span>{' '}
                                <span className="text-muted-foreground">→</span>{' '}
                                <span className="text-emerald-600">{value.new}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
