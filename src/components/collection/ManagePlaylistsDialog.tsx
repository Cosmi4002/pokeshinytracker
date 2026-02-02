import { useState, useEffect } from 'react';
import { Trash2, Loader2, List, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { EditPlaylistDialog } from './EditPlaylistDialog';
import type { Tables } from '@/integrations/supabase/types';

type PlaylistRow = Tables<'shiny_playlists'>;

interface ManagePlaylistsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

interface PlaylistWithCount extends PlaylistRow {
    shinyCount?: number;
}

export function ManagePlaylistsDialog({ open, onOpenChange, onSuccess }: ManagePlaylistsDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [playlists, setPlaylists] = useState<PlaylistWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [playlistToDelete, setPlaylistToDelete] = useState<PlaylistWithCount | null>(null);
    const [playlistToEdit, setPlaylistToEdit] = useState<PlaylistWithCount | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const fetchPlaylists = async () => {
        if (!user) {
            setPlaylists([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Fetch playlists
            const { data: playlistsData, error: playlistsError } = await supabase
                .from('shiny_playlists')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (playlistsError) throw playlistsError;

            // Fetch shiny counts for each playlist
            const playlistsWithCounts = await Promise.all(
                (playlistsData || []).map(async (playlist) => {
                    const { count, error: countError } = await supabase
                        .from('caught_shinies')
                        .select('*', { count: 'exact', head: true })
                        .eq('playlist_id', playlist.id);

                    if (countError) {
                        console.error('Error counting shinies:', countError);
                        return { ...playlist, shinyCount: 0 };
                    }

                    return { ...playlist, shinyCount: count || 0 };
                })
            );

            setPlaylists(playlistsWithCounts);
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Errore',
                description: err.message || 'Impossibile caricare le playlist',
            });
            setPlaylists([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchPlaylists();
        }
    }, [open, user?.id]);

    const handleDeleteClick = (playlist: PlaylistWithCount) => {
        setPlaylistToDelete(playlist);
    };

    const handleDeleteConfirm = async () => {
        if (!playlistToDelete || !user) return;

        setDeleteLoading(playlistToDelete.id);

        try {
            // First, set playlist_id to null for all shinies in this playlist
            const { error: updateError } = await supabase
                .from('caught_shinies')
                .update({ playlist_id: null })
                .eq('playlist_id', playlistToDelete.id)
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            // Then delete the playlist
            const { error: deleteError } = await supabase
                .from('shiny_playlists')
                .delete()
                .eq('id', playlistToDelete.id)
                .eq('user_id', user.id);

            if (deleteError) throw deleteError;

            toast({
                title: 'Playlist eliminata',
                description: `"${playlistToDelete.name}" è stata eliminata con successo.`,
            });

            // Refresh the list
            await fetchPlaylists();
            onSuccess();
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Errore nell\'eliminazione',
                description: err.message || 'Impossibile eliminare la playlist. Riprova.',
            });
        } finally {
            setDeleteLoading(null);
            setPlaylistToDelete(null);
        }
    };

    const handleEditClick = (playlist: PlaylistWithCount) => {
        setPlaylistToEdit(playlist);
        setIsEditOpen(true);
    };

    const handleEditSuccess = () => {
        fetchPlaylists();
        onSuccess();
    };

    const getCategoryLabel = (categoryType: string) => {
        const labels: Record<string, string> = {
            custom: 'Personalizzata',
            generation: 'Generazione',
            game: 'Gioco',
            method: 'Metodo',
            type: 'Tipo',
        };
        return labels[categoryType] || categoryType;
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <List className="h-5 w-5" />
                            Gestisci Playlist
                        </DialogTitle>
                    </DialogHeader>

                    {loading ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                            Caricamento...
                        </div>
                    ) : playlists.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            Nessuna playlist ancora. Crea la tua prima playlist!
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {playlists.map((playlist) => (
                                <Card key={playlist.id} className="hover:border-primary/50 transition-colors">
                                    <CardContent className="pt-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-1">
                                                <h3 className="font-semibold text-lg">{playlist.name}</h3>
                                                {playlist.description && (
                                                    <p className="text-sm text-muted-foreground">{playlist.description}</p>
                                                )}
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                                                        {getCategoryLabel(playlist.category_type)}
                                                    </span>
                                                    <span>
                                                        {playlist.shinyCount} shiny{playlist.shinyCount !== 1 ? '' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditClick(playlist)}
                                                    className="text-primary hover:text-primary hover:bg-primary/10"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(playlist)}
                                                    disabled={deleteLoading !== null}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    {deleteLoading === playlist.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <EditPlaylistDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                onSuccess={handleEditSuccess}
                playlist={playlistToEdit}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={playlistToDelete !== null} onOpenChange={(open) => !open && setPlaylistToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Stai per eliminare la playlist <strong>"{playlistToDelete?.name}"</strong>.
                            {playlistToDelete && playlistToDelete.shinyCount! > 0 && (
                                <>
                                    <br />
                                    <br />
                                    Questa playlist contiene <strong>{playlistToDelete.shinyCount} shiny</strong>.
                                    Gli shiny non verranno eliminati, ma non saranno più assegnati a questa playlist.
                                </>
                            )}
                            <br />
                            <br />
                            Questa azione non può essere annullata.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Elimina
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
