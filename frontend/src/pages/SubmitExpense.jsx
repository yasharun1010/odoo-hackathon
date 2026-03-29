import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import { expenseAPI } from '../services/api';
import { toast } from 'react-toastify';

const SubmitExpense = () => {
  const navigate = useNavigate();
  const { company } = useAuth();
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const getTodayLocalISO = () => {
    const now = new Date();
    const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
    return new Date(now.getTime() - tzOffsetMs).toISOString().split('T')[0];
  };
  const [formData, setFormData] = useState({
    amount: '',
    currency: company?.currency || 'USD',
    category: '',
    description: '',
    expense_date: getTodayLocalISO(),
  });

  const categories = [
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

  const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'CHF', label: 'CHF - Swiss Franc' },
    { value: 'CNY', label: 'CNY - Chinese Yuan' },
    { value: 'SGD', label: 'SGD - Singapore Dollar' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 16 * 1024 * 1024) { // 16MB max
      setReceiptFile(file);
    } else {
      toast.error('File size must be less than 16MB');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate amount
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      // Create form data for file upload
      const submitData = new FormData();
      submitData.append('amount', formData.amount);
      submitData.append('currency', formData.currency);
      submitData.append('category', formData.category);
      submitData.append('description', formData.description);
      submitData.append('expense_date', formData.expense_date);
      
      if (receiptFile) {
        submitData.append('receipt', receiptFile);
      }

      await expenseAPI.createExpense(submitData);
      toast.success('Expense submitted successfully!');
      navigate('/expenses');
    } catch (error) {
      console.error('Error submitting expense:', error);
      toast.error(error.response?.data?.error || 'Failed to submit expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Submit Expense</h1>
        <p className="text-gray-600 mt-1">Create a new expense reimbursement request</p>
      </div>

      <div className="max-w-3xl bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />

            <Select
              label="Currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              options={currencies}
              required
            />
          </div>

          <Select
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={categories}
            required
          />

          <Input
            label="Expense Date"
            type="date"
            name="expense_date"
            value={formData.expense_date}
            onChange={handleChange}
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Provide details about this expense..."
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Receipt (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600 justify-center">
                  <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                    />
                  </label>
                  {receiptFile && (
                    <p className="ml-1 text-green-600 font-medium">{receiptFile.name}</p>
                  )}
                </div>
                <p className="text-xs text-gray-500">PDF, PNG, JPG up to 16MB</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="flex-1"
            >
              Submit Expense
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/expenses')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default SubmitExpense;
