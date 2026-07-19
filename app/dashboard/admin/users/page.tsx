'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';
import { User } from '@/lib/types';

type ModalMode = 'view' | 'edit' | 'add' | null;

interface UserFormData {
  full_name: string;
  email: string;
  role: string;
  phone?: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    full_name: '',
    email: '',
    role: 'student',
    phone: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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

    loadUsers();
  };

  const loadUsers = async () => {
    let query = supabase.from('profiles').select('*');

    if (filter !== 'all') {
      query = query.eq('role', filter);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!loading) loadUsers();
  }, [filter]);

  const openModal = (mode: ModalMode, user?: User) => {
    setModalMode(mode);
    setFormError('');
    
    if (mode === 'add') {
      setFormData({
        full_name: '',
        email: '',
        role: 'student',
        phone: '',
      });
      setSelectedUser(null);
    } else if (user) {
      setSelectedUser(user);
      setFormData({
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
      });
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedUser(null);
    setFormError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Generate a random secure password
  const generateRandomPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      // Generate unique random password for this user
      const randomPassword = generateRandomPassword();

      // Create auth user - this will send a confirmation email with password reset link
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: randomPassword,
        options: {
          data: {
            full_name: formData.full_name,
            temporary_password: randomPassword, // Store for reference
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        // If rate limit error, suggest alternative
        if (authError.message.includes('rate limit') || authError.message.includes('Email rate')) {
          throw new Error('Email rate limit exceeded. Please wait a few minutes, or use the SQL script method that generates and displays unique passwords for you to share manually.');
        }
        throw authError;
      }

      if (authData.user) {
        // Update profile with role (conditionally include phone)
        const updateData: any = {
          full_name: formData.full_name,
          role: formData.role,
        };

        // Only include phone if it has a value
        if (formData.phone) {
          updateData.phone = formData.phone;
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', authData.user.id);

        if (profileError) throw profileError;

        // Reload users
        await loadUsers();
        closeModal();
        
        // Show success with the generated password (in case email doesn't arrive)
        alert(`User created successfully!\n\n✅ Confirmation email sent to: ${formData.email}\n\n📧 The user will receive:\n- Confirmation email with link\n- Instructions to set their password\n\n⚠️ Backup credentials (if email fails):\nEmail: ${formData.email}\nTemporary Password: ${randomPassword}\n\nThe user should check their email and follow the confirmation link.`);
      }
    } catch (error: any) {
      setFormError(error.message || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setFormLoading(true);
    setFormError('');

    try {
      // Update profile (conditionally include phone)
      const updateData: any = {
        full_name: formData.full_name,
        role: formData.role,
      };

      // Only include phone if it has a value
      if (formData.phone) {
        updateData.phone = formData.phone;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Reload users
      await loadUsers();
      closeModal();
      alert('User updated successfully!');
    } catch (error: any) {
      setFormError(error.message || 'Failed to update user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      // Note: This only deletes the profile. Auth user deletion requires admin privileges.
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      await loadUsers();
      alert('User profile deleted successfully!');
    } catch (error: any) {
      alert(`Failed to delete user: ${error.message}`);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getRoleBadgeColor = (role: string) => {
    const colors: any = {
      admin: 'bg-red-100 text-red-800',
      trainer: 'bg-blue-100 text-blue-800',
      student: 'bg-green-100 text-green-800',
      caregiver: 'bg-purple-100 text-purple-800',
      nurse: 'bg-pink-100 text-pink-800',
      consultant: 'bg-yellow-100 text-yellow-800',
      client: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold">User Management</h1>
          <div className="flex gap-3">
            <button
              onClick={() => openModal('add')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
            >
              + Add User
            </button>
            <Link
              href="/dashboard/admin"
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Back to Admin Dashboard
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Filter by role:</span>
            {['all', 'admin', 'trainer', 'student', 'caregiver', 'nurse', 'consultant', 'client'].map((role) => (
              <button
                key={role}
                onClick={() => setFilter(role)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  filter === role
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {role === 'all' ? 'All Users' : role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openModal('view', user)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openModal('edit', user)}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.full_name)}
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

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No users found
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Summary</h3>
          <p className="text-gray-600">
            Showing {filteredUsers.length} of {users.length} {filter !== 'all' ? filter : ''} user{users.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {modalMode === 'view' && 'View User'}
                  {modalMode === 'edit' && 'Edit User'}
                  {modalMode === 'add' && 'Add New User'}
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

              {modalMode === 'view' && selectedUser && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <p className="text-lg">{selectedUser.full_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-lg">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getRoleBadgeColor(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                  {selectedUser.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <p className="text-lg">{selectedUser.phone}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                    <p className="text-sm text-gray-600 font-mono">{selectedUser.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Joined</label>
                    <p className="text-lg">{new Date(selectedUser.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => openModal('edit', selectedUser)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Edit User
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
                <form onSubmit={modalMode === 'add' ? handleAddUser : handleUpdateUser}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        disabled={modalMode === 'edit'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      />
                      {modalMode === 'edit' && (
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role *
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="student">Student</option>
                        <option value="caregiver">Caregiver</option>
                        <option value="nurse">Nurse</option>
                        <option value="trainer">Trainer</option>
                        <option value="consultant">Consultant</option>
                        <option value="client">Client</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {modalMode === 'add' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <p className="text-sm text-blue-800">
                          <strong>📧 How it works:</strong>
                          <br />
                          1. A unique secure password will be generated automatically
                          <br />
                          2. User will receive a <strong>confirmation email</strong> with instructions
                          <br />
                          3. They click the link in the email to confirm their account
                          <br />
                          4. They can then login and set their own password
                          <br />
                          <br />
                          <strong>⚠️ Backup:</strong> A temporary password will be shown after creation (in case email doesn't arrive)
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 mt-6">
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {formLoading ? 'Processing...' : (modalMode === 'add' ? 'Create User' : 'Save Changes')}
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
