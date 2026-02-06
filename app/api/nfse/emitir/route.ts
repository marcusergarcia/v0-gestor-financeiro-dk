import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { gerarXmlEnvioLoteRps, gerarXmlConsultaNfseRps, type DadosNfse } from "@/lib/nfse/xml-builder"
import { enviarLoteRps, testeEnvioLoteRps, consultarNfse, extrairDadosNfseRetorno } from "@/lib/nfse/soap-client"

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

    console.log("[v0] SOAP Response success:", soapResponse.success)
    console.log("[v0] SOAP Response XML (primeiros 2000 chars):", soapResponse.xml.substring(0, 2000))
    console.log("[v0] SOAP Response erro:", soapResponse.erro)

    if (soapResponse.success) {
      // Extrair dados do retorno
      const dadosRetorno = extrairDadosNfseRetorno(soapResponse.xml)
      console.log("[v0] Dados retorno extraidos:", JSON.stringify(dadosRetorno))

      if (dadosRetorno.sucesso) {
        if (dadosRetorno.numeroNfse) {
          // NFS-e emitida com numero retornado (processamento sincrono)
          await connection.execute(
            `UPDATE notas_fiscais SET 
              numero_nfse = ?, codigo_verificacao = ?, status = 'emitida',
              data_emissao = NOW(), xml_retorno = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [dadosRetorno.numeroNfse, dadosRetorno.codigoVerificacao, soapResponse.xml, notaId],
          )
          // Atualizar ultima NFS-e conhecida na config
          await connection.execute(
            `UPDATE nfse_config SET ultima_nfse_numero = GREATEST(COALESCE(ultima_nfse_numero, 0), ?) WHERE ativo = 1`,
            [Number(dadosRetorno.numeroNfse)]
          )
        } else {
          // Lote aceito mas NFS-e em processamento assincrono (comum na prefeitura SP)
          await connection.execute(
            `UPDATE notas_fiscais SET 
              status = 'processando', xml_retorno = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [soapResponse.xml, notaId],
          )

          // Tentar consultar automaticamente apos 3 segundos (a prefeitura geralmente processa rapido)
          try {
            console.log("[v0] Aguardando 3s para consultar NFS-e automaticamente...")
            await new Promise((r) => setTimeout(r, 3000))

            const xmlConsulta = gerarXmlConsultaNfseRps(
              config.cnpj,
              config.inscricao_municipal,
              numeroRps,
              config.serie_rps || "11"
            )

            const consultaResponse = await consultarNfse(
              xmlConsulta,
              config.ambiente,
              config.certificado_base64,
              config.certificado_senha
            )

            // Registrar transmissao da consulta
            await connection.execute(
              `INSERT INTO nfse_transmissoes (nota_fiscal_id, tipo, xml_envio, xml_retorno, sucesso, tempo_resposta_ms)
               VALUES (?, 'consulta_auto', ?, ?, ?, ?)`,
              [notaId, xmlConsulta, consultaResponse.xml, consultaResponse.success ? 1 : 0, consultaResponse.tempoMs]
            )

            if (consultaResponse.success) {
              const dadosConsulta = extrairDadosNfseRetorno(consultaResponse.xml)
              if (dadosConsulta.sucesso && dadosConsulta.numeroNfse) {
                // NFS-e processada! Atualizar
                await connection.execute(
                  `UPDATE notas_fiscais SET 
                    numero_nfse = ?, codigo_verificacao = ?, status = 'emitida',
                    data_emissao = COALESCE(data_emissao, NOW()), xml_retorno = ?, updated_at = CURRENT_TIMESTAMP
                   WHERE id = ?`,
                  [dadosConsulta.numeroNfse, dadosConsulta.codigoVerificacao || null, consultaResponse.xml, notaId]
                )
                dadosRetorno.numeroNfse = dadosConsulta.numeroNfse
                dadosRetorno.codigoVerificacao = dadosConsulta.codigoVerificacao
                console.log("[v0] NFS-e encontrada na consulta automatica:", dadosConsulta.numeroNfse)
              }
            }
          } catch (consultaError: any) {
            console.log("[v0] Consulta automatica falhou (nao critico):", consultaError?.message)
            // Nao e critico - o usuario pode consultar manualmente
          }
        }

        // Incrementar numero RPS
        await connection.execute(
          "UPDATE nfse_config SET proximo_numero_rps = proximo_numero_rps + 1 WHERE ativo = 1"
        )

        const mensagem = dadosRetorno.numeroNfse
          ? (config.ambiente === 2
            ? `NFS-e enviada em HOMOLOGACAO com sucesso! NFS-e: ${dadosRetorno.numeroNfse}`
            : `NFS-e emitida com sucesso! Numero: ${dadosRetorno.numeroNfse}`)
          : (config.ambiente === 2
            ? "RPS enviado em HOMOLOGACAO! O lote esta em processamento. Clique em 'Consultar' para verificar o numero da NFS-e."
            : "RPS enviado com sucesso! Clique em 'Consultar na prefeitura' para obter o numero da NFS-e.")

        return NextResponse.json({
          success: true,
          message: mensagem,
          data: {
            id: notaId,
            numero_nfse: dadosRetorno.numeroNfse || null,
            codigo_verificacao: dadosRetorno.codigoVerificacao || null,
            numero_rps: numeroRps,
            serie_rps: config.serie_rps || "11",
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
      // SOAP marcou como falha, mas vamos tentar extrair dados mesmo assim
      // Pode ser que a prefeitura retornou <Erro> como alerta mas processou a nota
      console.log("[v0] SOAP retornou success=false, tentando extrair dados mesmo assim...")
      const dadosRecuperacao = extrairDadosNfseRetorno(soapResponse.xml)
      console.log("[v0] Dados recuperacao:", JSON.stringify(dadosRecuperacao))

      if (dadosRecuperacao.numeroNfse) {
        // A NFS-e FOI emitida! O SOAP marcou erro mas a nota existe
        console.log("[v0] NFS-e ENCONTRADA mesmo com SOAP success=false! Numero:", dadosRecuperacao.numeroNfse)
        await connection.execute(
          `UPDATE notas_fiscais SET 
            numero_nfse = ?, codigo_verificacao = ?, status = 'emitida',
            data_emissao = NOW(), xml_retorno = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [dadosRecuperacao.numeroNfse, dadosRecuperacao.codigoVerificacao || null, soapResponse.xml, notaId],
        )
        // Atualizar ultima NFS-e conhecida na config
        await connection.execute(
          `UPDATE nfse_config SET ultima_nfse_numero = GREATEST(COALESCE(ultima_nfse_numero, 0), ?) WHERE ativo = 1`,
          [Number(dadosRecuperacao.numeroNfse)]
        )

        await connection.execute(
          "UPDATE nfse_config SET proximo_numero_rps = proximo_numero_rps + 1 WHERE ativo = 1"
        )

        return NextResponse.json({
          success: true,
          message: `NFS-e emitida com sucesso! Numero: ${dadosRecuperacao.numeroNfse}`,
          data: {
            id: notaId,
            numero_nfse: dadosRecuperacao.numeroNfse,
            codigo_verificacao: dadosRecuperacao.codigoVerificacao || null,
            numero_rps: numeroRps,
            serie_rps: config.serie_rps || "11",
            ambiente: config.ambiente === 2 ? "homologacao" : "producao",
          },
        })
      }

      // Verificar se <Sucesso>true</Sucesso> esta no XML (SOAP pode ter errado na deteccao)
      if (dadosRecuperacao.sucesso) {
        console.log("[v0] Sucesso=true no XML apesar de SOAP success=false - tratando como processando")
        await connection.execute(
          `UPDATE notas_fiscais SET 
            status = 'processando', xml_retorno = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [soapResponse.xml, notaId],
        )

        await connection.execute(
          "UPDATE nfse_config SET proximo_numero_rps = proximo_numero_rps + 1 WHERE ativo = 1"
        )

        return NextResponse.json({
          success: true,
          message: "RPS enviado com sucesso! Clique em 'Consultar na prefeitura' para obter o numero da NFS-e.",
          data: {
            id: notaId,
            numero_rps: numeroRps,
            serie_rps: config.serie_rps || "11",
            ambiente: config.ambiente === 2 ? "homologacao" : "producao",
          },
        })
      }

      // Falha real na comunicacao SOAP
      await connection.execute(
        `UPDATE notas_fiscais SET status = 'erro', mensagem_erro = ?, xml_retorno = ? WHERE id = ?`,
        [soapResponse.erro || dadosRecuperacao.erros.join("; "), soapResponse.xml, notaId],
      )

      // Incrementar RPS
      await connection.execute(
        "UPDATE nfse_config SET proximo_numero_rps = proximo_numero_rps + 1 WHERE ativo = 1"
      )

      return NextResponse.json({
        success: false,
        message: "Erro na comunicacao com a prefeitura: " + (soapResponse.erro || dadosRecuperacao.erros.join("; ")),
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
