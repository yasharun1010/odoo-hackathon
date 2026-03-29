import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { toast } from 'react-toastify';

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company_name: '',
    country: '',
  });

  // Fetch countries on mount
  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      setCountriesLoading(true);

      const signal = (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function')
        ? AbortSignal.timeout(5000)
        : undefined;
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name', { signal });
      
      if (!response.ok) {
        throw new Error('Failed to fetch countries - API returned ' + response.status);
      }
      
      const data = await response.json();
      
      const sortedCountries = data
        .map((country) => country?.name?.common)
        .filter(Boolean)
        .sort();
      
      const options = sortedCountries.map((country) => ({
        value: country,
        label: country,
      }));
      
      setCountries(options);
      setCountriesLoading(false);
    } catch (error) {
      // Fallback to a predefined list of common countries
      const fallbackCountries = [
        'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
        'France', 'India', 'China', 'Japan', 'Brazil', 'Mexico', 'Spain',
        'Italy', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland',
        'Poland', 'Belgium', 'Switzerland', 'Austria', 'Ireland', 'New Zealand',
        'Singapore', 'South Korea', 'Portugal', 'Greece', 'Czech Republic'
      ].sort();
      
      const options = fallbackCountries.map((country) => ({
        value: country,
        label: country,
      }));
      
      setCountries(options);
      setCountriesLoading(false);
      toast.info('Using offline country list');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const signupData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      company_name: formData.company_name,
      country: formData.country,
    };

    const result = await signup(signupData);

    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Signup failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <p><strong>Debug:</strong></p>
            <p>Countries loaded: {countries.length}</p>
            <p>Loading state: {countriesLoading ? 'true' : 'false'}</p>
            <p>Selected country: {formData.country || '(none)'}</p>
            <p>First 3 countries: {countries.slice(0, 3).map(c => c.label).join(', ')}</p>
          </div>
        )}
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Set up your company and admin account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <Input
            label="Company Name"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            placeholder="Enter company name"
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
              disabled={countriesLoading}
              className={`
                w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2
                appearance-none bg-white cursor-pointer
                ${!formData.country 
                  ? 'border-gray-300 focus:ring-blue-200' 
                  : 'border-green-400 focus:ring-green-200'}
                ${countriesLoading ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}
              `}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1em'
              }}
            >
              <option value="">Select your country</option>
              {countriesLoading ? (
                <option disabled>Loading countries...</option>
              ) : (
                countries.map((country, index) => (
                  <option key={`${country.value}-${index}`} value={country.value}>
                    {country.label}
                  </option>
                ))
              )}
            </select>
            {!formData.country && countries.length > 0 && !countriesLoading && (
              <p className="mt-1 text-xs text-gray-500">{countries.length} countries available</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            className="w-full mt-6"
          >
            Create Account
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
