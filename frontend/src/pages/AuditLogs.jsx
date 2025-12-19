import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import { FileText, Plus, Edit, Trash2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuditLogs = () => {
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
      } else if (response.status === 401) {
        // Use empty data for unauthorized
        setLogs([]);
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
        return <Plus size={20} />;
      case 'UPDATE':
        return <Edit size={20} />;
      case 'DELETE':
        return <Trash2 size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
        return '#10B981';
      case 'UPDATE':
        return '#002FA7';
      case 'DELETE':
        return '#EF4444';
      default:
        return '#71717A';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Audit Logs
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {logs.length} activities recorded
      </Typography>

      {logs.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <FileText size={48} style={{ color: '#71717A', margin: '0 auto 16px' }} />
          <Typography variant="h6" gutterBottom>
            No audit logs yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Activity will appear here as changes are made
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {logs.map((log) => (
            <Card key={log.id} sx={{ position: 'relative', overflow: 'visible' }}>
              <CardContent sx={{ display: 'flex', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: `${getActionColor(log.action)}15`,
                    color: getActionColor(log.action),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getActionIcon(log.action)}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Chip
                      label={log.action}
                      size="small"
                      sx={{
                        bgcolor: `${getActionColor(log.action)}15`,
                        color: getActionColor(log.action),
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {log.entity_type}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(log.timestamp).toLocaleString()}
                  </Typography>
                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <Box sx={{ mt: 1, p: 1.5, bgcolor: '#F4F4F5', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Changes:
                      </Typography>
                      {Object.entries(log.changes).map(([key, value]) => (
                        <Typography key={key} variant="caption" sx={{ display: 'block', fontFamily: 'monospace' }}>
                          {key}: {value.old} → {value.new}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AuditLogs;
