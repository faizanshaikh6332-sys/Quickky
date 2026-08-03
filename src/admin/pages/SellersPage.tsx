import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/admin/lib/adminSupabase';
import AdminLayout from '@/admin/components/AdminLayout';
import DataTable from '@/admin/components/DataTable';
import ConfirmModal from '@/admin/components/ConfirmModal';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Shield, ShieldOff, Ban, CheckCircle, Search, Store } from 'lucide-react';

export default function SellersPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: string; seller: any | null }>({
    isOpen: false,
    type: '',
    seller: null
  });

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, shops(count)')
        .or('role.eq.seller,shops.count.gt.0');
      
      if (error) throw error;
      setSellers(data || []);
    } catch (err: any) {
      toast.error('Failed to load sellers: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockToggle = async (seller: any) => {
    try {
      const newBlocked = !seller.is_blocked;
      const { error } = await supabase.from('profiles').update({ is_blocked: newBlocked }).eq('id', seller.id);
      if (error) throw error;
      
      if (newBlocked) {
        await supabase.from('shops').update({ status: 'suspended' }).eq('seller_id', seller.id);
      }

      await logAdminAction(newBlocked ? 'seller_blocked' : 'seller_unblocked', `${newBlocked ? 'Blocked' : 'Unblocked'} seller ${seller.full_name}`, { seller_id: seller.id });
      
      setSellers(sellers.map(s => s.id === seller.id ? { ...s, is_blocked: newBlocked } : s));
      toast.success(`Seller ${newBlocked ? 'blocked' : 'unblocked'} successfully`);
      setConfirmModal({ isOpen: false, type: '', seller: null });
    } catch (err: any) {
      toast.error('Action failed: ' + err.message);
    }
  };

  const verifySeller = async (seller: any) => {
    try {
      const { error } = await supabase.from('shops').update({ is_verified: true }).eq('seller_id', seller.id);
      if (error) throw error;

      await logAdminAction('seller_verified', `Verified shops for seller ${seller.full_name}`, { seller_id: seller.id });
      toast.success('Seller shops verified successfully');
    } catch (err: any) {
      toast.error('Verification failed: ' + err.message);
    }
  };

  const filteredSellers = useMemo(() => {
    return sellers.filter(seller => {
      const matchesFilter = filter === 'All' ? true : filter === 'Active' ? !seller.is_blocked : seller.is_blocked;
      const matchesSearch = (seller.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
                            (seller.email || '').toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [sellers, filter, search]);

  const columns = [
    {
      header: 'Seller',
      accessor: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
            {row.avatar_url ? <img src={row.avatar_url} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold">{row.full_name?.charAt(0) || '?'}</div>}
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.full_name || 'No Name'}</div>
            <div className="text-sm text-gray-500">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Shops',
      accessor: (row: any) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Store className="w-4 h-4" />
          <span>{row.shops?.[0]?.count || 0}</span>
        </div>
      )
    },
    {
      header: 'Orders',
      accessor: (row: any) => <span className="text-sm font-medium">{row.total_orders || 0}</span>
    },
    {
      header: 'Status',
      accessor: (row: any) => (
        row.is_blocked ? 
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex w-max items-center gap-1"><Ban className="w-3 h-3" /> Blocked</span> :
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex w-max items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>
      )
    },
    {
      header: 'Joined',
      accessor: (row: any) => <span className="text-sm text-gray-500">{new Date(row.created_at).toLocaleDateString()}</span>
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/admin/shops?search=${row.email}`)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View Shops">
            <Store className="w-4 h-4" />
          </button>
          <button onClick={() => verifySeller(row)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="Verify Seller">
            <Shield className="w-4 h-4" />
          </button>
          {!row.is_blocked ? (
            <button onClick={() => setConfirmModal({ isOpen: true, type: 'block', seller: row })} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Block Seller">
              <Ban className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => handleBlockToggle(row)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Unblock Seller">
              <ShieldOff className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <AdminLayout title="Sellers Directory" subtitle="Manage platform merchants and their permissions">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
          {['All', 'Active', 'Blocked'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === f ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search sellers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DataTable columns={columns} data={filteredSellers} loading={loading} />
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: '', seller: null })}
        onConfirm={() => handleBlockToggle(confirmModal.seller)}
        title="Block Seller"
        message="Are you sure you want to block this seller? This will immediately suspend all their shops and they will not be able to log in."
        confirmText="Block Seller"
        type="danger"
      />
    </AdminLayout>
  );
}
