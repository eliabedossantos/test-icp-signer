/**
 * Script para gerar um PDF de teste
 * Gera um PDF simples para testar a assinatura digital
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');

async function generateTestPDF() {
  try {
    console.log('📄 Gerando PDF de teste...');
    
    // Criar um PDF simples
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    
    // Adicionar texto simples
    page.drawText('Documento de Teste para Assinatura Digital', {
      x: 50,
      y: 750,
      size: 16,
      color: rgb(0, 0, 0)
    });
    
    page.drawText('Este é um documento de teste para verificar a funcionalidade', {
      x: 50,
      y: 720,
      size: 12,
      color: rgb(0.2, 0.2, 0.2)
    });
    
    page.drawText('de assinatura digital com certificados ICP-Brasil.', {
      x: 50,
      y: 700,
      size: 12,
      color: rgb(0.2, 0.2, 0.2)
    });
    
    page.drawText('Data: ' + new Date().toLocaleDateString('pt-BR'), {
      x: 50,
      y: 650,
      size: 10,
      color: rgb(0.4, 0.4, 0.4)
    });
    
    // Salvar PDF
    const pdfBytes = await pdfDoc.save();
    const fileName = `documento_teste_${Date.now()}.pdf`;
    const filePath = path.join('./examples', fileName);
    
    fs.writeFileSync(filePath, pdfBytes);
    
    console.log('✅ PDF de teste gerado com sucesso!');
    console.log(`📁 Arquivo salvo: ${filePath}`);
    console.log(`📊 Tamanho: ${pdfBytes.length} bytes`);
    console.log(`📄 Páginas: ${pdfDoc.getPageCount()}`);
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF de teste:', error.message);
    process.exit(1);
  }
}

generateTestPDF(); 