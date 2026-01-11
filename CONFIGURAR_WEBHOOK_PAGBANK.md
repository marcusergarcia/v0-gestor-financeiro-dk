# Como Configurar o Webhook do PagBank

## Problema Atual
O PagBank não está enviando notificações de pagamento para o sistema. Você recebe o email de confirmação, mas o status do boleto não atualiza automaticamente.

## Solução
Você precisa configurar a URL do webhook no painel do PagBank para que eles enviem notificações quando um boleto for pago.

## Passo a Passo

### 1. Acessar o Painel do PagBank
- **Sandbox (Testes)**: https://sandbox.pagseguro.uol.com.br
- **Produção**: https://pagseguro.uol.com.br

### 2. Configurar URL de Notificação
1. Faça login com sua conta
2. Vá em **Integrações** > **Notificações**
3. Clique em **Configurar Notificações**
4. Configure a URL do webhook:

**URL do Webhook (sua aplicação):**
```
https://gestor9.vercel.app/api/pagbank/webhook
```

### 3. Configurar Eventos
Marque os seguintes eventos para receber notificações:
- ✅ **Pagamento Aprovado**
- ✅ **Pagamento Cancelado**
- ✅ **Pagamento em Análise**
- ✅ **Aguardando Pagamento**

### 4. Testar o Webhook

#### Opção 1: Teste Manual no Painel do PagBank
1. No painel, vá em **Integrações** > **Notificações**
2. Clique em **Testar Notificação**
3. Envie uma notificação de teste
4. Verifique os logs no Vercel: https://vercel.com/logs

#### Opção 2: Pagar um Boleto de Teste
1. Gere um boleto de teste no sistema
2. Pague usando o ambiente sandbox do PagBank
3. Aguarde alguns segundos
4. Verifique se o status mudou para "pago" automaticamente

### 5. Verificar Logs
Após configurar, você verá logs como este no Vercel quando um boleto for pago:

```
[v0][PagSeguro Webhook] ===== WEBHOOK RECEBIDO =====
[v0][PagSeguro Webhook] Content-Type: application/x-www-form-urlencoded
[v0][PagSeguro Webhook] Form data recebido: { notificationCode: '...', notificationType: 'transaction' }
[v0][PagSeguro Webhook] Buscando detalhes da transação via API...
[v0][PagSeguro Webhook] Status PAID - atualizando data_pagamento para boleto ID: XXX
[v0][PagSeguro Webhook] ===== PROCESSAMENTO CONCLUÍDO =====
```

## Troubleshooting

### Webhook não está sendo chamado
- ✅ Verifique se a URL está correta no painel do PagBank
- ✅ Certifique-se de estar usando o ambiente correto (sandbox ou produção)
- ✅ Verifique se não há firewall bloqueando requisições do PagBank

### Webhook é chamado mas não atualiza
- ✅ Verifique os logs no Vercel para ver mensagens de erro
- ✅ Confirme que o `numero` do boleto no banco corresponde ao `reference_id` enviado pelo PagBank
- ✅ Verifique se as variáveis de ambiente estão configuradas:
  - `PAGSEGURO_TOKEN`
  - `PAGSEGURO_EMAIL`
  - `PAGSEGURO_ENVIRONMENT` (sandbox ou production)

### Status continua "pendente" após pagamento
- ✅ Aguarde até 5 minutos (o PagBank pode demorar para enviar a notificação)
- ✅ Verifique se o webhook foi chamado nos logs do Vercel
- ✅ Se o webhook não foi chamado, revise a configuração da URL no painel do PagBank

## Variáveis de Ambiente Necessárias

Certifique-se de que estas variáveis estão configuradas no Vercel:

```env
PAGSEGURO_TOKEN=seu_token_aqui
PAGSEGURO_EMAIL=seu_email@exemplo.com
PAGSEGURO_ENVIRONMENT=sandbox
```

Para produção, mude para:
```env
PAGSEGURO_ENVIRONMENT=production
```

## Suporte
Se o problema persistir após seguir todos os passos:
1. Envie os logs do Vercel mostrando o webhook sendo chamado
2. Verifique se há erros específicos nos logs
3. Confirme que o boleto foi pago usando o mesmo CPF cadastrado no sistema
