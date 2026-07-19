'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';

interface Caregiver {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  specialization: string | null;
  availability: any;
  rating: number;
  created_at: string;
}

export default function CaregiversManagement() {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPINModal, setShowPINModal] = useState(false);
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [generatedPIN, setGeneratedPIN] = useState<string>('');
  const [caregiverEmail, setCaregiverEmail] = useState<string>('');
  const [sendEmailOption, setSendEmailOption] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    specialization: '',
  });
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    loadCaregivers();
  };

  const loadCaregivers = async () => {
    const { data, error } = await supabase
      .from('caregivers')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setCaregivers(data);
    setLoading(false);
  };

  const handleCreateCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch('/api/admin/caregivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          send_email: sendEmailOption,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create caregiver');
      }

      // Show the PIN to admin
      setGeneratedPIN(data.credentials.pin);
      setCaregiverEmail(formData.email);
      setShowCreateModal(false);
      setShowPINModal(true);
      
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        specialization: '',
      });
      
      loadCaregivers();
    } catch (err: any) {
      alert(`Failed to create caregiver: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleViewCaregiver = (caregiver: Caregiver) => {
    setSelectedCaregiver(caregiver);
    setShowViewModal(true);
  };

  const handleEditCaregiver = (caregiver: Caregiver) => {
    setSelectedCaregiver(caregiver);
    setFormData({
      full_name: caregiver.full_name,
      email: caregiver.email,
      phone: caregiver.phone,
      specialization: caregiver.specialization || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaregiver) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('caregivers')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          specialization: formData.specialization || null,
        })
        .eq('id', selectedCaregiver.id);

      if (error) throw error;

      alert('Caregiver updated successfully!');
      setShowEditModal(false);
      setSelectedCaregiver(null);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        specialization: '',
      });
      loadCaregivers();
    } catch (err: any) {
      alert(`Failed to update caregiver: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const deleteCaregiver = async (caregiverId: string, caregiverName: string) => {
    if (!confirm(`Are you sure you want to delete "${caregiverName}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase
      .from('caregivers')
      .delete()
      .eq('id', caregiverId);

    if (error) {
      alert('Failed to delete caregiver');
      return;
    }

    loadCaregivers();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Caregiver Management</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm bg-pink-600 text-white rounded-md hover:bg-pink-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Caregiver
          </button>
          <Link
            href="/dashboard/admin"
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Back to Admin Dashboard
          </Link>
        </div>
      </div>

      {/* Create Caregiver Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b bg-gradient-to-r from-pink-50 to-pink-100">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add New Caregiver</h2>
                  <p className="text-sm text-gray-600 mt-1">Fill in the caregiver details</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-full transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateCaregiver} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                    placeholder="e.g., Jane Smith"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                    placeholder="jane.smith@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Specialization
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition bg-white"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  >
                    <option value="">Select specialization</option>
                    <option value="Elderly Care">Elderly Care</option>
                    <option value="Dementia Care">Dementia Care</option>
                    <option value="Disability Support">Disability Support</option>
                    <option value="Post-Surgery Care">Post-Surgery Care</option>
                    <option value="Palliative Care">Palliative Care</option>
                    <option value="Child Care">Child Care</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="send_email"
                      checked={sendEmailOption}
                      onChange={(e) => setSendEmailOption(e.target.checked)}
                      className="mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label htmlFor="send_email" className="ml-3 block">
                      <span className="text-sm font-semibold text-gray-900">Send login PIN via email</span>
                      <p className="text-xs text-gray-600 mt-1">
                        A 6-digit PIN will be automatically generated and sent to the caregiver's email. 
                        If unchecked, you'll receive the PIN to share manually.
                      </p>
                    </label>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-900">Account Creation Notice</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        This will create a full login account for the caregiver with access to their dashboard.
                        The caregiver can login using their email and the generated PIN.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3 pt-6 border-t">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-6 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg"
                >
                  {creating ? 'Creating...' : 'Add Caregiver'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN Display Modal */}
      {showPINModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
            <div className="p-6 border-b bg-gradient-to-r from-green-50 to-green-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Caregiver Account Created!</h2>
                  <p className="text-sm text-gray-600 mt-1">Login credentials generated</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  The caregiver can now login with these credentials:
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                    <div className="bg-white px-3 py-2 rounded border border-gray-300">
                      <p className="text-sm font-mono text-gray-900">{caregiverEmail}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Login PIN</label>
                    <div className="bg-white px-3 py-2 rounded border border-gray-300 flex items-center justify-between">
                      <p className="text-2xl font-bold font-mono text-green-600 tracking-widest">{generatedPIN}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedPIN);
                          alert('PIN copied to clipboard!');
                        }}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs font-medium"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {sendEmailOption ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-900">Email Sent</p>
                      <p className="text-xs text-green-700 mt-1">
                        The PIN has been sent to the caregiver's email address.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-900">Manual Delivery Required</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Please provide these credentials to the caregiver securely.
                        Make sure to copy the PIN before closing this window.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600">
                  <strong>Important:</strong> The caregiver can login at the signin page using their email and this PIN. 
                  They should change their PIN after first login for security.
                </p>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={() => {
                  setShowPINModal(false);
                  setGeneratedPIN('');
                  setCaregiverEmail('');
                }}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Caregiver Modal */}
      {showEditModal && selectedCaregiver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b bg-gradient-to-r from-green-50 to-green-100">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Caregiver</h2>
                  <p className="text-sm text-gray-600 mt-1">Update caregiver information</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCaregiver(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-full transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateCaregiver} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    placeholder="e.g., Jane Smith"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    placeholder="jane.smith@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Specialization
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  >
                    <option value="">Select specialization</option>
                    <option value="Elderly Care">Elderly Care</option>
                    <option value="Dementia Care">Dementia Care</option>
                    <option value="Disability Support">Disability Support</option>
                    <option value="Post-Surgery Care">Post-Surgery Care</option>
                    <option value="Palliative Care">Palliative Care</option>
                    <option value="Child Care">Child Care</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 flex gap-3 pt-6 border-t">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg"
                >
                  {updating ? 'Updating...' : 'Update Caregiver'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCaregiver(null);
                  }}
                  disabled={updating}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Caregiver Modal */}
      {showViewModal && selectedCaregiver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Caregiver Details</h2>
                  <p className="text-sm text-gray-600 mt-1">Complete profile information</p>
                </div>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedCaregiver(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-full transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Profile Header */}
              <div className="flex items-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {selectedCaregiver.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-6">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedCaregiver.full_name}</h3>
                  <div className="flex items-center mt-2">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="ml-2 text-lg font-semibold text-gray-900">{selectedCaregiver.rating.toFixed(1)}</span>
                    <span className="ml-1 text-sm text-gray-500">/ 5.0</span>
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 mb-1">Email Address</label>
                      <p className="text-gray-900 font-medium">{selectedCaregiver.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 mb-1">Phone Number</label>
                      <p className="text-gray-900 font-medium">{selectedCaregiver.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 mb-1">Specialization</label>
                      <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                        {selectedCaregiver.specialization || 'General Care'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 mb-1">User ID</label>
                      <p className="text-gray-900 font-mono text-xs">{selectedCaregiver.user_id || 'Not linked'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 mb-1">Caregiver ID</label>
                      <p className="text-gray-900 font-mono text-xs">{selectedCaregiver.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 mb-1">Joined Date</label>
                      <p className="text-gray-900 font-medium">
                        {new Date(selectedCaregiver.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Availability Section */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Availability</label>
                  {selectedCaregiver.availability && Array.isArray(selectedCaregiver.availability) && selectedCaregiver.availability.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedCaregiver.availability.map((day: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                          {day}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No availability set</p>
                  )}
                </div>
              </div>

              <div className="mt-8 flex gap-3 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditCaregiver(selectedCaregiver);
                  }}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-md hover:shadow-lg"
                >
                  Edit Caregiver
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedCaregiver(null);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Caregivers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {caregivers.map((caregiver) => (
                <tr key={caregiver.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {caregiver.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{caregiver.full_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{caregiver.email}</div>
                    <div className="text-sm text-gray-500">{caregiver.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                      {caregiver.specialization || 'General Care'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="ml-2 text-sm text-gray-900">{caregiver.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewCaregiver(caregiver)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEditCaregiver(caregiver)}
                      className="text-green-600 hover:text-green-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCaregiver(caregiver.id, caregiver.full_name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {caregivers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p>No caregivers found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
            >
              Add Your First Caregiver
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      {caregivers.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Summary</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Caregivers</p>
              <p className="text-2xl font-bold">{caregivers.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-yellow-600">
                {(caregivers.reduce((sum, c) => sum + c.rating, 0) / caregivers.length).toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Top Rated (5.0)</p>
              <p className="text-2xl font-bold text-green-600">
                {caregivers.filter(c => c.rating === 5.0).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
