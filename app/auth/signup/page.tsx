'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-client';
import { UserRole } from '@/lib/types';

function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('client');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserClient();

  // Check if user is being redirected from course enrollment or care booking
  useEffect(() => {
    const intentParam = searchParams.get('intent');
    if (intentParam === 'caregiver') {
      setRole('caregiver');
    } else if (intentParam === 'client') {
      setRole('client');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Sign up user - profile will be created automatically by database trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback?next=/dashboard`,
        }
      });

      if (authError) throw authError;

      // Check if user was created and has a session (auto-confirmed)
      if (authData.user && authData.session) {
        // User is automatically signed in (email confirmation disabled in Supabase)
        if (role === 'caregiver') {
          setSuccess('Caregiver account created successfully! Note: Your account needs admin approval before you can enroll in courses. Redirecting...');
        } else if (role === 'client') {
          setSuccess('Client account created successfully! You can now book care services. Redirecting...');
        } else {
          setSuccess('Account created successfully! Redirecting...');
        }
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 2000);
      } else if (authData.user && !authData.session) {
        // Email confirmation is required
        if (role === 'caregiver') {
          setSuccess('Caregiver account created! Please check your email to confirm your account. Note: Your account will need admin approval before you can enroll in courses.');
        } else if (role === 'client') {
          setSuccess('Client account created! Please check your email to confirm your account before booking services.');
        } else {
          setSuccess('Account created! Please check your email to confirm your account before signing in.');
        }
      } else {
        // Unexpected case
        setSuccess('Account created! Please try signing in.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          {role === 'caregiver' && (
            <p className="mt-2 text-center text-sm text-blue-600 font-medium">
              Creating a Caregiver account - Requires admin approval
            </p>
          )}
          {role === 'client' && (
            <p className="mt-2 text-center text-sm text-green-600 font-medium">
              Creating a Client account for care services
            </p>
          )}
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
          {success && (
            <div className={`rounded-md p-4 ${role === 'caregiver' ? 'bg-purple-600' : 'bg-green-50'}`}>
              <div className={`text-sm font-medium ${role === 'caregiver' ? 'text-white' : 'text-green-800'}`}>{success}</div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {/* Role is automatically set based on intent parameter */}
            <input type="hidden" name="role" value={role} />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SignUp() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}
