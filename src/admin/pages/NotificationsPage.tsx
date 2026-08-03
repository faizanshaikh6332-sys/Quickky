import React, { useState, useEffect } from 'react';
import { Send, History, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '@/admin/components/AdminLayout';
import DataTable from '@/admin/components/DataTable';
import ConfirmModal from '@/admin/components/ConfirmModal';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/admin/lib/adminSupabase';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Form State
  const [target, setTarget] = useState('all_customers');
  const [specificEmail, setSpecificEmail] = useState('');
  const [type, setType] = useState('system');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*, profiles!user_id(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      toast.error('Failed to fetch history');
    } else {
      setHistory(data || []);
    }
    setLoading(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error('Title and Message are required');
      return;
    }

    setLoading(true);
    try {
      let userIds: string[] = [];

      if (target === 'all_customers') {
        const { data } = await supabase.from('profiles').select('id').eq('role', 'customer');
        userIds = data?.map(d => d.id) || [];
      } else if (target === 'all_sellers') {
        const { data } = await supabase.from('profiles').select('id').eq('role', 'seller');
        userIds = data?.map(d => d.id) || [];
      } else if (target === 'specific') {
        const { data } = await supabase.from('profiles').select('id').eq('email', specificEmail).single();
        if (!data) throw new Error('User with this email not found');
        userIds = [data.id];
      }

      if (userIds.length === 0) {
        throw new Error('No users found for the selected target');
      }

      const batch = userIds.map(userId => ({
        user_id: userId,
        title,
        message,
        type,
        read: false
      }));

      const { error } = await (supabase.from('notifications') as any).insert(batch);
      if (error) throw error;

      toast.success(`Successfully sent ${userIds.length} notification(s)`);
      await logAdminAction('create', 'notifications', `Sent to ${target}`);
      
      setTitle('');
      setMessage('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send notifications');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', confirmDelete);
      if (error) throw error;
      toast.success('Notification deleted');
      await logAdminAction('delete', 'notifications', confirmDelete);
      setConfirmDelete(null);
      fetchHistory();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const getTypeBadge = (typeStr: string) => {
    switch (typeStr) {
      case 'order': return 'bg-blue-100 text-blue-700';
      case 'offer': return 'bg-amber-100 text-amber-700';
      case 'system': return 'bg-purple-100 text-purple-700';
      case 'delivery': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredHistory = history.filter(h => filterType === 'all' || h.type === filterType);

  const columns = [
    {
      header: 'Recipient',
      accessor: (row: any) => row.profiles ? `${row.profiles.full_name} (${row.profiles.email})` : 'Unknown'
    },
    { header: 'Title', accessor: (row: any) => row.title },
    {
      header: 'Type',
      accessor: (row: any) => (
        <span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${getTypeBadge(row.type)}`}>
          {row.type}
        </span>
      )
    },
    { header: 'Message', accessor: (row: any) => row.message.length > 50 ? row.message.substring(0, 50) + '...' : row.message },
    { header: 'Read', accessor: (row: any) => row.read ? 'Yes' : 'No' },
    { header: 'Sent At', accessor: (row: any) => new Date(row.created_at).toLocaleString() },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <button onClick={() => setConfirmDelete(row.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <AdminLayout title="Notifications" subtitle="Send and manage system notifications">
      
      <div className="mb-6 flex gap-4 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('send')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'send' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Send Notification
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          History
        </button>
      </div>

      {activeTab === 'send' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Compose Message</h3>
            <form onSubmit={handleSend} className="space-y-5">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="radio" name="target" value="all_customers" checked={target === 'all_customers'} onChange={(e) => setTarget(e.target.value)} className="text-purple-600 focus:ring-purple-500" />
                    All Customers
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="radio" name="target" value="all_sellers" checked={target === 'all_sellers'} onChange={(e) => setTarget(e.target.value)} className="text-purple-600 focus:ring-purple-500" />
                    All Sellers
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="radio" name="target" value="specific" checked={target === 'specific'} onChange={(e) => setTarget(e.target.value)} className="text-purple-600 focus:ring-purple-500" />
                    Specific User
                  </label>
                </div>
                {target === 'specific' && (
                  <input 
                    type="email" 
                    placeholder="User's email address"
                    value={specificEmail}
                    onChange={e => setSpecificEmail(e.target.value)}
                    required
                    className="mt-2 w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notification Type</label>
                <select 
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="system">System Update</option>
                  <option value="offer">Special Offer</option>
                  <option value="order">Order Alert</option>
                  <option value="delivery">Delivery Status</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <span className="text-xs text-gray-400">{title.length}/100</span>
                </div>
                <input 
                  type="text"
                  maxLength={100}
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <span className="text-xs text-gray-400">{message.length}/500</span>
                </div>
                <textarea 
                  rows={4}
                  maxLength={500}
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-white font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-70 shadow-md transition-all"
              >
                <Send className="w-5 h-5 mr-2" />
                {loading ? 'Sending...' : 'Send Notification'}
              </button>

            </form>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Preview</h3>
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 flex justify-center">
              {/* Mock Mobile Screen */}
              <div className="w-[300px] h-[600px] bg-white rounded-[2rem] shadow-xl border-4 border-gray-100 overflow-hidden relative">
                <div className="bg-gray-900 text-white p-2 text-center text-xs">9:41 AM</div>
                <div className="p-4 bg-gray-50 h-full">
                  {(title || message) ? (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 animate-fade-in-down">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${type==='system'?'bg-purple-500':type==='offer'?'bg-amber-500':type==='order'?'bg-blue-500':'bg-green-500'}`}></div>
                        <span className="text-xs font-semibold text-gray-500 uppercase">{type}</span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm mb-1">{title || 'Notification Title'}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{message || 'Your notification message will appear here.'}</p>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm px-8 text-center">
                      Start typing to see preview
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Notification History</h3>
            <select 
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="p-1.5 text-sm border border-gray-300 rounded-md focus:ring-purple-500"
            >
              <option value="all">All Types</option>
              <option value="system">System</option>
              <option value="offer">Offer</option>
              <option value="order">Order</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>
          <DataTable columns={columns} data={filteredHistory} loading={loading} />
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Delete Notification"
        message="Are you sure you want to delete this notification record?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
        isDanger={true}
      />
    </AdminLayout>
  );
}
