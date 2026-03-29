import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { approvalAPI } from '../services/api';
import { toast } from 'react-toastify';

const ApprovalsDashboard = () => {
  const { user, company } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await approvalAPI.getPendingApprovals();
      setPendingApprovals(response.data.approvals);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (approval) => {
    setSelectedApproval(approval);
    setActionType('approve');
    setComment('');
    setShowModal(true);
  };

  const handleReject = (approval) => {
    setSelectedApproval(approval);
    setActionType('reject');
    setComment('');
    setShowModal(true);
  };

  const handleSubmitDecision = async () => {
    if (!selectedApproval) return;

    // Require comment for rejection
    if (actionType === 'reject' && !comment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      
      if (actionType === 'approve') {
        await approvalAPI.approveExpense(selectedApproval.expense_id, comment);
        toast.success('Expense approved successfully');
      } else {
        await approvalAPI.rejectExpense(selectedApproval.expense_id, comment);
        toast.success('Expense rejected');
      }
      
      setShowModal(false);
      fetchPendingApprovals();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error(error.response?.data?.error || 'Failed to process approval');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Approval Dashboard</h1>
        <p className="text-gray-600 mt-1">Review and approve expense requests</p>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Step
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    Loading...
                  </td>
                </tr>
              ) : pendingApprovals.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No pending approvals. Great job!
                  </td>
                </tr>
              ) : (
                pendingApprovals.map((approval) => (
                  <tr key={approval.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {approval.expense?.employee_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {approval.expense?.expense_date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {approval.expense?.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {approval.expense?.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {company?.currency} {approval.expense?.converted_amount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Step {approval.step}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="success"
                        size="small"
                        onClick={() => handleApprove(approval)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleReject(approval)}
                      >
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval/Rejection Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={actionType === 'approve' ? 'Approve Expense' : 'Reject Expense'}
        size="medium"
      >
        <div className="space-y-4">
          {selectedApproval && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Expense Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Employee:</span>
                  <p className="font-medium">{selectedApproval.expense?.employee_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Amount:</span>
                  <p className="font-medium">
                    {company?.currency} {selectedApproval.expense?.converted_amount?.toFixed(2)}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Description:</span>
                  <p className="font-medium">{selectedApproval.expense?.description}</p>
                </div>
              </div>
            </div>
          )}

          <Input
            label={actionType === 'approve' ? 'Comments (Optional)' : 'Reason for Rejection *'}
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={actionType === 'approve' ? 'Add any comments...' : 'Please provide a reason...'}
            required={actionType === 'reject'}
          />

          <div className="flex space-x-4 pt-4">
            <Button
              variant={actionType === 'approve' ? 'success' : 'danger'}
              onClick={handleSubmitDecision}
              loading={processing}
              className="flex-1"
            >
              {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default ApprovalsDashboard;
