## Contexto
Estás na página de Clientes (`/admin/clientes`). Já tem: pesquisa, favoritos, badge de devedor, expandir cliente, histórico, relatório PDF, preferências de agendamento. Boa base — mas há margem para tornar a página muito mais útil no dia-a-dia da Mayara.

## Melhorias propostas (por prioridade de impacto)

### 1. Quick actions no cartão do cliente (alto impacto, baixo risco)
Botões grandes diretos, sem precisar de expandir:
- **WhatsApp** (abre `wa.me/<telefone>` com mensagem opcional pré-feita: "Olá X, confirmo o serviço de amanhã?")
- **Ligar** (`tel:`)
- **Maps** (abre morada no Google Maps — já existe noutros sítios, replicar aqui)
- **Agendar agora** (atalho que abre o calendário no próximo dia preferido do cliente já pré-preenchido)

### 2. Ordenação e filtros avançados
Barra de filtros por cima da lista:
- **Ordenar por**: nome (A-Z) · favoritos · dívida · último serviço · €/h · mais frequente
- **Filtros rápidos** (chips): Todos · Favoritos · Com dívida · Inativos (30d+) · Aniversário este mês · Recibo verde
- Contador "X de Y clientes"

### 3. Mini-stats no cartão (sem expandir)
Linha discreta por baixo do nome com 3-4 números chave:
`12 serviços · 36h · €420 · último há 8d`
Permite varrer a lista visualmente sem clicar.

### 4. Badge "Próximo serviço agendado"
Mostra a próxima data marcada (ex: "Próximo: 4ª feira, 28 Mai"). Se não houver e for favorito, mostra "Sem próximo serviço" a amarelo.

### 5. Bulk actions / seleção múltipla
Checkbox por cartão + barra flutuante quando há seleção:
- Enviar mensagem WhatsApp em massa (abre cada conversa)
- Marcar/desmarcar favorito
- Exportar CSV dos selecionados

### 6. Insights no topo da página
Cards finos com:
- Total clientes ativos / inativos
- Total em dívida (€) — clicável → filtra devedores
- Top 3 clientes por receita YTD
- Aniversariantes este mês (já existe na Dashboard, adicionar atalho aqui)

### 7. Vista em mapa
Toggle "Lista / Mapa" — mapa Leaflet com pin por cliente baseado na morada (geocoded). Útil para planear rota do dia.
**Nota**: requer geocoding (Nominatim free). Pode ficar para uma segunda iteração se for muito.

### 8. Notas rápidas timeline
Na expansão do cliente, transformar `notas` num formato de timeline: cada nota com data e tipo (geral · contacto · problema · pagamento). Adicionar nota rápida sem editar tudo.

### 9. Tags / categorias
Campo de tags livres no cliente (ex: "vivenda", "alergia a químicos", "tem cão", "porteiro"). Filtrável.

### 10. Importar contactos
Botão "Importar do telefone" via CSV ou colar lista. Útil quando a Mayara quer migrar agenda antiga.

### 11. Aniversário no cartão
Se o cliente tem `data_nascimento` e o aniversário é nos próximos 7 dias, mostrar 🎂 + dias restantes no cartão. Botão direto WhatsApp parabéns.

### 12. Duplicar cliente
Quando cria um cliente parecido (ex: casal na mesma morada), botão "Duplicar" copia dados.

## Detalhes técnicos
- Tudo client-side; não requer migrations (já há campos suficientes).
- Vista mapa (#7) é o único que precisa biblioteca extra (já existe Leaflet no projeto para transportes — reutilizar) + geocoding gratuito.
- Tags (#9) sim precisa migration: `ALTER TABLE clients ADD COLUMN tags text[] DEFAULT '{}'`.

## Sugestão de ordem
**Fase A (rápida, alto valor)**: #1 Quick actions, #2 Filtros/ordenação, #3 Mini-stats, #4 Próximo serviço, #11 Aniversário no cartão.

**Fase B (média)**: #6 Insights topo, #5 Bulk actions, #8 Notas timeline.

**Fase C (mais pesada)**: #7 Mapa, #9 Tags, #10 Importar, #12 Duplicar.

## Pergunta
Diz quais queres (números) ou "Fase A", "tudo", etc., e avanço.
