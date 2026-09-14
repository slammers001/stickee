import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUpWithEmail, signInWithEmail } from '@/lib/supabase';
import { IconUser, IconMail, IconLock, IconArrowLeft } from '@tabler/icons-react';

type AuthMode = 'signin' | 'signup';

export const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await signUpWithEmail(email, password);
      if (result?.user) {
        // Store name in localStorage for profile
        const profileKey = `stickee_profile_${result.user.id}`;
        const DEFAULT_COLORS = ['#fff1bf', '#735c40', '#FFC2CC'];
        const randomColor = DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
        localStorage.setItem(profileKey, JSON.stringify({
          name: name.trim(),
          email: email,
          avatarColor: randomColor,
          avatarImage: null,
        }));
        
        if (result.session) {
          setMessage('');
        } else {
          setMessage('Account created! You can now sign in.');
          setMode('signin');
        }
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 px-4">
        <div className="text-center">
          <img
            src="./stickee.png"
            alt="Stickee"
            className="h-20 w-20 object-contain icon-crisp mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold text-foreground font-handwriting">
            Stickee
          </h1>
          <p className="mt-3 text-muted-foreground">
            {mode === 'signin' ? 'Sign in to access your sticky notes' : 'Create an account to get started'}
          </p>
        </div>

        <form onSubmit={mode === 'signup' ? handleSignUp : handleSignIn} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <div className="relative">
                <IconUser stroke={2} className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="pl-10"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <IconMail stroke={2} className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <IconLock stroke={2} className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signin' ? 'Enter your password' : 'Create a password (6+ chars)'}
                className="pl-10"
              />
            </div>
          </div>

          {message && (
            <div className="text-sm text-center text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-3 rounded-md">
              {message}
            </div>
          )}

          {error && (
            <div className="text-sm text-center text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading
              ? (mode === 'signup' ? 'Creating account...' : 'Signing in...')
              : (mode === 'signup' ? 'Sign Up' : 'Sign In')
            }
          </Button>
        </form>

        <div className="text-center">
          {mode === 'signin' ? (
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                className="text-primary hover:underline font-medium"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
                className="text-primary hover:underline font-medium"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
