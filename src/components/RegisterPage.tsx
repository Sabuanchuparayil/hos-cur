import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      await register(name, email, password);
      navigate('/profile');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center">
      <div className="w-full max-w-md bg-[--bg-secondary] p-8 rounded-lg shadow-xl">
        <h1 className="text-4xl font-cinzel font-bold text-[--accent] mb-6 text-center">Create Account</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[--text-muted]">Full Name</label>
            <input 
              type="text" 
              name="name" 
              id="name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
              className="mt-1 block w-full bg-[--bg-primary] border border-[--border-color] rounded-md shadow-sm py-2 px-3 text-[--text-primary] focus:outline-none focus:ring-[--accent] focus:border-[--accent]"/>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[--text-muted]">Email Address</label>
            <input 
              type="email" 
              name="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="mt-1 block w-full bg-[--bg-primary] border border-[--border-color] rounded-md shadow-sm py-2 px-3 text-[--text-primary] focus:outline-none focus:ring-[--accent] focus:border-[--accent]"/>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[--text-muted]">Password</label>
            <input 
              type="password" 
              name="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="mt-1 block w-full bg-[--bg-primary] border border-[--border-color] rounded-md shadow-sm py-2 px-3 text-[--text-primary] focus:outline-none focus:ring-[--accent] focus:border-[--accent]"/>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[--text-muted]">Confirm Password</label>
            <input 
              type="password" 
              name="confirmPassword" 
              id="confirmPassword" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
              className="mt-1 block w-full bg-[--bg-primary] border border-[--border-color] rounded-md shadow-sm py-2 px-3 text-[--text-primary] focus:outline-none focus:ring-[--accent] focus:border-[--accent]"/>
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div className="text-center">
            <button type="submit" disabled={isLoading} className="w-full px-8 py-3 bg-[--accent] text-[--bg-primary] font-bold text-lg rounded-full hover:bg-[--accent-hover] transition duration-300 transform hover:scale-105 shadow-lg shadow-[--accent]/20 disabled:bg-gray-500 disabled:cursor-not-allowed">
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
         <p className="mt-8 text-center text-sm text-[--text-muted]">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[--accent] hover:text-[--accent-hover]">
                Sign in
            </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;