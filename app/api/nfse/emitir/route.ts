import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { gerarXmlEnvioLoteRps, type DadosNfse } from "@/lib/nfse/xml-builder"
import { enviarLoteRps, testeEnvioLoteRps, extrairDadosNfseRetorno } from "@/lib/nfse/soap-client"

export async function POST(request: NextRequest) {
  const connection = await pool.getConnection()
  try {
    const body = await request.json()
    const {
      origem, // 'orcamento', 'ordem_servico', 'boleto', 'avulsa'
      origem_id,
      origem_numero,
      cliente_id,
      tomador_tipo,
      tomador_cpf_cnpj,
      tomador_inscricao_municipal,
      tomador_razao_social,
      tomador_email,
      tomador_telefone,
      tomador_endereco,
      tomador_numero,
      tomador_complemento,
      tomador_bairro,
      tomador_cidade,
      tomador_uf,
      tomador_cep,
      tomador_codigo_municipio,
      codigo_servico: codigoServicoOverride,
      descricao_servico,
      valor_servicos,
      valor_deducoes,
      valor_pis,
      valor_cofins,
      valor_inss,
      valor_ir,
      valor_csll,
      iss_retido,
      aliquota_iss: aliquotaOverride,
    } = body

    // Buscar configuração NFS-e
    const [configRows] = await connection.execute(
      "SELECT * FROM nfse_config WHERE ativo = 1 LIMIT 1"
    )
    const configs = configRows as any[]
    if (configs.length === 0) {
      return NextResponse.json(
        { success: false, message: "Configuracao NFS-e nao encontrada. Configure em Configuracoes > NFS-e." },
        { status: 400 },
      )
    }
    const config = configs[0]

    if (!config.certificado_base64) {
      return NextResponse.json(
        { success: false, message: "Certificado digital nao configurado." },
        { status: 400 },
      )
    }

    // Obter próximo número RPS
    const numeroRps = config.proximo_numero_rps || 1
    console.log("[v0] Proximo numero RPS:", numeroRps, "Serie:", config.serie_rps, "Ambiente:", config.ambiente)

    // Calcular valores
    const valorServicos = Number(valor_servicos)
    const aliquota = aliquotaOverride || config.aliquota_iss || 0.05
    const issRetidoBool = iss_retido === true || iss_retido === 1 || iss_retido === "true"
    const valorIss = issRetidoBool ? 0 : (valorServicos - (valor_deducoes || 0)) * aliquota
    const valorTotal = valorServicos

    // Montar dados da NFS-e
    const dadosNfse: DadosNfse = {
      rps: {
        numero: numeroRps,
        serie: config.serie_rps || "11",
        tipo: config.tipo_rps || 1,
        dataEmissao: new Date().toISOString().split("T")[0],
        naturezaOperacao: 1, // Tributação no município
        regimeTributacao: config.regime_tributacao || 1,
        optanteSimples: config.optante_simples || 0,
        incentivadorCultural: config.incentivador_cultural || 0,
      },
      prestador: {
        cnpj: config.cnpj,
        inscricaoMunicipal: config.inscricao_municipal,
      },
      tomador: {
        tipo: tomador_tipo || "PJ",
        cpfCnpj: tomador_cpf_cnpj?.replace(/\D/g, ""),
        inscricaoMunicipal: tomador_inscricao_municipal,
        razaoSocial: tomador_razao_social,
        email: tomador_email,
        telefone: tomador_telefone,
        endereco: tomador_endereco,
        numero: tomador_numero,
        complemento: tomador_complemento,
        bairro: tomador_bairro,
        cidade: tomador_cidade,
        uf: tomador_uf,
        cep: tomador_cep,
        codigoMunicipio: tomador_codigo_municipio,
      },
      servico: {
        codigoServico: codigoServicoOverride || config.codigo_servico,
        descricao: descricao_servico || config.descricao_servico || "Servico prestado",
        codigoCnae: config.codigo_cnae,
        aliquotaIss: aliquota,
        valorServicos,
        valorDeducoes: valor_deducoes || 0,
        valorPis: valor_pis || 0,
        valorCofins: valor_cofins || 0,
        valorInss: valor_inss || 0,
        valorIr: valor_ir || 0,
        valorCsll: valor_csll || 0,
        issRetido: issRetidoBool,
      },
    }

    // Gerar XML
    const xmlEnvio = gerarXmlEnvioLoteRps([dadosNfse], numeroRps)
    console.log("[v0] XML gerado, tamanho:", xmlEnvio.length)

    // Inserir registro da nota fiscal no banco
    console.log("[v0] Inserindo nota fiscal no banco...")
    const [insertResult] = await connection.execute(
      `INSERT INTO notas_fiscais (
        numero_rps, serie_rps, tipo_rps, origem, origem_id, origem_numero,
        prestador_cnpj, prestador_inscricao_municipal,
        cliente_id, tomador_tipo, tomador_cpf_cnpj, tomador_inscricao_municipal,
        tomador_razao_social, tomador_email, tomador_telefone,
        tomador_endereco, tomador_numero, tomador_complemento,
        tomador_bairro, tomador_cidade, tomador_uf, tomador_cep, tomador_codigo_municipio,
        codigo_servico, descricao_servico, codigo_cnae,
        valor_servicos, valor_deducoes, valor_pis, valor_cofins,
        valor_inss, valor_ir, valor_csll, valor_iss, aliquota_iss,
        iss_retido, valor_total, status, xml_envio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processando', ?)`,
      [
        numeroRps, config.serie_rps || "11", config.tipo_rps || 1,
        origem, origem_id || null, origem_numero || null,
        config.cnpj, config.inscricao_municipal,
        cliente_id || null, tomador_tipo || "PJ",
        tomador_cpf_cnpj?.replace(/\D/g, ""), tomador_inscricao_municipal || null,
        tomador_razao_social, tomador_email || null, tomador_telefone || null,
        tomador_endereco || null, tomador_numero || null, tomador_complemento || null,
        tomador_bairro || null, tomador_cidade || null, tomador_uf || null,
        tomador_cep?.replace(/\D/g, "") || null, tomador_codigo_municipio || null,
        codigoServicoOverride || config.codigo_servico, descricao_servico || config.descricao_servico,
        config.codigo_cnae || null,
        valorServicos, valor_deducoes || 0, valor_pis || 0, valor_cofins || 0,
        valor_inss || 0, valor_ir || 0, valor_csll || 0, valorIss, aliquota,
        issRetidoBool ? 1 : 0, valorTotal, xmlEnvio,
      ],
    )
    const notaId = (insertResult as any).insertId
    console.log("[v0] Nota inserida no banco com ID:", notaId)

    // Enviar para a prefeitura (teste ou produção)
    console.log("[v0] Enviando para prefeitura, ambiente:", config.ambiente === 2 ? "HOMOLOGACAO" : "PRODUCAO")
    let soapResponse
    if (config.ambiente === 2) {
      // Homologação = envio de teste
      soapResponse = await testeEnvioLoteRps(
        xmlEnvio, config.ambiente, config.certificado_base64, config.certificado_senha
      )
    } else {
      soapResponse = await enviarLoteRps(
        xmlEnvio, config.ambiente, config.certificado_base64, config.certificado_senha
      )
    }

    // Registrar transmissão
    await connection.execute(
      `INSERT INTO nfse_transmissoes (nota_fiscal_id, tipo, xml_envio, xml_retorno, sucesso, codigo_erro, mensagem_erro, tempo_resposta_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        notaId,
        config.ambiente === 2 ? "teste_envio" : "envio_rps",
        xmlEnvio,
        soapResponse.xml,
        soapResponse.success ? 1 : 0,
        null,
        soapResponse.erro || null,
        soapResponse.tempoMs,
      ],
    )

    if (soapResponse.success) {
      // Extrair dados do retorno
      const dadosRetorno = extrairDadosNfseRetorno(soapResponse.xml)

      if (dadosRetorno.sucesso) {
        // Atualizar nota com dados da NFS-e emitida
        await connection.execute(
          `UPDATE notas_fiscais SET 
            numero_nfse = ?, codigo_verificacao = ?, status = 'emitida',
            data_emissao = NOW(), xml_retorno = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [dadosRetorno.numeroNfse, dadosRetorno.codigoVerificacao, soapResponse.xml, notaId],
        )

        // Incrementar número RPS
        await connection.execute(
          "UPDATE nfse_config SET proximo_numero_rps = proximo_numero_rps + 1 WHERE ativo = 1"
        )

        return NextResponse.json({
          success: true,
          message: config.ambiente === 2
            ? "NFS-e enviada em HOMOLOGACAO (teste) com sucesso!"
            : "NFS-e emitida com sucesso!",
          data: {
            id: notaId,
            numero_nfse: dadosRetorno.numeroNfse,
            codigo_verificacao: dadosRetorno.codigoVerificacao,
            numero_rps: numeroRps,
            ambiente: config.ambiente === 2 ? "homologacao" : "producao",
          },
        })
      } else {
        // Retorno com erros
        await connection.execute(
          `UPDATE notas_fiscais SET status = 'erro', mensagem_erro = ?, xml_retorno = ? WHERE id = ?`,
          [dadosRetorno.erros.join("; "), soapResponse.xml, notaId],
        )

        // Incrementar RPS mesmo com erro (para evitar conflito)
        await connection.execute(
          "UPDATE nfse_config SET proximo_numero_rps = proximo_numero_rps + 1 WHERE ativo = 1"
        )

        return NextResponse.json({
          success: false,
          message: "Erro ao emitir NFS-e: " + dadosRetorno.erros.join("; "),
          data: { id: notaId, erros: dadosRetorno.erros },
        })
      }
    } else {
      // Falha na comunicação SOAP
      await connection.execute(
        `UPDATE notas_fiscais SET status = 'erro', mensagem_erro = ?, xml_retorno = ? WHERE id = ?`,
        [soapResponse.erro, soapResponse.xml, notaId],
      )

      // Incrementar RPS
      await connection.execute(
        "UPDATE nfse_config SET proximo_numero_rps = proximo_numero_rps + 1 WHERE ativo = 1"
      )

      return NextResponse.json({
        success: false,
        message: "Erro na comunicacao com a prefeitura: " + soapResponse.erro,
        data: { id: notaId },
      })
    }
  } catch (error: any) {
    console.error("[v0] Erro ao emitir NFS-e:", error?.message || error)
    console.error("[v0] Stack:", error?.stack)
    return NextResponse.json(
      { success: false, message: "Erro interno: " + (error?.message || "Erro desconhecido") },
      { status: 500 },
    )
  } finally {
    connection.release()
  }
}
