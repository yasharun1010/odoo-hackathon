import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import { approvalAPI, userAPI } from '../services/api';
import { toast } from 'react-toastify';

const ApprovalRules = () => {
  const [rules, setRules] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    rule_type: 'percentage',
    category: '',
    percentage: 60,
    specific_approver_id: '',
    min_approvers_required: 1,
    is_sequential: true,
    description: '',
  });

  const categories = [
    { value: '', label: 'All Categories (Default)' },
    { value: 'travel', label: 'Travel' },
    { value: 'meals', label: 'Meals & Entertainment' },
    { value: 'accommodation', label: 'Accommodation' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'office_supplies', label: 'Office Supplies' },
    { value: 'software', label: 'Software & Tools' },
    { value: 'training', label: 'Training & Education' },
    { value: 'conference', label: 'Conference & Events' },
    { value: 'miscellaneous', label: 'Miscellaneous' },
  ];

  useEffect(() => {
    fetchRules();
    fetchManagers();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await approvalAPI.getApprovalRules();
      setRules(response.data.rules);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast.error('Failed to load approval rules');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await userAPI.getManagers();
      const managerOptions = response.data.managers.map(m => ({
        value: m.id.toString(),
        label: `${m.name} (${m.role})`,
      }));
      setManagers([{ value: '', label: 'Select Approver' }, ...managerOptions]);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const handleOpenModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        rule_type: rule.rule_type,
        category: rule.category || '',
        percentage: rule.percentage || 60,
        specific_approver_id: rule.specific_approver_id?.toString() || '',
        min_approvers_required: rule.min_approvers_required || 1,
        is_sequential: rule.is_sequential,
        description: rule.description || '',
      });
    } else {
      setEditingRule(null);
      setFormData({
        rule_type: 'percentage',
        category: '',
        percentage: 60,
        specific_approver_id: '',
        min_approvers_required: 1,
        is_sequential: true,
        description: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRule(null);
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        percentage: formData.rule_type === 'percentage' ? parseFloat(formData.percentage) : null,
        specific_approver_id: formData.rule_type === 'specific_approver' ? parseInt(formData.specific_approver_id) : null,
      };

      if (editingRule) {
        await approvalAPI.updateApprovalRule(editingRule.id, submitData);
        toast.success('Rule updated successfully');
      } else {
        await approvalAPI.createApprovalRule(submitData);
        toast.success('Rule created successfully');
      }

      handleCloseModal();
      fetchRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error(error.response?.data?.error || 'Failed to save rule');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;

    try {
      await approvalAPI.deleteApprovalRule(ruleId);
      toast.success('Rule deleted successfully');
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete rule');
    }
  };

  const getRuleTypeBadge = (type) => {
    const variants = {
      percentage: 'info',
      specific_approver: 'warning',
      hybrid: 'success',
    };
    return <Badge variant={variants[type] || 'default'}>{type.replace('_', ' ')}</Badge>;
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approval Rules</h1>
          <p className="text-gray-600 mt-1">Configure expense approval workflows</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          + Add Rule
        </Button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">How Approval Rules Work</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Percentage:</strong> Requires a certain percentage of approvers to approve</li>
          <li>• <strong>Specific Approver:</strong> Requires approval from a specific person (e.g., CFO)</li>
          <li>• <strong>Hybrid:</strong> Either percentage OR specific approver can approve</li>
          <li>• Sequential means approvals happen one after another, parallel means all at once</li>
        </ul>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sequence
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
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No approval rules configured
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rule.category ? (
                        <span className="capitalize">{rule.category}</span>
                      ) : (
                        <span className="text-gray-500">All Categories</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRuleTypeBadge(rule.rule_type)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {rule.rule_type === 'percentage' && (
                        <span>{rule.percentage}% approval required</span>
                      )}
                      {rule.rule_type === 'specific_approver' && (
                        <span>Requires: {rule.specific_approver_name}</span>
                      )}
                      {rule.rule_type === 'hybrid' && (
                        <span>
                          {rule.percentage}% OR {rule.specific_approver_name}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rule.is_sequential ? 'Sequential' : 'Parallel'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={rule.is_active ? 'success' : 'danger'}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleOpenModal(rule)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Rule Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingRule ? 'Edit Approval Rule' : 'Add Approval Rule'}
        size="large"
      >
        <form onSubmit={handleSubmit}>
          <Select
            label="Rule Type"
            name="rule_type"
            value={formData.rule_type}
            onChange={handleChange}
            options={[
              { value: 'percentage', label: 'Percentage-Based' },
              { value: 'specific_approver', label: 'Specific Approver' },
              { value: 'hybrid', label: 'Hybrid (Percentage OR Specific)' },
            ]}
            required
          />

          <Select
            label="Expense Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={categories}
          />

          {(formData.rule_type === 'percentage' || formData.rule_type === 'hybrid') && (
            <Input
              label="Required Percentage (%)"
              type="number"
              name="percentage"
              value={formData.percentage}
              onChange={handleChange}
              min="1"
              max="100"
              required
            />
          )}

          {(formData.rule_type === 'specific_approver' || formData.rule_type === 'hybrid') && (
            <Select
              label="Specific Approver"
              name="specific_approver_id"
              value={formData.specific_approver_id}
              onChange={handleChange}
              options={managers}
              required
            />
          )}

          <Input
            label="Minimum Approvers Required"
            type="number"
            name="min_approvers_required"
            value={formData.min_approvers_required}
            onChange={handleChange}
            min="1"
          />

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_sequential"
                checked={formData.is_sequential}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Sequential Approval (one after another)
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              If unchecked, all approvers will be notified simultaneously
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Describe when this rule applies..."
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              {editingRule ? 'Update Rule' : 'Create Rule'}
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

export default ApprovalRules;
