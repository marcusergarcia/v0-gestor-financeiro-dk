# Configurar Timeout de Inatividade - WhatsApp

## Como Funciona

O sistema monitora automaticamente as conversas do WhatsApp e:

1. **Após 5 minutos de inatividade**: Envia um aviso ao usuário informando que o atendimento será finalizado em breve
2. **Após 10 minutos de inatividade**: Finaliza automaticamente o atendimento e limpa a sessão

## Configuração

### 1. Execute o Script SQL

Execute o script `scripts/add_whatsapp_timeout_fields.sql` no banco de dados para adicionar os campos necessários:

```sql
ALTER TABLE whatsapp_conversations 
ADD COLUMN last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN timeout_warning_sent BOOLEAN DEFAULT FALSE,
ADD INDEX idx_last_activity (last_activity);
```

### 2. Configure o Vercel Cron (Automático)

O arquivo `vercel.json` já está configurado para executar a verificação de timeouts a cada minuto.

### 3. Adicione a Variável de Ambiente

No Vercel, adicione a variável `CRON_SECRET`:

```
CRON_SECRET=seu_token_secreto_aqui
```

Gere um token aleatório seguro (exemplo: use um UUID ou string longa).

### 4. Deploy

Faça o deploy no Vercel. O Cron Job será ativado automaticamente.

## Teste Manual

Para testar sem esperar o cron, você pode chamar manualmente:

```bash
curl https://seu-dominio.vercel.app/api/whatsapp/check-timeouts
```

## Mensagens Enviadas

**Aviso de 5 minutos:**
```
⚠️ *Aviso de Inatividade*

Notamos que você está há alguns minutos sem responder.

Seu atendimento será *finalizado automaticamente em 5 minutos* caso não recebamos uma resposta.

Para continuar, basta enviar qualquer mensagem. 😊
```

**Finalização após 10 minutos:**
```
⏱️ *Atendimento Finalizado*

Seu atendimento foi encerrado devido à inatividade.

Para iniciar um novo atendimento, envie qualquer mensagem.

Obrigado! 👋
```

## Monitoramento

Você pode verificar os logs no Vercel para ver as execuções do cron e as conversas finalizadas.
