import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signInWithEmail } from '@/lib/supabase';
import { IconMail } from '@tabler/icons-react';

export const Auth = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const result = await signInWithEmail(email);
      if (!result) {
        throw new Error('Failed to initiate sign in');
      }
      setMessage('Check your email for the login link!');
    } catch (err: any) {
      console.error('Authentication error:', err);
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
            Sign in to access your sticky notes
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full"
            />
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
            <IconMail stroke={2} className="h-5 w-5 mr-2" />
            {loading ? 'Sending magic link...' : 'Sign in with Email'}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          We'll send you a magic link to sign in. No password required.
        </p>
      </div>
    </div>
  );
};
