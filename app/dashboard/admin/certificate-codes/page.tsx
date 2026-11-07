'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';

interface CertificateCode {
  id: string;
  code: string;
  holder_name: string;
  course_title: string;
  issued_date: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

const emptyForm = {
  code: '',
  holder_name: '',
  course_title: '',
  issued_date: '',
  notes: '',
  is_active: true,
};

export default function CertificateCodesPage() {
  const [codes, setCodes] = useState<CertificateCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState<CertificateCode | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [copied, setCopied] = useState(false);

  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => { checkAdmin(); }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/auth/signin'); return; }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') { router.push('/dashboard'); return; }
    loadCodes();
  };

  const loadCodes = async () => {
    const { data, error } = await supabase
      .from('certificate_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { console.error(error); }
    if (data) setCodes(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('certificate_codes').insert({
      code: formData.code.trim().toLowerCase(),
      holder_name: formData.holder_name.trim(),
      course_title: formData.course_title.trim(),
      issued_date: formData.issued_date,
      notes: formData.notes.trim() || null,
      is_active: formData.is_active,
    });
    setSaving(false);
    if (error) { alert(`Failed to create code: ${error.message}`); return; }
    setShowCreateModal(false);
    setFormData(emptyForm);
    loadCodes();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCode) return;
    setSaving(true);
    const { error } = await supabase
      .from('certificate_codes')
      .update({
        code: formData.code.trim().toLowerCase(),
        holder_name: formData.holder_name.trim(),
        course_title: formData.course_title.trim(),
        issued_date: formData.issued_date,
        notes: formData.notes.trim() || null,
        is_active: formData.is_active,
      })
      .eq('id', selectedCode.id);
    setSaving(false);
    if (error) { alert(`Failed to update: ${error.message}`); return; }
    setShowEditModal(false);
    setSelectedCode(null);
    setFormData(emptyForm);
    loadCodes();
  };

  const handleDelete = async (item: CertificateCode) => {
    if (!confirm(`Delete code "${item.code}"?\n\nThis cannot be undone.`)) return;
    const { error } = await supabase
      .from('certificate_codes')
      .delete()
      .eq('id', item.id);
    if (error) { alert(`Failed to delete: ${error.message}`); return; }
    loadCodes();
  };

  const openEdit = (item: CertificateCode) => {
    setSelectedCode(item);
    setFormData({
      code: item.code,
      holder_name: item.holder_name,
      course_title: item.course_title,
      issued_date: item.issued_date,
      notes: item.notes ?? '',
      is_active: item.is_active,
    });
    setShowEditModal(true);
  };

  const openView = (item: CertificateCode) => {
    setSelectedCode(item);
    setShowViewModal(true);
  };

  const copyVerifyLink = (code: string) => {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = codes.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.holder_name.toLowerCase().includes(search.toLowerCase()) ||
    c.course_title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  /* ── shared modal form fields ──────────────────────────────────────── */
  const FormFields = ({ accentColor }: { accentColor: string }) => (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Certificate Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="e.g. agc-001"
          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition font-mono`}
          value={formData.code}
          onChange={e => setFormData({ ...formData, code: e.target.value })}
        />
        <p className="text-xs text-gray-500 mt-1">Lowercase letters, numbers and hyphens. Must be unique.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Holder Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="e.g. Alice Mensah"
          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition`}
          value={formData.holder_name}
          onChange={e => setFormData({ ...formData, holder_name: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Course / Certification Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="e.g. Basic Caregiver Training"
          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition`}
          value={formData.course_title}
          onChange={e => setFormData({ ...formData, course_title: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Issued Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          required
          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition`}
          value={formData.issued_date}
          onChange={e => setFormData({ ...formData, issued_date: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (optional)</label>
        <textarea
          rows={3}
          placeholder="Any internal notes about this certificate…"
          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition resize-none`}
          value={formData.notes}
          onChange={e => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            formData.is_active ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              formData.is_active ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm font-medium text-gray-700">
          {formData.is_active ? 'Active — verifiable by public link' : 'Revoked — verification will fail'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Certificate Codes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manually issue and manage certificate verification codes
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => { setFormData(emptyForm); setShowCreateModal(true); }}
            className="px-4 py-2 text-sm bg-pink-600 text-white rounded-md hover:bg-pink-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Code
          </button>
          <Link
            href="/dashboard/admin"
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Back to Admin
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Total Codes</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{codes.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{codes.filter(c => c.is_active).length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Revoked</p>
          <p className="text-3xl font-bold text-red-500 mt-1">{codes.filter(c => !c.is_active).length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search code, name or course…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-3-3v6M4.5 19.5l15-15M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-4" />
            </svg>
            <p className="text-lg font-medium">{search ? 'No matching codes' : 'No certificate codes yet'}</p>
            {!search && <p className="text-sm mt-1">Click "New Code" to add the first one.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Code', 'Holder', 'Course / Certification', 'Issued', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {item.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.holder_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{item.course_title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(item.issued_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {item.is_active ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {/* Copy link */}
                        <button
                          onClick={() => copyVerifyLink(item.code)}
                          title="Copy verification link"
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </button>
                        {/* View */}
                        <button
                          onClick={() => openView(item)}
                          title="View details"
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(item)}
                          title="Edit"
                          className="p-1.5 rounded hover:bg-yellow-50 text-yellow-600 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(item)}
                          title="Delete"
                          className="p-1.5 rounded hover:bg-red-50 text-red-500 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Copied toast */}
      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-lg z-50">
          Verification link copied!
        </div>
      )}

      {/* ── Create Modal ─────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b bg-gradient-to-r from-pink-50 to-pink-100">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">New Certificate Code</h2>
                  <p className="text-sm text-gray-600 mt-1">Manually issue a verification code</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-full transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleCreate} className="p-6">
              <FormFields accentColor="pink" />
              <div className="mt-8 flex gap-3 pt-6 border-t">
                <button type="submit" disabled={saving} className="flex-1 px-6 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-50 transition shadow-md">
                  {saving ? 'Saving…' : 'Create Code'}
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────────────── */}
      {showEditModal && selectedCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b bg-gradient-to-r from-yellow-50 to-yellow-100">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Code</h2>
                  <p className="text-sm text-gray-600 mt-1 font-mono">{selectedCode.code}</p>
                </div>
                <button onClick={() => { setShowEditModal(false); setSelectedCode(null); }} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-full transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleUpdate} className="p-6">
              <FormFields accentColor="yellow" />
              <div className="mt-8 flex gap-3 pt-6 border-t">
                <button type="submit" disabled={saving} className="flex-1 px-6 py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50 transition shadow-md">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => { setShowEditModal(false); setSelectedCode(null); }} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Modal ───────────────────────────────────────────────────── */}
      {showViewModal && selectedCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Code Details</h2>
                  <p className="text-sm text-gray-600 mt-1">Full record information</p>
                </div>
                <button onClick={() => { setShowViewModal(false); setSelectedCode(null); }} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-full transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Code</p>
                  <p className="font-mono text-lg font-bold text-gray-900 bg-gray-100 px-3 py-1.5 rounded">{selectedCode.code}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</p>
                  <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold ${
                    selectedCode.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {selectedCode.is_active ? '✓ Active' : '✗ Revoked'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Holder Name</p>
                  <p className="text-gray-900">{selectedCode.holder_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Issued Date</p>
                  <p className="text-gray-900">
                    {new Date(selectedCode.issued_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Course / Certification</p>
                <p className="text-gray-900">{selectedCode.course_title}</p>
              </div>
              {selectedCode.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-gray-700 text-sm">{selectedCode.notes}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Verification Link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-gray-100 px-3 py-2 rounded text-gray-700 truncate">
                    {typeof window !== 'undefined' ? `${window.location.origin}/verify/${selectedCode.code}` : `/verify/${selectedCode.code}`}
                  </code>
                  <button
                    onClick={() => copyVerifyLink(selectedCode.code)}
                    className="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Created {new Date(selectedCode.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => { setShowViewModal(false); openEdit(selectedCode); }}
                className="flex-1 px-4 py-2.5 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition"
              >
                Edit
              </button>
              <button
                onClick={() => { setShowViewModal(false); setSelectedCode(null); }}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
