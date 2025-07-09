# Detecção de Objetos em Tempo Real

Este documento explica como usar o novo recurso de detecção de objetos em tempo real no aplicativo Vision Aid.

## Como Funciona

O aplicativo agora oferece dois modos de operação:

### 1. Modo Foto (Padrão)

- Funciona como antes: tira uma foto e identifica objetos
- Ideal para identificar objetos estáticos
- Maior precisão pois usa imagem de alta qualidade

### 2. Modo Tempo Real (Novo)

- Captura frames da câmera continuamente (a cada 2 segundos)
- Identifica objetos em tempo real
- Ideal para explorar ambientes e identificar objetos enquanto move a câmera
- Usa streaming via Socket.IO para comunicação eficiente

## Como Usar

### Ativando o Modo Tempo Real

1. Abra o aplicativo e vá para a tela da câmera
2. Na parte inferior, você verá um controle com "Modo Foto" e um switch
3. Ative o switch para entrar no "Modo Tempo Real"
4. O aplicativo começará a identificar objetos automaticamente

### Navegação com Modo Tempo Real

- Direcione a câmera para diferentes objetos
- O aplicativo falará automaticamente quando identificar novos objetos
- Os resultados aparecem na parte inferior da tela em tempo real
- Para economizar bateria e dados, apenas objetos novos são anunciados por voz

### Desativando o Modo Tempo Real

- Simplesmente desative o switch para voltar ao modo foto tradicional

## Configurações Técnicas

### Frequência de Captura

- **Padrão**: 2 segundos entre cada frame
- **Motivo**: Balanceio entre responsividade e performance

### Qualidade da Imagem

- **Modo Tempo Real**: Qualidade reduzida (0.5) para melhor performance
- **Modo Foto**: Qualidade alta (0.8) para melhor precisão

### Conectividade

- Usa Socket.IO para comunicação eficiente em tempo real
- Reconexão automática em caso de perda de conexão
- Fallback para modo foto se houver problemas de conectividade

## Considerações de Performance

### Bateria

- O modo tempo real consome mais bateria devido à captura contínua
- Recomenda-se usar apenas quando necessário

### Dados

- Transmissão contínua de imagens pode consumir dados móveis
- Recomenda-se usar em Wi-Fi quando possível

### Servidor

- O servidor Python deve estar preparado para receber múltiplos frames
- Implementa throttling para evitar sobrecarga

## Benefícios do Modo Tempo Real

1. **Exploração Ativa**: Identifica objetos enquanto você move a câmera
2. **Acessibilidade Melhorada**: Feedback contínuo para pessoas com deficiência visual
3. **Navegação Assistida**: Ajuda a identificar obstáculos e objetos em tempo real
4. **Experiência Fluida**: Não precisa parar para tirar fotos

## Troubleshooting

### Problema: Modo tempo real não funciona

- **Solução**: Verifique se o servidor Python está rodando
- **Solução**: Verifique a conexão de rede

### Problema: Muitos anúncios de voz

- **Solução**: O sistema já filtra repetições automáticamente

### Problema: Performance lenta

- **Solução**: Verifique a conexão de rede
- **Solução**: Considere reduzir a frequência de captura (atualmente 2 segundos)

## Próximas Melhorias

- [ ] Configuração da frequência de captura pelo usuário
- [ ] Filtros de objeto (identificar apenas categorias específicas)
- [ ] Histórico de objetos identificados
- [ ] Modo de baixo consumo de dados
- [ ] Suporte a múltiplas câmeras
