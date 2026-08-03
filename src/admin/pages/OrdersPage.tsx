import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/admin/lib/adminSupabase';
import AdminLayout from '@/admin/components/AdminLayout';
import DataTable from '@/admin/components/DataTable';
import ConfirmModal from '@/admin/components/ConfirmModal';
import { toast } from 'react-hot-toast';
import { Search, Eye, RefreshCw, XCircle, ChevronDown } from 'lucide-react';

const TABS = ['All', 'Confirmed', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('All');
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: string; order: any | null }>({
    isOpen: false,
    type: '',
    order: null
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles!user_id(full_name, email)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      toast.error('Failed to load orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (order: any, newStatus: string) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus as 'confirmed' | 'processing' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' }).eq('id', order.id);
      if (error) throw error;

      await logAdminAction('order_status_update', `Updated order ${order.id.slice(0, 8)} status to ${newStatus}`, { order_id: order.id, newStatus });
      setOrders(orders.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
      toast.success('Order status updated');
      setConfirmModal({ isOpen: false, type: '', order: null });
    } catch (err: any) {
      toast.error('Failed to update order: ' + err.message);
    }
  };

  const handleRefund = async (order: any) => {
    try {
      const { error } = await supabase.from('orders').update({ 
        status: 'returned', 
        payment_status: 'refunded' 
      }).eq('id', order.id);
      
      if (error) throw error;

      await logAdminAction('order_refund', `Refunded order ${order.id.slice(0, 8)}`, { order_id: order.id });
      setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'returned', payment_status: 'refunded' } : o));
      toast.success('Order marked as refunded');
      setConfirmModal({ isOpen: false, type: '', order: null });
    } catch (err: any) {
      toast.error('Refund failed: ' + err.message);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Tab filter
      const matchesTab = activeTab === 'All' || order.status.toLowerCase() === activeTab.toLowerCase();
      
      // Search filter
      const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase()) ||
                            (order.profiles?.email || '').toLowerCase().includes(search.toLowerCase());
      
      // Date filter
      const orderDate = new Date(order.created_at);
      const now = new Date();
      let matchesDate = true;
      if (dateFilter === 'Today') {
        matchesDate = orderDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'Last 7 days') {
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
        matchesDate = orderDate >= sevenDaysAgo;
      } else if (dateFilter === 'Last 30 days') {
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        matchesDate = orderDate >= thirtyDaysAgo;
      }

      return matchesTab && matchesSearch && matchesDate;
    });
  }, [orders, activeTab, search, dateFilter]);

  const totalRevenue = useMemo(() => {
    return filteredOrders
      .filter(o => o.status !== 'cancelled' && o.status !== 'returned')
      .reduce((sum, order) => sum + (order.total || 0), 0);
  }, [filteredOrders]);

  const columns = [
    {
      header: 'Order ID',
      accessor: (row: any) => <span className="font-mono text-sm font-medium text-gray-900">#{row.id.slice(0, 8).toUpperCase()}</span>
    },
    {
      header: 'Customer',
      accessor: (row: any) => (
        <div>
          <div className="font-medium text-sm text-gray-900">{row.profiles?.full_name || 'Guest'}</div>
          <div className="text-xs text-gray-500">{row.profiles?.email}</div>
        </div>
      )
    },
    {
      header: 'Amount',
      accessor: (row: any) => <span className="font-medium">₹{row.total?.toLocaleString('en-IN')}</span>
    },
    {
      header: 'Payment',
      accessor: (row: any) => {
        const isPaid = row.payment_status === 'paid';
        return (
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${isPaid ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
            {row.payment_status?.toUpperCase() || 'PENDING'}
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: (row: any) => {
        const colors: Record<string, string> = {
          pending: 'bg-amber-100 text-amber-800',
          confirmed: 'bg-blue-100 text-blue-800',
          processing: 'bg-purple-100 text-purple-800',
          'out for delivery': 'bg-indigo-100 text-indigo-800',
          delivered: 'bg-green-100 text-green-800',
          cancelled: 'bg-red-100 text-red-800',
          returned: 'bg-gray-200 text-gray-800'
        };
        const color = colors[row.status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
        return <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${color}`}>{row.status}</span>;
      }
    },
    {
      header: 'Date',
      accessor: (row: any) => <span className="text-sm text-gray-500">{new Date(row.created_at).toLocaleString()}</span>
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="flex items-center gap-1 text-xs font-medium bg-white border border-gray-300 rounded px-2 py-1 hover:bg-gray-50">
              Update <ChevronDown className="w-3 h-3" />
            </button>
            <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-md shadow-lg hidden group-hover:block z-10 overflow-hidden">
              {['Confirmed', 'Processing', 'Out for Delivery', 'Delivered'].map(s => (
                <button key={s} onClick={() => handleStatusUpdate(row, s.toLowerCase())} className="block w-full text-left px-4 py-2 text-xs hover:bg-indigo-50 text-gray-700 hover:text-indigo-700">
                  Mark {s}
                </button>
              ))}
            </div>
          </div>
          
          {row.status !== 'cancelled' && row.status !== 'returned' && (
            <button onClick={() => setConfirmModal({ isOpen: true, type: 'cancel', order: row })} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Cancel Order">
              <XCircle className="w-4 h-4" />
            </button>
          )}
          {row.status === 'returned' && row.payment_status !== 'refunded' && (
            <button onClick={() => setConfirmModal({ isOpen: true, type: 'refund', order: row })} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="Process Refund">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <AdminLayout title="Orders Management" subtitle="Monitor and manage customer orders">
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-wrap gap-2">
          <div className="flex bg-white rounded-lg shadow-sm p-1 border border-gray-200 overflow-x-auto w-full max-w-full">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  activeTab === tab ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <select 
            value={dateFilter} 
            onChange={e => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500"
          >
            {['All', 'Today', 'Last 7 days', 'Last 30 days'].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="relative w-full max-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search ID or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium text-indigo-900">Revenue Summary (Filtered)</h3>
          <p className="text-xs text-indigo-700 mt-1">Excludes cancelled and returned orders</p>
        </div>
        <div className="text-2xl font-bold text-indigo-700">
          ₹{totalRevenue.toLocaleString('en-IN')}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DataTable columns={columns} data={filteredOrders} loading={loading} />
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: '', order: null })}
        onConfirm={() => {
          if (confirmModal.type === 'cancel') handleStatusUpdate(confirmModal.order, 'cancelled');
          if (confirmModal.type === 'refund') handleRefund(confirmModal.order);
        }}
        title={confirmModal.type === 'cancel' ? 'Cancel Order' : 'Process Refund'}
        message={
          confirmModal.type === 'cancel' ? 'Are you sure you want to cancel this order?' :
          'Are you sure you want to mark this order as refunded? This will update the payment status.'
        }
        confirmText={confirmModal.type === 'cancel' ? 'Cancel Order' : 'Process Refund'}
        type={confirmModal.type === 'cancel' ? 'danger' : 'warning'}
      />
    </AdminLayout>
  );
}
