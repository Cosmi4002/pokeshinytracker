export const GAMEPAD_HOTKEY_PREFIX = 'gamepad:';

const STANDARD_GAMEPAD_BUTTONS: Record<number, string> = {
  0: 'A / Cross / B',
  1: 'B / Circle / A',
  2: 'X / Square / Y',
  3: 'Y / Triangle / X',
  4: 'LB / L1',
  5: 'RB / R1',
  6: 'LT / L2',
  7: 'RT / R2',
  8: 'View / Share',
  9: 'Menu / Options',
  10: 'Left stick / L3',
  11: 'Right stick / R3',
  12: 'D-pad Up',
  13: 'D-pad Down',
  14: 'D-pad Left',
  15: 'D-pad Right',
  16: 'Home',
};

export function encodeGamepadHotkey(buttonIndex: number) {
  return `${GAMEPAD_HOTKEY_PREFIX}${Math.max(0, Math.trunc(buttonIndex))}`;
}

export function parseGamepadHotkey(hotkey: string): number | null {
  if (!hotkey.startsWith(GAMEPAD_HOTKEY_PREFIX)) return null;
  const rawIndex = hotkey.slice(GAMEPAD_HOTKEY_PREFIX.length);
  if (!/^\d+$/.test(rawIndex)) return null;
  const index = Number(rawIndex);
  return Number.isSafeInteger(index) ? index : null;
}

export function formatGamepadHotkey(buttonIndex: number) {
  const name = STANDARD_GAMEPAD_BUTTONS[buttonIndex];
  return name
    ? `Controller · ${name}`
    : `Controller · Button ${buttonIndex}`;
}

export function normalizeKeyboardHotkey(rawKey: string) {
  if (rawKey === ' ') return 'space';
  return rawKey.toLowerCase();
}

export function formatCounterHotkey(hotkey: string) {
  if (!hotkey) return 'None';
  const gamepadButton = parseGamepadHotkey(hotkey);
  if (gamepadButton !== null) return formatGamepadHotkey(gamepadButton);
  if (hotkey === 'space') return 'Space';
  if (hotkey.length === 1) return hotkey.toUpperCase();
  return hotkey.charAt(0).toUpperCase() + hotkey.slice(1);
}
