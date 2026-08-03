import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/admin/lib/adminSupabase';
import AdminLayout from '@/admin/components/AdminLayout';
import DataTable from '@/admin/components/DataTable';
import ConfirmModal from '@/admin/components/ConfirmModal';
import { toast } from 'react-hot-toast';
import { Check, X, Star, Trash2, Archive, Package, Search } from 'lucide-react';

const TABS = ['All', 'Pending', 'Active', 'Rejected', 'Archived'];

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: string; product: any | null }>({
    isOpen: false,
    type: '',
    product: null
  });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, shops(name), profiles!seller_id(full_name, email)');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      toast.error('Failed to load products: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (product: any, newStatus: string, reason = '') => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'rejected') updates.reject_reason = reason;

      const { error } = await supabase.from('products').update(updates).eq('id', product.id);
      if (error) throw error;

      await logAdminAction('product_status_update', `Updated product ${product.name} to ${newStatus}`, { product_id: product.id, newStatus, reason });
      
      setProducts(products.map(p => p.id === product.id ? { ...p, ...updates } : p));
      toast.success(`Product ${newStatus} successfully`);
      setConfirmModal({ isOpen: false, type: '', product: null });
      setRejectReason('');
    } catch (err: any) {
      toast.error('Action failed: ' + err.message);
    }
  };

  const toggleFeatured = async (product: any) => {
    try {
      const newFeatured = !product.is_featured;
      const { error } = await supabase.from('products').update({ is_featured: newFeatured }).eq('id', product.id);
      if (error) throw error;

      await logAdminAction('product_feature_toggle', `${newFeatured ? 'Featured' : 'Unfeatured'} product ${product.name}`, { product_id: product.id });
      setProducts(products.map(p => p.id === product.id ? { ...p, is_featured: newFeatured } : p));
      toast.success(newFeatured ? 'Product featured' : 'Product unfeatured');
    } catch (err: any) {
      toast.error('Failed to update product: ' + err.message);
    }
  };

  const deleteProduct = async (product: any) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', product.id);
      if (error) throw error;
      
      await logAdminAction('product_delete', `Deleted product ${product.name}`, { product_id: product.id });
      setProducts(products.filter(p => p.id !== product.id));
      toast.success('Product deleted successfully');
      setConfirmModal({ isOpen: false, type: '', product: null });
    } catch (err: any) {
      toast.error('Failed to delete product: ' + err.message);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesTab = activeTab === 'All' || product.status.toLowerCase() === activeTab.toLowerCase();
      const matchesSearch = (product.name || '').toLowerCase().includes(search.toLowerCase()) ||
                            (product.brand || '').toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [products, activeTab, search]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
  };

  const columns = [
    {
      header: 'Product',
      accessor: (row: any) => {
        const imgUrl = row.images?.[0] || '';
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
              {imgUrl ? <img src={imgUrl} alt="" className="h-full w-full object-cover" /> : <Package className="w-5 h-5 text-gray-400" />}
            </div>
            <div>
              <div className="font-medium text-gray-900 max-w-[200px] truncate">{row.name}</div>
              <div className="text-xs text-gray-500">{row.brand || 'No Brand'} • {row.category_slug}</div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Shop',
      accessor: (row: any) => <div className="text-sm text-gray-700">{row.shops?.name || 'Unknown'}</div>
    },
    {
      header: 'Pricing',
      accessor: (row: any) => (
        <div>
          <div className="font-medium text-gray-900">{formatPrice(row.price)}</div>
          {row.discount_pct > 0 && <div className="text-xs text-green-600">{row.discount_pct}% OFF</div>}
        </div>
      )
    },
    {
      header: 'Stock',
      accessor: (row: any) => (
        <span className={`text-sm font-medium ${row.stock > 10 ? 'text-green-600' : row.stock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
          {row.stock} in stock
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (row: any) => {
        const colors: Record<string, string> = {
          pending: 'bg-amber-100 text-amber-800',
          active: 'bg-green-100 text-green-800',
          archived: 'bg-gray-100 text-gray-800',
          rejected: 'bg-red-100 text-red-800'
        };
        const color = colors[row.status] || 'bg-gray-100 text-gray-800';
        return <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${color}`}>{row.status}</span>;
      }
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          {row.status === 'pending' && (
            <>
              <button onClick={() => handleStatusChange(row, 'active')} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
              <button onClick={() => setConfirmModal({ isOpen: true, type: 'reject', product: row })} className="p-1 text-red-600 hover:bg-red-50 rounded"><X className="w-4 h-4" /></button>
            </>
          )}
          {row.status === 'active' && (
            <button onClick={() => handleStatusChange(row, 'archived')} className="p-1 text-gray-600 hover:bg-gray-50 rounded" title="Archive"><Archive className="w-4 h-4" /></button>
          )}
          <button onClick={() => toggleFeatured(row)} className={`p-1 rounded ${row.is_featured ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:bg-gray-50'}`} title="Feature">
            <Star className="w-4 h-4" />
          </button>
          <button onClick={() => setConfirmModal({ isOpen: true, type: 'delete', product: row })} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  return (
    <AdminLayout title="Products Catalog" subtitle="Review and manage items listed on the platform">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-white rounded-lg shadow-sm p-1 border border-gray-200 overflow-x-auto w-full sm:w-auto">
          {TABS.map(tab => {
            const count = products.filter(p => tab === 'All' ? true : p.status === tab.toLowerCase()).length;
            const isPending = tab === 'Pending' && count > 0;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeTab === tab ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab} 
                <span className={`px-2 py-0.5 rounded-full text-xs border ${isPending ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-gray-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DataTable columns={columns} data={filteredProducts} loading={loading} />
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: '', product: null })}
        onConfirm={() => {
          if (confirmModal.type === 'delete') deleteProduct(confirmModal.product);
          if (confirmModal.type === 'reject') handleStatusChange(confirmModal.product, 'rejected', rejectReason);
        }}
        title={confirmModal.type === 'delete' ? 'Delete Product' : 'Reject Product'}
        message={
          confirmModal.type === 'delete' ? 'Are you sure you want to permanently delete this product? This action cannot be undone.' : ''
        }
        confirmText={confirmModal.type === 'delete' ? 'Delete' : 'Reject'}
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
              placeholder="Please explain why this product is being rejected..."
            />
          </div>
        )}
      </ConfirmModal>
    </AdminLayout>
  );
}
