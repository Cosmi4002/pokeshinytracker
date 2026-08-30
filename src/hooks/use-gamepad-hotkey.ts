import { useEffect, useRef } from 'react';
import { encodeGamepadHotkey, parseGamepadHotkey } from '@/lib/gamepad-input';

type GamepadHotkeyOptions = {
  enabled?: boolean;
  hotkey: string;
  assigning: boolean;
  onAssign: (hotkey: string) => void;
  onTrigger: () => void;
};

export function useGamepadHotkey({
  enabled = true,
  hotkey,
  assigning,
  onAssign,
  onTrigger,
}: GamepadHotkeyOptions) {
  const buttonStatesRef = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    const assignedButton = parseGamepadHotkey(hotkey);
    if (!enabled || (assignedButton === null && !assigning)) return;
    if (typeof navigator.getGamepads !== 'function') return;

    const pollGamepads = () => {
      const previousStates = buttonStatesRef.current;
      const nextStates = new Map<string, boolean>();
      let assignmentCaptured = false;

      for (const gamepad of navigator.getGamepads()) {
        if (!gamepad?.connected) continue;

        gamepad.buttons.forEach((button, buttonIndex) => {
          const stateKey = `${gamepad.index}:${buttonIndex}`;
          const pressed = button.pressed || button.value > 0.5;
          const wasPressed = previousStates.get(stateKey) ?? false;
          nextStates.set(stateKey, pressed);

          if (!pressed || wasPressed) return;

          if (assigning && !assignmentCaptured) {
            assignmentCaptured = true;
            onAssign(encodeGamepadHotkey(buttonIndex));
            return;
          }

          if (!assigning && assignedButton === buttonIndex) onTrigger();
        });
      }

      buttonStatesRef.current = nextStates;
    };

    pollGamepads();
    const intervalId = window.setInterval(pollGamepads, 50);
    return () => window.clearInterval(intervalId);
  }, [assigning, enabled, hotkey, onAssign, onTrigger]);
}
