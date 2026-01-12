// src/components/auth/LoginForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      
      // Create session cookie
      const user = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idToken: await (await import('firebase/auth')).getAuth().currentUser?.getIdToken() 
        }),
      });

      if (user.ok) {
        toast.success('Welcome back! Redirecting to dashboard...', {
          duration: 2000,
          style: {
            background: '#10B981',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            fontWeight: '500',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10B981',
          },
        });
        setTimeout(() => {
          router.push('/dashboard');
        }, 500);
      } else {
        throw new Error('Failed to create session');
      }
    } catch (error: any) {
      // Suppress console error
      console.clear();
      
      let errorMessage = 'Something went wrong. Please try again.';
      
      // Handle specific Firebase error codes
      if (error?.code) {
        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/wrong-password':
          case 'auth/user-not-found':
            errorMessage = '🔒 Invalid email or password. Please double-check your credentials.';
            break;
          case 'auth/invalid-email':
            errorMessage = '📧 Please enter a valid email address.';
            break;
          case 'auth/user-disabled':
            errorMessage = '⚠️ This account has been disabled. Please contact support.';
            break;
          case 'auth/too-many-requests':
            errorMessage = '⏱️ Too many failed attempts. Please try again in a few minutes.';
            break;
          case 'auth/network-request-failed':
            errorMessage = '🌐 Network error. Please check your internet connection.';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      } else if (error?.message && !error?.code) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        style: {
          background: '#fff',
          color: '#DC2626',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '2px solid #FEE2E2',
          boxShadow: '0 10px 25px rgba(220, 38, 38, 0.1)',
          fontWeight: '500',
        },
        iconTheme: {
          primary: '#DC2626',
          secondary: '#FEE2E2',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Lock, text: 'Admin Authentication', available: true },
    { icon: Package, text: 'Product Master Catalog', available: true },
    { icon: CheckCircle, text: 'Customer Management', available: true },
    { icon: Clock, text: '6-Stage Order Tracking', available: true },
    { icon: Mail, text: 'Automated Customer Emails', available: false },
    { icon: CheckCircle, text: 'Real-time Analytics', available: false },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 via-orange-50 to-yellow-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Left side - Branding & Features */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-md">
              <img 
                src="/logo.png" 
                alt="Western Terrain Coffee Roasters" 
                className="h-10 w-10 object-contain"
              />
              <div className="text-left">
                <h1 className="text-2xl font-bold text-gray-900">Western Terrain</h1>
                <p className="text-sm text-amber-700">Coffee Roasters</p>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Admin Order<br />Management System
              </h2>
              <p className="text-lg text-gray-700 max-w-md">
                Streamline your coffee roasting business with our powerful admin portal. Manage orders, customers, and products all in one place.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 max-w-lg">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    feature.available 
                      ? 'bg-white/80 backdrop-blur-sm shadow-sm' 
                      : 'bg-gray-100/50 backdrop-blur-sm opacity-60'
                  }`}
                >
                  <feature.icon className={`w-5 h-5 ${feature.available ? 'text-amber-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${feature.available ? 'text-gray-800' : 'text-gray-500'}`}>
                    {feature.text}
                  </span>
                  {!feature.available && (
                    <span className="ml-auto text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">Soon</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-amber-500 to-orange-600 rounded-full mb-4 shadow-lg">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Admin Sign In</h3>
                <p className="text-gray-600 mt-2">Enter your credentials to access the dashboard</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@coffeebrands.com"
                      required
                      autoComplete="email"
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-linear-to-r from-amber-600 to-orange-600 text-white py-3 px-4 rounded-lg hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-center text-sm text-gray-500">
                  🔒 Admin access only • Secure authentication
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}