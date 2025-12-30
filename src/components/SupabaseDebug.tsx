import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface DebugInfo {
  supabaseUrl: string;
  hasRealtime: boolean;
  hasAuth: boolean;
  realtimeEnabled: boolean; // New field to track if realtime is enabled in app
  envVars: {
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
  };
  connectionTest?: string;
}

export const SupabaseDebug = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | { error: string }>({ error: 'Loading...' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSupabase = async () => {
      try {
        const info: DebugInfo = {
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'Not available',
          hasRealtime: !!supabase?.realtime,
          hasAuth: !!supabase?.auth,
          realtimeEnabled: false, // Realtime is disabled in the application
          envVars: {
            VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not set',
            VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
          }
        };

        // Test connection
        try {
          const { error } = await supabase.from('users').select('count').limit(1);
          info.connectionTest = error ? `Error: ${error.message}` : 'Connected successfully';
        } catch (err) {
          info.connectionTest = `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
        }

        setDebugInfo(info);
      } catch (error) {
        setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
      } finally {
        setLoading(false);
      }
    };

    checkSupabase();
  }, []);

  if (loading) {
    return <div>Loading debug info...</div>;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Supabase Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {'error' in debugInfo ? (
          <div className="text-red-600">
            <strong>Error:</strong> {debugInfo.error}
          </div>
        ) : (
          <>
            <div>
              <p className="text-sm text-muted-foreground">Environment</p>
              <Badge variant="secondary">
                Web
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Supabase URL</p>
              <code className="text-xs bg-muted p-2 rounded block">
                {debugInfo.supabaseUrl}
              </code>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Environment Variables</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">VITE_SUPABASE_URL:</span>
                  <Badge variant={debugInfo.envVars?.VITE_SUPABASE_URL === 'Set' ? 'default' : 'destructive'}>
                    {debugInfo.envVars?.VITE_SUPABASE_URL}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">VITE_SUPABASE_ANON_KEY:</span>
                  <Badge variant={debugInfo.envVars?.VITE_SUPABASE_ANON_KEY === 'Set' ? 'default' : 'destructive'}>
                    {debugInfo.envVars?.VITE_SUPABASE_ANON_KEY}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Connection Test</p>
              <Badge variant={debugInfo.connectionTest?.includes('successfully') ? 'default' : 'destructive'}>
                {debugInfo.connectionTest}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Supabase Features</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Auth:</span>
                  <Badge variant={debugInfo.hasAuth ? 'default' : 'destructive'}>
                    {debugInfo.hasAuth ? 'Available' : 'Not available'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Realtime:</span>
                  <Badge variant={debugInfo.realtimeEnabled ? 'default' : 'destructive'}>
                    {debugInfo.realtimeEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
