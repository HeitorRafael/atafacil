const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

function buildAtaHTML(ataTexto, dadosReuniao) {
  const paragraphs = ataTexto
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<p>${line.trim()}</p>`)
    .join('\n');

  const dataFormatada = new Date(dadosReuniao.dataReuniao + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ata de Assembleia — ${dadosReuniao.condominioNome}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      background: #fff;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 2.5cm 2cm 2.5cm 3cm;
      position: relative;
    }

    .header {
      text-align: center;
      margin-bottom: 2em;
      border-bottom: 2px solid #000;
      padding-bottom: 1em;
    }

    .header h1 {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 0.3em;
    }

    .header h2 {
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
    }

    .header p {
      font-size: 11pt;
      margin-top: 0.3em;
    }

    .content p {
      text-indent: 1.25cm;
      margin-bottom: 0.8em;
      text-align: justify;
    }

    .footer {
      position: fixed;
      bottom: 1cm;
      left: 3cm;
      right: 2cm;
      text-align: center;
      font-size: 9pt;
      color: #666;
      border-top: 1px solid #ccc;
      padding-top: 0.3em;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>${dadosReuniao.condominioNome}</h1>
      <h2>Ata de ${dadosReuniao.tipoAssembleia === 'AGO' ? 'Assembleia Geral Ordinária' : 'Assembleia Geral Extraordinária'}</h2>
      <p>${dataFormatada}</p>
    </div>

    <div class="content">
      ${paragraphs}
    </div>
  </div>

  <div class="footer">
    Documento gerado pelo AtaFácil &nbsp;|&nbsp; ${dadosReuniao.condominioNome}
  </div>
</body>
</html>`;
}

async function generatePDF(ataTexto, dadosReuniao) {
  const outputDir = process.env.PDF_OUTPUT_DIR || './data/pdfs';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `ata_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`;
  const outputPath = path.join(outputDir, filename);

  const html = buildAtaHTML(ataTexto, dadosReuniao);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new',
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '2.5cm', bottom: '2.5cm', left: '3cm', right: '2cm' },
      printBackground: true,
      displayHeaderFooter: false,
    });

    fs.writeFileSync(outputPath, pdfBuffer);

    return { path: outputPath, filename, buffer: pdfBuffer };
  } finally {
    await browser.close();
  }
}

module.exports = { generatePDF };
