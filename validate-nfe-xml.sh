#!/bin/bash

# Validador de XML NF-e contra o padrão SEFAZ
# Este script valida se o XML gerado está correto

echo "🔍 Validador de XML NF-e SEFAZ"
echo "==============================="
echo ""

XML_FILE="${1:-}"

if [ -z "$XML_FILE" ]; then
  echo "Uso: $0 <caminho-do-arquivo-xml>"
  echo ""
  echo "Exemplo: $0 NFe35260349895742000111550010000001651009568690.xml"
  exit 1
fi

if [ ! -f "$XML_FILE" ]; then
  echo "❌ Erro: Arquivo não encontrado: $XML_FILE"
  exit 1
fi

echo "📄 Validando: $XML_FILE"
echo ""

# Função para verificar elemento
check_element() {
  local element=$1
  local file=$2
  if grep -q "<$element" "$file"; then
    echo "✅ Encontrado: <$element>"
  else
    echo "❌ Faltando: <$element>"
  fi
}

# Função para verificar atributo
check_attribute() {
  local element=$1
  local attr=$2
  local value=$3
  local file=$4
  if grep -q "<$element[^>]*$attr=\"$value\"" "$file"; then
    echo "✅ Atributo correto: <$element ... $attr=\"$value\" ...>"
  else
    echo "⚠️  Verifique: <$element ... $attr=\"$value\" ...>"
  fi
}

echo "📋 Verificações realizadas:"
echo ""

# 1. Verificar declaração XML
echo "1️⃣  Declaração XML:"
if head -1 "$XML_FILE" | grep -q "<?xml.*encoding.*UTF-8"; then
  echo "✅ Declaração XML correta"
else
  echo "⚠️  Verifique a declaração XML"
fi
echo ""

# 2. Verificar elemento raiz
echo "2️⃣  Elemento raiz:"
check_element "nfeProc" "$XML_FILE"
echo ""

# 3. Verificar namespace
echo "3️⃣  Namespace:"
check_attribute "nfeProc" "xmlns" "http://www.portalfiscal.inf.br/nfe" "$XML_FILE"
echo ""

# 4. Verificar versão
echo "4️⃣  Versão:"
check_attribute "nfeProc" "versao" "4.00" "$XML_FILE"
echo ""

# 5. Verificar estrutura interna
echo "5️⃣  Estrutura interna:"
check_element "NFe" "$XML_FILE"
check_element "infNFe" "$XML_FILE"
check_element "Signature" "$XML_FILE"
check_element "protNFe" "$XML_FILE"
echo ""

# 6. Verificar que NÃO tem elemento inválido
echo "6️⃣  Validações negativas:"
if grep -q "<nfeProcs" "$XML_FILE"; then
  echo "❌ ERRO: Encontrado elemento inválido <nfeProcs>"
else
  echo "✅ Não contém elemento inválido <nfeProcs>"
fi
echo ""

# 7. Contar elementos
echo "7️⃣  Contagem de elementos:"
nfe_count=$(grep -c "<NFe" "$XML_FILE" || echo "0")
protnfe_count=$(grep -c "<protNFe" "$XML_FILE" || echo "0")
echo "   NFe: $nfe_count (esperado: 1)"
echo "   protNFe: $protnfe_count (esperado: 1)"

if [ "$nfe_count" -eq 1 ] && [ "$protnfe_count" -eq 1 ]; then
  echo "   ✅ Contagem correta"
else
  echo "   ⚠️  Contagem incorreta"
fi
echo ""

# 8. Verificar se o XML é válido
echo "8️⃣  Validação XML bem-formado:"
if xmllint --noout "$XML_FILE" 2>/dev/null; then
  echo "✅ XML bem-formado"
else
  if command -v xmllint &> /dev/null; then
    echo "⚠️  Verifique a formatação XML"
  else
    echo "⚠️  xmllint não instalado. Instale: apt-get install libxml2-utils"
  fi
fi
echo ""

echo "✨ Validação concluída!"
echo ""
echo "Se todos os testes passarem, o XML está pronto para:"
echo "  - Validação contra XSD SEFAZ"
echo "  - Transmissão para SEFAZ"
echo "  - Importação em softwares NF-e"
