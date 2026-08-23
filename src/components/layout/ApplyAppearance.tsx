import { useEffect } from 'react';
import {
  applyBackgroundAccentsToRoot,
  applyBackgroundStyleToRoot,
  applyUiStyleToRoot,
  getStoredBackgroundAccent2,
  getStoredBackgroundAccent3,
  getStoredBackgroundStyle,
  getStoredUiStyle,
} from '@/lib/appearance';

export function ApplyAppearance() {
  useEffect(() => {
    applyUiStyleToRoot(getStoredUiStyle());
    applyBackgroundStyleToRoot(getStoredBackgroundStyle());
    applyBackgroundAccentsToRoot(getStoredBackgroundAccent2(), getStoredBackgroundAccent3());
  }, []);

  return null;
}

