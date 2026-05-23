## Mural de Recados (chat partilhado em tempo real)

Um único quadro de avisos onde admin e trabalhadores ativos deixam recados curtos. Mensagens aparecem ao vivo, sem refresh.

### Base de dados (1 migration)

Tabela `public.messages`:
- `id` uuid PK
- `user_id` uuid (autor)
- `author_name` text (nome a mostrar — snapshot, para não revelar email)
- `author_role` text (`'admin'` ou `'neury'`)
- `content` text (máx. 500 chars, validado por trigger)
- `created_at` timestamptz

RLS:
- SELECT: qualquer utilizador autenticado **ativo** ou admin
- INSERT: admin ou utilizador ativo, com `auth.uid() = user_id`
- DELETE: o próprio autor ou admin
- (sem UPDATE — recados são imutáveis)

Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.messages` + `REPLICA IDENTITY FULL`.

### Frontend

Nova página `src/pages/Recados.tsx` partilhada por ambos os papéis:
- Rota `/admin/recados` e `/neury/recados`
- Lista cronológica (mais recentes em baixo, auto-scroll)
- Input fixo no fundo com botão "Enviar" e contador 500/500
- Cada bolha mostra nome, hora relativa ("há 5 min") e botão apagar (só autor/admin)
- Subscrição Realtime ao canal `messages` para INSERT/DELETE
- Visual liquid-glass coerente com o resto (cards `bg-card/60 backdrop-blur`, bolhas distintas por papel: admin com accent azul, trabalhador com surface-1)

Sidebar (`AppSidebar.tsx`): adicionar item **"Recados"** (ícone `MessageSquare`) nos dois grupos — para admin entre Clientes e Pagamentos, para trabalhador depois de Agendamentos.

### Segurança
- Conteúdo validado client-side (Zod: trim, 1-500 chars) e server-side (trigger CHECK não, mas BEFORE INSERT function que rejeita vazio/>500).
- `author_name` e `author_role` preenchidos no cliente a partir do `useAuth`, mas verificados no trigger contra `user_roles` para evitar spoofing.
- Sem anexos, sem HTML — texto puro renderizado como string.

### O que NÃO entra nesta versão
- Indicador de não lidas / badges
- Edição de mensagens
- Anexos (fotos)
- Conversas privadas 1-para-1
