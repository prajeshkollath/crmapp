import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from '../components/layout';
import { FilteredTable } from '../components/common';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { useToast } from '../hooks/use-toast';
import { Toaster } from '../components/ui/toaster';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Building, 
  UserPlus,
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Demo mode helpers
const DEMO_STORAGE_KEY = 'crm_demo_contacts';

const getDemoContacts = () => {
  const stored = localStorage.getItem(DEMO_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Return initial demo data
  return [
    {
      id: 'demo-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      company: 'Acme Corporation',
      status: 'active',
      tags: ['prospect', 'enterprise'],
      tenant_id: 'demo-tenant-123',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@techcorp.com',
      phone: '+1 (555) 987-6543',
      company: 'Tech Corp',
      status: 'active',
      tags: ['customer', 'vip'],
      tenant_id: 'demo-tenant-123',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-3',
      first_name: 'Robert',
      last_name: 'Johnson',
      email: 'robert.j@innovate.io',
      phone: '+1 (555) 456-7890',
      company: 'Innovate Inc',
      status: 'inactive',
      tags: ['lead'],
      tenant_id: 'demo-tenant-123',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-4',
      first_name: 'Emily',
      last_name: 'Davis',
      email: 'emily.davis@startup.co',
      phone: '+1 (555) 321-0987',
      company: 'Startup Co',
      status: 'pending',
      tags: ['prospect'],
      tenant_id: 'demo-tenant-123',
      created_at: new Date().toISOString(),
    },
  ];
};

const saveDemoContacts = (contacts) => {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(contacts));
};

const ContactsList = ({ className }) => {
  const { token } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [globalSearch, setGlobalSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingContact, setDeletingContact] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    status: 'active',
    tags: '',
  });

  // Function to load demo mode data
  const loadDemoData = useCallback(() => {
    let demoContacts = getDemoContacts();
    
    // Apply global search
    if (globalSearch) {
      const search = globalSearch.toLowerCase();
      demoContacts = demoContacts.filter(c =>
        c.first_name.toLowerCase().includes(search) ||
        c.last_name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.company?.toLowerCase().includes(search)
      );
    }

    // Apply column filters
    if (filters.name) {
      const nameFilter = filters.name.toLowerCase();
      demoContacts = demoContacts.filter(c =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(nameFilter)
      );
    }
    if (filters.email) {
      demoContacts = demoContacts.filter(c =>
        c.email.toLowerCase().includes(filters.email.toLowerCase())
      );
    }
    if (filters.company) {
      demoContacts = demoContacts.filter(c =>
        c.company?.toLowerCase().includes(filters.company.toLowerCase())
      );
    }
    if (filters.status && filters.status !== 'all') {
      demoContacts = demoContacts.filter(c => c.status === filters.status);
    }
    
    const start = page * pageSize;
    const end = start + pageSize;
    setContacts(demoContacts.slice(start, end));
    setTotal(demoContacts.length);
  }, [globalSearch, filters, page, pageSize]);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(
        `${API_URL}/api/contacts?page=${page + 1}&page_size=${pageSize}${globalSearch ? '&search=' + globalSearch : ''}`,
        { 
          headers,
          credentials: 'include' 
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
        setTotal(data.total || 0);
        setIsDemoMode(false);
      } else if (response.status === 401) {
        // Use demo mode if not authenticated
        setIsDemoMode(true);
        loadDemoData();
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setIsDemoMode(true);
      loadDemoData();
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, globalSearch, loadDemoData, token]);

  useEffect(() => {
    if (isDemoMode) {
      loadDemoData();
      setLoading(false);
    } else {
      fetchContacts();
    }
  }, [isDemoMode, loadDemoData, fetchContacts]);

  // Re-apply filters when they change in demo mode
  useEffect(() => {
    if (isDemoMode) {
      loadDemoData();
    }
  }, [isDemoMode, filters, loadDemoData]);

  const handleOpenDialog = (contact = null) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone || '',
        company: contact.company || '',
        status: contact.status || 'active',
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
        status: 'active',
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
      status: 'active',
      tags: '',
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isDemoMode) {
      // Demo mode - save to localStorage
      const demoContacts = getDemoContacts();
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        tenant_id: 'demo-tenant-123',
        created_at: new Date().toISOString(),
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
      toast({
        title: editingContact ? 'Contact updated' : 'Contact created',
        description: `${formData.first_name} ${formData.last_name} has been ${editingContact ? 'updated' : 'added'} successfully.`,
      });
      handleCloseDialog();
      loadDemoData();
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

      const response = await fetch(url, {
        method: editingContact ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: editingContact ? 'Contact updated' : 'Contact created',
          description: `${formData.first_name} ${formData.last_name} has been ${editingContact ? 'updated' : 'added'} successfully.`,
        });
        handleCloseDialog();
        fetchContacts();
      } else {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.detail || 'Failed to save contact',
        });
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save contact',
      });
    }
  };

  const handleDeleteClick = (contact) => {
    setDeletingContact(contact);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingContact) return;

    if (isDemoMode) {
      const demoContacts = getDemoContacts();
      const filtered = demoContacts.filter(c => c.id !== deletingContact.id);
      saveDemoContacts(filtered);
      toast({
        title: 'Contact deleted',
        description: `${deletingContact.first_name} ${deletingContact.last_name} has been removed.`,
      });
      setOpenDeleteDialog(false);
      setDeletingContact(null);
      loadDemoData();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/contacts/${deletingContact.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'Contact deleted',
          description: `${deletingContact.first_name} ${deletingContact.last_name} has been removed.`,
        });
        fetchContacts();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete contact',
        });
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete contact',
      });
    }
    
    setOpenDeleteDialog(false);
    setDeletingContact(null);
  };

  // Table columns configuration
  const columns = useMemo(() => [
    {
      id: 'name',
      header: 'Name',
      minWidth: '200px',
      filterPlaceholder: 'Filter name...',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
            {row.first_name?.charAt(0)}{row.last_name?.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{row.first_name} {row.last_name}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      minWidth: '220px',
      filterPlaceholder: 'Filter email...',
      render: (row) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>{row.email}</span>
        </div>
      ),
    },
    {
      id: 'phone',
      header: 'Phone',
      minWidth: '160px',
      filterPlaceholder: 'Filter phone...',
      render: (row) => row.phone ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{row.phone}</span>
        </div>
      ) : (
        <span className="text-muted-foreground/50">-</span>
      ),
    },
    {
      id: 'company',
      header: 'Company',
      minWidth: '180px',
      filterPlaceholder: 'Filter company...',
      render: (row) => row.company ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building className="h-4 w-4" />
          <span>{row.company}</span>
        </div>
      ) : (
        <span className="text-muted-foreground/50">-</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      width: '120px',
      filterType: 'select',
      filterOptions: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
      ],
      render: (row) => {
        const status = row.status || 'active';
        const variants = {
          active: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
          inactive: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
          pending: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
        };
        return (
          <Badge variant="secondary" className={variants[status]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      id: 'tags',
      header: 'Tags',
      minWidth: '200px',
      filterable: false,
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {Array.isArray(row.tags) && row.tags.length > 0 ? (
            row.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground/50">-</span>
          )}
        </div>
      ),
    },
  ], []);

  const rowActions = useMemo(() => [
    {
      label: 'Edit',
      icon: Edit,
      onClick: handleOpenDialog,
    },
    {
      label: 'Delete',
      icon: Trash2,
      destructive: true,
      onClick: handleDeleteClick,
    },
  ], []);

  return (
    <div className={`flex flex-col h-full overflow-hidden p-4 ${className || ''}`}>
      <Toaster />
      
      {/* Header Section - Fixed Height */}
      <div className="shrink-0 mb-3">
        <Header
          title="Contacts"
          subtitle={`${total} total contacts`}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Contacts' },
          ]}
          actionLabel="Add Contact"
          actionIcon={Plus}
          onAction={() => handleOpenDialog()}
          compact
        />

        {/* Global Search and Demo Badge Row */}
        <div className="flex items-center gap-4 mt-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search contacts..."
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setPage(0);
              }}
              className="pl-10 h-9 w-64"
              data-testid="search-input"
            />
          </div>
          {isDemoMode && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 shrink-0">
              Demo Mode
            </Badge>
          )}
        </div>
      </div>

      {/* Filtered Table - Fills Remaining Space */}
      <div className="flex-1 min-h-0">
        <FilteredTable
          columns={columns}
          data={contacts}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
          filters={filters}
          onFilterChange={setFilters}
          onClearFilters={() => setFilters({})}
          rowActions={rowActions}
          fillHeight
          emptyState={
            <div className="text-center py-6">
              <UserPlus className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-base font-medium text-foreground">No contacts found</p>
              <p className="text-sm text-muted-foreground mt-1 mb-3">
                Get started by adding your first contact
              </p>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>
          }
        />
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingContact ? 'Edit Contact' : 'Add New Contact'}
            </DialogTitle>
            <DialogDescription>
              {editingContact
                ? 'Update the contact information below.'
                : 'Fill in the details to create a new contact.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-4">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                />
              </div>

              {/* Phone & Company Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Acme Inc"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="prospect, vip, customer"
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple tags with commas
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!formData.first_name || !formData.last_name || !formData.email}
                data-testid="submit-contact-btn"
              >
                {editingContact ? 'Update Contact' : 'Create Contact'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-medium text-foreground">
                {deletingContact?.first_name} {deletingContact?.last_name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingContact(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContactsList;
