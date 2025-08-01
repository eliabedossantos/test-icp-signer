const PDFSigner = require('../services/pdfSigner');
const CertificateManager = require('../config/certificate');
const fs = require('fs');
const path = require('path');

class PDFController {
  constructor() {
    this.pdfSigner = new PDFSigner();
    this.certificateManager = new CertificateManager();
  }

  /**
   * Assina um PDF com certificado digital ICP-Brasil
   */
  async signPDF(req, res) {
    try {
      const { files } = req;
      const {
        password,
        reason,
        location,
        contactInfo,
        signatureField,
        signaturePosition
      } = req.body;

      // Validar se os arquivos foram enviados
      if (!files || !files.pdf || !files.certificate) {
        return res.status(400).json({
          success: false,
          message: 'Arquivo PDF e certificado são obrigatórios'
        });
      }

      // Salvar certificado temporariamente
      const certFileName = `temp_cert_${Date.now()}.pfx`;
      const certPath = path.resolve('./certificates', certFileName);
      fs.writeFileSync(certPath, files.certificate[0].buffer);

      try {
        // Preparar opções de assinatura
        const signOptions = {
          certificateFile: certPath, // Caminho completo
          certificatePassword: password,
          reason,
          location,
          contactInfo,
          signatureField,
          signaturePosition
        };

        // Assinar o PDF
        const signedPdfBuffer = await this.pdfSigner.signPDF(files.pdf[0].buffer, signOptions);

        // Gerar nome do arquivo assinado
        const originalName = path.parse(files.pdf[0].originalname).name;
        const signedFileName = `${originalName}_assinado_${Date.now()}.pdf`;
        const signedPdfPath = path.join('./temp', signedFileName);

        // Salvar PDF assinado
        fs.writeFileSync(signedPdfPath, signedPdfBuffer);

        res.json({
          success: true,
          message: 'PDF assinado com sucesso',
          signedPdfPath,
          fileName: signedFileName
        });

      } finally {
        // Limpar arquivo temporário do certificado
        if (fs.existsSync(certPath)) {
          fs.unlinkSync(certPath);
        }
      }

    } catch (error) {
      console.error('Erro na assinatura do PDF:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Verifica a assinatura de um PDF
   */
  async verifySignature(req, res) {
    try {
      const { file } = req;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'Arquivo PDF é obrigatório'
        });
      }

      // Verificar assinatura
      const verificationResult = await this.pdfSigner.verifySignature(file.buffer);

      // Extrair informações da assinatura
      const signatureInfo = await this.pdfSigner.extractSignatureInfo(file.buffer);

      res.json({
        success: true,
        data: {
          verification: verificationResult,
          signatureInfo
        }
      });

    } catch (error) {
      console.error('Erro na verificação da assinatura:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Lista certificados disponíveis
   */
  async listCertificates(req, res) {
    try {
      const certificates = [];
      const certPath = this.certificateManager.certificatePath;

      if (fs.existsSync(certPath)) {
        const files = fs.readdirSync(certPath);
        
        for (const file of files) {
          const filePath = path.join(certPath, file);
          const stats = fs.statSync(filePath);
          
          if (stats.isFile() && (file.endsWith('.pfx') || file.endsWith('.pem'))) {
            certificates.push({
              filename: file,
              size: stats.size,
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime,
              type: file.endsWith('.pfx') ? 'PFX' : 'PEM'
            });
          }
        }
      }

      res.json({
        success: true,
        data: {
          certificates,
          total: certificates.length
        }
      });

    } catch (error) {
      console.error('Erro ao listar certificados:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Valida um certificado digital
   */
  async validateCertificate(req, res) {
    try {
      const { certificateFile, certificatePassword } = req.body;

      if (!certificateFile || !certificatePassword) {
        return res.status(400).json({
          success: false,
          message: 'Nome do arquivo e senha do certificado são obrigatórios'
        });
      }

      // Carregar certificado
      const certInfo = this.certificateManager.loadPFXCertificate(
        certificateFile, 
        certificatePassword
      );

      // Validar certificado
      const isValid = this.certificateManager.validateCertificateValidity(certInfo);
      const isICPBrasil = this.certificateManager.isICPBrasilCertificate(certInfo);

      res.json({
        success: true,
        data: {
          isValid,
          isICPBrasil,
          certificateInfo: {
            subject: certInfo.subject,
            issuer: certInfo.issuer,
            validFrom: certInfo.validFrom,
            validTo: certInfo.validTo
          }
        }
      });

    } catch (error) {
      console.error('Erro na validação do certificado:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Upload de certificado digital
   */
  async uploadCertificate(req, res) {
    try {
      const { file } = req;
      const { certificateType, description } = req.body;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'Arquivo de certificado é obrigatório'
        });
      }

      // Validar tipo de certificado
      if (certificateType === 'pfx' && !file.originalname.endsWith('.pfx')) {
        return res.status(400).json({
          success: false,
          message: 'Arquivo deve ter extensão .pfx para certificados PFX'
        });
      }

      if (certificateType === 'pem' && !file.originalname.endsWith('.pem')) {
        return res.status(400).json({
          success: false,
          message: 'Arquivo deve ter extensão .pem para certificados PEM'
        });
      }

      // Salvar arquivo
      const fileName = `${Date.now()}_${file.originalname}`;
      const filePath = path.join(this.certificateManager.certificatePath, fileName);
      
      fs.writeFileSync(filePath, file.buffer);

      res.json({
        success: true,
        message: 'Certificado enviado com sucesso',
        data: {
          filename: fileName,
          originalName: file.originalname,
          size: file.size,
          type: certificateType,
          description
        }
      });

    } catch (error) {
      console.error('Erro no upload do certificado:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Remove um certificado
   */
  async removeCertificate(req, res) {
    try {
      const { filename } = req.params;

      if (!filename) {
        return res.status(400).json({
          success: false,
          message: 'Nome do arquivo é obrigatório'
        });
      }

      const filePath = path.join(this.certificateManager.certificatePath, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Certificado não encontrado'
        });
      }

      // Remover arquivo
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: 'Certificado removido com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover certificado:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Informações do sistema
   */
  async getSystemInfo(req, res) {
    try {
      const certPath = this.certificateManager.certificatePath;
      const tempPath = this.pdfSigner.tempDir;

      const systemInfo = {
        version: '1.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        directories: {
          certificates: certPath,
          temp: tempPath
        },
        features: {
          supportsPFX: true,
          supportsPEM: true,
          supportsICPBrasil: true,
          supportsPAdES: true
        }
      };

      res.json({
        success: true,
        data: systemInfo
      });

    } catch (error) {
      console.error('Erro ao obter informações do sistema:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = PDFController; 