import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HUNTING_METHODS, HuntingMethod } from '@/lib/pokemon-data';

interface MethodSelectorProps {
  value: string;
  onChange: (method: HuntingMethod) => void;
}

export function MethodSelector({ value, onChange }: MethodSelectorProps) {
  // Group methods by generation
  const methodsByGen = HUNTING_METHODS.reduce((acc, method) => {
    const gen = method.generation === 0 ? 'Custom' : `Generation ${method.generation}`;
    if (!acc[gen]) acc[gen] = [];
    acc[gen].push(method);
    return acc;
  }, {} as Record<string, HuntingMethod[]>);

  const handleValueChange = (newValue: string) => {
    const method = HUNTING_METHODS.find((m) => m.id === newValue);
    if (method) {
      onChange(method);
    }
  };

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full h-12">
        <SelectValue placeholder="Select Method" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(methodsByGen).map(([gen, methods]) => (
          <SelectGroup key={gen}>
            <SelectLabel>{gen}</SelectLabel>
            {methods.map((method) => (
              <SelectItem key={method.id} value={method.id}>
                <span className="flex items-center justify-between w-full min-w-[200px] gap-2">
                  <span>{method.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    1/{method.baseOdds}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
