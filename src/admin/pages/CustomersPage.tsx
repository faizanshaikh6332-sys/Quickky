import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Search, Download, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '@/admin/components/AdminLayout';
import DataTable from '@/admin/components/DataTable';
import ConfirmModal from '@/admin/components/ConfirmModal';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/admin/lib/adminSupabase';
import { useNavigate } from 'react-router-dom';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'blocked'>('all');
  const [confirmBlock, setConfirmBlock] = useState<{ id: string, status: boolean } | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerDetails, setCustomerDetails] = useState<{ orders: any[], addresses: any[] }>({ orders: [], addresses: [] });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    // In a real app, you might join with admin_roles to exclude them, or just rely on role='customer'
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch customers');
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  };

  const handleBlockToggle = async () => {
    if (!confirmBlock) return;
    const { id, status } = confirmBlock;
    const { error } = await supabase.from('profiles').update({ is_blocked: !status }).eq('id', id);
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(status ? 'Customer unblocked' : 'Customer blocked');
      await logAdminAction('update', 'profiles', id);
      setConfirmBlock(null);
      fetchCustomers();
    }
  };

  const openCustomerDetails = async (customer: any) => {
    setSelectedCustomer(customer);
    const { data: orders } = await supabase
      .from('orders')
      .select('id, total, status, created_at')
      .eq('user_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(5);
      
    const { data: addresses } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', customer.id)
      .limit(3);

    setCustomerDetails({
      orders: orders || [],
      addresses: addresses || []
    });
  };

  const exportCSV = () => {
    const csvRows = [];
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Total Orders', 'Total Spent', 'Status', 'Joined Date'];
    csvRows.push(headers.join(','));

    filteredCustomers.forEach(c => {
      const row = [
        c.id,
        `"${c.full_name || ''}"`,
        c.email,
        c.phone || '',
        c.total_orders || 0,
        c.total_spent || 0,
        c.is_blocked ? 'Blocked' : 'Active',
        new Date(c.created_at).toISOString().split('T')[0]
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'customers_export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Export started');
    logAdminAction('export', 'profiles', 'csv');
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      (c.full_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (c.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (c.phone || '').includes(search);
    
    if (!matchesSearch) return false;
    
    if (activeTab === 'active') return !c.is_blocked;
    if (activeTab === 'blocked') return c.is_blocked;
    return true;
  });

  const columns = [
    {
      header: 'Customer',
      accessor: (row: any) => (
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => openCustomerDetails(row)}>
          {row.avatar_url ? (
            <img src={row.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
              {(row.full_name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900">{row.full_name || 'Unknown'}</div>
            <div className="text-xs text-gray-500">{row.email}</div>
          </div>
        </div>
      )
    },
    { header: 'Phone', accessor: (row: any) => row.phone || 'N/A' },
    { header: 'Orders', accessor: (row: any) => row.total_orders || 0 },
    { header: 'Spent', accessor: (row: any) => `₹${(row.total_spent || 0).toLocaleString()}` },
    {
      header: 'Status',
      accessor: (row: any) => (
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${row.is_blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {row.is_blocked ? 'Blocked' : 'Active'}
        </span>
      )
    },
    { header: 'Joined', accessor: (row: any) => new Date(row.created_at).toLocaleDateString() },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="relative group">
          <button className="p-1 rounded hover:bg-gray-100">
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
          <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <button 
              onClick={() => navigate(`/admin/orders?customer=${row.id}`)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
            >
              View Orders
            </button>
            <button 
              onClick={() => setConfirmBlock({ id: row.id, status: row.is_blocked })}
              className={`w-full text-left px-4 py-2 text-sm rounded-b-lg ${row.is_blocked ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
            >
              {row.is_blocked ? 'Unblock' : 'Block User'}
            </button>
          </div>
        </div>
      )
    }
  ];

  return (
    <AdminLayout title="Customers" subtitle="Manage your platform's customers">
      {/* Stats & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          {['all', 'active', 'blocked'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                activeTab === tab ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab} ({customers.filter(c => tab === 'all' ? true : tab === 'active' ? !c.is_blocked : c.is_blocked).length})
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button 
            onClick={exportCSV}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      <DataTable 
        columns={columns}
        data={filteredCustomers}
        loading={loading}
      />

      <ConfirmModal
        isOpen={!!confirmBlock}
        title={confirmBlock?.status ? 'Unblock Customer' : 'Block Customer'}
        message={confirmBlock?.status 
          ? 'Are you sure you want to unblock this customer? They will regain access to the platform.' 
          : 'Are you sure you want to block this customer? They will not be able to log in or make purchases.'}
        confirmText={confirmBlock?.status ? 'Unblock' : 'Block'}
        cancelText="Cancel"
        onConfirm={handleBlockToggle}
        onClose={() => setConfirmBlock(null)}
        isDanger={!confirmBlock?.status}
      />

      {/* Slide-over Customer Details */}
      <AnimatePresence>
        {selectedCustomer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomer(null)}
              className="fixed inset-0 bg-black/30 z-40"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Customer Details</h2>
                  <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-8">
                  {selectedCustomer.avatar_url ? (
                    <img src={selectedCustomer.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-2xl">
                      {(selectedCustomer.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedCustomer.full_name || 'Unknown'}</h3>
                    <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
                    <p className="text-sm text-gray-500">{selectedCustomer.phone || 'No phone number'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-1">Total Orders</p>
                    <p className="text-xl font-bold text-gray-900">{selectedCustomer.total_orders || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-1">Total Spent</p>
                    <p className="text-xl font-bold text-gray-900">₹{(selectedCustomer.total_spent || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-1">Joined Date</p>
                    <p className="text-sm font-bold text-gray-900">{new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-1">Status</p>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${selectedCustomer.is_blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {selectedCustomer.is_blocked ? 'Blocked' : 'Active'}
                    </span>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-900">Recent Orders</h4>
                    <button 
                      onClick={() => { setSelectedCustomer(null); navigate(`/admin/orders?customer=${selectedCustomer.id}`) }}
                      className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      View All
                    </button>
                  </div>
                  {customerDetails.orders.length === 0 ? (
                    <p className="text-sm text-gray-500">No orders yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {customerDetails.orders.map((o: any) => (
                        <div key={o.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Order #{o.id.substring(0, 8)}</p>
                            <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">₹{o.total.toLocaleString()}</p>
                            <span className="text-xs text-gray-500 capitalize">{o.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-4">Saved Addresses</h4>
                  {customerDetails.addresses.length === 0 ? (
                    <p className="text-sm text-gray-500">No addresses saved.</p>
                  ) : (
                    <div className="space-y-3">
                      {customerDetails.addresses.map((a: any) => (
                        <div key={a.id} className="p-3 border border-gray-100 rounded-lg text-sm text-gray-700">
                          <p className="font-medium text-gray-900 mb-1">{a.full_name} <span className="text-xs font-normal text-gray-500">({a.phone})</span></p>
                          <p>{a.address_line1}</p>
                          {a.address_line2 && <p>{a.address_line2}</p>}
                          <p>{a.city}, {a.state} {a.pincode}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </AdminLayout>
  );
}
