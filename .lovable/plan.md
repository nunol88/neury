

## Problema

O login com Apple falha com erro `provider_disabled` porque o provider Apple não está habilitado no backend de autenticação. O Google foi configurado mas o Apple não.

## Solução

1. **Ativar o provider Apple** usando a ferramenta `configure_auth` do Lovable Cloud para habilitar o Apple como provider de autenticação
2. O código no `Login.tsx` já está correto — usa `lovable.auth.signInWithOAuth("apple")` que é o padrão correto

## Passos

1. Usar a ferramenta de configuração de autenticação para ativar o provider Apple (managed pelo Lovable Cloud)
2. Testar o login com Apple no site publicado (neury.lovable.app)

Nenhuma alteração de código é necessária — apenas a configuração do backend.

