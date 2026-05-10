#!/bin/bash

# Script para testar a exportação de XMLs das NF-e
# Este script demonstra como usar a API de exportação

echo "🧪 Testando exportação de XMLs das NF-e"
echo "========================================"
echo ""

# Endpoint da API
ENDPOINT="http://localhost:3000/api/nfe/exportar-xml"

# IDs das NF-e que você quer exportar (substituir com IDs reais)
NF_IDS='[1, 2, 3]'

echo "📤 Enviando requisição para exportar XMLs..."
echo "Endpoint: $ENDPOINT"
echo "NF-e IDs: $NF_IDS"
echo ""

# Fazer a requisição
curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"nfeIds\": $NF_IDS}" \
  -o export_response.json \
  -w "\nStatus HTTP: %{http_code}\n"

echo ""
echo "📋 Resposta recebida em: export_response.json"
echo ""
echo "Conteúdo:"
cat export_response.json | jq '.'

echo ""
echo "✅ Teste concluído!"
echo ""
echo "Se a resposta for bem-sucedida, você receberá:"
echo "  - Lista de XMLs no padrão SEFAZ"
echo "  - Nome de arquivo no padrão: NFe + chave de acesso"
echo "  - XML com estrutura correta:"
echo "    <nfeProc xmlns='...' versao='4.00'>"
echo "      <NFe>...</NFe>"
echo "      <protNFe>...</protNFe>"
echo "    </nfeProc>"
