import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import { Plus, Search, Edit, Trash2, Mail, Phone, Building } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Demo mode helpers
const DEMO_STORAGE_KEY = 'crm_demo_contacts';

const getDemoContacts = () => {
  const stored = localStorage.getItem(DEMO_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Return some initial demo data
  return [
    {
      id: 'demo-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      company: 'Acme Corp',
      tags: ['prospect', 'enterprise'],
      tenant_id: 'demo-tenant-123'
    },
    {
      id: 'demo-2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@techcorp.com',
      phone: '+0987654321',
      company: 'Tech Corp',
      tags: ['customer', 'vip'],
      tenant_id: 'demo-tenant-123'
    }
  ];
};

const saveDemoContacts = (contacts) => {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(contacts));
};

const ContactsList = () => {
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingContact, setDeletingContact] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    tags: '',
  });

  const fetchContacts = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/contacts?page=${page + 1}&page_size=${rowsPerPage}${search ? '&search=' + search : ''}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
        setTotal(data.total || 0);
        setIsDemoMode(false);
      } else if (response.status === 401) {
        // Use demo mode
        setIsDemoMode(true);
        const demoContacts = getDemoContacts();
        const filtered = search 
          ? demoContacts.filter(c => 
              c.first_name.toLowerCase().includes(search.toLowerCase()) ||
              c.last_name.toLowerCase().includes(search.toLowerCase()) ||
              c.email.toLowerCase().includes(search.toLowerCase())
            )
          : demoContacts;
        
        const start = page * rowsPerPage;
        const end = start + rowsPerPage;
        setContacts(filtered.slice(start, end));
        setTotal(filtered.length);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      // Fallback to demo mode
      setIsDemoMode(true);
      const demoContacts = getDemoContacts();
      const start = page * rowsPerPage;
      const end = start + rowsPerPage;
      setContacts(demoContacts.slice(start, end));
      setTotal(demoContacts.length);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleOpenDialog = (contact = null) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone || '',
        company: contact.company || '',
        tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : '',
      });
    } else {
      setEditingContact(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        tags: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingContact(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: '',
      tags: '',
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    if (isDemoMode) {
      // Demo mode - save to localStorage
      const demoContacts = getDemoContacts();
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        tenant_id: 'demo-tenant-123'
      };

      if (editingContact) {
        const index = demoContacts.findIndex(c => c.id === editingContact.id);
        if (index !== -1) {
          demoContacts[index] = { ...editingContact, ...payload };
        }
      } else {
        payload.id = 'demo-' + Date.now();
        demoContacts.push(payload);
      }
      
      saveDemoContacts(demoContacts);
      showSnackbar(
        editingContact ? 'Contact updated successfully' : 'Contact created successfully',
        'success'
      );
      handleCloseDialog();
      fetchContacts();
      return;
    }

    // Real API mode
    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      };

      const url = editingContact
        ? `${API_URL}/api/contacts/${editingContact.id}`
        : `${API_URL}/api/contacts`;

      const method = editingContact ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showSnackbar(
          editingContact ? 'Contact updated successfully' : 'Contact created successfully',
          'success'
        );
        handleCloseDialog();
        fetchContacts();
      } else {
        const error = await response.json();
        showSnackbar(error.detail || 'Error saving contact', 'error');
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      showSnackbar('Error saving contact', 'error');
    }
  };

  const handleDeleteClick = (contact) => {
    setDeletingContact(contact);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingContact) return;

    if (isDemoMode) {
      // Demo mode - remove from localStorage
      const demoContacts = getDemoContacts();
      const filtered = demoContacts.filter(c => c.id !== deletingContact.id);
      saveDemoContacts(filtered);
      showSnackbar('Contact deleted successfully', 'success');
      fetchContacts();
      setOpenDeleteDialog(false);
      setDeletingContact(null);
      return;
    }

    // Real API mode
    try {
      const response = await fetch(`${API_URL}/api/contacts/${deletingContact.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        showSnackbar('Contact deleted successfully', 'success');
        fetchContacts();
      } else {
        showSnackbar('Error deleting contact', 'error');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      showSnackbar('Error deleting contact', 'error');
    }
    
    setOpenDeleteDialog(false);
    setDeletingContact(null);
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
    setDeletingContact(null);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Contacts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {total} total contacts
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => handleOpenDialog()}
          data-testid="add-contact-btn"
        >
          Add Contact
        </Button>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} />
              </InputAdornment>
            ),
          }}
          data-testid="search-input"
        />
      </Box>

      {/* Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table data-testid="contacts-table">
            <TableHead>
              <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>
                  Name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>
                  Email
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>
                  Phone
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>
                  Company
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>
                  Tags
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="text.secondary">
                      No contacts found
                    </Typography>
                    <Button
                      variant="text"
                      onClick={() => handleOpenDialog()}
                      sx={{ mt: 2 }}
                    >
                      Add your first contact
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {contact.first_name} {contact.last_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Mail size={14} color="#71717A" />
                        <Typography variant="body2" color="text.secondary">
                          {contact.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {contact.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Phone size={14} color="#71717A" />
                          <Typography variant="body2" color="text.secondary">
                            {contact.phone}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.company && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Building size={14} color="#71717A" />
                          <Typography variant="body2" color="text.secondary">
                            {contact.company}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {Array.isArray(contact.tags) && contact.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            sx={{ bgcolor: '#E0E7FF', color: '#002FA7', fontSize: '0.7rem' }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(contact)}
                        data-testid={`edit-contact-${contact.id}`}
                      >
                        <Edit size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(contact)}
                        data-testid={`delete-contact-${contact.id}`}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingContact ? 'Edit Contact' : 'Add New Contact'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company"
                name="company"
                value={formData.company}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g. prospect, vip, customer"
                helperText="Separate tags with commas"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.first_name || !formData.last_name || !formData.email}
            data-testid="submit-contact-btn"
          >
            {editingContact ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContactsList;
