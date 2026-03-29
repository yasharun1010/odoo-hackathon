import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import { userAPI } from '../services/api';
import { toast } from 'react-toastify';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    manager_id: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchManagers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await userAPI.getManagers();
      const managerOptions = response.data.managers.map(m => ({
        value: m.id.toString(),
        label: `${m.name} (${m.email})`,
      }));
      setManagers([{ value: '', label: 'No Manager' }, ...managerOptions]);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        manager_id: user.manager_id?.toString() || '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        manager_id: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingUser) {
        // Update existing user
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          manager_id: formData.manager_id ? parseInt(formData.manager_id) : null,
        };
        await userAPI.updateUser(editingUser.id, updateData);
        toast.success('User updated successfully');
      } else {
        // Create new user
        if (!formData.password) {
          toast.error('Password is required');
          return;
        }
        await userAPI.createUser(formData);
        toast.success('User created successfully');
      }
      
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.response?.data?.error || 'Failed to save user');
    }
  };

  const handleResetPassword = async (userId, userEmail) => {
    const newPassword = prompt('Enter new password for this user:');
    if (!newPassword) return;

    try {
      await userAPI.resetPassword(userId, { new_password: newPassword });
      toast.success(`Password reset for ${userEmail}`);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'danger',
      manager: 'info',
      employee: 'default',
    };
    return <Badge variant={variants[role] || 'default'}>{role}</Badge>;
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage employees and managers</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          + Add User
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.manager?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.is_active ? 'success' : 'danger'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id, user.email)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingUser ? 'Edit User' : 'Add New User'}
        size="medium"
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          {!editingUser && (
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!editingUser}
            />
          )}

          <Select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            options={[
              { value: 'employee', label: 'Employee' },
              { value: 'manager', label: 'Manager' },
              { value: 'admin', label: 'Admin' },
            ]}
            required
          />

          <Select
            label="Manager"
            name="manager_id"
            value={formData.manager_id}
            onChange={handleChange}
            options={managers}
          />

          <div className="flex space-x-4 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default UserManagement;
