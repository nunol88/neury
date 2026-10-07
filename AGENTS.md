# AGENTS.md

- Navigation structure lives in `src/config/navigation.ts` (Agenda / Clientes / Contas / Mais); sidebar, mobile BottomNav, ContasTabs, Mais page and search all read from it so menus never drift apart.
- Agenda view/date/month/highlight are stored in URL query params (`vista`, `data`, `mes`, `destaque`) so context survives navigation and deep links; invalid values fall back to today.
- Only supported month keys from `generateMonthsConfig` are valid for dates and extras; never extend years without matching support in `useAgendamentos`.
- Extras `mes_key` is always derived from the record date; extras with `tipo = 'despesa'` count as negative in every total.
- Global search filters the full authorised collections before limiting results and is admin-only.
- Mobile bottom nav height is exposed as CSS var `--bottom-nav-offset`; floating elements must add it to their bottom offset, and fixed controls that a floating card must avoid carry `data-floating-obstacle`.
- Sticky agenda layers stack below the 48px app header; MonthTabs reads `--agenda-sticky-top` and `main` must not create a scroll container (use `overflow-x-clip`, not `overflow-auto`) or sticky breaks.
- Isolated checks live in `tests/` (run with `bun test tests/`); UI checks mock backend writes and never touch real data.
