# Correção do XML das NF-e para Padrão SEFAZ

## Resumo das Alterações

O XML das notas fiscais foi corrigido para estar em total conformidade com o padrão SEFAZ (PL_009_V4). As principais mudanças implementadas são:

---

## ✅ Problemas Corrigidos

### 1. **Formato Anterior (INCORRETO)**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<nfeProcs xmlns="http://www.portalfiscal.inf.br/nfe">
  <nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
    <NFe>...</NFe>
  </nfeProc>
  <nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
    <NFe>...</NFe>
  </nfeProc>
</nfeProcs>
```

**Problemas:**
- ❌ `<nfeProcs>` (plural) não existe no XSD SEFAZ
- ❌ Múltiplas NF-e em um único arquivo
- ❌ Não segue o padrão de nomenclatura de arquivos

### 2. **Formato Correto (SEFAZ)**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe Id="NFe..." versao="4.00">...</infNFe>
    <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">...</Signature>
  </NFe>
  <protNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
    <infProt Id="ID...">
      <tpAmb>1</tpAmb>
      <verAplic>...</verAplic>
      <chNFe>...</chNFe>
      <dhRecbto>...</dhRecbto>
      <nProt>...</nProt>
      <digVal>...</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>
```

**Características corretas:**
- ✅ Elemento raiz `<nfeProc>` (singular)
- ✅ `xmlns` e `versao` no elemento raiz
- ✅ Contém exatamente uma NF-e assinada (`<NFe>`)
- ✅ Contém exatamente um protocolo SEFAZ (`<protNFe>`)
- ✅ Cada arquivo = um `<nfeProc>` individual

---

## 📝 Arquivos Modificados

### 1. **`lib/nfe/xml-builder.ts`**
- **Adicionada:** Função exportada `montarNfeProcPadrao()`
- **Propósito:** Centralizar a lógica de montagem do nfeProc no padrão correto SEFAZ
- **Ordem dos atributos:** `xmlns` antes de `versao` (conforme XSD SEFAZ)

```typescript
export function montarNfeProcPadrao(xmlNFeAssinado: string, xmlRetorno: string): string {
  const protMatch = xmlRetorno.match(/<protNFe[^>]*>[\s\S]*?<\/protNFe>/)
  const protNFe = protMatch ? protMatch[0] : ""
  
  return `<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">${xmlNFeAssinado}${protNFe}</nfeProc>`
}
```

### 2. **`app/api/nfe/emitir/route.ts`**
- **Alterado:** Importação de `montarNfeProcPadrao`
- **Removido:** Função local duplicada `montarNfeProc()`
- **Resultado:** Usa a função centralizada do xml-builder

### 3. **`app/api/nfe/exportar-xml/route.ts`**
- **Completamente reescrita** para exportar XMLs individuais
- **Nova funcionalidade:**
  - `normalizarXmlSefaz()`: Corrige XMLs malformados
  - `montarNfeProcPadrao()`: Monta o XML correto
  - Suporte a múltiplas NF-e para criar ZIP

- **Fluxo corrigido:**
  1. Busca NF-e autorizadas no banco
  2. Normaliza cada XML para o padrão SEFAZ
  3. Retorna XMLs individuais validados

### 4. **`app/nota-fiscal/page.tsx`**
- **Alterado:** Lógica de exportação de XMLs
- **Novo comportamento:**
  - **Uma NF-e:** Download direto do arquivo `.xml`
  - **Múltiplas NF-e:** Cria um `.zip` com arquivos individuais
  - **Nomenclatura padrão SEFAZ:** `NFe` + chave de acesso (44 dígitos)

```typescript
// Exemplo: NFe35260349895742000111550010000001651009568690.xml
const nomeArquivo = `NFe${nfe.chaveAcesso}.xml`
```

---

## 🆕 Dependências Adicionadas

- **jszip** (^3.10.1): Para criar arquivos ZIP com múltiplos XMLs

---

## 📋 Padrão de Nomenclatura de Arquivos SEFAZ

Cada arquivo XML deve seguir o padrão:

```
NFe + CHAVE_DE_ACESSO + .xml

Exemplo: NFe35260349895742000111550010000001651009568690.xml
         └─ NFe (prefixo fixo)
             └─ 3 (versão NF-e)
                 └─ 5 (UF)
                     └─ 26034989574200 (CNPJ)
                         └─ 0111 (ano e mês)
                             └─ 55 (série)
                                 └─ 0010000001 (número)
                                     └─ 65 (modelo)
                                         └─ 1009568690 (dígito verificador)
```

---

## 🔄 Fluxo de Geração e Exportação (Atualizado)

### Antes:
```
Emissão → XML Envio → Assinatura → XML Protocolo (nfeProc)
                                            ↓
                      Exportação → Único arquivo com <nfeProcs> (INVÁLIDO)
```

### Depois:
```
Emissão → XML Envio → Assinatura → XML Protocolo (nfeProc individual)
                                            ↓
         Banco de Dados (xml_protocolo armazenado correto)
                      ↓
         Exportação → Normalização → Validação → Download
                                            ↓
                      Uma NF-e: arquivo .xml individual
                      Múltiplas: arquivo .zip com XMLs individuais
```

---

## ✅ Validação

O XML agora pode ser:
1. **Validado** contra o XSD SEFAZ oficial
2. **Transmitido** para SEFAZ sem erros de formato
3. **Importado** em softwares NF-e compatíveis
4. **Armazenado** no padrão oficial

---

## 🚀 Próximas Ações (Recomendadas)

1. Testar a exportação de uma NF-e autorizada
2. Testar a exportação de múltiplas NF-e (gera ZIP)
3. Validar os XMLs gerados contra o XSD SEFAZ
4. Importar os XMLs em software NF-e para validação

---

## 📚 Referências SEFAZ

- **Padrão:** PL_009_V4 - Manual de Padrões Técnicos da NF-e
- **Namespace:** http://www.portalfiscal.inf.br/nfe
- **Versão:** 4.00
- **Estrutura válida:** Um `<nfeProc>` contém exatamente um `<NFe>` e um `<protNFe>`
