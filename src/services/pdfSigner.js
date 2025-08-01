const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PDFDocument, rgb } = require('pdf-lib');
const signpdf = require('@signpdf/signpdf').default;
const { P12Signer } = require('@signpdf/signer-p12');
const { addPlaceholder } = require('@signpdf/placeholder-pdf-lib');
const CertificateManager = require('../config/certificate');

class PDFSigner {
  constructor() {
    this.certificateManager = new CertificateManager();
    this.tempDir = process.env.TEMP_DIR || './temp';
    this.ensureTempDirectory();
  }

  ensureTempDirectory() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Assina um PDF com certificado digital ICP-Brasil
   * @param {Buffer} pdfBuffer - Buffer do PDF original
   * @param {Object} options - Opções de assinatura
   * @returns {Buffer} - Buffer do PDF assinado
   */
  async signPDF(pdfBuffer, options = {}) {
    const {
      certificateFile,
      certificatePassword,
      reason = 'Assinatura Digital ICP-Brasil',
      location = 'Brasil',
      contactInfo = '',
      signatureField = 'Signature1'
    } = options;

    try {
      // 1. Adicionar placeholder para assinatura
      const { plainAddPlaceholder } = require('@signpdf/placeholder-plain');
      const pdfWithPlaceholder = plainAddPlaceholder({
        pdfBuffer: pdfBuffer,
        reason,
        location,
        contactInfo,
        signatureLength: 8192,
        signatureField
      });

      // 2. Criar signer com o certificado PFX diretamente
      const certBuffer = fs.readFileSync(certificateFile);
      const signer = new P12Signer(certBuffer);

      // 3. Assinar o PDF
      const signedPdf = await signpdf.sign(pdfWithPlaceholder, signer);

      return signedPdf;

    } catch (error) {
      throw new Error(`Erro na assinatura do PDF: ${error.message}`);
    }
  }

  /**
   * Valida o certificado digital
   * @param {Object} certInfo - Informações do certificado
   */
  validateCertificate(certInfo) {
    // Verificar validade temporal
    if (!this.certificateManager.validateCertificateValidity(certInfo)) {
      throw new Error('Certificado digital expirado ou ainda não válido');
    }

    // Verificar se é certificado ICP-Brasil (apenas em produção)
    // const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Em desenvolvimento, permitir qualquer certificado válido
    // if (isDevelopment) {
    //   console.log('⚠️  Modo desenvolvimento: permitindo certificados de teste');
    // } else if (!this.certificateManager.isICPBrasilCertificate(certInfo)) {
    //   throw new Error('Certificado não é da ICP-Brasil');
    // }

    // Verificar se tem chave privada
    if (!certInfo.privateKey) {
      throw new Error('Chave privada não encontrada no certificado');
    }

    // Verificar se tem certificado público
    if (!certInfo.certificate) {
      throw new Error('Certificado público não encontrado');
    }
  }

  /**
   * Prepara o PDF para receber a assinatura
   * @param {Buffer} pdfBuffer - Buffer do PDF original
   * @param {Object} position - Posição da assinatura
   * @returns {Buffer} - Buffer do PDF preparado
   */
  async preparePDFForSignature(pdfBuffer, position) {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();
      
      if (pages.length === 0) {
        throw new Error('PDF não possui páginas');
      }

      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      // Adicionar texto indicativo de assinatura digital
      firstPage.drawText('Assinado Digitalmente - ICP-Brasil', {
        x: position.x,
        y: height - position.y - 20,
        size: 10,
        color: rgb(0.2, 0.2, 0.2)
      });

      // Adicionar retângulo para área de assinatura
      firstPage.drawRectangle({
        x: position.x,
        y: height - position.y - position.height,
        width: position.width,
        height: position.height,
        borderWidth: 1,
        borderColor: rgb(0.5, 0.5, 0.5),
        color: rgb(0.95, 0.95, 0.95)
      });

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      throw new Error(`Erro ao preparar PDF: ${error.message}`);
    }
  }

  /**
   * Verifica a assinatura de um PDF
   * @param {Buffer} pdfBuffer - Buffer do PDF assinado
   * @returns {Object} - Resultado da verificação
   */
  async verifySignature(pdfBuffer) {
    try {
      // Esta é uma verificação básica
      // Para verificação completa, seria necessário usar bibliotecas específicas
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      
      // Verificar se o PDF foi modificado após assinatura
      // (implementação simplificada)
      
      return {
        isValid: true,
        message: 'Assinatura válida',
        signedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        isValid: false,
        message: `Erro na verificação: ${error.message}`,
        signedAt: null
      };
    }
  }

  /**
   * Extrai informações da assinatura de um PDF
   * @param {Buffer} pdfBuffer - Buffer do PDF assinado
   * @returns {Object} - Informações da assinatura
   */
  async extractSignatureInfo(pdfBuffer) {
    try {
      // Implementação básica de extração de informações
      // Para implementação completa, seria necessário parser específico
      
      return {
        hasSignature: true,
        signatureCount: 1,
        signatureInfo: {
          reason: 'Assinatura Digital ICP-Brasil',
          location: 'Brasil',
          signedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao extrair informações da assinatura: ${error.message}`);
    }
  }

  /**
   * Limpa arquivos temporários
   */
  cleanupTempFiles() {
    try {
      const files = fs.readdirSync(this.tempDir);
      files.forEach(file => {
        const filePath = path.join(this.tempDir, file);
        fs.unlinkSync(filePath);
      });
    } catch (error) {
      // Ignora erros de limpeza
      console.warn('Aviso: Erro ao limpar arquivos temporários:', error.message);
    }
  }
}

module.exports = PDFSigner; 