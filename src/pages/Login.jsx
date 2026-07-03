import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, LifeBuoy, AlertCircle } from 'lucide-react';

const Login = () => {
  const { user, login, error: authError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setLocalError(null);
      
      const result = await login(email, password);
      if (result.success) {
        // Redirection logic happens inside App.jsx or here based on user role
        // For security, we'll request details from getMe, which sets the state.
        // We'll let the user context update, then redirect based on role.
      } else {
        setLocalError(result.message);
      }
    } catch (err) {
      setLocalError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick helper to fill credentials and log in instantly for testing
  const handleQuickLogin = async (demoRole) => {
    let demoEmail = '';
    const demoPassword = 'password123';

    switch (demoRole) {
      case 'admin':
        demoEmail = 'admin@ticket.com';
        break;
      case 'agent':
        demoEmail = 'agent1@ticket.com';
        break;
      case 'customer':
        demoEmail = 'customer1@ticket.com';
        break;
      default:
        return;
    }

    setEmail(demoEmail);
    setPassword(demoPassword);
    
    try {
      setLoading(true);
      setLocalError(null);
      await login(demoEmail, demoPassword);
    } catch (err) {
      setLocalError('Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-indigo-600/30 shadow-md">
            <LifeBuoy className="w-8 h-8" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
            OmniSupport
          </span>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-100">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Or{' '}
          <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
            register a new customer account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="glass-panel py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {(localError || authError) && (
              <div className="flex items-center space-x-2 text-rose-400 bg-rose-500/10 border border-rose-500/25 p-3.5 rounded-xl text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{localError || authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white py-3 rounded-xl font-bold tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-600/25"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-850"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-3 text-slate-500 font-bold tracking-widest">
                  Quick Demo Access
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('customer')}
                className="flex flex-col items-center justify-center p-2.5 bg-indigo-950/20 hover:bg-indigo-900/30 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl text-[11px] font-bold text-indigo-400 cursor-pointer transition-all duration-200"
              >
                <span>Customer</span>
                <span className="text-[9px] text-indigo-500/60 font-medium mt-0.5">Demo</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('agent')}
                className="flex flex-col items-center justify-center p-2.5 bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl text-[11px] font-bold text-emerald-400 cursor-pointer transition-all duration-200"
              >
                <span>Agent</span>
                <span className="text-[9px] text-emerald-500/60 font-medium mt-0.5">Demo</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="flex flex-col items-center justify-center p-2.5 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-500/20 hover:border-rose-500/40 rounded-xl text-[11px] font-bold text-rose-400 cursor-pointer transition-all duration-200"
              >
                <span>Admin</span>
                <span className="text-[9px] text-rose-500/60 font-medium mt-0.5">Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
