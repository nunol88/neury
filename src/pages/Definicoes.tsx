import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Settings, Mail, Users } from 'lucide-react';
import { EMAIL_LOGIN_KEY, NEW_REGISTRATIONS_KEY } from '@/utils/authConstants';

const Definicoes: React.FC = () => {
  const [emailLoginEnabled, setEmailLoginEnabled] = useState(
    () => localStorage.getItem(EMAIL_LOGIN_KEY) === 'true'
  );
  const [newRegistrationsEnabled, setNewRegistrationsEnabled] = useState(
    () => localStorage.getItem(NEW_REGISTRATIONS_KEY) === 'true'
  );

  const toggleEmailLogin = () => {
    const v = !emailLoginEnabled;
    setEmailLoginEnabled(v);
    localStorage.setItem(EMAIL_LOGIN_KEY, String(v));
  };

  const toggleNewRegistrations = () => {
    const v = !newRegistrationsEnabled;
    setNewRegistrationsEnabled(v);
    localStorage.setItem(NEW_REGISTRATIONS_KEY, String(v));
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
            <Switch checked={emailLoginEnabled} onCheckedChange={toggleEmailLogin} />
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
            <Switch checked={newRegistrationsEnabled} onCheckedChange={toggleNewRegistrations} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Definicoes;
