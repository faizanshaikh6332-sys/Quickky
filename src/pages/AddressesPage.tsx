import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin, Edit2, Trash2, Star, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface Address {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir'];

const EMPTY_FORM = { label: 'Home', full_name: '', phone: '', line1: '', line2: '', city: 'Chhatrapati Sambhaji Nagar, Aurangabad', state: 'Maharashtra', pincode: '431001' };

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchAddresses = async () => {
    if (!user) return;
    const { data } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false });
    const mapped = (data || []).map(a => ({ ...a, line2: a.line2 ?? undefined })) as Address[];
    setAddresses(mapped);
    setLoading(false);
  };

  useEffect(() => { fetchAddresses(); }, [user]);

  const openEdit = (addr: Address) => {
    setEditing(addr.id);
    setForm({ label: addr.label, full_name: addr.full_name, phone: addr.phone, line1: addr.line1, line2: addr.line2 || '', city: addr.city, state: addr.state, pincode: addr.pincode });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!user || !form.full_name || !form.phone || !form.line1 || !form.city || !form.pincode) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('addresses').update(form).eq('id', editing);
      if (error) toast.error(error.message);
      else { toast.success('Address updated'); }
    } else {
      const { error } = await supabase.from('addresses').insert({ ...form, user_id: user.id, is_default: addresses.length === 0 });
      if (error) toast.error(error.message);
      else toast.success('Address added');
    }
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    fetchAddresses();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Address deleted'); fetchAddresses(); }
  };

  const setDefault = async (id: string) => {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user!.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    fetchAddresses();
    toast.success('Default address updated');
  };

  const inp = 'w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 transition-all';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Saved Addresses</h1>
          <button
            onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors"
          >
            <Plus size={15} /> Add New
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-3 mb-6">
            {addresses.length === 0 && !showForm && (
              <div className="text-center py-16">
                <MapPin size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No saved addresses yet</p>
              </div>
            )}
            {addresses.map((addr, i) => (
              <motion.div key={addr.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`bg-white dark:bg-gray-900 rounded-2xl p-5 border-2 ${addr.is_default ? 'border-purple-400' : 'border-gray-100 dark:border-gray-800'} shadow-sm`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                      <MapPin size={16} className="text-purple-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg">{addr.label}</span>
                        {addr.is_default && <span className="flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full"><Star size={9} /> Default</span>}
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{addr.full_name} · {addr.phone}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                      <p className="text-xs text-gray-500">{addr.city}, {addr.state} - {addr.pincode}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!addr.is_default && (
                      <button onClick={() => setDefault(addr.id)} className="w-7 h-7 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center justify-center text-gray-400 hover:text-purple-600 transition-colors" title="Set as default">
                        <Check size={13} />
                      </button>
                    )}
                    <button onClick={() => openEdit(addr)} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDelete(addr.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-gray-900 dark:text-white">{editing ? 'Edit Address' : 'Add Address'}</h3>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600"><X size={14} /></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {['Home','Work','Other'].map(l => (
                    <button key={l} onClick={() => setForm(f => ({ ...f, label: l }))}
                      className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                        form.label === l ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >{l}</button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-bold text-gray-500 mb-1">Full Name *</label><input className={inp} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
                  <div><label className="block text-xs font-bold text-gray-500 mb-1">Phone *</label><input className={inp} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                </div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Address Line 1 *</label><input className={inp} placeholder="House no, Street" value={form.line1} onChange={e => setForm(f => ({ ...f, line1: e.target.value }))} /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Address Line 2</label><input className={inp} placeholder="Area, Landmark" value={form.line2} onChange={e => setForm(f => ({ ...f, line2: e.target.value }))} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs font-bold text-gray-500 mb-1">City *</label><input className={inp} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
                  <div><label className="block text-xs font-bold text-gray-500 mb-1">State *</label>
                    <select className={inp} value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}>
                      {STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-xs font-bold text-gray-500 mb-1">Pincode *</label><input className={inp} maxLength={6} value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))} /></div>
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-sm hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {saving ? 'Saving...' : (editing ? 'Update Address' : 'Save Address')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
