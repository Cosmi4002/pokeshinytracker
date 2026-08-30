import { Bell, BellOff, Clock3, Radio, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePwaNotifications } from '@/hooks/use-pwa-notifications';
import { useToast } from '@/hooks/use-toast';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NotificationSettingsDialog({ open, onOpenChange }: Props) {
  const { preferences, permission, supported, enable, notify, updatePreferences } = usePwaNotifications();
  const { toast } = useToast();

  const handleEnable = async () => {
    const enabled = await enable();
    toast(enabled
      ? { title: 'Notifications enabled', description: 'You can customize each alert below.' }
      : { variant: 'destructive', title: 'Permission not granted', description: 'Allow notifications from your browser settings, then try again.' });
  };

  const handleTest = async () => {
    const shown = await notify({
      title: 'Shiny Tracker notifications are ready',
      body: 'This is a test notification. You remain in control of every alert.',
      tag: `notification-test-${Date.now()}`,
      url: '/counter',
      cooldownMs: 0,
      force: true,
    });
    if (!shown) {
      toast({ variant: 'destructive', title: 'Test not shown', description: 'Enable browser notifications first.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Notifications</DialogTitle>
          <DialogDescription>Smart alerts are sent only when the site is not in the foreground.</DialogDescription>
        </DialogHeader>

        {!supported ? (
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            This browser does not support PWA notifications.
          </div>
        ) : permission !== 'granted' || !preferences.enabled ? (
          <div className="space-y-4 rounded-xl border border-border bg-muted/25 p-4">
            <div className="flex gap-3">
              <BellOff className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-semibold">Notifications are off</div>
                <p className="text-sm text-muted-foreground">Permission is requested only after you press the button.</p>
              </div>
            </div>
            <Button className="w-full" onClick={() => void handleEnable()}>Enable notifications</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <SettingRow
              icon={Radio}
              title="Hunt Room results"
              description="Notify me when another hunter finds the shared shiny."
              checked={preferences.huntRoomResults}
              onCheckedChange={(checked) => updatePreferences({ huntRoomResults: checked })}
            />
            <SettingRow
              icon={Clock3}
              title="Active hunt reminders"
              description="Remind me only when unfinished counters still exist."
              checked={preferences.activeHuntReminders}
              onCheckedChange={(checked) => updatePreferences({ activeHuntReminders: checked })}
            />

            {preferences.activeHuntReminders && (
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <Label htmlFor="notification-interval" className="text-sm font-semibold">Reminder interval</Label>
                <select
                  id="notification-interval"
                  value={preferences.reminderIntervalMinutes}
                  onChange={(event) => updatePreferences({ reminderIntervalMinutes: Number(event.target.value) })}
                  className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value={60}>Every hour</option>
                  <option value={180}>Every 3 hours</option>
                  <option value={360}>Every 6 hours</option>
                  <option value={720}>Every 12 hours</option>
                </select>
              </div>
            )}

            <SettingRow
              icon={ShieldCheck}
              title="Quiet hours"
              description="Do not alert between 23:00 and 08:00."
              checked={preferences.quietHours}
              onCheckedChange={(checked) => updatePreferences({ quietHours: checked })}
            />

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => updatePreferences({ enabled: false })}>Disable</Button>
              <Button className="flex-1" onClick={() => void handleTest()}>Send test</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  icon: typeof Bell;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-3">
      <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <Label className="font-semibold">{title}</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={title} />
    </div>
  );
}

