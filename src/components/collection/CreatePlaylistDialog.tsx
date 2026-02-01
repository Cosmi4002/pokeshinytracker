import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';

interface CreatePlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CATEGORY_TYPES = [
  { id: 'custom', name: 'Custom' },
  { id: 'generation', name: 'Generation' },
  { id: 'game', name: 'Game' },
  { id: 'method', name: 'Method' },
  { id: 'type', name: 'Type' },
];

export function CreatePlaylistDialog({ open, onOpenChange, onSuccess }: CreatePlaylistDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryType, setCategoryType] = useState('custom');

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategoryType('custom');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({
        variant: 'destructive',
        title: 'Nome richiesto',
        description: 'Inserisci un nome per la playlist',
      });
      return;
    }

    if (trimmedName.length > 100) {
      toast({
        variant: 'destructive',
        title: 'Nome troppo lungo',
        description: 'Il nome deve essere massimo 100 caratteri',
      });
      return;
    }

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Accesso richiesto',
        description: 'Devi effettuare il login per creare una playlist',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('shiny_playlists').insert({
        user_id: user.id,
        name: trimmedName,
        description: description.trim() || null,
        category_type: categoryType,
      });

      if (error) {
        // Handle specific Supabase errors
        if (error.message.includes('JWT')) {
          throw new Error('Sessione scaduta. Effettua nuovamente il login.');
        } else if (error.message.includes('unique')) {
          throw new Error('Hai già una playlist con questo nome.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Errore di connessione. Verifica la tua connessione internet.');
        }
        throw error;
      }

      toast({
        title: 'Playlist creata!',
        description: `"${trimmedName}" è stata creata con successo.`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Errore nella creazione',
        description: error.message || 'Impossibile creare la playlist. Riprova.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Playlist</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Gen 1 Shinies"
            />
          </div>

          <div className="space-y-2">
            <Label>Category Type</Label>
            <Select value={categoryType} onValueChange={setCategoryType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this playlist..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Playlist
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
