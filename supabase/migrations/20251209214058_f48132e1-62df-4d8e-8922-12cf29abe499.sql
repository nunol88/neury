-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'neury');

-- Criar enum para status dos agendamentos
CREATE TYPE public.agendamento_status AS ENUM ('agendado', 'concluido', 'cancelado');

-- Tabela de roles dos utilizadores
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função para verificar se utilizador tem uma role específica
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para obter a role do utilizador
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Política: utilizadores podem ver as suas próprias roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Tabela de agendamentos
CREATE TABLE public.agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_nome TEXT NOT NULL,
    cliente_contacto TEXT,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    descricao TEXT,
    status agendamento_status NOT NULL DEFAULT 'agendado',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Políticas para agendamentos: todos os utilizadores autenticados podem ver
CREATE POLICY "Authenticated users can view agendamentos"
ON public.agendamentos
FOR SELECT
TO authenticated
USING (true);

-- Apenas admins podem criar agendamentos
CREATE POLICY "Only admins can create agendamentos"
ON public.agendamentos
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Apenas admins podem atualizar agendamentos
CREATE POLICY "Only admins can update agendamentos"
ON public.agendamentos
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Apenas admins podem apagar agendamentos
CREATE POLICY "Only admins can delete agendamentos"
ON public.agendamentos
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_agendamentos_updated_at
BEFORE UPDATE ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();