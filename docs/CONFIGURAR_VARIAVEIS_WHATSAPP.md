# Como Configurar Variáveis do WhatsApp no Vercel

## Passo 1: Acesse o Dashboard do Vercel

1. Vá para: https://vercel.com/dashboard
2. Faça login se necessário
3. Encontre o projeto "gestor9" na lista
4. Clique no card do projeto

## Passo 2: Acesse Environment Variables

1. No projeto, clique em **"Settings"** no menu superior
2. No menu lateral, clique em **"Environment Variables"**

## Passo 3: Adicione as Variáveis

Adicione cada variável abaixo clicando em "Add New":

### WHATSAPP_VERIFY_TOKEN
- **Key**: `WHATSAPP_VERIFY_TOKEN`
- **Value**: O token que você criou no Meta (ex: "meu_token_secreto_123")
- **Environment**: Selecione "Production", "Preview" e "Development"

### WHATSAPP_ACCESS_TOKEN
- **Key**: `WHATSAPP_ACCESS_TOKEN`
- **Value**: O token que aparece em "Configuração da API" no Meta (começa com EAA...)
- **Environment**: Selecione "Production", "Preview" e "Development"

### WHATSAPP_PHONE_NUMBER_ID
- **Key**: `WHATSAPP_PHONE_NUMBER_ID`
- **Value**: O Phone Number ID do número de teste (número longo que aparece abaixo do número de telefone)
- **Environment**: Selecione "Production", "Preview" e "Development"

### WHATSAPP_BUSINESS_ACCOUNT_ID
- **Key**: `WHATSAPP_BUSINESS_ACCOUNT_ID`
- **Value**: O WhatsApp Business Account ID (aparece na página de configuração)
- **Environment**: Selecione "Production", "Preview" e "Development"

## Passo 4: Redeploy

Após adicionar todas as variáveis:
1. Volte para a aba "Deployments"
2. Clique nos três pontos do último deployment
3. Clique em "Redeploy"
4. Aguarde o deploy finalizar (1-2 minutos)

## Passo 5: Verifique o Webhook no Meta

Volte para o Meta e clique em "Verificar e salvar" no webhook.

Se tudo estiver correto, o webhook será verificado com sucesso!

## Onde encontrar cada valor no Meta:

1. **Token de acesso**: Menu lateral > Configuração da API > "Temporary access token"
2. **Phone Number ID**: Menu lateral > Configuração da API > Abaixo do número de telefone de teste
3. **Business Account ID**: Menu lateral > Configuração da API > "WhatsApp Business Account ID"
4. **Verify Token**: O que você criou e colocou no campo "Verificar token"
