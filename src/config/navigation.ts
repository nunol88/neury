import {
  CalendarDays, Users, Wallet, LayoutGrid, MessageSquare, Bus, Settings, UserCog, Info,
  Euro, ArrowLeftRight, BarChart3, Receipt, type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  description?: string;
  /** Extra paths that should mark this item active */
  matches?: string[];
}

export const CONTAS_ITEMS: NavItem[] = [
  { title: 'Receber', url: '/admin/pagamentos', icon: Euro, description: 'Serviços por pagar, por cliente' },
  { title: 'Movimentos', url: '/admin/movimentos', icon: ArrowLeftRight, description: 'Receitas e despesas extra' },
  { title: 'Resumo', url: '/admin/dashboard', icon: BarChart3, description: 'Indicadores e comparações' },
  { title: 'Fiscal', url: '/admin/recibos-verdes', icon: Receipt, description: 'Recibos verdes e Segurança Social' },
];

export const ADMIN_MAIS_ITEMS: NavItem[] = [
  { title: 'Recados', url: '/admin/recados', icon: MessageSquare, description: 'Mural de mensagens e áudios da equipa' },
  { title: 'Transportes', url: '/admin/transportes', icon: Bus, description: 'Carris e Metro em tempo real' },
  { title: 'Definições', url: '/admin/definicoes', icon: Settings, description: 'Preferências e opções de entrada' },
  { title: 'Utilizadores', url: '/admin/utilizadores', icon: UserCog, description: 'Contas, palavras-passe e acessos' },
  { title: 'Sobre', url: '/admin/sobre', icon: Info, description: 'Versão e informações da app' },
];

export const ADMIN_MAIN: NavItem[] = [
  { title: 'Agenda', url: '/admin/agendamentos', icon: CalendarDays },
  { title: 'Clientes', url: '/admin/clientes', icon: Users },
  { title: 'Contas', url: '/admin/pagamentos', icon: Wallet, matches: CONTAS_ITEMS.map(i => i.url) },
  { title: 'Mais', url: '/admin/mais', icon: LayoutGrid, matches: ['/admin/mais', ...ADMIN_MAIS_ITEMS.map(i => i.url)] },
];

/** Worker (neury) role: only the destinations it already had. */
export const WORKER_MAIN: NavItem[] = [
  { title: 'Agenda', url: '/neury/agendamentos', icon: CalendarDays },
  { title: 'Recados', url: '/neury/recados', icon: MessageSquare },
  { title: 'Transportes', url: '/neury/transportes', icon: Bus },
  { title: 'Sobre', url: '/neury/sobre', icon: Info },
];

export const isNavActive = (item: NavItem, pathname: string) =>
  pathname === item.url || (item.matches?.includes(pathname) ?? false);
