import { useState, useEffect } from 'react';
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
import type { Tables } from '@/integrations/supabase/types';

interface EditPlaylistDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    playlist: Tables<'shiny_playlists'> | null;
}

const CATEGORY_TYPES = [
    { id: 'custom', name: 'Custom' },
    { id: 'generation', name: 'Generation' },
    { id: 'game', name: 'Game' },
    { id: 'method', name: 'Method' },
    { id: 'type', name: 'Type' },
];

export function EditPlaylistDialog({ open, onOpenChange, onSuccess, playlist }: EditPlaylistDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [categoryType, setCategoryType] = useState('custom');

    useEffect(() => {
        if (playlist) {
            setName(playlist.name);
            setDescription(playlist.description || '');
            setCategoryType(playlist.category_type);
        }
    }, [playlist, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!playlist || !user) return;

        const trimmedName = name.trim();
        if (!trimmedName) {
            toast({
                variant: 'destructive',
                title: 'Name required',
                description: 'Enter a name for the playlist',
            });
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from('shiny_playlists')
                .update({
                    name: trimmedName,
                    description: description.trim() || null,
                    category_type: categoryType,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', playlist.id)
                .eq('user_id', user.id);

            if (error) throw error;

            toast({
                title: 'Playlist updated!',
                description: `"${trimmedName}" was updated successfully.`,
            });

            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Update error',
                description: error.message || 'Unable to update the playlist. Try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Playlist</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="es. Shiny Gen 1"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Categoria</Label>
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
                        <Label>Descrizione (opzionale)</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe this playlist..."
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
