import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/admin/lib/adminSupabase';
import AdminLayout from '@/admin/components/AdminLayout';
import ConfirmModal from '@/admin/components/ConfirmModal';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, GripVertical, CheckCircle2 } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    slug: '',
    icon: '',
    gradient: 'from-blue-500 to-indigo-500',
    image_url: '',
    sort_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order');
      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      toast.error('Failed to load categories: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!formData.id;
      const dataToSave = { ...formData };
      if (!isEdit) delete (dataToSave as any).id;
      
      const { error } = isEdit 
        ? await supabase.from('categories').update(dataToSave).eq('id', formData.id)
        : await supabase.from('categories').insert(dataToSave);
      
      if (error) throw error;
      
      await logAdminAction(isEdit ? 'category_update' : 'category_create', `${isEdit ? 'Updated' : 'Created'} category ${formData.name}`);
      toast.success(`Category ${isEdit ? 'updated' : 'created'} successfully`);
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error('Failed to save category: ' + err.message);
    }
  };

  const toggleActive = async (category: any) => {
    try {
      const { error } = await supabase.from('categories').update({ is_active: !category.is_active }).eq('id', category.id);
      if (error) throw error;
      
      setCategories(categories.map(c => c.id === category.id ? { ...c, is_active: !c.is_active } : c));
      await logAdminAction('category_toggle', `Toggled active status for category ${category.name}`);
      toast.success('Category status updated');
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', confirmDelete.id);
      if (error) throw error;
      
      await logAdminAction('category_delete', `Deleted category ${confirmDelete.name}`);
      setCategories(categories.filter(c => c.id !== confirmDelete.id));
      toast.success('Category deleted');
      setConfirmDelete(null);
    } catch (err: any) {
      toast.error('Failed to delete category: ' + err.message);
    }
  };

  const changeOrder = async (id: string, newOrder: number) => {
    try {
      setCategories(categories.map(c => c.id === id ? { ...c, sort_order: newOrder } : c).sort((a, b) => a.sort_order - b.sort_order));
      await supabase.from('categories').update({ sort_order: newOrder }).eq('id', id);
    } catch (err: any) {
      toast.error('Failed to update order');
    }
  };

  return (
    <AdminLayout title="Categories" subtitle="Manage product categories and layout">
      <div className="flex justify-end mb-6">
        <button 
          onClick={() => {
            setFormData({ id: '', name: '', slug: '', icon: '📦', gradient: 'from-blue-500 to-indigo-500', image_url: '', sort_order: categories.length + 1, is_active: true });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div key={category.id} className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative group transition-all ${!category.is_active ? 'opacity-60 grayscale' : ''}`}>
              <div className={`h-24 bg-gradient-to-r ${category.gradient} flex items-center justify-center text-4xl relative`}>
                {category.image_url && <img src={category.image_url} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" alt="" />}
                <span className="relative z-10">{category.icon}</span>
                <button onClick={() => toggleActive(category)} className="absolute top-2 left-2 z-10 bg-white/20 p-1 rounded backdrop-blur-sm text-white hover:bg-white/40">
                  <CheckCircle2 className={`w-5 h-5 ${category.is_active ? 'opacity-100' : 'opacity-50'}`} />
                </button>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-xs text-gray-500">/{category.slug}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <button onClick={() => changeOrder(category.id, category.sort_order - 1)} className="text-gray-400 hover:text-indigo-600">▲</button>
                    <span className="text-xs font-mono">{category.sort_order}</span>
                    <button onClick={() => changeOrder(category.id, category.sort_order + 1)} className="text-gray-400 hover:text-indigo-600">▼</button>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">{category.product_count || 0} Products</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setFormData(category); setIsModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmDelete(category)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold">{formData.id ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-lg p-2" value={formData.name} onChange={e => {
                    const name = e.target.value;
                    setFormData({ ...formData, name, slug: !formData.id ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : formData.slug })
                  }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-lg p-2" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Emoji/Text)</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-lg p-2" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gradient (Tailwind classes)</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-lg p-2" value={formData.gradient} onChange={e => setFormData({ ...formData, gradient: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional background)</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg p-2" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} />
                </div>
                <div className="flex items-center gap-4 col-span-2 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-2">Live Preview</p>
                <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                  <div className={`h-24 bg-gradient-to-r ${formData.gradient} flex items-center justify-center text-4xl relative`}>
                    {formData.image_url && <img src={formData.image_url} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" alt="" />}
                    <span className="relative z-10">{formData.icon}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900">{formData.name || 'Category Name'}</h3>
                    <p className="text-xs text-gray-500">/{formData.slug || 'slug'}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? Ensure no active products are assigned to it before deleting."
        confirmText="Delete"
        type="danger"
      />
    </AdminLayout>
  );
}
