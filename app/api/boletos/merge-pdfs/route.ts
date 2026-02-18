import { NextRequest, NextResponse } from "next/server"
import { PDFDocument } from "pdf-lib"

// Increase serverless function timeout
export const maxDuration = 60

async function fetchPdfWithRetry(url: string, retries = 2): Promise<ArrayBuffer | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000) // 15s per PDF

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/pdf",
        },
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        console.error(`[merge-pdfs] Fetch failed ${url}: status ${response.status} (attempt ${attempt + 1})`)
        if (attempt < retries) continue
        return null
      }

      const pdfBytes = await response.arrayBuffer()
      console.log(`[merge-pdfs] Fetched ${url}: ${pdfBytes.byteLength} bytes`)
      return pdfBytes
    } catch (err) {
      console.error(`[merge-pdfs] Error fetching ${url} (attempt ${attempt + 1}):`, err)
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000)) // wait 1s before retry
        continue
      }
      return null
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "URLs dos boletos sao obrigatorias" }, { status: 400 })
    }

    console.log(`[merge-pdfs] Starting merge of ${urls.length} PDFs`)

    // Fetch all PDFs in parallel for maximum speed
    const validUrls = urls.filter((u: string) => u && u.startsWith("http"))
    const pdfPromises = validUrls.map((url: string) => fetchPdfWithRetry(url))
    const pdfResults = await Promise.all(pdfPromises)

    // Create merged PDF
    const mergedPdf = await PDFDocument.create()

    let successCount = 0
    for (let i = 0; i < pdfResults.length; i++) {
      const pdfBytes = pdfResults[i]
      if (!pdfBytes) {
        console.error(`[merge-pdfs] Skipping PDF ${i + 1} - fetch failed`)
        continue
      }

      try {
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
        for (const page of pages) {
          mergedPdf.addPage(page)
        }
        successCount++
      } catch (err) {
        console.error(`[merge-pdfs] Error loading PDF ${i + 1}:`, err)
        continue
      }
    }

    console.log(`[merge-pdfs] Merged ${successCount}/${validUrls.length} PDFs, total pages: ${mergedPdf.getPageCount()}`)

    if (mergedPdf.getPageCount() === 0) {
      return NextResponse.json({ error: "Nenhum PDF pode ser carregado" }, { status: 500 })
    }

    const mergedPdfBytes = await mergedPdf.save()

    return new NextResponse(mergedPdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=boletos.pdf",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("[merge-pdfs] Error:", error)
    return NextResponse.json({ error: "Erro ao mesclar PDFs" }, { status: 500 })
  }
}
