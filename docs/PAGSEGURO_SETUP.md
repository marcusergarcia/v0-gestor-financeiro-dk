# Configuração da Integração PagSeguro

## Variáveis de Ambiente Necessárias

### Banco de Dados (Já configuradas)
- `DB_HOST` - Host do banco MySQL
- `DB_USER` - Usuário do banco
- `DB_PASSWORD` - Senha do banco
- `DB_NAME` - Nome do banco de dados
- `DB_PORT` - Porta do MySQL (padrão: 3306)
- `DB_SSL` - SSL habilitado (true/false)

### PagSeguro (Aguardando token - 2 dias úteis)
- `PAGSEGURO_TOKEN` - Token de acesso da API PagSeguro
- `PAGSEGURO_ENVIRONMENT` - Ambiente: `sandbox` ou `production`

### Aplicação
- `NEXT_PUBLIC_APP_URL` - URL da aplicação (para webhooks)

## Passo a Passo de Configuração

### 1. Executar Script SQL

Execute o script SQL para criar as tabelas necessárias:

```bash
# No MySQL
source scripts/update-boletos-pagseguro.sql
```

Ou copie e cole o conteúdo do arquivo `/scripts/update-boletos-pagseguro.sql` no seu cliente MySQL.

### 2. Obter Token do PagSeguro

1. Acesse https://pagseguro.uol.com.br/
2. Faça login na sua conta
3. Vá em **Integrações** > **Token de Segurança**
4. Gere um novo token
5. Copie o token gerado

### 3. Configurar Variáveis de Ambiente no v0

Na seção **Vars** da barra lateral, adicione:

```
PAGSEGURO_TOKEN=seu_token_aqui
PAGSEGURO_ENVIRONMENT=sandbox
```

Para produção, altere para:
```
PAGSEGURO_ENVIRONMENT=production
```

### 4. Configurar Webhook no PagSeguro

1. No painel do PagSeguro, vá em **Integrações** > **Notificações**
2. Configure a URL de webhook:
   ```
   https://seu-dominio.vercel.app/api/pagseguro/webhook
   ```
3. Marque todas as notificações relacionadas a:
   - Pagamentos (charges)
   - Boletos
   - Payouts

## Funcionalidades Implementadas

### 1. Emissão de Boletos
- Boletos bancários reais com código de barras
- Linha digitável para pagamento
- PDF pronto para impressão
- Multa e juros configuráveis
- Notificação automática via webhook quando pago

### 2. Cashback Automático (ClubePag)
- 2% de cashback em todos os pagamentos (configurável)
- Cliente identificado pelo telefone
- Saldo acumulado disponível para uso
- Resgate automático em próximas compras

### 3. Pagamento de Contas (Payout)
- Pagar fornecedores via PIX
- Transferências bancárias
- Agendamento de pagamentos
- Histórico completo de transações

## Testando a Integração

### Ambiente Sandbox (Desenvolvimento)

1. Configure `PAGSEGURO_ENVIRONMENT=sandbox`
2. Use o token de sandbox
3. Crie um boleto de teste
4. Use os dados de teste do PagSeguro para simular pagamento

### Ambiente de Produção

1. Configure `PAGSEGURO_ENVIRONMENT=production`
2. Use o token de produção
3. Boletos reais serão gerados
4. Clientes poderão pagar normalmente

## Fluxo de Emissão de Boleto

1. Usuário acessa **Financeiro** > **Nova Ordem**
2. Preenche dados do cliente, valor, vencimento
3. Sistema cria boleto no PagSeguro
4. Retorna:
   - Código de barras
   - Linha digitável
   - Link para PDF
   - Dados do boleto
5. Salva tudo no banco de dados
6. Cliente recebe boleto (pode ser enviado via WhatsApp)
7. Quando cliente paga, webhook notifica o sistema
8. Sistema atualiza status para "pago"
9. Registra cashback automaticamente (2%)

## Fluxo de Cashback

1. Cliente paga um boleto de R$ 100,00
2. Sistema recebe notificação via webhook
3. Calcula 2% de cashback = R$ 2,00
4. Registra cashback na conta ClubePag do cliente
5. Na próxima compra, cliente pode usar o cashback acumulado
6. Cashback é descontado automaticamente do valor

## APIs Disponíveis

### Boletos
- `POST /api/boletos` - Criar boleto (integrado com PagSeguro)
- `GET /api/boletos` - Listar boletos
- `GET /api/boletos/[id]` - Consultar boleto específico
- `PUT /api/boletos/[id]` - Atualizar boleto
- `DELETE /api/boletos/[id]` - Cancelar boleto

### Cashback
- `GET /api/pagseguro/cashback?clienteId=X` - Consultar cashback do cliente
- `GET /api/pagseguro/cashback?telefone=X` - Consultar por telefone
- `POST /api/pagseguro/cashback` - Resgatar cashback
- `GET /api/pagseguro/cashback/config` - Ver configuração
- `PUT /api/pagseguro/cashback/config` - Atualizar percentual

### Payout (Pagamento de Contas)
- `POST /api/pagseguro/payout` - Criar pagamento
- `GET /api/pagseguro/payout` - Listar pagamentos

### Webhook
- `POST /api/pagseguro/webhook` - Receber notificações do PagSeguro

## Estrutura de Tabelas

### boletos
- Campos adicionados:
  - `pagseguro_charge_id` - ID do boleto no PagSeguro
  - `codigo_barras` - Código de barras do boleto
  - `linha_digitavel` - Linha digitável
  - `pdf_url` - Link para download do PDF
  - `qr_code_url` - QR Code do boleto

### cashback
- Nova tabela para controlar cashback dos clientes
- Campos: cliente_id, boleto_id, telefone, valor_cashback, status, etc.

### payouts
- Nova tabela para controlar pagamentos realizados
- Campos: reference_id, tipo_pagamento, valor, beneficiario, etc.

### configuracoes_pagseguro
- Configurações gerais da integração
- Cashback percentual, limites, etc.

## Troubleshooting

### Erro: "PAGSEGURO_TOKEN não configurado"
- Adicione a variável `PAGSEGURO_TOKEN` nas variáveis de ambiente

### Erro: "Webhook não está recebendo notificações"
- Verifique se a URL do webhook está configurada corretamente no painel PagSeguro
- Certifique-se que a URL é acessível publicamente (não localhost)
- Verifique logs em `/api/pagseguro/webhook`

### Erro: "Boleto não foi criado no PagSeguro"
- Verifique se o token está correto e válido
- Confirme se o ambiente (sandbox/production) está configurado corretamente
- Veja logs de erro no console

### Erro de banco de dados
- Certifique-se que o script SQL foi executado
- Verifique se as variáveis DB_* estão configuradas
- Teste a conexão do banco

## Suporte

Para mais informações sobre a API do PagSeguro:
- Documentação: https://developer.pagbank.com.br/
- Suporte PagSeguro: https://pagseguro.uol.com.br/atendimento/

Para problemas técnicos do sistema:
- Verifique logs no console do navegador (F12)
- Verifique logs do servidor
- Entre em contato com o desenvolvedor
