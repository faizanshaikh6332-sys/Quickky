import React, { useState, useEffect } from 'react';
import AdminLayout from '@/admin/components/AdminLayout';
import DataTable from '@/admin/components/DataTable';
import ConfirmModal from '@/admin/components/ConfirmModal';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/admin/lib/adminSupabase';
import { Plus, Edit, Trash2, Search, Tag, AlertCircle, Percent, IndianRupee } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '', type: 'percentage', value: '', min_order_value: '', max_discount: '', description: '', valid_until: '', is_active: true
  });

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCoupons(data || []);
    } catch (error: any) {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: Number(formData.value),
        min_order_value: Number(formData.min_order_value) || 0,
        max_discount: formData.max_discount ? Number(formData.max_discount) : null,
        description: formData.description,
        valid_until: formData.valid_until,
        is_active: formData.is_active
      };

      if (editingCoupon) {
        const { error } = await (supabase.from('coupons') as any).update(payload).eq('id', editingCoupon.id);
        if (error) throw error;
        await logAdminAction('update_coupon', `Updated coupon ${payload.code}`);
        toast.success('Coupon updated');
      } else {
        const { error } = await (supabase.from('coupons') as any).insert([payload]);
        if (error) throw error;
        await logAdminAction('create_coupon', `Created coupon ${payload.code}`);
        toast.success('Coupon created');
      }
      setIsModalOpen(false);
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const coupon = coupons.find(c => c.id === confirmDelete);
      const { error } = await supabase.from('coupons').delete().eq('id', confirmDelete);
      if (error) throw error;
      await logAdminAction('delete_coupon', `Deleted coupon ${coupon?.code}`);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (error: any) {
      toast.error('Failed to delete coupon');
    } finally {
      setConfirmDelete(null);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean, code: string) => {
    try {
      const { error } = await supabase.from('coupons').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      await logAdminAction('toggle_coupon_status', `Toggled coupon ${code} to ${!currentStatus}`);
      toast.success('Status updated');
      fetchCoupons();
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const filteredCoupons = coupons.filter(c => c.code.toLowerCase().includes(search.toLowerCase()));

  const activeCount = coupons.filter(c => c.is_active && new Date(c.valid_until) > new Date()).length;
  const expiredCount = coupons.filter(c => new Date(c.valid_until) < new Date()).length;

  return (
    <AdminLayout title="Coupons" subtitle="Manage discount codes and promotions">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl"><Tag size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Active Coupons</p>
            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl"><AlertCircle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Expired Coupons</p>
            <p className="text-2xl font-bold text-gray-900">{expiredCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><IndianRupee size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Value Distributed</p>
            <p className="text-2xl font-bold text-gray-900">Est. ₹--</p>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        <button
          onClick={() => {
            setEditingCoupon(null);
            setFormData({ code: '', type: 'percentage', value: '', min_order_value: '', max_discount: '', description: '', valid_until: '', is_active: true });
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Add Coupon
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
              <th className="p-4 font-medium">Code</th>
              <th className="p-4 font-medium">Value</th>
              <th className="p-4 font-medium">Min Order</th>
              <th className="p-4 font-medium">Valid Until</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : filteredCoupons.map((coupon) => {
              const isExpired = new Date(coupon.valid_until) < new Date();
              const isExpiringSoon = !isExpired && new Date(coupon.valid_until).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000;
              return (
                <tr key={coupon.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-semibold text-gray-900">{coupon.code}</td>
                  <td className="p-4 text-gray-600">
                    {coupon.type === 'flat' ? `₹${coupon.value} off` : `${coupon.value}% off`}
                    {coupon.max_discount && coupon.type === 'percentage' && <span className="text-xs text-gray-400 block">Up to ₹{coupon.max_discount}</span>}
                  </td>
                  <td className="p-4 text-gray-600">₹{coupon.min_order_value}</td>
                  <td className="p-4">
                    <span className={`text-sm ${isExpired ? 'text-red-500 font-medium' : isExpiringSoon ? 'text-amber-500 font-medium' : 'text-gray-600'}`}>
                      {new Date(coupon.valid_until).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleActive(coupon.id, coupon.is_active, coupon.code)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        coupon.is_active && !isExpired ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-4 flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setEditingCoupon(coupon);
                        setFormData({
                          code: coupon.code, type: coupon.type, value: coupon.value, min_order_value: coupon.min_order_value, max_discount: coupon.max_discount || '', description: coupon.description || '', valid_until: coupon.valid_until.split('T')[0], is_active: coupon.is_active
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(coupon.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">{editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}</h2>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-8">
                <form id="couponForm" onSubmit={handleSave} className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                    <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase" placeholder="SUMMER50" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500">
                        <option value="percentage">Percentage</option>
                        <option value="flat">Flat Amount</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                      <input required type="number" min="0" step="any" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 20" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (₹)</label>
                      <input required type="number" min="0" value={formData.min_order_value} onChange={e => setFormData({...formData, min_order_value: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹) <span className="text-gray-400 font-normal">(Optional)</span></label>
                      <input type="number" min="0" value={formData.max_discount} onChange={e => setFormData({...formData, max_discount: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" disabled={formData.type === 'flat'} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                    <input required type="date" value={formData.valid_until} onChange={e => setFormData({...formData, valid_until: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" rows={2}></textarea>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="isActive" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Active</label>
                  </div>
                </form>
                
                {/* Live Preview */}
                <div className="w-full md:w-64">
                  <p className="text-sm font-medium text-gray-500 mb-4">Live Preview</p>
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10"><Tag size={48} /></div>
                    <div className="relative z-10">
                      <div className="font-bold text-xl text-indigo-900 mb-1">{formData.code || 'CODE'}</div>
                      <div className="text-indigo-700 font-semibold text-lg mb-2">
                        {formData.value ? (formData.type === 'flat' ? `₹${formData.value} OFF` : `${formData.value}% OFF`) : 'Discount'}
                      </div>
                      <p className="text-xs text-indigo-600/80 mb-1">
                        Min. order ₹{formData.min_order_value || '0'}. {formData.type === 'percentage' && formData.max_discount ? `Up to ₹${formData.max_discount}.` : ''}
                      </p>
                      <p className="text-[10px] text-indigo-500 font-medium">Valid till: {formData.valid_until ? new Date(formData.valid_until).toLocaleDateString() : 'Date'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" form="couponForm" className="px-4 py-2 text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors">Save Coupon</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon? This action cannot be undone."
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </AdminLayout>
  );
}
