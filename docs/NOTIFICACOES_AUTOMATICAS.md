# Notificações Automáticas

## WhatsApp - Timeout de Inatividade

### Como funciona
- Após **5 minutos** de inatividade, o usuário recebe um aviso
- Após **10 minutos** totais (5 + 5), a sessão é finalizada automaticamente
- Verificação automática a cada **5 minutos** via Vercel Cron

### Configuração
O cron job já está configurado em `vercel.json`:
```json
{
  "path": "/api/whatsapp/check-timeouts",
  "schedule": "*/5 * * * *"
}
```

## Boletos - Notificações de Vencimento

### Tipos de Notificação

1. **3 dias antes do vencimento**
   - Lembrete amigável
   - Enviado às 09:00 do dia

2. **No dia do vencimento**
   - Alerta de urgência
   - Enviado às 09:00 do dia

3. **1 dia após vencimento**
   - Aviso de boleto vencido
   - Menciona multa e juros
   - Enviado às 09:00 do dia seguinte

### Configuração
O cron job executa diariamente às 09:00:
```json
{
  "path": "/api/boletos/check-vencimentos",
  "schedule": "0 9 * * *"
}
```

### Requisitos
- Cliente deve ter telefone cadastrado
- Boleto deve estar com status "pendente"
- Notificação não pode ter sido enviada anteriormente

### Campos de Controle
```sql
- notificacao_3dias_enviada
- notificacao_hoje_enviada  
- notificacao_vencido_enviada
```

## Ordem de Serviço - Conclusão

### Notificação automática quando:
- Situação muda para "concluída"
- Cliente tem telefone cadastrado
- Inclui detalhes do serviço realizado

Já implementado em `/api/ordens-servico/[id]/route.ts`
