'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';

type ModalMode = 'view' | 'edit' | 'add' | null;

interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  price_per_hour: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  icon: string;
  price_per_hour: string;
  is_active: boolean;
  display_order: string;
}

export default function ServiceTypesManagement() {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    icon: 'medical',
    price_per_hour: '',
    is_active: true,
    display_order: '0',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const router = useRouter();
  const supabase = createBrowserClient();

  const iconOptions = [
    { name: 'medical', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: 'heart', d: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    { name: 'user-group', d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'home', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'sparkles', d: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    { name: 'chat', d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { name: 'truck', d: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' },
    { name: 'briefcase', d: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { name: 'clock', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'star', d: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    { name: 'lightning', d: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: 'sun', d: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' },
  ];

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

    loadServices();
  };

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .order('display_order', { ascending: true });

    if (data) setServices(data);
    setLoading(false);
  };

  const openModal = (mode: ModalMode, service?: ServiceType) => {
    setModalMode(mode);
    setFormError('');
    
    if (mode === 'add') {
      setFormData({
        name: '',
        description: '',
        icon: 'medical',
        price_per_hour: '',
        is_active: true,
        display_order: String(services.length),
      });
      setSelectedService(null);
    } else if (service) {
      setSelectedService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        icon: service.icon || '🏥',
        price_per_hour: service.price_per_hour?.toString() || '',
        is_active: service.is_active,
        display_order: service.display_order.toString(),
      });
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedService(null);
    setFormError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const { error } = await supabase
        .from('service_types')
        .insert({
          name: formData.name,
          description: formData.description || null,
          icon: formData.icon,
          price_per_hour: formData.price_per_hour ? parseFloat(formData.price_per_hour) : null,
          is_active: formData.is_active,
          display_order: parseInt(formData.display_order),
        });

      if (error) throw error;

      await loadServices();
      closeModal();
      alert('Service type created successfully!');
    } catch (error: any) {
      setFormError(error.message || 'Failed to create service type');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    setFormLoading(true);
    setFormError('');

    try {
      const { error } = await supabase
        .from('service_types')
        .update({
          name: formData.name,
          description: formData.description || null,
          icon: formData.icon,
          price_per_hour: formData.price_per_hour ? parseFloat(formData.price_per_hour) : null,
          is_active: formData.is_active,
          display_order: parseInt(formData.display_order),
        })
        .eq('id', selectedService.id);

      if (error) throw error;

      await loadServices();
      closeModal();
      alert('Service type updated successfully!');
    } catch (error: any) {
      setFormError(error.message || 'Failed to update service type');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    if (!confirm(`Are you sure you want to delete service type "${serviceName}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('service_types')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      await loadServices();
      alert('Service type deleted successfully!');
    } catch (error: any) {
      alert(`Failed to delete service type: ${error.message}`);
    }
  };

  const toggleActive = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('service_types')
        .update({ is_active: !currentStatus })
        .eq('id', serviceId);

      if (error) throw error;
      await loadServices();
    } catch (error: any) {
      alert(`Failed to update status: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Service Types Management</h1>
          <div className="flex gap-3">
            <button
              onClick={() => openModal('add')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
            >
              + Add Service Type
            </button>
            <Link
              href="/dashboard/admin"
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Back to Admin Dashboard
            </Link>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-lg shadow-md p-6 ${!service.is_active ? 'opacity-60' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-2xl border-2" style={{ backgroundColor: '#694EAB', borderColor: '#4e3a80' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconOptions.find(io => io.name === service.icon)?.d || iconOptions[0].d} />
                  </svg>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {service.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <h3 className="text-xl font-bold mb-2">{service.name}</h3>
              <p className="text-gray-600 text-sm mb-4 h-12 overflow-hidden">{service.description}</p>
              
              {service.price_per_hour && (
                <div className="text-lg font-semibold text-blue-600 mb-4">
                  RWF {service.price_per_hour}/hour
                </div>
              )}

              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => openModal('view', service)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                >
                  View
                </button>
                <button
                  onClick={() => openModal('edit', service)}
                  className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(service.id, service.is_active)}
                  className="flex-1 px-3 py-2 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100"
                >
                  {service.is_active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleDeleteService(service.id, service.name)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {services.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏥</div>
            <h3 className="text-xl font-semibold mb-2">No Service Types Yet</h3>
            <p className="text-gray-600 mb-4">Create your first service type to get started</p>
            <button
              onClick={() => openModal('add')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Service Type
            </button>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold text-blue-600">{services.length}</div>
              <div className="text-sm text-gray-600">Total Services</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{services.filter(s => s.is_active).length}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{services.filter(s => !s.is_active).length}</div>
              <div className="text-sm text-gray-600">Inactive</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                RWF {(services.filter(s => s.price_per_hour).reduce((sum, s) => sum + (s.price_per_hour || 0), 0) / (services.filter(s => s.price_per_hour).length || 1)).toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Avg Price/Hour</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {modalMode === 'view' && 'View Service Type'}
                  {modalMode === 'edit' && 'Edit Service Type'}
                  {modalMode === 'add' && 'Add New Service Type'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {formError}
                </div>
              )}

              {modalMode === 'view' && selectedService && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="inline-block bg-blue-100 p-4 rounded-lg mb-4">
                      <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconOptions.find(io => io.name === selectedService.icon)?.d || iconOptions[0].d} />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                    <p className="text-lg font-semibold">{selectedService.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-gray-600">{selectedService.description || 'No description'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price per Hour</label>
                      <p className="text-lg font-semibold text-blue-600">
                        {selectedService.price_per_hour ? `RWF ${selectedService.price_per_hour}` : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${selectedService.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {selectedService.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => openModal('edit', selectedService)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Edit Service
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {(modalMode === 'edit' || modalMode === 'add') && (
                <form onSubmit={modalMode === 'add' ? handleAddService : handleUpdateService}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Icon *
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {iconOptions.map((iconOption) => (
                          <button
                            key={iconOption.name}
                            type="button"
                            onClick={() => setFormData({ ...formData, icon: iconOption.name })}
                            className={`p-3 rounded border-2 transition ${
                              formData.icon === iconOption.name 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <svg className={`w-6 h-6 mx-auto ${formData.icon === iconOption.name ? 'text-blue-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconOption.d} />
                            </svg>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Select an icon for this service</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price per Hour (RWF)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="price_per_hour"
                          value={formData.price_per_hour}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Display Order
                        </label>
                        <input
                          type="number"
                          name="display_order"
                          value={formData.display_order}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Service is active and visible to users
                      </label>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {formLoading ? 'Processing...' : (modalMode === 'add' ? 'Create Service' : 'Save Changes')}
                      </button>
                      <button
                        type="button"
                        onClick={closeModal}
                        disabled={formLoading}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
