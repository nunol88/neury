# Cartão flutuante arrastável

## Objetivo
Tornar o cartão dos totais livremente posicionável por rato ou toque, preservando o aspeto, os valores e o clique simples para voltar ao topo.

## Implementação
- Usar Pointer Events com captura do ponteiro e um limiar de 6 px para separar clique de arrasto.
- Posicionar o cartão com coordenadas fixas e limitá-lo ao ecrã, incluindo margem de 12 px e safe areas móveis.
- Guardar apenas a posição em `localStorage`, com validação e fallback seguro para o canto inferior direito.
- Revalidar a posição ao mostrar o cartão e em resize/orientação.
- Manter Enter/Espaço para voltar ao topo e adicionar nome acessível com indicação de que pode ser arrastado.

## Verificação
- Confirmar compilação e tipos.
- Testar no navegador: rato, toque simulado, clique simples, cancelamento, persistência e resize.
- Não alterar dados, totais, autenticação, base de dados ou outros elementos da agenda.
