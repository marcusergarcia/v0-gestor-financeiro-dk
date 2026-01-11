# 🔧 Configuração do Webhook PagBank (API v4)

## ⚠️ PROBLEMA ATUAL

O webhook está recebendo notificações no formato **API v3 antiga** (form-urlencoded) que não contém o `reference_id` diretamente. Por isso o sistema não consegue atualizar o status dos boletos automaticamente.

## ✅ SOLUÇÃO

Configure o webhook no painel do PagBank para enviar notificações no formato **JSON da API v4**, que inclui o `reference_id` no payload.

## 📋 PASSO A PASSO

### 1. Acesse o Painel do PagBank

**Sandbox:**
- https://sandbox.pagseguro.uol.com.br/

**Produção:**
- https://minhaconta.pagseguro.uol.com.br/

### 2. Vá em Preferências > Integrações

### 3. Localize "Notificação de Transação"

### 4. Configure a URL do Webhook

```
https://gestor9.vercel.app/api/pagseguro/webhook
```

### 5. ⚠️ IMPORTANTE: Selecione o Formato Correto

**NÃO USE:** "Notificações de Transação" (API v3 - form-urlencoded)

**USE:** "Webhooks" ou "Notificações v4" (API v4 - JSON)

### 6. Eventos para Habilitar

- ✅ **charge.paid** - Quando o boleto for pago
- ✅ **charge.waiting** - Quando o boleto estiver aguardando
- ✅ **charge.canceled** - Quando o boleto for cancelado

### 7. Salvar Configurações

## 🧪 TESTAR O WEBHOOK

Após configurar, pague um boleto de teste e verifique os logs do Vercel:

```
[v0][PagSeguro Webhook] ✅ Formato correto detectado (JSON - API v4)
[v0][PagSeguro Webhook] Reference ID: 149-01
[v0][PagSeguro Webhook] ✅ Boleto encontrado
[v0][PagSeguro Webhook] 💰 STATUS PAGO - Atualizando boleto...
[v0][PagSeguro Webhook] ✅ Boleto atualizado para PAGO
```

## 📊 DIFERENÇA ENTRE OS FORMATOS

### ❌ API v3 (Formato Antigo - NÃO USE)
```
Content-Type: application/x-www-form-urlencoded
notificationCode=CB62D8-CE2D052D0589...
notificationType=transaction
```
→ Precisa fazer consulta adicional à API para obter reference_id

### ✅ API v4 (Formato Correto - USE ESTE)
```json
Content-Type: application/json
{
  "charges": [{
    "id": "CHAR_...",
    "reference_id": "149-01",
    "status": "PAID"
  }]
}
```
→ O reference_id vem diretamente no payload!

## 🔍 VERIFICAR SE ESTÁ FUNCIONANDO

Se você ver nos logs:

```
[v0][PagSeguro Webhook] ⚠️  FORMATO ANTIGO DETECTADO (API v3)
```

Significa que o webhook ainda está configurado no formato antigo. Reconfigure no painel do PagBank.

Se você ver:

```
[v0][PagSeguro Webhook] ✅ Formato correto detectado (JSON - API v4)
```

Está correto e o sistema vai atualizar automaticamente!
