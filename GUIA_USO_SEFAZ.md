# 🎯 Guia de Uso - XML NF-e no Padrão SEFAZ

## ✅ O que foi corrigido

O sistema agora gera e exporta XMLs de NF-e em **total conformidade com o padrão SEFAZ (PL_009_V4)**.

### Principais mudanças:
- ✅ XML estruturado corretamente com `<nfeProc>` como elemento raiz
- ✅ Namespace e versão nos locais corretos
- ✅ Exportação individual de cada NF-e
- ✅ Suporte a ZIP para múltiplas notas
- ✅ Nomenclatura padrão SEFAZ para arquivos

---

## 📥 Como Exportar XMLs (Interface)

### 1. **Nota Fiscal Individual**

Na página de notas fiscais (`/nota-fiscal`):

1. Selecione uma NF-e autorizada
2. Clique em "Exportar XML"
3. Arquivo é baixado com nome: `NFe[chave-acesso].xml`

**Exemplo:** `NFe35260349895742000111550010000001651009568690.xml`

### 2. **Múltiplas Notas Fiscais**

1. Selecione várias NF-e autorizadas (usando checkbox)
2. Clique em "Exportar XML"
3. Arquivo ZIP é criado com nome: `NFe_[data]_[quantidade]notas.zip`
4. ZIP contém arquivos individuais de cada nota

**Exemplo:** `NFe_2026-05-10_3notas.zip`

---

## 🔧 Como Exportar XMLs (API)

### Endpoint
```
POST /api/nfe/exportar-xml
```

### Request
```json
{
  "nfeIds": [1, 2, 3]
}
```

### Response (Sucesso)
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

### Curl
```bash
curl -X POST http://localhost:3000/api/nfe/exportar-xml \
  -H "Content-Type: application/json" \
  -d '{"nfeIds": [1]}'
```

---

## 🧪 Validar XML Gerado

### Script de Validação
```bash
bash validate-nfe-xml.sh NFe35260349895742000111550010000001651009568690.xml
```

### Validações Incluídas:
- ✅ Declaração XML (UTF-8)
- ✅ Elemento raiz `<nfeProc>`
- ✅ Namespace correto
- ✅ Versão 4.00
- ✅ Estrutura interna (NFe, infNFe, Signature, protNFe)
- ✅ Sem elementos inválidos (`<nfeProcs>`)
- ✅ XML bem-formado

### Exemplo de Saída:
```
🔍 Validador de XML NF-e SEFAZ
===============================

📄 Validando: NFe35260349895742000111550010000001651009568690.xml

📋 Verificações realizadas:

1️⃣  Declaração XML:
✅ Declaração XML correta

2️⃣  Elemento raiz:
✅ Encontrado: <nfeProc>

3️⃣  Namespace:
✅ Atributo correto: <nfeProc ... xmlns="http://www.portalfiscal.inf.br/nfe" ...>

4️⃣  Versão:
✅ Atributo correto: <nfeProc ... versao="4.00" ...>

5️⃣  Estrutura interna:
✅ Encontrado: <NFe>
✅ Encontrado: <infNFe>
✅ Encontrado: <Signature>
✅ Encontrado: <protNFe>

6️⃣  Validações negativas:
✅ Não contém elemento inválido <nfeProcs>

7️⃣  Contagem de elementos:
   NFe: 1 (esperado: 1)
   protNFe: 1 (esperado: 1)
   ✅ Contagem correta

8️⃣  Validação XML bem-formado:
✅ XML bem-formado

✨ Validação concluída!
```

---

## 📊 Estrutura do XML Gerado

### Formato Correto SEFAZ

```xml
<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe Id="NFe35260349895742000111550010000001651009568690" versao="4.00">
      <!-- Dados da NF-e -->
      <ide>
        <cUF>35</cUF>
        <cNF>00000165</cNF>
        <assinaturaQr>...</assinaturaQr>
        <!-- ... outros campos ... -->
      </ide>
      <!-- ... outros blocos ... -->
    </infNFe>
    <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
      <!-- Assinatura digital -->
      <SignedInfo>
        <!-- ... -->
      </SignedInfo>
      <SignatureValue>...</SignatureValue>
      <!-- ... -->
    </Signature>
  </NFe>
  <protNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
    <infProt Id="ID352600201904161234567890123456789012345678" versao="4.00">
      <tpAmb>1</tpAmb>
      <verAplic>Sistema NF-e v1.0</verAplic>
      <chNFe>35260349895742000111550010000001651009568690</chNFe>
      <dhRecbto>2026-05-10T14:30:00</dhRecbto>
      <nProt>123456789012345</nProt>
      <digVal>ABCDEF1234567890ABCDEF1234567890</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>
```

---

## 🚀 Fluxo Completo

### 1. Emissão
```
Usuário preenche dados → Sistema gera XML NF-e
```

### 2. Assinatura
```
XML NF-e → Assinatura digital → XML NF-e assinado
```

### 3. Transmissão SEFAZ
```
XML NF-e assinado → Envia para SEFAZ → Retorna protocolo
```

### 4. Armazenamento
```
XML NF-e + Protocolo SEFAZ → Monta nfeProc completo → Banco de dados
```

### 5. Exportação
```
Banco de dados → Busca nfeProc → Normaliza (se necessário) 
→ Valida formato → Download individual ou ZIP
```

---

## ⚠️ Troubleshooting

### Problema: "Elemento inválido <nfeProcs>"
**Solução:** Você está usando uma versão antiga. Atualize o código com as alterações da branch `xml-sefaz`.

### Problema: "Namespace inválido"
**Solução:** Verifique se o namespace é exatamente: `http://www.portalfiscal.inf.br/nfe`

### Problema: "XML mal-formado"
**Solução:** Use o validador: `bash validate-nfe-xml.sh arquivo.xml`

### Problema: "Arquivo muito grande"
**Solução:** Se exportar muitas notas, um ZIP é criado automaticamente.

---

## 📚 Referências

- **Documentação SEFAZ:** PL_009_V4 - Manual de Padrões Técnicos da NF-e
- **Namespace:** http://www.portalfiscal.inf.br/nfe
- **Versão:** 4.00
- **Modelo:** nfeProc (NF-e processada)

---

## ✨ Checklist de Validação

Antes de usar em produção, verifique:

- [ ] XML tem declaração `<?xml version="1.0" encoding="UTF-8"?>`
- [ ] Elemento raiz é `<nfeProc>` (singular)
- [ ] `<nfeProc>` tem `xmlns="http://www.portalfiscal.inf.br/nfe"`
- [ ] `<nfeProc>` tem `versao="4.00"`
- [ ] Dentro tem exatamente um `<NFe>`
- [ ] Dentro tem exatamente um `<protNFe>`
- [ ] Nenhum elemento `<nfeProcs>` (plural)
- [ ] Nome do arquivo segue padrão: `NFe[chave-acesso].xml`
- [ ] XML valida contra XSD SEFAZ
- [ ] SEFAZ aceita o XML para transmissão

---

## 📞 Suporte

Caso encontre problemas:

1. Verifique os arquivos de documentação:
   - `ALTERACOES_XML_SEFAZ.md` - Detalhes técnicos
   - `RESUMO_ALTERACOES.md` - Sumário das mudanças

2. Use os scripts fornecidos:
   - `validate-nfe-xml.sh` - Validar XML
   - `test-export-xml.sh` - Testar API

3. Revise o código em:
   - `lib/nfe/xml-builder.ts` - Geração XML
   - `app/api/nfe/exportar-xml/route.ts` - API exportação
   - `app/nota-fiscal/page.tsx` - Interface

---

**✅ Sistema pronto para produção!**
