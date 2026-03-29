import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { expenseAPI, approvalAPI } from '../services/api';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user, company } = useAuth();
  const [stats, setStats] = useState({
    myExpenses: [],
    pendingApprovals: [],
    totalAmount: 0,
    approvedAmount: 0,
    pendingAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's expenses
      const expensesResponse = await expenseAPI.getMyExpenses();
      const expenses = expensesResponse.data.expenses;

      // Calculate totals
      const totalAmount = expenses.reduce((sum, exp) => sum + (exp.converted_amount || exp.amount), 0);
      const approvedAmount = expenses
        .filter(exp => exp.status === 'approved')
        .reduce((sum, exp) => sum + (exp.converted_amount || exp.amount), 0);
      const pendingAmount = expenses
        .filter(exp => exp.status === 'pending')
        .reduce((sum, exp) => sum + (exp.converted_amount || exp.amount), 0);

      // Fetch pending approvals if manager/admin
      let pendingApprovals = [];
      if (user.role === 'manager' || user.role === 'admin') {
        const approvalsResponse = await approvalAPI.getPendingApprovals();
        pendingApprovals = approvalsResponse.data.approvals;
      }

      setStats({
        myExpenses: expenses.slice(0, 5), // Last 5 expenses
        pendingApprovals,
        totalAmount,
        approvedAmount,
        pendingAmount,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      draft: 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="large" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {company?.currency} {stats.totalAmount.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Approved</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {company?.currency} {stats.approvedAmount.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {company?.currency} {stats.pendingAmount.toFixed(2)}
          </p>
        </div>

        {(user.role === 'manager' || user.role === 'admin') && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Pending Approvals</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {stats.pendingApprovals.length}
            </p>
          </div>
        )}
      </div>

      {/* Recent Expenses */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Expenses</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.myExpenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No expenses yet. Submit your first expense!
                  </td>
                </tr>
              ) : (
                stats.myExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.expense_date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {expense.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {company?.currency} {expense.converted_amount?.toFixed(2) || expense.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(expense.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Approvals (for managers/admins) */}
      {(user.role === 'manager' || user.role === 'admin') && stats.pendingApprovals.length > 0 && (
        <div className="bg-white rounded-lg shadow">
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
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Step
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.pendingApprovals.map((approval) => (
                  <tr key={approval.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {approval.approver_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {approval.expense?.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {company?.currency} {approval.expense?.converted_amount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Step {approval.step}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
