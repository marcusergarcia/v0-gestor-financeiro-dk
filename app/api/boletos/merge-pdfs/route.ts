import { NextRequest, NextResponse } from "next/server"
import { PDFDocument } from "pdf-lib"

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "URLs dos boletos sao obrigatorias" }, { status: 400 })
    }

    // Create a new PDF document to merge all boletos into
    const mergedPdf = await PDFDocument.create()

    // Fetch and merge each PDF
    for (const url of urls) {
      if (!url) continue

      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
        })

        if (!response.ok) {
          console.error(`Failed to fetch PDF from ${url}: ${response.status}`)
          continue
        }

        const pdfBytes = await response.arrayBuffer()

        // Load the PDF and copy all its pages
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())

        for (const page of pages) {
          mergedPdf.addPage(page)
        }
      } catch (err) {
        console.error(`Error processing PDF from ${url}:`, err)
        continue
      }
    }

    if (mergedPdf.getPageCount() === 0) {
      return NextResponse.json({ error: "Nenhum PDF pode ser carregado" }, { status: 500 })
    }

    // Generate the merged PDF
    const mergedPdfBytes = await mergedPdf.save()

    return new NextResponse(mergedPdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=boletos.pdf",
      },
    })
  } catch (error) {
    console.error("Error merging PDFs:", error)
    return NextResponse.json({ error: "Erro ao mesclar PDFs" }, { status: 500 })
  }
}
