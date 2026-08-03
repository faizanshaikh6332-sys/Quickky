import React, { useState, useEffect } from 'react';
import { Save, AlertTriangle, Shield, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '@/admin/components/AdminLayout';
import ConfirmModal from '@/admin/components/ConfirmModal';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/admin/lib/adminSupabase';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [initialSettings, setInitialSettings] = useState<Record<string, any>>({});
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'super_admin' | 'moderator'>('admin');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch Settings
    const { data: setts } = await supabase.from('platform_settings').select('*');
    if (setts) {
      const obj = setts.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, any>);
      
      // Default missing values for UI safely
      const defaults = {
        free_delivery_threshold: 500,
        delivery_fee: 50,
        platform_commission: 10,
        tax_rate: 18,
        max_coupon_discount: 1000,
        max_delivery_time: 120,
        platform_name: 'Quickky',
        support_email: 'support@quickky.com',
        support_phone: '',
        maintenance_mode: false
      };
      
      const finalObj = { ...defaults, ...obj };
      setSettings(finalObj);
      setInitialSettings(finalObj);
    }

    // Fetch Admins
    const { data: adminList } = await supabase.from('admin_roles').select('*, profiles!user_id(full_name, email, avatar_url)');
    if (adminList) setAdmins(adminList);

    setLoading(false);
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const isSectionDirty = (keys: string[]) => {
    return keys.some(k => settings[k] !== initialSettings[k]);
  };

  const saveSettingsSection = async (keys: string[]) => {
    try {
      const updates = keys.map(k => ({
        key: k,
        value: settings[k],
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('platform_settings').upsert(updates);
      if (error) throw error;
      
      toast.success('Settings saved successfully');
      await logAdminAction('update', 'platform_settings', `Updated keys: ${keys.join(', ')}`);
      
      const newInit = { ...initialSettings };
      keys.forEach(k => newInit[k] = settings[k]);
      setInitialSettings(newInit);
    } catch (error: any) {
      toast.error('Failed to save settings');
    }
  };

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Find user by email
      const { data: profile } = await supabase.from('profiles').select('id').eq('email', newAdminEmail).single();
      if (!profile) throw new Error('User not found. They must sign up first.');

      // Insert role
      const { error } = await (supabase.from('admin_roles') as any).insert([{
        user_id: profile.id,
        role: newAdminRole
      }]);
      if (error) throw error;

      toast.success('Admin added successfully');
      await logAdminAction('create', 'admin_roles', profile.id);
      setNewAdminEmail('');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add admin');
    }
  };

  const removeAdmin = async () => {
    if (!confirmRemove) return;
    try {
      const { error } = await supabase.from('admin_roles').delete().eq('user_id', confirmRemove);
      if (error) throw error;
      toast.success('Admin removed');
      await logAdminAction('delete', 'admin_roles', confirmRemove);
      setConfirmRemove(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to remove admin');
    }
  };

  if (loading) return <AdminLayout title="Settings" subtitle="System configuration"><div className="animate-pulse flex flex-col gap-6"><div className="h-48 bg-gray-200 rounded-xl" /></div></AdminLayout>;

  return (
    <AdminLayout title="Settings" subtitle="Manage platform configuration and access">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          
          {/* Maintenance Mode */}
          <div className={`p-6 rounded-xl border-2 transition-colors ${settings.maintenance_mode ? 'border-red-500 bg-red-50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-gray-200 bg-white shadow-sm'}`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                  <AlertTriangle className={settings.maintenance_mode ? 'text-red-500' : 'text-gray-400'} />
                  Maintenance Mode
                </h2>
                <p className="text-sm mt-1 text-gray-600">
                  {settings.maintenance_mode ? 'Platform is currently offline for customers.' : 'Enable to temporarily disable customer access during updates.'}
                </p>
              </div>
              <button 
                onClick={() => {
                  const newVal = !settings.maintenance_mode;
                  handleSettingChange('maintenance_mode', newVal);
                  // Auto-save this one because it's critical
                  supabase.from('platform_settings').upsert({ key: 'maintenance_mode', value: String(newVal) }).then(() => {
                    toast.success(`Maintenance mode ${newVal ? 'ENABLED' : 'DISABLED'}`);
                    setInitialSettings(prev => ({...prev, maintenance_mode: newVal}));
                    logAdminAction('update', 'platform_settings', `maintenance_mode: ${newVal}`);
                  });
                }}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${settings.maintenance_mode ? 'bg-red-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${settings.maintenance_mode ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Delivery & Pricing */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative">
            {isSectionDirty(['free_delivery_threshold', 'delivery_fee', 'platform_commission', 'tax_rate', 'max_coupon_discount', 'max_delivery_time']) && (
              <span className="absolute top-6 right-6 w-3 h-3 bg-orange-500 rounded-full animate-pulse" title="Unsaved changes" />
            )}
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">Delivery & Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Free Delivery Threshold</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input type="number" value={settings.free_delivery_threshold} onChange={e => handleSettingChange('free_delivery_threshold', parseFloat(e.target.value))} className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Standard Delivery Fee</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input type="number" value={settings.delivery_fee} onChange={e => handleSettingChange('delivery_fee', parseFloat(e.target.value))} className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform Commission</label>
                <div className="relative">
                  <input type="number" value={settings.platform_commission} onChange={e => handleSettingChange('platform_commission', parseFloat(e.target.value))} className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-purple-500" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax/GST Rate</label>
                <div className="relative">
                  <input type="number" value={settings.tax_rate} onChange={e => handleSettingChange('tax_rate', parseFloat(e.target.value))} className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-purple-500" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => saveSettingsSection(['free_delivery_threshold', 'delivery_fee', 'platform_commission', 'tax_rate', 'max_coupon_discount', 'max_delivery_time'])}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                disabled={!isSectionDirty(['free_delivery_threshold', 'delivery_fee', 'platform_commission', 'tax_rate', 'max_coupon_discount', 'max_delivery_time'])}
              >
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </button>
            </div>
          </div>

          {/* Platform Info */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative">
            {isSectionDirty(['platform_name', 'support_email', 'support_phone']) && (
              <span className="absolute top-6 right-6 w-3 h-3 bg-orange-500 rounded-full animate-pulse" title="Unsaved changes" />
            )}
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">Platform Details</h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
                <input type="text" value={settings.platform_name} onChange={e => handleSettingChange('platform_name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                  <input type="email" value={settings.support_email} onChange={e => handleSettingChange('support_email', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
                  <input type="text" value={settings.support_phone} onChange={e => handleSettingChange('support_phone', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => saveSettingsSection(['platform_name', 'support_email', 'support_phone'])}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                disabled={!isSectionDirty(['platform_name', 'support_email', 'support_phone'])}
              >
                <Save className="w-4 h-4 mr-2" /> Save Details
              </button>
            </div>
          </div>

        </div>

        {/* Admin Management */}
        <div className="xl:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" /> Admins & Roles
            </h3>

            <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2">
              {admins.map(admin => (
                <div key={admin.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    {admin.profiles?.avatar_url ? (
                      <img src={admin.profiles.avatar_url} className="w-8 h-8 rounded-full" alt="avatar" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center font-bold text-xs">
                        {(admin.profiles?.full_name || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{admin.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 truncate w-32">{admin.profiles?.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider">
                      {admin.role}
                    </span>
                    <button 
                      onClick={() => setConfirmRemove(admin.user_id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove Admin"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={addAdmin} className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-bold text-gray-900 mb-3">Add New Admin</h4>
              <div className="space-y-3">
                <input 
                  type="email" 
                  placeholder="User's email" 
                  required
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500"
                />
                <select 
                  value={newAdminRole}
                  onChange={e => setNewAdminRole(e.target.value as 'admin' | 'super_admin' | 'moderator')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
                <button type="submit" className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black">
                  Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmRemove}
        title="Revoke Admin Access"
        message="Are you sure you want to remove this user's admin privileges? They will immediately lose access to the admin dashboard."
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={removeAdmin}
        onClose={() => setConfirmRemove(null)}
        isDanger={true}
      />
    </AdminLayout>
  );
}
