## 1. Bug do áudio (recados) — não reproduz

**Causa provável:** o `MediaRecorder` grava em `audio/webm; codecs=opus` (Chrome/Android). Esse formato **não toca em iPhone/Safari**, por isso quem grava num telemóvel Android consegue ouvir, mas a Mayara no iPhone (ou vice-versa) só vê o botão play sem som.

**Correção em `src/pages/Recados.tsx`:**
- Detetar o melhor mime suportado em cascata: `audio/mp4` → `audio/mp4;codecs=mp4a.40.2` → `audio/webm;codecs=opus` → `audio/webm`. Safari moderno (iOS 14.5+) suporta `audio/mp4`, pelo que passa a haver formato universal.
- Guardar o ficheiro com extensão coerente (`.m4a` para `mp4`, `.webm` para `webm`) e passar o `contentType` correto no upload.
- No `<AudioPlayer>`: adicionar tratamento de erro (`onError`) que mostra um toast claro ("formato não suportado neste dispositivo") e um link de fallback para abrir o áudio numa nova aba, em vez de falhar silenciosamente.
- Pequena melhoria: usar `audio.duration` quando disponível para exibir tempo real (em vez do tempo calculado no cliente, que conta desde `start()` e inclui latência).

Sem alterações de base de dados — o bucket `recados-audio` continua público e as policies atuais já permitem leitura.

## 2. Seletor de idioma nas mensagens de WhatsApp

Aplicar a **todas** as mensagens (cobrança, confirmação de serviço, aniversário, clientes inativos, "Olá!" simples do ClientesAdmin).

**Refactor em `src/utils/whatsappMessages.ts`:**
- Novo tipo `WhatsAppLang = 'pt' | 'en' | 'it' | 'es' | 'fr' | 'de'`.
- Cada builder (`buildPaymentReminderMessage`, `buildServiceConfirmationMessage`, novo `buildBirthdayMessage`, novo `buildSimpleGreeting`) recebe `lang` opcional (default `'pt'`) e devolve a mensagem traduzida com formato de data localizado (`toLocaleDateString(lang+'-XX')`).
- Tabela de strings interna com as 6 traduções por chave (saudação, "só a lembrar", "total", "pode pagar por", "obrigada", "confirmo a limpeza no dia", "até lá", etc.).
- `openWhatsApp(phone, message)` mantém-se igual.

**Novo componente `src/components/whatsapp/LanguagePicker.tsx`:**
- `DropdownMenu` (shadcn) com bandeirinha + label de cada idioma (🇵🇹 PT · 🇬🇧 EN · 🇮🇹 IT · 🇪🇸 ES · 🇫🇷 FR · 🇩🇪 DE).
- Props: `onPick(lang)`; o trigger pode ser o próprio botão de WhatsApp (clique abre dropdown em vez de abrir diretamente).
- Memoriza última escolha em `localStorage` (`whatsapp_lang`) por cliente — abre logo no idioma mais usado para esse contacto. Chave: `whatsapp_lang:<clienteId>`.

**Locais a atualizar:**
- `src/pages/Pagamentos.tsx` (cobrança, copy + send)
- `src/components/schedule/TodaySummary.tsx` (confirmação)
- `src/pages/ClientesAdmin.tsx` (saudação simples + linha 1478)
- `src/components/admin/BirthdaysCard.tsx` (parabéns)
- `src/components/admin/InactiveFavoritesCard.tsx` (reativar)

Em cada local, substituir o botão de WhatsApp por: clica → `LanguagePicker` → ao escolher idioma, chama o builder com `lang` e abre `wa.me`.

## 3. Contactos de pagamento (Mayara)

Em `src/utils/whatsappMessages.ts`:
- `ADMIN_MBWAY = '961 689 411'` (substitui o 933 474 736).
- Nova constante `ADMIN_REVOLUT_USER = 'mayara1dgr'` e helper `revolutLink()` que devolve `https://revolut.me/mayara1dgr`. Este link, quando aberto no telemóvel com a app Revolut instalada, abre direto a app para pagamento.
- `buildPaymentReminderMessage` passa a incluir, traduzido em cada idioma:
  - `MB Way: 961 689 411`
  - `Revolut: https://revolut.me/mayara1dgr` (URL completo para o WhatsApp criar link clicável)

## 4. Memória

Atualizar `mem://features/recados-message-board` (nota sobre mime mp4 para cross-platform) e criar/atualizar entrada para `whatsapp-i18n` no índice de memória.

## Ficheiros tocados

```text
src/pages/Recados.tsx                              (mime mp4 + error fallback player)
src/utils/whatsappMessages.ts                      (i18n + Revolut + novo número)
src/components/whatsapp/LanguagePicker.tsx         (novo)
src/pages/Pagamentos.tsx                           (usar LanguagePicker)
src/components/schedule/TodaySummary.tsx           (usar LanguagePicker)
src/pages/ClientesAdmin.tsx                        (usar LanguagePicker)
src/components/admin/BirthdaysCard.tsx             (usar LanguagePicker)
src/components/admin/InactiveFavoritesCard.tsx     (usar LanguagePicker)
mem://features/recados-message-board               (nota mp4)
mem://index.md                                     (entrada whatsapp-i18n)
```

Sem migrações de base de dados nem secrets novos.
