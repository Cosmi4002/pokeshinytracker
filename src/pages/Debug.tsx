
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function Debug() {
    const [status, setStatus] = useState<any>({ loading: true });

    const checkConnection = async () => {
        setStatus({ loading: true });
        const results: any = {
            isConfigured: isSupabaseConfigured,
            connection: 'pending',
            tableExists: 'pending',
            columnsExist: 'pending',
        };

        try {
            if (!isSupabaseConfigured) {
                throw new Error("Supabase env vars missing");
            }

            // 1. Check basic connection (Auth check)
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;
            results.connection = 'success';

            // 2. Check table existence
            const { count, error: tableError } = await supabase
                .from('active_hunts')
                .select('*', { count: 'exact', head: true });

            if (tableError) {
                results.tableExists = 'failed';
                results.error = tableError.message;
            } else {
                results.tableExists = 'success';

                // 3. Check specific columns (by trying to insert a dummy record and failing, or selecting)
                // Selecting columns that don't exist usually errors in PostgREST
                const { error: columnError } = await supabase
                    .from('active_hunts')
                    .select('form, gender')
                    .limit(1);

                if (columnError) {
                    results.columnsExist = 'failed';
                    results.columnError = columnError.message;
                } else {
                    results.columnsExist = 'success';
                }
            }

        } catch (e: any) {
            results.connection = 'failed';
            results.error = e.message;
        } finally {
            setStatus({ loading: false, ...results });
        }
    };

    useEffect(() => {
        checkConnection();
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto py-8 space-y-4">
            <h1 className="text-2xl font-bold">Diagnostica Supabase</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Stato Connessione</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-2 border rounded">
                        <span>Configurazione (Env Vars)</span>
                        {status.isConfigured ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
                    </div>

                    <div className="flex items-center justify-between p-2 border rounded">
                        <span>Connessione Server</span>
                        {status.loading ? <Loader2 className="animate-spin" /> :
                            status.connection === 'success' ? <CheckCircle2 className="text-green-500" /> :
                                <div className="flex items-center gap-2 text-red-500"><XCircle /> <span>{status.error}</span></div>}
                    </div>

                    <div className="flex items-center justify-between p-2 border rounded">
                        <span>Tabella 'active_hunts'</span>
                        {status.loading ? <Loader2 className="animate-spin" /> :
                            status.tableExists === 'success' ? <CheckCircle2 className="text-green-500" /> :
                                <XCircle className="text-red-500" />}
                    </div>

                    <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex flex-col">
                            <span>Colonne 'form' e 'gender'</span>
                            <span className="text-xs text-muted-foreground">Necessarie per la nuova feature</span>
                        </div>

                        {status.loading ? <Loader2 className="animate-spin" /> :
                            status.columnsExist === 'success' ? <CheckCircle2 className="text-green-500" /> :
                                <div className="flex items-center gap-2 text-red-500"><XCircle /> <span>{status.columnError}</span></div>}
                    </div>

                    <Button onClick={checkConnection} disabled={status.loading}>Riprova Test</Button>
                </CardContent>
            </Card>
        </div>
        </div>
    );
}
