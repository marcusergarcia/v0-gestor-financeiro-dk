# ✅ Checklist de Integração PagBank - Boletos

Este documento lista todas as correções implementadas e os próximos passos para finalizar a integração com o PagBank.

## 🔧 Correções Implementadas

### 1. Campo `country` Corrigido
- ❌ **Antes**: `"country": "Brasil"`
- ✅ **Agora**: `"country": "BRA"`
- **Local**: `app/api/boletos/route.ts` e `lib/pagseguro.ts`
- **Motivo**: PagBank exige código ISO 3166-1 alpha-3

### 2. Campo `shipping` Removido
- ✅ **Removido** do payload principal
- **Motivo**: Não é obrigatório para boletos de serviço
- **Local**: `lib/pagseguro.ts` - método `criarBoleto()`

### 3. Validação de Telefone
- ✅ **Implementado**: Só inclui telefone se tiver 10+ dígitos válidos
- **Comportamento**: Se telefone inválido, o campo `phones` é omitido do payload
- **Local**: `lib/pagseguro.ts` - método `criarBoleto()`

### 4. Logger Corrigido
- ✅ **Implementado**: Todos os valores `undefined` são convertidos para `null`
- **Motivo**: PostgreSQL não aceita `undefined` em bind parameters
- **Local**: `lib/pagbank-logger.ts`

### 5. Valores em Centavos
- ✅ **Já implementado**: Todos os valores são multiplicados por 100
- **Mínimo**: R$ 0,20 (20 centavos)

### 6. CPF/CNPJ sem Máscara
- ✅ **Já implementado**: `.replace(/\D/g, "")`

### 7. CEP sem Máscara
- ✅ **Já implementado**: Somente números

## 📋 Checklist de Validação com PagBank

### Conta PagBank
- [ ] Conta **Pessoa Jurídica** ativa
- [ ] Conta **verificada/aprovada**
- [ ] Boleto **habilitado no painel**
- [ ] API Orders **habilitada**
- [ ] **Whitelist liberada** para ambiente cloud (Vercel)

### Token de Produção
- [ ] Token começa com `EAA...`
- [ ] Token configurado em `PAGSEGURO_TOKEN` no Vercel
- [ ] Variável `PAGSEGURO_ENVIRONMENT=production` configurada
- [ ] Token testado e funcionando

### Endpoint
- [ ] Produção: `https://api.pagseguro.com/orders`
- [ ] Ambiente correto configurado

## 🚨 Problema Atual: Whitelist

**Erro encontrado:**
```
403 - ACCESS_DENIED - whitelist access required
```

**Solução:**
Entre em contato com o suporte PagBank e solicite:

> "Solicito liberação da API Orders/Boleto para ambiente cloud Vercel (gestor9.vercel.app), sem restrição de whitelist de IP, pois o ambiente serverless não possui IP fixo."

## 🧪 Como Testar Após Liberação

1. Acesse: `/test-pagbank-boleto`
2. Selecione um cliente cadastrado
3. Configure:
   - Valor da nota
   - Data de vencimento
   - Número de parcelas
4. Clique em "Gerar Log de Boleto"
5. Acesse: `/configuracoes/pagbank-logs`
6. Verifique se o status é **200 (Sucesso)**
7. Baixe o arquivo TXT e confira os dados

## 📊 Estrutura do Payload Atual

```json
{
  "reference_id": "689-01",
  "customer": {
    "name": "COND. VILLAGGIO DI RAVENNA",
    "email": "villaggiodiravenna@gmail.com",
    "tax_id": "00872284000106",
    "phones": [
      {
        "country": "55",
        "area": "11",
        "number": "52419494",
        "type": "MOBILE"
      }
    ]
  },
  "items": [
    {
      "reference_id": "689-01",
      "name": "Boleto 689-01",
      "quantity": 1,
      "unit_amount": 5000
    }
  ],
  "charges": [
    {
      "reference_id": "689-01",
      "description": "Boleto 689-01",
      "amount": {
        "value": 5000,
        "currency": "BRL"
      },
      "payment_method": {
        "type": "BOLETO",
        "boleto": {
          "template": "COBRANCA",
          "due_date": "2026-01-05",
          "days_until_expiration": 45,
          "holder": {
            "name": "COND. VILLAGGIO DI RAVENNA",
            "tax_id": "00872284000106",
            "email": "villaggiodiravenna@gmail.com",
            "address": {
              "street": "Rua Doutor Cristiano Altenfelder Silva",
              "number": "496",
              "postal_code": "03322010",
              "locality": "Vila Carrão",
              "city": "São Paulo",
              "region": "São Paulo",
              "region_code": "SP",
              "country": "BRA"
            }
          },
          "instruction_lines": {
            "line_1": "Pagamento de serviço",
            "line_2": "Não receber após o vencimento"
          }
        }
      },
      "payment_instructions": {
        "fine": {
          "date": "2026-01-06",
          "value": 200
        },
        "interest": {
          "date": "2026-01-06",
          "value": 33
        }
      }
    }
  ]
}
```

## ✅ Campos Validados

| Campo | Formato | Status |
|-------|---------|--------|
| `country` | BRA | ✅ |
| `tax_id` | Somente números | ✅ |
| `postal_code` | 8 dígitos | ✅ |
| `region_code` | Sigla UF | ✅ |
| `amount.value` | Centavos | ✅ |
| `phones` | Opcional se inválido | ✅ |
| `shipping` | Removido (opcional) | ✅ |

## 📞 Contato PagBank

**Suporte Técnico:**
- Email: integracao@pagseguro.com
- Telefone: 0800 721 1234

**Informações para fornecer:**
- Domínio: gestor9.vercel.app
- Ambiente: Vercel (Serverless)
- API: Orders (Boleto)
- Motivo: IP dinâmico (whitelist não aplicável)

## 🎯 Próximos Passos

1. ✅ Implementar todas as correções (CONCLUÍDO)
2. ⏳ Aguardar liberação do PagBank
3. 🧪 Testar criação de boletos
4. 📊 Enviar logs de sucesso para validação final
5. 🚀 Ir para produção

---

**Última atualização:** 30/12/2025
**Status:** Aguardando liberação de whitelist do PagBank
