# Configuração do WhatsApp Business API

## Status Atual

Seu número **+55 (11) 5241-9494** está verificado e pronto para uso!

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no Vercel:

### 1. WHATSAPP_PHONE_NUMBER_ID
- Onde encontrar: Meta for Developers > Seu App > WhatsApp > API Setup
- Exemplo: `123456789012345`

### 2. WHATSAPP_ACCESS_TOKEN
- Onde encontrar: Meta for Developers > Seu App > WhatsApp > API Setup > Token de Acesso Temporário
- Para produção, gere um token permanente em "System Users"
- Exemplo: `EAAxxxxxxxxxxxx`

### 3. WHATSAPP_VERIFY_TOKEN
- Este token é criado por você (qualquer string segura)
- Use o mesmo valor ao configurar o webhook no Meta
- Exemplo: `meu_token_secreto_12345`

### 4. WHATSAPP_BUSINESS_ACCOUNT_ID
- Onde encontrar: Meta for Developers > Seu App > WhatsApp > API Setup
- Exemplo: `987654321098765`

## Configurar Webhook no Meta

1. Acesse: Meta for Developers > Seu App > WhatsApp > Configuration
2. Clique em "Edit" na seção Webhooks
3. Adicione a URL do webhook:
   ```
   https://seu-dominio.vercel.app/api/whatsapp/webhook
   ```
4. Cole o mesmo valor usado em `WHATSAPP_VERIFY_TOKEN`
5. Inscreva-se nos seguintes campos:
   - ✅ messages
   - ✅ message_status (opcional, para rastreamento de entrega)

## Testar a Integração

1. Acesse a página de configuração no sistema: `/configuracoes/whatsapp`
2. Verifique se todos os status estão verdes
3. Envie uma mensagem de teste
4. Envie uma mensagem para o número do WhatsApp Business para testar o recebimento

## Funcionalidades Disponíveis

### Criação Automática de Ordens de Serviço
Os clientes podem criar ordens de serviço conversando com o WhatsApp Business. O sistema guia o cliente através de:
- Identificação do cliente (por código ou nome)
- Cadastro de novo cliente (se necessário)
- Seleção do tipo de serviço
- Tipo de atendimento (Urgente, Normal, Agendado)
- Descrição do problema
- Nome e telefone do solicitante

### Consulta de Ordens
- Consultar OS pelo código
- Listar todas as OS abertas
- Listar OS finalizadas
- Listar OS agendadas

### Notificações Automáticas
O sistema envia notificações via WhatsApp quando:
- Uma nova OS é criada
- O status de uma OS muda
- Um técnico é atribuído à OS

## Comandos Disponíveis

- `menu` - Volta ao menu principal
- `sair` - Finaliza a conversa
- `voltar` - Volta para a etapa anterior

## Limites e Custos

- **Gratuito**: Até 1.000 conversas por mês
- **Janela de conversa**: 24 horas após a última mensagem do cliente
- **Após 24h**: Necessário usar templates aprovados pela Meta

## Suporte

Para problemas com a integração:
1. Verifique os logs no Vercel
2. Teste a API diretamente: `/configuracoes/whatsapp`
3. Consulte a documentação oficial: https://developers.facebook.com/docs/whatsapp
