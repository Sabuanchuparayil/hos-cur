import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { User } from '../types';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithProvider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoginSuccess = (loggedInUser: User) => {
    const from = location.state?.from?.pathname;
    if (from) {
        navigate(from, { replace: true });
    } else {
        // Default navigation if no 'from' state
        if (loggedInUser.role !== 'customer') {
            navigate('/admin');
        } else {
            navigate('/');
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setIsLoading(true);
    try {
      const loggedInUser = await login(email, password);
      handleLoginSuccess(loggedInUser);
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    if (isLoading) return;
    setError('');
    setIsLoading(true);
    try {
        const loggedInUser = await loginWithProvider(provider);
        handleLoginSuccess(loggedInUser);
    } catch (err: any) {
        setError(err.message || 'An error occurred during social login.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center">
      <div className="w-full max-w-md bg-[--bg-secondary] p-8 rounded-lg shadow-xl">
        <h1 className="text-4xl font-cinzel font-bold text-[--accent] mb-6 text-center">Login</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[--text-muted]">Email Address</label>
            <input 
              type="email" 
              name="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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
              autoComplete="current-password"
              required 
              className="mt-1 block w-full bg-[--bg-primary] border border-[--border-color] rounded-md shadow-sm py-2 px-3 text-[--text-primary] focus:outline-none focus:ring-[--accent] focus:border-[--accent]"/>
          </div>
          
          {error && <p className="text-red-500 text-sm text-center !mt-4">{error}</p>}
          
          <div className="text-center">
            <button type="submit" disabled={isLoading} className="w-full px-8 py-3 bg-[--accent] text-[--bg-primary] font-bold text-lg rounded-full hover:bg-[--accent-hover] transition duration-300 transform hover:scale-105 shadow-lg shadow-[--accent]/20 disabled:bg-gray-500 disabled:cursor-not-allowed">
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-[--border-color]" />
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="bg-[--bg-secondary] px-2 text-[--text-muted]">Or continue with</span>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center py-2 px-4 border border-[--border-color] rounded-md shadow-sm bg-[--bg-primary] text-sm font-medium text-[--text-secondary] hover:bg-[--bg-tertiary] disabled:opacity-50 transition-colors"
            >
                <svg className="w-5 h-5 mr-2" role="img" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.48 10.92v3.28h7.84c-.27 1.45-1.04 2.9-2.2 3.87v2.85h3.32c1.93-1.8 3.04-4.54 3.04-7.98 0-.83-.07-1.62-.2-2.36h-12z" />
                    <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.32-2.85c-1.08.73-2.45 1.16-4.61 1.16-3.47 0-6.42-2.33-7.47-5.46H1.07v2.91C3.05 21.45 7.22 24 12 24z" />
                    <path d="M5.27 14.29c-.25-.72-.38-1.48-.38-2.29s.13-1.57.38-2.29V6.79H1.83C1.08 8.28.63 10.08.63 12s.45 3.72 1.2 5.21l3.44-2.92z" />
                    <path d="M12 4.75c1.77 0 3.34.61 4.56 1.79l2.77-2.77A11.9 11.9 0 0012 2C7.22 2 3.05 4.55 1.07 8.21l3.44 2.92C5.58 8.13 8.53 4.75 12 4.75z" />
                </svg>
                Google
            </button>
            <button
                type="button"
                onClick={() => handleSocialLogin('facebook')}
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center py-2 px-4 border border-[--border-color] rounded-md shadow-sm bg-[--bg-primary] text-sm font-medium text-[--text-secondary] hover:bg-[--bg-tertiary] disabled:opacity-50 transition-colors"
            >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
                Facebook
            </button>
        </div>

        <p className="mt-8 text-center text-sm text-[--text-muted]">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-[--accent] hover:text-[--accent-hover]">
                Sign up
            </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
