import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { syncService, type Device, type SyncSession } from '@/services/syncService';
import { Smartphone, Laptop, Tablet, Link, Clock, CheckCircle } from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SyncModal({ isOpen, onClose }: SyncModalProps) {
  const [mode, setMode] = useState<'host' | 'join'>('host');
  const [deviceName, setDeviceName] = useState('');
  const [syncCode, setSyncCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [syncSessions, setSyncSessions] = useState<SyncSession[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes

  // Set default device name
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    let deviceType = 'desktop';
    
    if (/mobile|android|iphone|ipod/.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/tablet|ipad/.test(userAgent)) {
      deviceType = 'tablet';
    }
    
    const defaultName = `${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} ${new Date().toLocaleDateString()}`;
    setDeviceName(defaultName);
  }, []);

  // Load user's devices and sync sessions
  useEffect(() => {
    if (isOpen) {
      loadUserDevices();
      loadSyncSessions();
    }
  }, [isOpen]);

  // Countdown timer for generated code
  useEffect(() => {
    if (generatedCode && timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      setGeneratedCode('');
      setTimeRemaining(300);
    }
  }, [generatedCode, timeRemaining]);

  const loadUserDevices = async () => {
    try {
      const userDevices = await syncService.getUserDevices();
      setDevices(userDevices);
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const loadSyncSessions = async () => {
    try {
      const sessions = await syncService.getActiveSyncSessions();
      setSyncSessions(sessions);
    } catch (error) {
      console.error('Error loading sync sessions:', error);
    }
  };

  const handleGenerateCode = async () => {
    if (!deviceName.trim()) {
      toast.error('Please enter a device name');
      return;
    }

    setIsGenerating(true);
    try {
      const code = await syncService.generateSyncCode(deviceName);
      setGeneratedCode(code);
      setTimeRemaining(300);
      
      // Start polling for connection
      const pollInterval = setInterval(async () => {
        const sessions = await syncService.getActiveSyncSessions();
        const currentSession = sessions.find(s => s.syncCode === code);
        
        if (currentSession && currentSession.status === 'connected') {
          clearInterval(pollInterval);
          setGeneratedCode('');
          setTimeRemaining(300);
          loadSyncSessions();
          toast.success('Device connected successfully!');
        }
      }, 2000);

      // Cleanup after 5 minutes
      setTimeout(() => clearInterval(pollInterval), 300000);
    } catch (error) {
      console.error('Error generating code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleJoinSession = async () => {
    if (!syncCode.trim() || !deviceName.trim()) {
      toast.error('Please enter both sync code and device name');
      return;
    }

    setIsJoining(true);
    try {
      await syncService.joinSyncSession(syncCode.toUpperCase(), deviceName);
      setSyncCode('');
      loadSyncSessions();
      loadUserDevices();
    } catch (error) {
      console.error('Error joining session:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Laptop className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Device Sync
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Selection */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              variant={mode === 'host' ? 'default' : 'ghost'}
              onClick={() => setMode('host')}
              className="flex-1"
            >
              Generate Code
            </Button>
            <Button
              variant={mode === 'join' ? 'default' : 'ghost'}
              onClick={() => setMode('join')}
              className="flex-1"
            >
              Enter Code
            </Button>
          </div>

          {mode === 'host' ? (
            /* Host Mode */
            <Card>
              <CardHeader>
                <CardTitle>Generate Sync Code</CardTitle>
                <CardDescription>
                  Create a code to sync this device with others
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="device-name">Device Name</Label>
                  <Input
                    id="device-name"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="My Device"
                  />
                </div>

                {generatedCode ? (
                  <div className="text-center space-y-4">
                    <div className="text-6xl font-mono font-bold text-primary">
                      {generatedCode}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Expires in {formatTime(timeRemaining)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enter this code on your other device to connect
                    </p>
                  </div>
                ) : (
                  <Button 
                    onClick={handleGenerateCode} 
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Code'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Join Mode */
            <Card>
              <CardHeader>
                <CardTitle>Enter Sync Code</CardTitle>
                <CardDescription>
                  Enter the code from another device to sync
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="device-name">Device Name</Label>
                  <Input
                    id="device-name"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="My Device"
                  />
                </div>
                <div>
                  <Label htmlFor="sync-code">Sync Code</Label>
                  <Input
                    id="sync-code"
                    value={syncCode}
                    onChange={(e) => setSyncCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="text-center text-xl font-mono"
                  />
                </div>
                <Button 
                  onClick={handleJoinSession} 
                  disabled={isJoining || syncCode.length !== 6}
                  className="w-full"
                >
                  {isJoining ? 'Connecting...' : 'Connect Device'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Connected Devices */}
          {devices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Devices</CardTitle>
                <CardDescription>
                  All devices connected to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {devices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getDeviceIcon(device.deviceType)}
                        <div>
                          <div className="font-medium">{device.deviceName}</div>
                          <div className="text-sm text-muted-foreground">
                            Last seen: {new Date(device.lastSeen).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant={device.isActive ? 'default' : 'secondary'}>
                        {device.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Sync Sessions */}
          {syncSessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Connections</CardTitle>
                <CardDescription>
                  Devices currently synced with this one
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {syncSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium">
                            {session.hostDeviceName} ↔ {session.joinerDeviceName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Connected: {new Date(session.connectedAt!).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="default">Connected</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
