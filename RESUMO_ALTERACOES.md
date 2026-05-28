# Sumário das Alterações - XML NF-e Padrão SEFAZ

## 🎯 Objetivo
Corrigir o formato do XML das notas fiscais para estar em total conformidade com o padrão SEFAZ (PL_009_V4).

---

## 📊 Comparativo

| Aspecto | Antes (❌) | Depois (✅) |
|---------|-----------|-----------|
| **Elemento Raiz** | `<nfeProcs>` (plural, INVÁLIDO) | `<nfeProc>` (singular, padrão SEFAZ) |
| **Arquivo por NF-e** | Múltiplas em um arquivo | Um arquivo por NF-e |
| **Namespace** | Em nfeProc individual | No elemento raiz nfeProc |
| **Atributo versao** | Depois de xmlns | Na ordem correta (xmlns primeiro) |
| **Exportação** | Um único arquivo XML | Arquivo individual ou ZIP |
| **Nome do arquivo** | NFe_data_quantidade.xml | NFe + chave de acesso |
| **Validação SEFAZ** | Falha (XSD inválido) | Sucesso |

---

## 📝 Estrutura do XML (Antes vs Depois)

### ❌ ANTES (INCORRETO)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<nfeProcs xmlns="http://www.portalfiscal.inf.br/nfe">
  <nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
    <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
      <infNFe>...</infNFe>
    </NFe>
  </nfeProc>
  <nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
    <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
      <infNFe>...</infNFe>
    </NFe>
  </nfeProc>
</nfeProcs>
```

### ✅ DEPOIS (CORRETO)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe Id="NFe..." versao="4.00">...</infNFe>
    <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">...</Signature>
  </NFe>
  <protNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
    <infProt Id="ID...">...</infProt>
  </protNFe>
</nfeProc>
```

---

## 🔧 Arquivos Alterados

### 1. `lib/nfe/xml-builder.ts`
✅ **Adicionada** função exportada:
- `montarNfeProcPadrao(xmlNFeAssinado, xmlRetorno)`

**Benefício:** Centraliza a lógica e garante conformidade em todos os lugares

---

### 2. `app/api/nfe/emitir/route.ts`
✅ **Atualizado** para usar `montarNfeProcPadrao`
✅ **Removido** código duplicado

---

### 3. `app/api/nfe/exportar-xml/route.ts`
✅ **Completamente reescrita**

**Novas funções:**
- `normalizarXmlSefaz()` - Corrige XMLs malformados
- `montarNfeProcPadrao()` - Monta XML correto

**Novo fluxo:**
```
GET /api/nfe/exportar-xml
  ↓
Buscar NF-e autorizadas
  ↓
Normalizar XMLs para padrão SEFAZ
  ↓
Validar conformidade
  ↓
Retornar XMLs individuais
```

---

### 4. `app/nota-fiscal/page.tsx`
✅ **Alterada** lógica de exportação

**Novo comportamento:**
- **1 NF-e:** Download direto `NFe[chaveAcesso].xml`
- **N NF-e:** ZIP com múltiplos arquivos individuais

**Dependência adicionada:** jszip ^3.10.1

---

## 🚀 Como Funciona Agora

### Cenário 1: Exportar 1 NF-e
```
Usuário clica "Exportar XML"
    ↓
API busca XML protocolo no banco
    ↓
Normaliza para padrão SEFAZ
    ↓
Download direto: NFe35260349895742000111550010000001651009568690.xml
```

### Cenário 2: Exportar Múltiplas NF-e
```
Usuário seleciona 3 NF-e
    ↓
API busca XMLs protocolo no banco
    ↓
Normaliza cada um para padrão SEFAZ
    ↓
Cria ZIP com 3 arquivos individuais
    ↓
Download: NFe_2026-05-10_3notas.zip
    ├── NFe35260349895742000111550010000001651009568690.xml
    ├── NFe35260349895742000111550010000001651009568691.xml
    └── NFe35260349895742000111550010000001651009568692.xml
```

---

## ✅ Validações Implementadas

1. **Verificação de xmlns**
   - Garante que `xmlns="http://www.portalfiscal.inf.br/nfe"` está no `<nfeProc>`

2. **Verificação de versão**
   - Garante que `versao="4.00"` está no `<nfeProc>`

3. **Extração de elementos**
   - Extrai corretamente `<NFe>` e `<protNFe>` do XML

4. **Normalização**
   - Remove envelopes inválidos como `<nfeProcs>`
   - Reconstrói a estrutura correta

---

## 📦 Dependências

```json
{
  "jszip": "^3.10.1"
}
```

**Uso:** Criar arquivos ZIP para exportação de múltiplas NF-e

---

## 🧪 Como Testar

### Via curl
```bash
curl -X POST http://localhost:3000/api/nfe/exportar-xml \
  -H "Content-Type: application/json" \
  -d '{"nfeIds": [1, 2, 3]}'
```

### Resultado esperado
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "numero": "1",
      "serie": "1",
      "chaveAcesso": "35260349895742000111550010000001651009568690",
      "nomeArquivo": "NFe35260349895742000111550010000001651009568690.xml",
      "dataEmissao": "2026-05-10",
      "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<nfeProc xmlns=\"http://www.portalfiscal.inf.br/nfe\" versao=\"4.00\">..."
    }
  ],
  "total": 1
}
```

---

## 🎓 Referências

- **Documentação SEFAZ:** PL_009_V4
- **Namespace:** http://www.portalfiscal.inf.br/nfe
- **Versão:** 4.00
- **Padrão:** NF-e 4.0

---

## ✨ Benefícios

✅ Conformidade total com padrão SEFAZ
✅ Validação XSD bem-sucedida
✅ Compatibilidade com softwares NF-e
✅ Exportação individual ou em lote
✅ Nomenclatura padrão de arquivos
✅ Código centralizado e reutilizável
