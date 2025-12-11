import { useState, useEffect } from 'react';
import { getVersionStats } from '@/services/userService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VersionStats {
  totalUsers: number;
  versionCounts: Record<string, number>;
  currentVersion: string;
}

export const VersionStats = () => {
  const [stats, setStats] = useState<VersionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const versionStats = await getVersionStats();
        setStats(versionStats);
      } catch (error) {
        console.error('Error loading version stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <div>Loading version stats...</div>;
  }

  if (!stats) {
    return <div>Failed to load version stats</div>;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Version Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground mb-2">Users by Version</p>
          <div className="space-y-2">
            {Object.entries(stats.versionCounts).map(([version, count]) => (
              <div key={version} className="flex items-center justify-between">
                <Badge variant={version === stats.currentVersion ? "default" : "secondary"}>
                  {version}
                </Badge>
                <span className="text-sm font-medium">{count} users</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground">Current App Version</p>
          <Badge variant="outline">{stats.currentVersion}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};
