$body = @{
    cliente_id = "test-id"
    tipo_servico = "teste"
    valor_material = 100
    valor_mao_obra = 0
    desconto = 0
    valor_total = 100
    validade = 30
    situacao = "pendente"
    data_orcamento = "2026-04-19"
    parcelamento_mdo = 0
    parcelamento_material = 1
    itens = @(
        @{
            produto_id = "test-prod"
            quantidade = 1
            valor_unitario = 100
            valor_mao_obra = 0
            valor_total = 100
            marca_nome = "Teste"
        }
    )
} | ConvertTo-Json -Depth 5

Write-Host "Enviando payload:"
Write-Host $body

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/orcamentos/20260419001" `
        -Method PUT `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "`nStatus: $($response.StatusCode)"
    Write-Host "Resposta: $($response.Content)"
} catch {
    Write-Host "`nERRO HTTP: $($_.Exception.Response.StatusCode)"
    $errorStream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($errorStream)
    $errorBody = $reader.ReadToEnd()
    Write-Host "Corpo do erro: $errorBody"
}
