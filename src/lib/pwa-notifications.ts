export type PwaNotificationPreferences = {
  enabled: boolean;
  huntRoomResults: boolean;
  activeHuntReminders: boolean;
  reminderIntervalMinutes: number;
  quietHours: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: PwaNotificationPreferences = {
  enabled: false,
  huntRoomResults: true,
  activeHuntReminders: false,
  reminderIntervalMinutes: 180,
  quietHours: true,
};

export const NOTIFICATION_PREFERENCES_CHANGED = 'pokeshiny:notification-preferences-changed';
const PREFERENCES_KEY = 'pokeshiny:notification-preferences:v1';
const RATE_LIMIT_KEY = 'pokeshiny:notification-rate-limit:v1';

const preferencesKey = (userId?: string | null) => `${PREFERENCES_KEY}:${userId || 'guest'}`;

export const readNotificationPreferences = (userId?: string | null): PwaNotificationPreferences => {
  try {
    const stored = JSON.parse(localStorage.getItem(preferencesKey(userId)) || '{}') as Partial<PwaNotificationPreferences>;
    return {
      enabled: stored.enabled === true,
      huntRoomResults: stored.huntRoomResults !== false,
      activeHuntReminders: stored.activeHuntReminders === true,
      reminderIntervalMinutes: [60, 180, 360, 720].includes(Number(stored.reminderIntervalMinutes))
        ? Number(stored.reminderIntervalMinutes)
        : DEFAULT_NOTIFICATION_PREFERENCES.reminderIntervalMinutes,
      quietHours: stored.quietHours !== false,
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
};

export const writeNotificationPreferences = (
  userId: string | null | undefined,
  preferences: PwaNotificationPreferences
) => {
  localStorage.setItem(preferencesKey(userId), JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent(NOTIFICATION_PREFERENCES_CHANGED, { detail: { userId } }));
};

export const notificationsSupported = () => (
  typeof window !== 'undefined' && 'Notification' in window
);

export const isInsideQuietHours = (date = new Date()) => {
  const hour = date.getHours();
  return hour >= 23 || hour < 8;
};

type SmartNotification = {
  title: string;
  body: string;
  tag: string;
  url: string;
  cooldownMs?: number;
  force?: boolean;
};

const passesRateLimit = (tag: string, cooldownMs: number) => {
  try {
    const now = Date.now();
    const timestamps = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '{}') as Record<string, number>;
    const previous = Number(timestamps[tag] || 0);
    if (now - previous < cooldownMs) return false;

    const recentEntries = Object.fromEntries(
      Object.entries(timestamps).filter(([, timestamp]) => now - Number(timestamp) < 30 * 24 * 60 * 60 * 1000)
    );
    recentEntries[tag] = now;
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recentEntries));
    return true;
  } catch {
    return true;
  }
};

export const showSmartNotification = async (
  notification: SmartNotification,
  preferences: PwaNotificationPreferences
) => {
  if (!notificationsSupported() || Notification.permission !== 'granted' || !preferences.enabled) return false;
  if (!notification.force && document.visibilityState === 'visible') return false;
  if (!notification.force && preferences.quietHours && isInsideQuietHours()) return false;
  if (!passesRateLimit(notification.tag, notification.cooldownMs ?? 60_000)) return false;

  const options: NotificationOptions = {
    body: notification.body,
    icon: '/pwa/app-icon-192.png',
    badge: '/pwa/app-icon-192.png',
    tag: notification.tag,
    data: { url: notification.url },
  };

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(notification.title, options);
        return true;
      }
    } catch {
      // Fall through to the page Notification API.
    }
  }

  try {
    const pageNotification = new Notification(notification.title, options);
    pageNotification.onclick = () => {
      window.focus();
      window.location.assign(notification.url);
      pageNotification.close();
    };
    return true;
  } catch {
    return false;
  }
};
