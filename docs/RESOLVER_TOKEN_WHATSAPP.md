# Como Resolver Erro de Token WhatsApp Expirado

## Problema
Você está recebendo este erro nos logs:
```
Error validating application. Application has been deleted.
OAuthException, code: 190
```

Isso significa que o **token de acesso expirou** ou está inválido.

## Solução Rápida (Token Temporário - 24 horas)

1. Acesse: https://developers.facebook.com/apps
2. Clique no app "Gestor Financeiro"
3. No menu lateral, clique em **"WhatsApp" > "Configuração da API"**
4. Procure por **"Temporary access token"**
5. Clique no ícone de copiar ao lado do token
6. Vá para: https://vercel.com/dashboard
7. Acesse seu projeto "gestor9" > Settings > Environment Variables
8. Edite a variável `WHATSAPP_ACCESS_TOKEN`
9. Cole o novo token
10. Clique em "Save"
11. Aguarde 1-2 minutos para o redeploy

**Importante:** Tokens temporários expiram em 24 horas. Você precisará repetir esse processo diariamente.

## Solução Permanente (Token que nunca expira)

Para criar um token permanente, você precisa criar um System User:

### Passo 1: Criar System User

1. Acesse: https://business.facebook.com
2. Selecione seu Business Portfolio: "Macintel Segurança Eletrônica e Controle de Acesso"
3. No menu lateral, clique em **"Usuários" > "Usuários do sistema"**
4. Clique em **"Adicionar"**
5. Nome: "WhatsApp API Bot"
6. Função: **"Administrador"**
7. Clique em "Criar usuário do sistema"

### Passo 2: Gerar Token Permanente

1. Clique no System User que você acabou de criar
2. Clique em **"Gerar novo token"** ou **"Adicionar ativos"**
3. Selecione o app: **"Gestor Financeiro"**
4. Marque as permissões:
   - ✅ `whatsapp_business_management`
   - ✅ `whatsapp_business_messaging`
5. Duração: Selecione **"Nunca expira"** ou **"60 dias"**
6. Clique em "Gerar token"
7. **COPIE O TOKEN AGORA** (só aparece uma vez!)

### Passo 3: Atualizar no Vercel

1. Vá para: https://vercel.com/dashboard
2. Acesse seu projeto "gestor9" > Settings > Environment Variables
3. Edite a variável `WHATSAPP_ACCESS_TOKEN`
4. Cole o token permanente
5. Clique em "Save"
6. Aguarde o redeploy

## Como Testar

Depois de atualizar o token:

1. Envie uma mensagem para o número de teste do WhatsApp
2. Verifique os logs no Vercel: https://vercel.com/seu-usuario/gestor9/logs
3. Você deve ver: `[v0] ✅ Mensagem enviada com sucesso`

## Checklist de Verificação

- [ ] Token copiado do Meta Developers
- [ ] Token atualizado no Vercel em `WHATSAPP_ACCESS_TOKEN`
- [ ] Aguardou 1-2 minutos para o redeploy
- [ ] Testou enviando uma mensagem
- [ ] Verificou os logs do Vercel

Se ainda tiver problemas, verifique:
- O `WHATSAPP_PHONE_NUMBER_ID` está correto?
- O `WHATSAPP_BUSINESS_ACCOUNT_ID` está correto?
- O app no Meta Developers está ativo?
