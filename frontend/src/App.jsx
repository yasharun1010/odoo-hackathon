import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import SubmitExpense from './pages/SubmitExpense';
import ExpenseList from './pages/ExpenseList';
import ApprovalsDashboard from './pages/ApprovalsDashboard';
import UserManagement from './pages/UserManagement';
import ApprovalRules from './pages/ApprovalRules';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <ExpenseList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/expenses/new"
              element={
                <ProtectedRoute>
                  <SubmitExpense />
                </ProtectedRoute>
              }
            />

            <Route
              path="/approvals"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <ApprovalsDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/rules"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ApprovalRules />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
