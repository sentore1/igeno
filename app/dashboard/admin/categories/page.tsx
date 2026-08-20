'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';

interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

const COLOR_PRESETS = [
  { label: 'Purple', value: '#7C3AED' },
  { label: 'Blue', value: '#2563EB' },
  { label: 'Green', value: '#16A34A' },
  { label: 'Red', value: '#DC2626' },
  { label: 'Orange', value: '#EA580C' },
  { label: 'Pink', value: '#DB2777' },
  { label: 'Teal', value: '#0D9488' },
  { label: 'Indigo', value: '#4338CA' },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [courseCountMap, setCourseCountMap] = useState<Record<string, number>>({});

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formColor, setFormColor] = useState('#7C3AED');
  const [formError, setFormError] = useState('');

  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/auth/signin'); return; }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') { router.push('/dashboard'); return; }

    loadCategories();
  };

  const loadCategories = async () => {
    setLoading(true);

    // Load all categories (including inactive for admin)
    const { data: cats } = await supabase
      .from('course_categories')
      .select('*')
      .order('order_index', { ascending: true });

    if (cats) {
      setCategories(cats);

      // Count courses per category
      const { data: courses } = await supabase
        .from('courses')
        .select('category');

      if (courses) {
        const counts: Record<string, number> = {};
        for (const c of courses) {
          counts[c.category] = (counts[c.category] ?? 0) + 1;
        }
        setCourseCountMap(counts);
      }
    }

    setLoading(false);
  };

  const openAdd = () => {
    setFormName('');
    setFormDesc('');
    setFormColor('#7C3AED');
    setFormError('');
    setEditingCategory(null);
    setShowAddModal(true);
  };

  const openEdit = (cat: Category) => {
    setFormName(cat.name);
    setFormDesc(cat.description ?? '');
    setFormColor(cat.color ?? '#7C3AED');
    setFormError('');
    setEditingCategory(cat);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingCategory(null);
    setFormError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) { setFormError('Name is required'); return; }
    setSaving(true);
    setFormError('');

    const method = editingCategory ? 'PATCH' : 'POST';
    const body = editingCategory
      ? { id: editingCategory.id, name: formName.trim(), description: formDesc.trim() || null, color: formColor }
      : { name: formName.trim(), description: formDesc.trim() || null, color: formColor };

    const res = await fetch('/api/categories', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok) {
      setFormError(json.error ?? 'Something went wrong');
      setSaving(false);
      return;
    }

    setSaving(false);
    closeModal();
    loadCategories();
  };

  const handleToggleActive = async (cat: Category) => {
    const action = cat.is_active ? 'deactivate' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} "${cat.name}"? ${cat.is_active ? 'It will be hidden from dropdowns and filters.' : 'It will appear in dropdowns and filters.'}`)) return;

    const res = await fetch('/api/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cat.id, is_active: !cat.is_active }),
    });

    if (res.ok) loadCategories();
    else {
      const json = await res.json();
      alert(json.error ?? 'Failed to update category');
    }
  };

  const handleDelete = async (cat: Category) => {
    const courseCount = courseCountMap[cat.name] ?? 0;
    if (courseCount > 0) {
      alert(`Cannot delete "${cat.name}" — ${courseCount} course(s) still use this category.\n\nReassign those courses to a different category first, then delete.`);
      return;
    }
    if (!confirm(`Permanently delete "${cat.name}"? This cannot be undone.`)) return;

    const res = await fetch(`/api/categories?id=${cat.id}&force=true`, { method: 'DELETE' });
    if (res.ok) loadCategories();
    else {
      const json = await res.json();
      alert(json.error ?? 'Failed to delete category');
    }
  };

  const handleReorder = async (cat: Category, direction: 'up' | 'down') => {
    const active = categories.filter(c => c.is_active);
    const idx = active.findIndex(c => c.id === cat.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= active.length) return;

    const other = active[swapIdx];

    // Swap order_index values
    await Promise.all([
      fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, order_index: other.order_index }),
      }),
      fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: other.id, order_index: cat.order_index }),
      }),
    ]);

    loadCategories();
  };

  const visibleCategories = showInactive ? categories : categories.filter(c => c.is_active);
  const inactiveCount = categories.filter(c => !c.is_active).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard/admin" className="hover:text-purple-600">Admin</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">Course Categories</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Course Categories</h1>
          <p className="text-gray-500 mt-1">
            Manage the categories available when creating or editing courses.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{categories.filter(c => c.is_active).length}</div>
          <div className="text-sm text-gray-500 mt-1">Active</div>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">{inactiveCount}</div>
          <div className="text-sm text-gray-500 mt-1">Inactive</div>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold text-gray-700">
            {Object.values(courseCountMap).reduce((a, b) => a + b, 0)}
          </div>
          <div className="text-sm text-gray-500 mt-1">Total Courses</div>
        </div>
      </div>

      {/* Toggle inactive */}
      {inactiveCount > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setShowInactive(v => !v)}
            className="text-sm text-purple-600 hover:underline"
          >
            {showInactive ? 'Hide' : `Show ${inactiveCount} inactive`} categor{inactiveCount === 1 ? 'y' : 'ies'}
          </button>
        </div>
      )}

      {/* Categories list */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {visibleCategories.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <p className="font-medium">No categories yet</p>
            <p className="text-sm mt-1">Add your first category to get started.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Description</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Courses</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleCategories.map((cat, idx) => {
                const activeList = visibleCategories.filter(c => c.is_active);
                const activeIdx = activeList.findIndex(c => c.id === cat.id);
                return (
                  <tr key={cat.id} className={`hover:bg-gray-50 transition ${!cat.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color ?? '#7C3AED' }}
                        />
                        <span className="font-semibold text-gray-900">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell max-w-xs truncate">
                      {cat.description ?? <span className="italic text-gray-300">No description</span>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                        {courseCountMap[cat.name] ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(cat)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition ${
                          cat.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title={cat.is_active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {cat.is_active && (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleReorder(cat, 'up')}
                            disabled={activeIdx === 0}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition"
                            title="Move up"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleReorder(cat, 'down')}
                            disabled={activeIdx === activeList.length - 1}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition"
                            title="Move down"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Deactivating a category hides it from dropdowns but keeps existing courses intact.
        Deleting is only allowed when no courses are assigned to that category.
      </p>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  placeholder="e.g., Mental Health Care"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  maxLength={300}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition resize-none"
                  placeholder="Brief description of what this category covers"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map(preset => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setFormColor(preset.value)}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        formColor === preset.value ? 'border-gray-900 scale-110' : 'border-transparent hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.label}
                    />
                  ))}
                  <div className="flex items-center gap-2 ml-1">
                    <input
                      type="color"
                      value={formColor}
                      onChange={e => setFormColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                      title="Custom color"
                    />
                    <span className="text-xs text-gray-400">Custom</span>
                  </div>
                </div>
                {/* Preview */}
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-sm font-semibold"
                    style={{ backgroundColor: formColor }}
                  >
                    <span className="w-2 h-2 rounded-full bg-white/60" />
                    {formName || 'Preview'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  {saving ? 'Saving…' : editingCategory ? 'Save Changes' : 'Add Category'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
