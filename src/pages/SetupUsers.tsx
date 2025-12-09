import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

interface SetupResult {
  user: string;
  success: boolean;
  error?: string;
}

const SetupUsers = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SetupResult[]>([]);
  const [step, setStep] = useState<'idle' | 'creating' | 'done'>('idle');
  const navigate = useNavigate();

  const createUsers = async () => {
    setLoading(true);
    setStep('creating');
    const newResults: SetupResult[] = [];

    try {
      // Create admin user (Mayara)
      const { data: adminData, error: adminError } = await supabase.auth.signUp({
        email: 'mayara@local.app',
        password: 'password',
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { name: 'Mayara', username: 'mayara' }
        }
      });

      if (adminError) {
        newResults.push({ user: 'Mayara (admin)', success: false, error: adminError.message });
      } else if (adminData.user) {
        newResults.push({ user: 'Mayara (admin)', success: true });
      }

      // Sign out before creating next user
      await supabase.auth.signOut();

      // Wait a bit before next signup
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create neury user
      const { data: neuryData, error: neuryError } = await supabase.auth.signUp({
        email: 'neury@local.app',
        password: 'password',
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { name: 'Neury', username: 'neury' }
        }
      });

      if (neuryError) {
        newResults.push({ user: 'Neury', success: false, error: neuryError.message });
      } else if (neuryData.user) {
        newResults.push({ user: 'Neury', success: true });
      }

      // Sign out
      await supabase.auth.signOut();

    } catch (error) {
      console.error('Setup error:', error);
    }

    setResults(newResults);
    setStep('done');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Configurar Utilizadores</CardTitle>
          <CardDescription>
            Cria os utilizadores iniciais do sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {step === 'idle' && (
            <>
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <p><strong>Admin:</strong> mayara / password</p>
                <p><strong>Neury:</strong> neury / password</p>
              </div>
              <Button onClick={createUsers} className="w-full" disabled={loading}>
                Criar Utilizadores
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Login
              </Button>
            </>
          )}

          {step === 'creating' && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">A criar utilizadores...</p>
            </div>
          )}

          {step === 'done' && (
            <>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg flex items-start gap-3 ${
                      result.success 
                        ? 'bg-success/10 border border-success/20' 
                        : 'bg-destructive/10 border border-destructive/20'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">{result.user}</p>
                      {result.error && (
                        <p className="text-sm text-destructive mt-1">{result.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg text-sm">
                <p className="font-medium text-warning">⚠️ Próximo passo:</p>
                <p className="text-muted-foreground mt-1">
                  Avisa-me para eu atribuir as roles aos utilizadores.
                </p>
              </div>

              <Button onClick={() => navigate('/')} className="w-full">
                Ir para Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupUsers;
