import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/admin/lib/adminSupabase';
import AdminLayout from '@/admin/components/AdminLayout';
import DataTable from '@/admin/components/DataTable';
import ConfirmModal from '@/admin/components/ConfirmModal';
import { toast } from 'react-hot-toast';
import { Check, X, Ban, Star, Trash2, Store, Search, Filter } from 'lucide-react';

const TABS = ['All', 'Pending', 'Active', 'Suspended', 'Rejected'];

export default function ShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: string; shop: any | null }>({
    isOpen: false,
    type: '',
    shop: null
  });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*, profiles!seller_id(full_name, email, avatar_url)');
      
      if (error) throw error;
      setShops(data || []);
    } catch (err: any) {
      toast.error('Failed to load shops: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (shop: any, newStatus: string, reason = '') => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'rejected') updates.reject_reason = reason;

      const { error } = await supabase.from('shops').update(updates).eq('id', shop.id);
      if (error) throw error;

      await logAdminAction('shop_status_update', `Updated shop ${shop.name} to ${newStatus}`, { shop_id: shop.id, newStatus, reason });
      
      setShops(shops.map(s => s.id === shop.id ? { ...s, ...updates } : s));
      toast.success(`Shop ${newStatus} successfully`);
      setConfirmModal({ isOpen: false, type: '', shop: null });
      setRejectReason('');
    } catch (err: any) {
      toast.error('Action failed: ' + err.message);
    }
  };

  const toggleFeatured = async (shop: any) => {
    try {
      const newFeatured = !shop.is_featured;
      const { error } = await supabase.from('shops').update({ is_featured: newFeatured }).eq('id', shop.id);
      if (error) throw error;

      await logAdminAction('shop_feature_toggle', `${newFeatured ? 'Featured' : 'Unfeatured'} shop ${shop.name}`, { shop_id: shop.id });
      setShops(shops.map(s => s.id === shop.id ? { ...s, is_featured: newFeatured } : s));
      toast.success(newFeatured ? 'Shop featured' : 'Shop unfeatured');
    } catch (err: any) {
      toast.error('Failed to update shop: ' + err.message);
    }
  };

  const deleteShop = async (shop: any) => {
    try {
      const { error } = await supabase.from('shops').delete().eq('id', shop.id);
      if (error) throw error;
      
      await logAdminAction('shop_delete', `Deleted shop ${shop.name}`, { shop_id: shop.id });
      setShops(shops.filter(s => s.id !== shop.id));
      toast.success('Shop deleted successfully');
      setConfirmModal({ isOpen: false, type: '', shop: null });
    } catch (err: any) {
      toast.error('Failed to delete shop: ' + err.message);
    }
  };

  const filteredShops = useMemo(() => {
    return shops.filter(shop => {
      const matchesTab = activeTab === 'All' || shop.status.toLowerCase() === activeTab.toLowerCase();
      const matchesSearch = (shop.name || '').toLowerCase().includes(search.toLowerCase()) ||
                            (shop.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
                            (shop.city || '').toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [shops, activeTab, search]);

  const stats = useMemo(() => {
    return {
      all: shops.length,
      pending: shops.filter(s => s.status === 'pending').length,
      active: shops.filter(s => s.status === 'active').length,
      suspended: shops.filter(s => s.status === 'suspended').length,
      rejected: shops.filter(s => s.status === 'rejected').length
    };
  }, [shops]);

  const columns = [
    {
      header: 'Shop',
      accessor: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
            {row.logo_url ? <img src={row.logo_url} alt="" className="h-full w-full object-cover" /> : <Store className="w-5 h-5 text-gray-400" />}
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">{row.category || 'General'}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Seller',
      accessor: (row: any) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{row.profiles?.full_name || 'Unknown'}</div>
          <div className="text-sm text-gray-500">{row.profiles?.email}</div>
        </div>
      )
    },
    { header: 'City', accessor: 'city' },
    {
      header: 'Status',
      accessor: (row: any) => {
        const colors: Record<string, string> = {
          pending: 'bg-amber-100 text-amber-800',
          active: 'bg-green-100 text-green-800',
          suspended: 'bg-orange-100 text-orange-800',
          rejected: 'bg-red-100 text-red-800'
        };
        const color = colors[row.status] || 'bg-gray-100 text-gray-800';
        return <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${color}`}>{row.status}</span>;
      }
    },
    {
      header: 'Metrics',
      accessor: (row: any) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 text-yellow-600"><Star className="w-3 h-3 fill-current" /> {row.rating || 0}</div>
          <div className="text-gray-500">{row.total_sales || 0} sales</div>
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          {row.status === 'pending' && (
            <>
              <button onClick={() => handleStatusChange(row, 'active')} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
              <button onClick={() => setConfirmModal({ isOpen: true, type: 'reject', shop: row })} className="p-1 text-red-600 hover:bg-red-50 rounded"><X className="w-4 h-4" /></button>
            </>
          )}
          {row.status === 'active' && (
            <button onClick={() => setConfirmModal({ isOpen: true, type: 'suspend', shop: row })} className="p-1 text-orange-600 hover:bg-orange-50 rounded" title="Suspend"><Ban className="w-4 h-4" /></button>
          )}
          <button onClick={() => toggleFeatured(row)} className={`p-1 rounded ${row.is_featured ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:bg-gray-50'}`} title="Feature">
            <Star className="w-4 h-4" />
          </button>
          <button onClick={() => setConfirmModal({ isOpen: true, type: 'delete', shop: row })} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  return (
    <AdminLayout title="Shops Management" subtitle="Manage marketplace sellers and shops">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-white rounded-lg shadow-sm p-1 border border-gray-200 overflow-x-auto w-full sm:w-auto">
          {TABS.map(tab => {
            const count = stats[tab.toLowerCase() as keyof typeof stats] || 0;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  activeTab === tab ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab} <span className="ml-1.5 px-2 py-0.5 rounded-full bg-white text-xs text-gray-500 border">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search shops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DataTable columns={columns} data={filteredShops} loading={loading} />
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: '', shop: null })}
        onConfirm={() => {
          if (confirmModal.type === 'delete') deleteShop(confirmModal.shop);
          if (confirmModal.type === 'suspend') handleStatusChange(confirmModal.shop, 'suspended');
          if (confirmModal.type === 'reject') handleStatusChange(confirmModal.shop, 'rejected', rejectReason);
        }}
        title={
          confirmModal.type === 'delete' ? 'Delete Shop' : 
          confirmModal.type === 'suspend' ? 'Suspend Shop' : 'Reject Shop'
        }
        message={
          confirmModal.type === 'delete' ? 'Are you sure you want to permanently delete this shop? This action cannot be undone.' :
          confirmModal.type === 'suspend' ? 'Are you sure you want to suspend this shop? They will not be able to sell products.' : ''
        }
        confirmText={
          confirmModal.type === 'delete' ? 'Delete' : 
          confirmModal.type === 'suspend' ? 'Suspend' : 'Reject'
        }
        type={confirmModal.type === 'delete' ? 'danger' : 'warning'}
      >
        {confirmModal.type === 'reject' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rejection</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please explain why this shop is being rejected..."
            />
          </div>
        )}
      </ConfirmModal>
    </AdminLayout>
  );
}
