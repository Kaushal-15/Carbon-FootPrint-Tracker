'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Leaf, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const tempErrors: Record<string, string> = {};
    if (!formData.name.trim()) tempErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      tempErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      tempErrors.password = 'Password must be at least 8 characters';
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

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          // Field-specific validation errors from backend
          const backendErrors: Record<string, string> = {};
          Object.entries(data.errors).forEach(([key, val]) => {
            backendErrors[key] = Array.isArray(val) ? val[0] : (val as string);
          });
          setErrors(backendErrors);
        } else {
          setGeneralError(data.message || 'Registration failed');
        }
        setIsLoading(false);
        return;
      }

      // Success -> Auto log in the user
      const loginResult = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (loginResult?.error) {
        // Redirect to login if auto-sign-in fails for some reason
        router.push('/login?registered=true');
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
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden" id="register-container">
      {/* Decorative background glows */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-8 backdrop-blur-xl shadow-2xl relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Join EcoTrace
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Start tracking and reducing your carbon footprint today
          </p>
        </div>

        {/* General Error Alert */}
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
          {/* Name Field */}
          <div className="space-y-1.5">
            <label htmlFor="name-input" className="text-sm font-semibold text-slate-300">
              Full Name
            </label>
            <input
              id="name-input"
              name="name"
              type="text"
              required
              disabled={isLoading}
              value={formData.name}
              onChange={handleChange}
              className={`w-full rounded-lg border bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                errors.name ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500'
              }`}
              placeholder="Alex Green"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-xs font-medium text-red-400" role="alert">
                {errors.name}
              </p>
            )}
          </div>

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
            <label htmlFor="password-input" className="text-sm font-semibold text-slate-300">
              Password
            </label>
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-sm text-slate-400 mt-6 border-t border-slate-800/60 pt-4">
          Already have an account?{' '}
          <Link 
            href="/login" 
            className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 rounded-sm px-0.5"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
