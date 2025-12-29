# Ativando Sistema de Timeout do WhatsApp

O sistema de timeout do WhatsApp avisa o usuário após 5 minutos de inatividade e finaliza o atendimento após 10 minutos.

## Passos para ativar:

### 1. Execute o Script SQL

Acesse o painel de scripts e execute o arquivo `add_whatsapp_timeout_fields.sql`:

```sql
ALTER TABLE whatsapp_conversations 
ADD COLUMN last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN timeout_warning_sent BOOLEAN DEFAULT FALSE,
ADD INDEX idx_last_activity (last_activity);
```

### 2. Configure a variável CRON_SECRET no Vercel

1. Acesse: https://vercel.com/seu-usuario/gestor9/settings/environment-variables
2. Adicione uma nova variável:
   - Nome: `CRON_SECRET`
   - Valor: Crie uma senha forte aleatória (ex: `whatsapp_cron_2025_secret_key`)
   - Ambientes: Production, Preview, Development

### 3. Verifique o Cron Job no Vercel

O cron job já está configurado no `vercel.json` para rodar a cada minuto.

Após o deploy, você pode verificar os logs do cron em:
https://vercel.com/seu-usuario/gestor9/logs?source=%2Fapi%2Fcron%2Fwhatsapp-timeouts

### 4. Teste o Sistema

1. Inicie uma conversa no WhatsApp
2. Aguarde 5 minutos sem enviar mensagem
3. Você receberá: "⏰ Olá! Notei que você está sem responder há 5 minutos..."
4. Se não responder, após mais 5 minutos (10 minutos total), receberá: "⏱️ O atendimento foi finalizado..."

## Como funciona:

- A cada minuto, o sistema verifica conversas inativas
- Aos 5 minutos: envia aviso de inatividade
- Aos 10 minutos: finaliza automaticamente o atendimento
- O campo `last_activity` é atualizado a cada mensagem recebida
- Funciona em TODOS os fluxos: menu principal, já sou cliente, primeiro contato, etc.

## Problemas comuns:

**O timeout não está funcionando?**
- Verifique se o script SQL foi executado
- Confirme se a variável CRON_SECRET está configurada no Vercel
- Veja os logs do cron job no Vercel para identificar erros
- Faça um redeploy do projeto após adicionar a variável

**Os avisos não estão sendo enviados?**
- Verifique os logs em: https://vercel.com/gestor9/logs
- Procure por mensagens com "[v0] ⏰" para ver a execução do timeout
