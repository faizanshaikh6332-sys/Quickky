import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '@/admin/components/AdminLayout';
import ConfirmModal from '@/admin/components/ConfirmModal';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/admin/lib/adminSupabase';

interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  position: string;
  sort_order: number;
  is_active: boolean;
  bg_color: string | null;
  text_color: string | null;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Banner>>({
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '',
    position: 'hero',
    sort_order: 0,
    is_active: true,
    bg_color: '#ffffff',
    text_color: '#000000',
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('banners').select('*').order('sort_order');
    if (error) {
      toast.error('Failed to fetch banners');
      console.error(error);
    } else {
      setBanners((data || []) as unknown as Banner[]);
    }
    setLoading(false);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('banners').update({ is_active: !currentStatus }).eq('id', id);
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(currentStatus ? 'Banner deactivated' : 'Banner activated');
      await logAdminAction('update', 'banners', id);
      fetchBanners();
    }
  };

  const openModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData(banner);
    } else {
      setEditingBanner(null);
      setFormData({
        title: '',
        subtitle: '',
        image_url: '',
        link_url: '',
        position: 'hero',
        sort_order: 0,
        is_active: true,
        bg_color: '#ffffff',
        text_color: '#000000',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      toast.error('Image URL is required');
      return;
    }

    try {
      if (editingBanner) {
        const { error } = await (supabase.from('banners') as any).update(formData).eq('id', editingBanner.id);
        if (error) throw error;
        await logAdminAction('update', 'banners', editingBanner.id);
        toast.success('Banner updated successfully');
      } else {
        const { data, error } = await (supabase.from('banners') as any).insert([formData]).select().single();
        if (error) throw error;
        await logAdminAction('create', 'banners', data.id);
        toast.success('Banner created successfully');
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const { error } = await supabase.from('banners').delete().eq('id', confirmDelete);
      if (error) throw error;
      await logAdminAction('delete', 'banners', confirmDelete);
      toast.success('Banner deleted successfully');
      setConfirmDelete(null);
      fetchBanners();
    } catch (error: any) {
      toast.error('Failed to delete banner');
    }
  };

  const getPositionBadgeColor = (position: string) => {
    switch (position) {
      case 'hero': return 'bg-blue-100 text-blue-800';
      case 'mid': return 'bg-purple-100 text-purple-800';
      case 'category': return 'bg-green-100 text-green-800';
      case 'footer': return 'bg-gray-100 text-gray-800';
      case 'popup': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout title="Banners Management" subtitle="Manage homepage and category banners">
      <div className="flex justify-end mb-6">
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Banner
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-xl h-64 border border-gray-100 shadow-sm" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No banners found</h3>
          <p className="text-gray-500">Add a banner to display on your platform.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map(banner => (
            <div key={banner.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              <div 
                className="h-32 relative bg-cover bg-center"
                style={{ 
                  backgroundColor: banner.bg_color || '#e5e7eb',
                  backgroundImage: `url(${banner.image_url})` 
                }}
              >
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => openModal(banner)} className="p-2 bg-white rounded-full text-gray-700 hover:text-purple-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setConfirmDelete(banner.id)} className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getPositionBadgeColor(banner.position)}`}>
                    {banner.position}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">Order: {banner.sort_order}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 truncate">{banner.title || 'Untitled'}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{banner.subtitle || 'No subtitle'}</p>
                
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Status</span>
                  <button 
                    onClick={() => handleToggleActive(banner.id, banner.is_active)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${banner.is_active ? 'bg-purple-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${banner.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
            >
              <div className="p-6 md:w-1/2 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-100">
                <h2 className="text-xl font-bold mb-4">{editingBanner ? 'Edit Banner' : 'Add Banner'}</h2>
                <form id="banner-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                      <select 
                        value={formData.position}
                        onChange={e => setFormData({ ...formData, position: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="hero">Hero (Top)</option>
                        <option value="mid">Mid Section</option>
                        <option value="category">Category List</option>
                        <option value="footer">Footer</option>
                        <option value="popup">Popup</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                      <input 
                        type="number"
                        value={formData.sort_order}
                        onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title (Optional)</label>
                    <input 
                      type="text"
                      value={formData.title || ''}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (Optional)</label>
                    <input 
                      type="text"
                      value={formData.subtitle || ''}
                      onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
                    <input 
                      type="url"
                      required
                      value={formData.image_url || ''}
                      onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link URL (Optional)</label>
                    <input 
                      type="url"
                      value={formData.link_url || ''}
                      onChange={e => setFormData({ ...formData, link_url: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color"
                          value={formData.bg_color || '#ffffff'}
                          onChange={e => setFormData({ ...formData, bg_color: e.target.value })}
                          className="h-10 w-10 p-1 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input 
                          type="text"
                          value={formData.bg_color || '#ffffff'}
                          onChange={e => setFormData({ ...formData, bg_color: e.target.value })}
                          className="flex-1 p-2 border border-gray-300 rounded-lg font-mono text-sm uppercase"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color"
                          value={formData.text_color || '#000000'}
                          onChange={e => setFormData({ ...formData, text_color: e.target.value })}
                          className="h-10 w-10 p-1 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input 
                          type="text"
                          value={formData.text_color || '#000000'}
                          onChange={e => setFormData({ ...formData, text_color: e.target.value })}
                          className="flex-1 p-2 border border-gray-300 rounded-lg font-mono text-sm uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">Active</label>
                  </div>
                </form>
              </div>

              <div className="p-6 md:w-1/2 bg-gray-50 flex flex-col">
                <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Live Preview</h3>
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-4 overflow-hidden">
                  {/* Banner Preview Card */}
                  <div 
                    className="w-full max-w-sm rounded-xl overflow-hidden shadow-lg relative aspect-video flex flex-col justify-center p-6 bg-cover bg-center"
                    style={{ 
                      backgroundColor: formData.bg_color || '#ffffff',
                      color: formData.text_color || '#000000',
                      backgroundImage: formData.image_url ? `url(${formData.image_url})` : 'none'
                    }}
                  >
                    {!formData.image_url && <div className="absolute inset-0 flex items-center justify-center text-opacity-30 text-inherit"><ImageIcon size={48} /></div>}
                    <div className="relative z-10">
                      {formData.title && <h3 className="text-2xl font-bold mb-2">{formData.title}</h3>}
                      {formData.subtitle && <p className="text-sm opacity-90">{formData.subtitle}</p>}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    form="banner-form"
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    {editingBanner ? 'Save Changes' : 'Create Banner'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Delete Banner"
        message="Are you sure you want to delete this banner? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
        isDanger={true}
      />
    </AdminLayout>
  );
}
