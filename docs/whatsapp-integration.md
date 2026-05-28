# Integração WhatsApp Business API

## Visão Geral

Esta integração permite que clientes criem ordens de serviço através do WhatsApp Business, usando um fluxo conversacional guiado.

## Fluxo de Conversa

1. **Início**: Cliente envia mensagem
2. **Menu**: Opções para criar ou acompanhar OS
3. **Coleta de Dados**:
   - Nome do cliente
   - Endereço
   - Tipo de serviço
   - Descrição do problema
   - Fotos (opcional)
4. **Criação**: OS é criada automaticamente no sistema
5. **Confirmação**: Cliente recebe número da OS

## Configuração

### 1. Meta for Developers

1. Acesse https://developers.facebook.com
2. Crie um app do tipo "Business"
3. Adicione o produto "WhatsApp"
4. Configure um número de telefone

### 2. Variáveis de Ambiente

Adicione no Vercel ou `.env.local`:

\`\`\`env
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id
WHATSAPP_ACCESS_TOKEN=seu_access_token
WHATSAPP_VERIFY_TOKEN=seu_token_secreto_qualquer
\`\`\`

### 3. Webhook

Configure o webhook no Meta:
- URL: `https://seu-dominio.com/api/whatsapp/webhook`
- Verify Token: O mesmo definido em `WHATSAPP_VERIFY_TOKEN`
- Campos: Inscreva-se em "messages"

### 4. Banco de Dados

Execute o script SQL:
\`\`\`bash
# No sistema, vá em Scripts e execute:
scripts/create-whatsapp-tables.sql
\`\`\`

## Uso

### Para Clientes

1. Envie qualquer mensagem para o número do WhatsApp Business
2. Siga as instruções do bot
3. Receba o número da OS criada

### Para Técnicos

1. As OS criadas via WhatsApp aparecem normalmente no sistema
2. O campo "Solicitado Por" contém o nome e telefone do cliente
3. O campo "Observações" contém o endereço e telefone

## Notificações Automáticas

Você pode enviar notificações automáticas para clientes quando:
- OS é atribuída a um técnico
- Técnico está a caminho
- Serviço foi concluído

Exemplo de código:

\`\`\`typescript
// Em qualquer lugar do sistema
await fetch('/api/whatsapp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '5511999999999',
    message: 'Seu técnico está a caminho! OS #123456'
  })
})
\`\`\`

## Custos

- Gratuito até 1.000 conversas/mês
- Conversas iniciadas pelo cliente: 24h de janela gratuita
- Após 24h: necessário usar templates aprovados

## Suporte

Para dúvidas sobre a API do WhatsApp:
- Documentação: https://developers.facebook.com/docs/whatsapp
- Suporte Meta: https://business.facebook.com/support
