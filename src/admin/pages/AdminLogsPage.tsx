import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '@/admin/components/AdminLayout';
import DataTable from '@/admin/components/DataTable';
import ConfirmModal from '@/admin/components/ConfirmModal';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/admin/lib/adminSupabase';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');
  const [search, setSearch] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_logs')
      .select('*, profiles!admin_id(email)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      toast.error('Failed to fetch logs');
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  const handleClearOld = async () => {
    try {
      // Clear logs older than 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const { error } = await supabase
        .from('admin_logs')
        .delete()
        .lt('created_at', ninetyDaysAgo.toISOString());

      if (error) throw error;
      
      toast.success('Old logs cleared successfully');
      await logAdminAction('delete', 'admin_logs', 'Cleared logs > 90 days');
      setConfirmClear(false);
      fetchLogs();
    } catch (error) {
      toast.error('Failed to clear logs');
    }
  };

  const getActionColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('unblock')) return 'bg-green-100 text-green-800 border border-green-200';
    if (act.includes('update')) return 'bg-blue-100 text-blue-800 border border-blue-200';
    if (act.includes('delete') || act.includes('block') || act.includes('suspend')) return 'bg-red-100 text-red-800 border border-red-200';
    if (act.includes('approve')) return 'bg-purple-100 text-purple-800 border border-purple-200';
    return 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const filteredLogs = logs.filter(l => {
    const matchesFilter = filterAction === 'all' || l.action.toLowerCase() === filterAction.toLowerCase();
    const matchesSearch = 
      (l.profiles?.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.entity_type || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.action || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const columns = [
    { 
      header: 'Admin', 
      accessor: (row: any) => <span className="font-medium text-gray-900">{row.profiles?.email || 'System'}</span> 
    },
    { 
      header: 'Action', 
      accessor: (row: any) => (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md uppercase tracking-wider ${getActionColor(row.action)}`}>
          {row.action}
        </span>
      )
    },
    { header: 'Entity Type', accessor: (row: any) => <span className="text-gray-600 font-mono text-sm">{row.entity_type}</span> },
    { 
      header: 'Entity / Details', 
      accessor: (row: any) => (
        <div className="max-w-xs truncate text-gray-600 text-sm" title={row.entity_id}>
          {row.entity_id}
        </div>
      )
    },
    { header: 'Timestamp', accessor: (row: any) => new Date(row.created_at).toLocaleString() },
  ];

  return (
    <AdminLayout title="Audit Logs" subtitle="Track administrative actions and system changes">
      
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 mb-6">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-blue-900 mb-1">Audit Trail Information</h4>
          <p className="text-sm text-blue-700">These logs record critical administrative actions for compliance and security purposes. Logs are read-only and cannot be modified. For performance, only the latest 200 logs are displayed.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex gap-4 flex-1">
          <input 
            type="text" 
            placeholder="Search email, entity, or action..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:max-w-xs px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 bg-white shadow-sm"
          />
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 bg-white shadow-sm"
          >
            <option value="all">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="export">Export</option>
          </select>
        </div>
        <button 
          onClick={() => setConfirmClear(true)}
          className="flex items-center justify-center px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors shadow-sm font-medium"
        >
          <Trash2 className="w-4 h-4 mr-2" /> Clear Logs &gt; 90 Days
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <DataTable 
          columns={columns}
          data={filteredLogs}
          loading={loading}
        />
      </div>

      <ConfirmModal
        isOpen={confirmClear}
        title="Clear Old Logs"
        message="Are you sure you want to permanently delete all audit logs older than 90 days? This action cannot be undone."
        confirmText="Yes, Clear Old Logs"
        cancelText="Cancel"
        onConfirm={handleClearOld}
        onClose={() => setConfirmClear(false)}
        isDanger={true}
      />
    </AdminLayout>
  );
}
