import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, company, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/expenses', label: 'Expenses' },
  ];

  // Add role-specific links
  if (user?.role === 'admin') {
    navLinks.push({ path: '/users', label: 'Users' });
    navLinks.push({ path: '/rules', label: 'Approval Rules' });
  }

  if (user?.role === 'manager' || user?.role === 'admin') {
    navLinks.push({ path: '/approvals', label: 'Approvals' });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-blue-600">ReimbursementPro</h1>
              </div>

              {/* Navigation Links */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                      location.pathname === link.path
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <Button variant="outline" size="small" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
