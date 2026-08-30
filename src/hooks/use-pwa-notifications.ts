import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  NOTIFICATION_PREFERENCES_CHANGED,
  notificationsSupported,
  readNotificationPreferences,
  showSmartNotification,
  writeNotificationPreferences,
  type PwaNotificationPreferences,
} from '@/lib/pwa-notifications';

const getPermission = (): NotificationPermission | 'unsupported' => (
  notificationsSupported() ? Notification.permission : 'unsupported'
);

export function usePwaNotifications() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(() => readNotificationPreferences(user?.id));
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(getPermission);

  useEffect(() => {
    setPreferences(readNotificationPreferences(user?.id));
  }, [user?.id]);

  useEffect(() => {
    const syncPreferences = () => setPreferences(readNotificationPreferences(user?.id));
    const syncPermission = () => setPermission(getPermission());
    window.addEventListener(NOTIFICATION_PREFERENCES_CHANGED, syncPreferences);
    window.addEventListener('focus', syncPermission);
    document.addEventListener('visibilitychange', syncPermission);
    return () => {
      window.removeEventListener(NOTIFICATION_PREFERENCES_CHANGED, syncPreferences);
      window.removeEventListener('focus', syncPermission);
      document.removeEventListener('visibilitychange', syncPermission);
    };
  }, [user?.id]);

  const updatePreferences = useCallback((updates: Partial<PwaNotificationPreferences>) => {
    const next = { ...readNotificationPreferences(user?.id), ...updates };
    writeNotificationPreferences(user?.id, next);
    setPreferences(next);
  }, [user?.id]);

  const enable = useCallback(async () => {
    if (!notificationsSupported()) return false;
    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    if (nextPermission !== 'granted') return false;
    updatePreferences({ enabled: true });
    return true;
  }, [updatePreferences]);

  const notify = useCallback((notification: Parameters<typeof showSmartNotification>[0]) => (
    showSmartNotification(notification, preferences)
  ), [preferences]);

  return {
    preferences,
    permission,
    supported: permission !== 'unsupported',
    enable,
    notify,
    updatePreferences,
  };
}
