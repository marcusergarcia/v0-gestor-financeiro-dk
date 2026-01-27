# Configuração PagSeguro

Este documento explica como configurar completamente a integração com PagSeguro.

## 1. Token de Segurança da API

### Obtendo o Token

1. Acesse o [PagBank](https://minhaconta.pagseguro.uol.com.br/)
2. Faça login na sua conta
3. Vá em **Integrações** → **Token de Segurança**
4. Gere um novo token ou copie o token existente
5. Adicione o token na variável de ambiente `PAGSEGURO_TOKEN`

### Configurando no Projeto

No Vercel (ou arquivo `.env` local):

\`\`\`env
PAGSEGURO_TOKEN=seu_token_aqui
PAGSEGURO_ENVIRONMENT=production
\`\`\`

## 2. Página de Redirecionamento

Após o pagamento, o cliente será redirecionado para uma página de confirmação.

### Configurando no PagSeguro

1. Acesse **Integrações** → **Configurações de integração**
2. Em **Página de redirecionamento**, configure:

**Página de redirecionamento fixa:**
\`\`\`
https://seu-dominio.vercel.app/pagamento/confirmacao
\`\`\`

**Código do Parâmetro (opcional):**
\`\`\`
transaction_id
\`\`\`

**URL completa de exemplo:**
\`\`\`
https://seu-dominio.vercel.app/pagamento/confirmacao?transaction_id=B6E12D75-33-A1A5-63D261
\`\`\`

### Parâmetros Recebidos

A página de redirecionamento receberá os seguintes parâmetros na URL:

- `transaction_id`: ID da transação PagSeguro
- `status`: Status do pagamento (success, pending, canceled)

## 3. Webhook (Notificações)

O webhook já está implementado em:
\`\`\`
https://seu-dominio.vercel.app/api/pagbank/webhook
\`\`\`

### Configurando no PagSeguro

1. Acesse **Integrações** → **Notificações**
2. Configure a URL de notificação:
\`\`\`
https://seu-dominio.vercel.app/api/pagbank/webhook
\`\`\`

3. Selecione os eventos que deseja receber:
   - Alteração de status de cobrança
   - Pagamento confirmado
   - Cancelamento de pagamento

## 4. Whitelist de IP/Domínio

**IMPORTANTE:** Para produção, você precisa solicitar ao PagSeguro que adicione seu domínio na whitelist.

### Como Solicitar

1. Entre em contato com o suporte PagSeguro
2. Informe seu domínio Vercel: `seu-projeto.vercel.app`
3. Aguarde a liberação (pode levar alguns dias úteis)

**Erro comum sem whitelist:**
\`\`\`
403 - ACCESS_DENIED - whitelist access required
\`\`\`

## 5. Ambiente Sandbox vs Produção

### Sandbox (Testes)

\`\`\`env
PAGSEGURO_TOKEN=seu_token_sandbox
PAGSEGURO_ENVIRONMENT=sandbox
\`\`\`

URL Base: `https://sandbox.api.pagseguro.com`

### Produção

\`\`\`env
PAGSEGURO_TOKEN=seu_token_producao
PAGSEGURO_ENVIRONMENT=production
\`\`\`

URL Base: `https://api.pagseguro.com`

## 6. Testando a Integração

### 1. Criar um Boleto de Teste

\`\`\`bash
# Via API
POST /api/boletos
{
  "numero_nota": 123,
  "parcela": 1,
  "valor": 100.00,
  "vencimento": "2025-12-31",
  "cliente_id": 1
}
\`\`\`

### 2. Verificar Logs

Acesse o Vercel Dashboard e verifique os logs da função serverless para ver as requisições:

\`\`\`
[PagSeguro API] Request: ...
[PagSeguro API] Response: ...
\`\`\`

### 3. Webhook Local (Desenvolvimento)

Para testar webhook localmente, use ngrok ou similar:

\`\`\`bash
ngrok http 3000
\`\`\`

Configure a URL do ngrok no PagSeguro:
\`\`\`
https://abc123.ngrok.io/api/pagseguro/webhook
\`\`\`

## 7. Troubleshooting

### Erro 403 - ACCESS_DENIED

**Solução:** Contate o suporte PagSeguro para liberar seu domínio na whitelist.

### Erro 401 - UNAUTHORIZED

**Solução:** Verifique se o token está correto na variável `PAGSEGURO_TOKEN`.

### Webhook não está sendo recebido

**Soluções:**
1. Verifique se a URL do webhook está configurada corretamente no PagSeguro
2. Verifique os logs no Vercel para ver se as requisições estão chegando
3. Teste a URL manualmente com um POST request

### Boleto não é gerado

**Soluções:**
1. Verifique os logs para ver o erro específico
2. Confirme que todos os campos obrigatórios estão preenchidos
3. Verifique se o valor é maior que R$ 0,20 (mínimo do PagSeguro)
4. Valide CPF/CNPJ e email do cliente

## 8. Campos Obrigatórios para Boleto

\`\`\`typescript
{
  customer: {
    name: string,        // Nome completo
    email: string,       // Email válido
    tax_id: string,      // CPF/CNPJ (apenas números)
    phone: string        // Telefone (apenas números)
  },
  amount: number,        // Mínimo R$ 0,20
  due_date: string,      // Formato: YYYY-MM-DD
  address: {
    street: string,
    number: string,
    postal_code: string, // CEP (apenas números)
    city: string,
    region: string,      // Nome completo do estado (ex: "São Paulo")
    region_code: string, // Sigla do estado (ex: "SP")
  }
}
\`\`\`

## 9. Suporte

Para mais informações, consulte a [documentação oficial do PagSeguro](https://dev.pagseguro.uol.com.br/).
