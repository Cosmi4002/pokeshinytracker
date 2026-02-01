import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from '@/lib/theme-context';

export function ThemeCustomizer() {
  const { setTheme, theme, setColorScheme, colorScheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 shiny-glow shiny-border-glow">
          {colorScheme === 'dark' ? <Moon className="h-[1.2rem] w-[1.2rem]" /> : <Sun className="h-[1.2rem] w-[1.2rem]" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => setColorScheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorScheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('default')}>
          Default (Yellow)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('blue')}>
          Blue
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('purple')}>
          Purple
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}