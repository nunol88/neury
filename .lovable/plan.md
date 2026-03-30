

# Reset de Password para Utilizadores

## Objetivo
Adicionar funcionalidade de reset de password na gestão de utilizadores, permitindo ao admin definir uma nova password para qualquer utilizador (ex: Nuno).

## Alterações

### 1. Edge Function `manage-users/index.ts` — Nova ação `reset_password`
- Adicionar handler para `action === "reset_password"`
- Recebe `user_id` e `new_password`
- Valida password (mínimo 8 caracteres)
- Usa `adminClient.auth.admin.updateUserById(user_id, { password })` para atualizar
- Impede reset da própria conta admin (segurança)

### 2. Página `GestaoUtilizadores.tsx` — Botão e dialog de reset
- Adicionar botão de reset (ícone `KeyRound`) nos cards de utilizadores não-admin
- Novo dialog com campo de nova password (com toggle mostrar/esconder)
- Ao confirmar, chama a edge function com `action: 'reset_password'`
- Toast de sucesso/erro

## Fluxo
1. Admin clica no ícone de chave no card do utilizador
2. Dialog abre pedindo nova password
3. Admin define password → confirma
4. Edge function atualiza a password via Admin API
5. Toast confirma sucesso

