'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Leaf, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShowSuccessMessage(true);
    }
  }, [searchParams]);

  const validateForm = () => {
    const tempErrors: Record<string, string> = {};
    if (!formData.email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      tempErrors.password = 'Password is required';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setGeneralError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setGeneralError('');
    setShowSuccessMessage(false);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        setGeneralError('Invalid email or password');
        setIsLoading(false);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setGeneralError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden" id="login-container">
      {/* Decorative background glows */}
      <div className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-8 backdrop-blur-xl shadow-2xl relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Welcome to EcoTrace
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to track your carbon footprint metrics
          </p>
        </div>

        {/* Success Alert */}
        {showSuccessMessage && (
          <div 
            className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-sm text-emerald-400"
            role="alert"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>Account created successfully! Please sign in below.</span>
          </div>
        )}

        {/* Error Alert */}
        {generalError && (
          <div 
            className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Email Field */}
          <div className="space-y-1.5">
            <label htmlFor="email-input" className="text-sm font-semibold text-slate-300">
              Email Address
            </label>
            <input
              id="email-input"
              name="email"
              type="email"
              required
              disabled={isLoading}
              value={formData.email}
              onChange={handleChange}
              className={`w-full rounded-lg border bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500'
              }`}
              placeholder="alex@example.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-xs font-medium text-red-400" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password-input" className="text-sm font-semibold text-slate-300">
                Password
              </label>
            </div>
            <input
              id="password-input"
              name="password"
              type="password"
              required
              disabled={isLoading}
              value={formData.password}
              onChange={handleChange}
              className={`w-full rounded-lg border bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                errors.password ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500'
              }`}
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <p id="password-error" className="text-xs font-medium text-red-400" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 focus-visible:outline-offset-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-sm text-slate-400 mt-6 border-t border-slate-800/60 pt-4">
          New to EcoTrace?{' '}
          <Link 
            href="/register" 
            className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 rounded-sm px-0.5"
          >
            Create an account
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
