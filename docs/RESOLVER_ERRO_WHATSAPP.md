# Como Resolver o Erro de Permissões WhatsApp

## O Problema

Erro: `Object with ID '885165781341458' does not exist, cannot be loaded due to missing permissions`

Este erro ocorre por um dos seguintes motivos:

### 1. ID Incorreto
O ID `885165781341458` que você está usando pode estar incorreto. Você precisa de:
- **WHATSAPP_PHONE_NUMBER_ID**: ID do número de telefone (não do Business Account)
- **WHATSAPP_BUSINESS_ACCOUNT_ID**: ID da conta business (usado apenas em algumas operações)

### 2. Permissões do Token Faltando
O Access Token precisa ter as seguintes permissões:
- `whatsapp_business_management` - Para gerenciar configurações
- `whatsapp_business_messaging` - Para enviar/receber mensagens

### 3. Token Temporário
Se você gerou um token temporário no Meta Developers, ele expira em 24 horas.

---

## Como Resolver

### Passo 1: Obter os IDs Corretos

1. Acesse: https://developers.facebook.com/apps
2. Selecione seu App
3. Vá em **WhatsApp** → **Introdução** (Getting Started)
4. Você verá:
   - **Phone number ID**: Este é o `WHATSAPP_PHONE_NUMBER_ID` ✅
   - **WhatsApp Business Account ID**: Este é o `WHATSAPP_BUSINESS_ACCOUNT_ID`

**Exemplo:**
```
Phone number ID: 110200345501442
WhatsApp Business Account ID: 123456789012345
```

### Passo 2: Gerar Token Permanente (System User)

Um token temporário expira em 24h. Você precisa criar um **System User** com token permanente:

1. Acesse **Meta Business Suite**: https://business.facebook.com
2. Vá em **Configurações do Negócio** → **Usuários** → **Usuários do Sistema**
3. Clique em **Adicionar** e crie um novo System User
4. Dê um nome (ex: "WhatsApp API Bot")
5. Defina a função como **Admin**
6. Clique em **Criar token de acesso**
7. Selecione seu App
8. Marque as permissões:
   - ✅ `whatsapp_business_management`
   - ✅ `whatsapp_business_messaging`
9. Defina o token para **nunca expirar** (ou 60 dias se preferir renovar)
10. **COPIE E SALVE O TOKEN** (você não verá novamente)

### Passo 3: Atribuir Assets ao System User

1. Ainda em **Usuários do Sistema**, clique no System User criado
2. Clique em **Atribuir Assets**
3. Selecione **Apps**
4. Marque seu App WhatsApp
5. Defina controle total
6. Clique em **Salvar alterações**

### Passo 4: Configurar Variáveis de Ambiente no Vercel

Acesse seu projeto no Vercel:

```bash
# Variáveis OBRIGATÓRIAS
WHATSAPP_PHONE_NUMBER_ID=110200345501442
WHATSAPP_ACCESS_TOKEN=EAAJBxxxxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_VERIFY_TOKEN=meu_token_secreto_qualquer_string
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
```

**Importante:**
- `WHATSAPP_PHONE_NUMBER_ID`: ID do telefone (não da conta business)
- `WHATSAPP_ACCESS_TOKEN`: Token permanente do System User
- `WHATSAPP_VERIFY_TOKEN`: Você define (qualquer string segura)
- `WHATSAPP_BUSINESS_ACCOUNT_ID`: ID da conta business

### Passo 5: Registrar o Número (Opcional)

Se você ainda não registrou o número, pode fazer via API:

```bash
curl -X POST "https://graph.facebook.com/v18.0/SEU_PHONE_NUMBER_ID/register" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "pin": "123456"
  }'
```

O `pin` é o PIN de verificação em duas etapas (2FA) que você configurou.

---

## Verificar se Está Funcionando

1. Acesse a página de configuração WhatsApp no sistema
2. Verifique se todos os status aparecem em verde ✅
3. Tente enviar uma mensagem de teste

---

## Dicas de Troubleshooting

### Verificar Permissões do Token

Use o Graph API Explorer:
https://developers.facebook.com/tools/explorer/

```
GET /{PHONE_NUMBER_ID}?fields=verified_name,display_phone_number,quality_rating
```

Se retornar erro, o token não tem permissões corretas.

### Verificar Validade do Token

```bash
curl "https://graph.facebook.com/debug_token?input_token=SEU_TOKEN&access_token=SEU_TOKEN"
```

Deve retornar as permissões (`scopes`) incluindo `whatsapp_business_*`.

---

## Resumo Rápido

1. ✅ Use **WHATSAPP_PHONE_NUMBER_ID** (ID do telefone, não da conta)
2. ✅ Crie **System User** com token permanente
3. ✅ Adicione permissões `whatsapp_business_management` e `whatsapp_business_messaging`
4. ✅ Atribua o App ao System User
5. ✅ Configure todas as variáveis de ambiente no Vercel
6. ✅ Teste no sistema
