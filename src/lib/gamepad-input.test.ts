import { describe, expect, it } from 'vitest';
import {
  encodeGamepadHotkey,
  formatCounterHotkey,
  formatGamepadHotkey,
  normalizeKeyboardHotkey,
  parseGamepadHotkey,
} from './gamepad-input';

describe('gamepad counter input', () => {
  it('stores and reads a controller button assignment', () => {
    expect(encodeGamepadHotkey(0)).toBe('gamepad:0');
    expect(parseGamepadHotkey('gamepad:15')).toBe(15);
  });

  it('does not treat keyboard shortcuts or malformed values as controller buttons', () => {
    expect(parseGamepadHotkey('space')).toBeNull();
    expect(parseGamepadHotkey('gamepad:-1')).toBeNull();
    expect(parseGamepadHotkey('gamepad:button')).toBeNull();
  });

  it('uses familiar cross-platform labels for standard controller buttons', () => {
    expect(formatGamepadHotkey(0)).toBe('Controller · A / Cross / B');
    expect(formatGamepadHotkey(12)).toBe('Controller · D-pad Up');
    expect(formatGamepadHotkey(22)).toBe('Controller · Button 22');
  });

  it('formats keyboard and controller counter shortcuts consistently', () => {
    expect(normalizeKeyboardHotkey(' ')).toBe('space');
    expect(normalizeKeyboardHotkey('K')).toBe('k');
    expect(formatCounterHotkey('space')).toBe('Space');
    expect(formatCounterHotkey('k')).toBe('K');
    expect(formatCounterHotkey('gamepad:5')).toBe('Controller · RB / R1');
  });
});
