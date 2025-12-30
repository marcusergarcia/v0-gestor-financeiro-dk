# Configurar Verificação Automática de Timeouts do WhatsApp

## Visão Geral

O sistema agora possui verificação automática de inatividade que:
- Envia aviso após 5 minutos de inatividade
- Finaliza sessão após 10 minutos de inatividade
- Garante isolamento completo entre diferentes usuários

## Configuração no Vercel

### Passo 1: Verificar variável CRON_SECRET

A variável `CRON_SECRET` já está configurada no seu projeto. Ela é usada para autenticar as chamadas do cron job.

### Passo 2: Criar Cron Job no Vercel

1. Acesse: https://vercel.com/seu-usuario/gestor9/settings/cron-jobs

2. Clique em "Create Cron Job"

3. Configure:
   - **Path**: `/api/whatsapp/check-timeouts`
   - **Schedule**: `*/2 * * * *` (executa a cada 2 minutos)
   - **Description**: Verificar timeouts de sessões WhatsApp

4. Clique em "Save"

### Passo 3: Testar

Execute manualmente para testar:

```bash
curl -X GET https://gestor9.vercel.app/api/whatsapp/check-timeouts \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

## Como Funciona

### Fluxo de Timeout

1. **Usuário envia mensagem** → `last_activity_at` é atualizado
2. **Após 5 minutos sem atividade** → Sistema envia aviso
3. **Após 10 minutos sem atividade** → Sistema finaliza sessão automaticamente
4. **Novo usuário entra** → Sempre recebe mensagem de boas-vindas

### Isolamento de Sessões

Cada usuário tem sua própria sessão isolada baseada no `phone_number`. Quando um novo usuário envia uma mensagem:
- O sistema verifica apenas as sessões DESSE usuário específico
- Não há interferência entre diferentes usuários
- Sessões expiradas são automaticamente limpas

## Monitoramento

Verifique os logs no Vercel para acompanhar:
- Avisos enviados
- Sessões expiradas
- Erros de processamento

## Troubleshooting

**Problema**: Sessões não estão expirando
- Verifique se o cron job está configurado
- Verifique se a variável `CRON_SECRET` está correta
- Verifique os logs do Vercel

**Problema**: Usuários recebendo "opção inválida"
- Execute o script SQL `add_whatsapp_inactivity_warnings.sql`
- Verifique se as colunas `last_activity_at` e `warning_sent_at` existem na tabela
