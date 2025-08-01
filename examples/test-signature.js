const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

/**
 * Exemplo de uso da API de Assinatura Digital ICP-Brasil
 * 
 * Este script demonstra como:
 * 1. Fazer upload de um certificado
 * 2. Assinar um PDF
 * 3. Verificar a assinatura
 */

const API_BASE_URL = 'http://localhost:3000/api/pdf';

class PDFSignatureExample {
  constructor() {
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000
    });
  }

  /**
   * Testa a conectividade com a API
   */
  async testConnection() {
    try {
      console.log('🔍 Testando conectividade com a API...');
      
      const response = await this.axios.get('/health');
      
      if (response.data.success) {
        console.log('✅ API está funcionando corretamente');
        console.log(`📋 Versão: ${response.data.version}`);
        console.log(`⏰ Timestamp: ${response.data.timestamp}`);
        return true;
      } else {
        console.log('❌ API retornou erro');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao conectar com a API:', error.message);
      return false;
    }
  }

  /**
   * Lista certificados disponíveis
   */
  async listCertificates() {
    try {
      console.log('\n📋 Listando certificados disponíveis...');
      
      const response = await this.axios.get('/certificates');
      
      if (response.data.success) {
        const { certificates, total } = response.data.data;
        
        if (total === 0) {
          console.log('⚠️  Nenhum certificado encontrado');
          return [];
        }
        
        console.log(`📊 Total de certificados: ${total}`);
        certificates.forEach((cert, index) => {
          console.log(`${index + 1}. ${cert.filename} (${cert.type}) - ${cert.size} bytes`);
        });
        
        return certificates;
      } else {
        console.log('❌ Erro ao listar certificados');
        return [];
      }
    } catch (error) {
      console.error('❌ Erro ao listar certificados:', error.message);
      return [];
    }
  }

  /**
   * Faz upload de um certificado
   */
  async uploadCertificate(certificatePath, certificateType = 'pfx', description = '') {
    try {
      console.log(`\n📤 Fazendo upload do certificado: ${certificatePath}`);
      
      if (!fs.existsSync(certificatePath)) {
        console.error('❌ Arquivo de certificado não encontrado');
        return false;
      }

      const formData = new FormData();
      formData.append('certificate', fs.createReadStream(certificatePath));
      formData.append('certificateType', certificateType);
      formData.append('description', description);

      const response = await this.axios.post('/certificates/upload', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      if (response.data.success) {
        console.log('✅ Certificado enviado com sucesso');
        console.log(`📁 Nome do arquivo: ${response.data.data.filename}`);
        return response.data.data.filename;
      } else {
        console.log('❌ Erro ao enviar certificado');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro no upload do certificado:', error.message);
      return false;
    }
  }

  /**
   * Valida um certificado
   */
  async validateCertificate(certificateFile, certificatePassword) {
    try {
      console.log(`\n🔍 Validando certificado: ${certificateFile}`);
      
      const response = await this.axios.post('/certificates/validate', {
        certificateFile,
        certificatePassword
      });

      if (response.data.success) {
        const { isValid, isICPBrasil, certificateInfo } = response.data.data;
        
        console.log(`✅ Certificado válido: ${isValid}`);
        console.log(`🇧🇷 ICP-Brasil: ${isICPBrasil}`);
        
        if (certificateInfo.subject) {
          console.log(`👤 Sujeito: ${certificateInfo.subject.commonName || 'N/A'}`);
        }
        
        if (certificateInfo.issuer) {
          console.log(`🏢 Emissor: ${certificateInfo.issuer.organizationName || 'N/A'}`);
        }
        
        console.log(`📅 Válido de: ${certificateInfo.validFrom}`);
        console.log(`📅 Válido até: ${certificateInfo.validTo}`);
        
        return isValid && isICPBrasil;
      } else {
        console.log('❌ Erro na validação do certificado');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao validar certificado:', error.message);
      return false;
    }
  }

  /**
   * Assina um PDF
   */
  async signPDF(pdfPath, certificateFile, certificatePassword, options = {}) {
    try {
      console.log(`\n✍️  Assinando PDF: ${pdfPath}`);
      
      if (!fs.existsSync(pdfPath)) {
        console.error('❌ Arquivo PDF não encontrado');
        return false;
      }

      const formData = new FormData();
      formData.append('pdf', fs.createReadStream(pdfPath));
      formData.append('certificateFile', certificateFile);
      formData.append('certificatePassword', certificatePassword);
      
      // Opções opcionais
      if (options.reason) formData.append('reason', options.reason);
      if (options.location) formData.append('location', options.location);
      if (options.contactInfo) formData.append('contactInfo', options.contactInfo);

      const response = await this.axios.post('/sign', formData, {
        headers: {
          ...formData.getHeaders()
        },
        responseType: 'arraybuffer'
      });

      // Salvar PDF assinado
      const outputPath = pdfPath.replace('.pdf', '_assinado.pdf');
      fs.writeFileSync(outputPath, response.data);
      
      console.log('✅ PDF assinado com sucesso');
      console.log(`📁 Arquivo salvo: ${outputPath}`);
      
      return outputPath;
    } catch (error) {
      console.error('❌ Erro ao assinar PDF:', error.message);
      return false;
    }
  }

  /**
   * Verifica a assinatura de um PDF
   */
  async verifySignature(pdfPath) {
    try {
      console.log(`\n🔍 Verificando assinatura: ${pdfPath}`);
      
      if (!fs.existsSync(pdfPath)) {
        console.error('❌ Arquivo PDF não encontrado');
        return false;
      }

      const formData = new FormData();
      formData.append('pdf', fs.createReadStream(pdfPath));

      const response = await this.axios.post('/verify', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      if (response.data.success) {
        const { verification, signatureInfo } = response.data.data;
        
        console.log(`✅ Assinatura válida: ${verification.isValid}`);
        console.log(`📝 Mensagem: ${verification.message}`);
        console.log(`⏰ Assinado em: ${verification.signedAt}`);
        
        if (signatureInfo.hasSignature) {
          console.log(`📊 Número de assinaturas: ${signatureInfo.signatureCount}`);
          console.log(`📋 Motivo: ${signatureInfo.signatureInfo.reason}`);
          console.log(`📍 Local: ${signatureInfo.signatureInfo.location}`);
        }
        
        return verification.isValid;
      } else {
        console.log('❌ Erro na verificação da assinatura');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao verificar assinatura:', error.message);
      return false;
    }
  }

  /**
   * Executa um teste completo
   */
  async runCompleteTest() {
    console.log('🚀 Iniciando teste completo da API de Assinatura Digital ICP-Brasil\n');
    
    // 1. Testar conectividade
    const isConnected = await this.testConnection();
    if (!isConnected) {
      console.log('❌ Não foi possível conectar com a API. Encerrando teste.');
      return;
    }

    // 2. Listar certificados
    const certificates = await this.listCertificates();
    
    // 3. Se não houver certificados, fazer upload de um exemplo
    let certificateFile = null;
    if (certificates.length === 0) {
      console.log('\n⚠️  Nenhum certificado encontrado. Você precisa fazer upload de um certificado primeiro.');
      console.log('💡 Use o método uploadCertificate() para adicionar um certificado.');
      return;
    } else {
      certificateFile = certificates[0].filename;
    }

    // 4. Validar certificado (assumindo senha padrão para teste)
    const certificatePassword = 'senha_teste'; // ⚠️ Altere para a senha real
    const isValid = await this.validateCertificate(certificateFile, certificatePassword);
    
    if (!isValid) {
      console.log('❌ Certificado inválido. Verifique a senha e se é um certificado ICP-Brasil válido.');
      return;
    }

    // 5. Assinar PDF (assumindo que existe um PDF de teste)
    const testPdfPath = './examples/test-document.pdf';
    if (fs.existsSync(testPdfPath)) {
      const signedPdfPath = await this.signPDF(testPdfPath, certificateFile, certificatePassword, {
        reason: 'Teste de Assinatura Digital ICP-Brasil',
        location: 'Brasil'
      });
      
      if (signedPdfPath) {
        // 6. Verificar assinatura
        await this.verifySignature(signedPdfPath);
      }
    } else {
      console.log('\n⚠️  Arquivo de teste não encontrado. Crie um arquivo PDF em ./examples/test-document.pdf para testar a assinatura.');
    }

    console.log('\n✅ Teste completo finalizado!');
  }
}

// Executar exemplo se chamado diretamente
if (require.main === module) {
  const example = new PDFSignatureExample();
  example.runCompleteTest().catch(console.error);
}

module.exports = PDFSignatureExample; 