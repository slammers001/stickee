import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getUserId } from './userService';

export interface SyncSession {
  id: string;
  syncCode: string;
  hostUserId: string;
  hostDeviceName: string;
  joinerUserId?: string;
  joinerDeviceName?: string;
  status: 'pending' | 'connected' | 'expired';
  expiresAt: string;
  connectedAt?: string;
  createdAt: string;
}

export interface Device {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  deviceFingerprint: string;
  lastSeen: string;
  isActive: boolean;
  createdAt: string;
}

export interface SyncLog {
  id: string;
  userId: string;
  deviceId: string;
  operationType: 'create' | 'update' | 'delete' | 'link_device';
  operationData: any;
  syncStatus: 'success' | 'failed' | 'pending';
  errorMessage?: string;
  createdAt: string;
}

class SyncService {
  private deviceFingerprint: string;

  constructor() {
    this.deviceFingerprint = this.generateDeviceFingerprint();
  }

  // Generate unique device fingerprint
  private generateDeviceFingerprint(): string {
    const userAgent = navigator.userAgent;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const screen = `${screenWidth}x${screenHeight}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const random = Math.random().toString(36).substring(2);
    
    return btoa(`${userAgent}|${screen}|${timezone}|${random}`).substring(0, 50);
  }

  // Generate sync code for host device
  async generateSyncCode(deviceName: string): Promise<string> {
    try {
      const userId = await getUserId();
      if (!userId) throw new Error('User ID not available');

      // Generate unique sync code
      let syncCode: string;
      let attempts = 0;
      
      do {
        syncCode = this.generateRandomCode();
        attempts++;
        
        const { data: existing } = await supabase
          .from('sync_sessions')
          .select('sync_code')
          .eq('sync_code', syncCode)
          .single();
        
        if (!existing) break;
        
        if (attempts > 10) throw new Error('Failed to generate unique sync code');
      } while (true);

      // Create sync session
      const { error } = await supabase
        .from('sync_sessions')
        .insert({
          sync_code: syncCode,
          host_user_id: userId,
          host_device_name: deviceName,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Register host device
      await this.registerDevice(deviceName);

      toast.success(`Sync code generated: ${syncCode}`);
      return syncCode;
    } catch (error) {
      console.error('Error generating sync code:', error);
      toast.error('Failed to generate sync code');
      throw error;
    }
  }

  // Join sync session with code
  async joinSyncSession(syncCode: string, deviceName: string): Promise<void> {
    try {
      const userId = await getUserId();
      if (!userId) throw new Error('User ID not available');

      // Find valid sync session
      const { data: session, error: fetchError } = await supabase
        .from('sync_sessions')
        .select('*')
        .eq('sync_code', syncCode)
        .eq('status', 'pending')
        .single();

      if (fetchError || !session) {
        throw new Error('Invalid or expired sync code');
      }

      // Check if expired
      if (new Date(session.expires_at) < new Date()) {
        throw new Error('Sync code has expired');
      }

      // Update session with joiner info
      const { error: updateError } = await supabase
        .from('sync_sessions')
        .update({
          joiner_user_id: userId,
          joiner_device_name: deviceName,
          status: 'connected',
          connected_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (updateError) throw updateError;

      // Register joiner device
      await this.registerDevice(deviceName);

      // Enable sync for both users
      await this.enableSyncForUser(userId);
      await this.enableSyncForUser(session.host_user_id);

      toast.success('Devices connected successfully!');
    } catch (error) {
      console.error('Error joining sync session:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to connect devices');
      throw error;
    }
  }

  // Register device for user
  private async registerDevice(deviceName: string): Promise<void> {
    try {
      const userId = await getUserId();
      if (!userId) throw new Error('User ID not available');

      const deviceType = this.detectDeviceType();

      // Check if device already exists
      const { data: existingDevice } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', userId)
        .eq('device_fingerprint', this.deviceFingerprint)
        .single();

      if (existingDevice) {
        // Update last seen
        await supabase
          .from('devices')
          .update({
            last_seen: new Date().toISOString(),
            is_active: true
          })
          .eq('id', existingDevice.id);
      } else {
        // Create new device
        await supabase
          .from('devices')
          .insert({
            user_id: userId,
            device_name: deviceName,
            device_type: deviceType,
            device_fingerprint: this.deviceFingerprint
          });
      }
    } catch (error) {
      console.error('Error registering device:', error);
    }
  }

  // Enable sync for user
  private async enableSyncForUser(userId: string): Promise<void> {
    try {
      await supabase
        .from('users')
        .update({
          sync_enabled: true,
          last_sync_at: new Date().toISOString()
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error enabling sync:', error);
    }
  }

  // Get user's connected devices
  async getUserDevices(): Promise<Device[]> {
    try {
      const userId = await getUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_seen', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user devices:', error);
      return [];
    }
  }

  // Get active sync sessions
  async getActiveSyncSessions(): Promise<SyncSession[]> {
    try {
      const userId = await getUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('sync_sessions')
        .select('*')
        .or(`host_user_id.eq.${userId},joiner_user_id.eq.${userId}`)
        .eq('status', 'connected')
        .order('connected_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sync sessions:', error);
      return [];
    }
  }

  // Log sync operation
  async logSyncOperation(
    operationType: 'create' | 'update' | 'delete' | 'link_device',
    operationData: any,
    status: 'success' | 'failed' | 'pending' = 'success',
    errorMessage?: string
  ): Promise<void> {
    try {
      const userId = await getUserId();
      if (!userId) return;

      const device = await this.getCurrentDevice();
      if (!device) return;

      await supabase
        .from('sync_logs')
        .insert({
          user_id: userId,
          device_id: device.id,
          operation_type: operationType,
          operation_data: operationData,
          sync_status: status,
          error_message: errorMessage
        });
    } catch (error) {
      console.error('Error logging sync operation:', error);
    }
  }

  // Get current device info
  private async getCurrentDevice(): Promise<Device | null> {
    try {
      const userId = await getUserId();
      if (!userId) return null;

      const { data } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', userId)
        .eq('device_fingerprint', this.deviceFingerprint)
        .single();

      return data;
    } catch (error) {
      return null;
    }
  }

  // Generate random 6-character code
  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Detect device type
  private detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipod/.test(userAgent)) {
      return 'mobile';
    } else if (/tablet|ipad/.test(userAgent)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  // Clean up expired sessions (call periodically)
  async cleanupExpiredSessions(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_sync_sessions');
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }
}

export const syncService = new SyncService();
