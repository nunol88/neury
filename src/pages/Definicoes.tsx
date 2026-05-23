import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Settings, Mail, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  EMAIL_LOGIN_SETTING,
  NEW_REGISTRATIONS_SETTING,
  getBooleanSetting,
  setBooleanSetting,
} from '@/utils/appSettings';

const Definicoes: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [emailLoginEnabled, setEmailLoginEnabled] = useState(false);
  const [newRegistrationsEnabled, setNewRegistrationsEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [email, reg] = await Promise.all([
        getBooleanSetting(EMAIL_LOGIN_SETTING),
        getBooleanSetting(NEW_REGISTRATIONS_SETTING),
      ]);
      if (!mounted) return;
      setEmailLoginEnabled(email);
      setNewRegistrationsEnabled(reg);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleEmailLogin = async () => {
    const v = !emailLoginEnabled;
    setSaving(EMAIL_LOGIN_SETTING);
    const previous = emailLoginEnabled;
    setEmailLoginEnabled(v);
    const { error } = await setBooleanSetting(EMAIL_LOGIN_SETTING, v);
    setSaving(null);
    if (error) {
      setEmailLoginEnabled(previous);
      toast.error('Não foi possível guardar (apenas administradores).');
    }
  };

  const toggleNewRegistrations = async () => {
    const v = !newRegistrationsEnabled;
    setSaving(NEW_REGISTRATIONS_SETTING);
    const previous = newRegistrationsEnabled;
    setNewRegistrationsEnabled(v);
    const { error } = await setBooleanSetting(NEW_REGISTRATIONS_SETTING, v);
    setSaving(null);
    if (error) {
      setNewRegistrationsEnabled(previous);
      toast.error('Não foi possível guardar (apenas administradores).');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <header className="flex items-center gap-3">
        <Settings className="text-primary" size={26} />
        <div>
          <h1 className="text-xl font-bold text-foreground">Definições</h1>
          <p className="text-sm text-muted-foreground">Configurações de acesso à plataforma</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acesso</CardTitle>
          <CardDescription>Controla como utilizadores entram e registam-se</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" size={16} /> A carregar definições…
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Login por email</p>
                    <p className="text-xs text-muted-foreground">Permite entrar com email + palavra-passe (além do Google)</p>
                  </div>
                </div>
                <Switch
                  checked={emailLoginEnabled}
                  onCheckedChange={toggleEmailLogin}
                  disabled={saving === EMAIL_LOGIN_SETTING}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Novos registos</p>
                    <p className="text-xs text-muted-foreground">Permite que novas pessoas criem conta no ecrã de login</p>
                  </div>
                </div>
                <Switch
                  checked={newRegistrationsEnabled}
                  onCheckedChange={toggleNewRegistrations}
                  disabled={saving === NEW_REGISTRATIONS_SETTING}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Definicoes;
