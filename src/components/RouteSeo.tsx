import { useLocation } from 'react-router-dom';
import { SeoHead } from '@/components/SeoHead';

const ROUTE_META: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Entrar — Agenda Mayara Godoi | Mayslimpo',
    description: 'Acesso à plataforma interna de gestão de agendamentos, clientes e pagamentos da Mayslimpo.',
  },
  '/admin/agendamentos': {
    title: 'Agendamentos (Admin) — Mayslimpo',
    description: 'Vista de administração da agenda mensal: criar, copiar e gerir serviços fixos e pontuais.',
  },
  '/admin/dashboard': {
    title: 'Dashboard — Mayslimpo',
    description: 'Indicadores mensais de receita, horas trabalhadas e desempenho da Mayslimpo.',
  },
  '/admin/clientes': {
    title: 'Clientes — Mayslimpo',
    description: 'Base de clientes com preferências, contactos e histórico de serviços.',
  },
  '/admin/pagamentos': {
    title: 'Pagamentos — Mayslimpo',
    description: 'Controlo de pagamentos por cliente, valores em atraso e recibos.',
  },
  '/admin/recibos-verdes': {
    title: 'Gestão Fiscal — Mayslimpo',
    description: 'Cálculo de Segurança Social, IRS e geração de relatórios fiscais.',
  },
  '/admin/utilizadores': {
    title: 'Utilizadores — Mayslimpo',
    description: 'Gestão de contas, permissões e estado dos utilizadores da plataforma.',
  },
  '/admin/transportes': {
    title: 'Transportes de Lisboa — Mayslimpo',
    description: 'Horários da Carris e estado do Metro de Lisboa em tempo real.',
  },
  '/admin/sobre': {
    title: 'Sobre — Mayslimpo',
    description: 'Versão, novidades e informação sobre a aplicação Mayslimpo.',
  },
  '/neury/agendamentos': {
    title: 'Agenda do Dia — Mayslimpo',
    description: 'Vista diária e mensal da agenda para o funcionário.',
  },
  '/neury/transportes': {
    title: 'Transportes — Mayslimpo',
    description: 'Horários e estado dos transportes de Lisboa.',
  },
  '/neury/sobre': {
    title: 'Sobre — Mayslimpo',
    description: 'Versão e novidades da aplicação Mayslimpo.',
  },
};

export function RouteSeo() {
  const { pathname } = useLocation();
  const meta = ROUTE_META[pathname] ?? {
    title: 'Mayslimpo — Agenda Mayara Godoi',
    description: 'Plataforma interna de gestão da Mayslimpo.',
  };
  const isPublic = pathname === '/';
  return (
    <SeoHead
      title={meta.title}
      description={meta.description}
      path={pathname}
      noindex={!isPublic}
    />
  );
}

export default RouteSeo;
