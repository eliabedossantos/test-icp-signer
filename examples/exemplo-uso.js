/**
 * Exemplo Prático de Uso da API de Assinatura Digital ICP-Brasil
 * 
 * Este script demonstra como usar a API para:
 * 1. Fazer upload de um certificado digital
 * 2. Validar o certificado
 * 3. Assinar um PDF
 * 4. Verificar a assinatura
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api/pdf';

class ExemploAssinaturaDigital {
  constructor() {
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000
    });
  }

  /**
   * Exemplo 1: Verificar se a API está funcionando
   */
  async verificarAPI() {
    console.log('🔍 Verificando se a API está funcionando...');
    
    try {
      const response = await this.axios.get('/health');
      console.log('✅ API está funcionando!');
      console.log(`📋 Versão: ${response.data.version}`);
      console.log(`⏰ Timestamp: ${response.data.timestamp}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao conectar com a API:', error.message);
      return false;
    }
  }

  /**
   * Exemplo 2: Listar certificados disponíveis
   */
  async listarCertificados() {
    console.log('\n📋 Listando certificados disponíveis...');
    
    try {
      const response = await this.axios.get('/certificates');
      
      if (response.data.success) {
        const { certificates, total } = response.data.data;
        
        if (total === 0) {
          console.log('⚠️  Nenhum certificado encontrado');
          console.log('💡 Execute: npm run generate-test-cert');
          return [];
        }
        
        console.log(`📊 Total de certificados: ${total}`);
        certificates.forEach((cert, index) => {
          console.log(`${index + 1}. ${cert.filename} (${cert.type}) - ${cert.size} bytes`);
        });
        
        return certificates;
      }
    } catch (error) {
      console.error('❌ Erro ao listar certificados:', error.message);
      return [];
    }
  }

  /**
   * Exemplo 3: Fazer upload de um certificado
   */
  async fazerUploadCertificado(caminhoCertificado, tipo = 'pfx', descricao = '') {
    console.log(`\n📤 Fazendo upload do certificado: ${caminhoCertificado}`);
    
    if (!fs.existsSync(caminhoCertificado)) {
      console.error('❌ Arquivo de certificado não encontrado');
      console.log('💡 Certifique-se de que o arquivo existe e o caminho está correto');
      console.log('💡 Execute: npm run generate-test-cert');
      return false;
    }

    try {
      const formData = new FormData();
      formData.append('certificate', fs.createReadStream(caminhoCertificado));
      formData.append('certificateType', tipo);
      formData.append('description', descricao);

      const response = await this.axios.post('/certificates/upload', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      if (response.data.success) {
        console.log('✅ Certificado enviado com sucesso!');
        console.log(`📁 Nome do arquivo: ${response.data.data.filename}`);
        console.log(`📊 Tamanho: ${response.data.data.size} bytes`);
        console.log(`📋 Tipo: ${response.data.data.type}`);
        return response.data.data.filename;
      }
    } catch (error) {
      console.error('❌ Erro no upload do certificado:', error.message);
      if (error.response?.data?.message) {
        console.error('📝 Detalhes:', error.response.data.message);
      }
      return false;
    }
  }

  /**
   * Exemplo 4: Validar um certificado
   */
  async validarCertificado(nomeArquivo, senha) {
    console.log(`\n🔍 Validando certificado: ${nomeArquivo}`);
    
    try {
      const response = await this.axios.post('/certificates/validate', {
        certificateFile: nomeArquivo,
        certificatePassword: senha
      });

      if (response.data.success) {
        const { isValid, isICPBrasil, certificateInfo } = response.data.data;
        
        console.log(`✅ Certificado válido: ${isValid ? 'SIM' : 'NÃO'}`);
        console.log(`🇧🇷 ICP-Brasil: ${isICPBrasil ? 'SIM' : 'NÃO'}`);
        
        if (certificateInfo.subject) {
          console.log(`👤 Sujeito: ${certificateInfo.subject.commonName || 'N/A'}`);
          console.log(`🏢 Organização: ${certificateInfo.subject.organizationName || 'N/A'}`);
        }
        
        if (certificateInfo.issuer) {
          console.log(`🏢 Emissor: ${certificateInfo.issuer.organizationName || 'N/A'}`);
        }
        
        console.log(`📅 Válido de: ${certificateInfo.validFrom}`);
        console.log(`📅 Válido até: ${certificateInfo.validTo}`);
        
        if (!isValid) {
          console.log('⚠️  Certificado não é válido ou está expirado');
        }
        
        if (!isICPBrasil) {
          console.log('⚠️  Certificado não é da ICP-Brasil (esperado para certificado de teste)');
        }
        
        return isValid; // Para certificado de teste, aceitamos mesmo não sendo ICP-Brasil
      }
    } catch (error) {
      console.error('❌ Erro ao validar certificado:', error.message);
      if (error.response?.data?.message) {
        console.error('📝 Detalhes:', error.response.data.message);
      }
      return false;
    }
  }

  /**
   * Exemplo 5: Assinar um PDF
   */
  async assinarPDF(caminhoPDF, nomeCertificado, senhaCertificado, opcoes = {}) {
    console.log(`\n✍️  Assinando PDF: ${caminhoPDF}`);
    
    if (!fs.existsSync(caminhoPDF)) {
      console.error('❌ Arquivo PDF não encontrado');
      console.log('💡 Certifique-se de que o arquivo existe e o caminho está correto');
      console.log('💡 Execute: npm run generate-test-pdf');
      return false;
    }

    try {
      const formData = new FormData();
      formData.append('pdf', fs.createReadStream(caminhoPDF));
      formData.append('certificateFile', nomeCertificado);
      formData.append('certificatePassword', senhaCertificado);
      
      // Opções opcionais
      if (opcoes.motivo) formData.append('reason', opcoes.motivo);
      if (opcoes.local) formData.append('location', opcoes.local);
      if (opcoes.contato) formData.append('contactInfo', opcoes.contato);

      const response = await this.axios.post('/sign', formData, {
        headers: {
          ...formData.getHeaders()
        },
        responseType: 'arraybuffer'
      });

      // Salvar PDF assinado
      const nomeOriginal = path.parse(caminhoPDF).name;
      const caminhoAssinado = `${nomeOriginal}_assinado_${Date.now()}.pdf`;
      fs.writeFileSync(caminhoAssinado, response.data);
      
      console.log('✅ PDF assinado com sucesso!');
      console.log(`📁 Arquivo salvo: ${caminhoAssinado}`);
      console.log(`📊 Tamanho: ${response.data.length} bytes`);
      
      return caminhoAssinado;
    } catch (error) {
      console.error('❌ Erro ao assinar PDF:', error.message);
      if (error.response?.data) {
        try {
          const errorData = JSON.parse(error.response.data.toString());
          console.error('📝 Detalhes:', errorData.message);
        } catch {
          console.error('📝 Detalhes:', error.response.data.toString());
        }
      }
      return false;
    }
  }

  /**
   * Exemplo 6: Verificar assinatura de um PDF
   */
  async verificarAssinatura(caminhoPDF) {
    console.log(`\n🔍 Verificando assinatura: ${caminhoPDF}`);
    
    if (!fs.existsSync(caminhoPDF)) {
      console.error('❌ Arquivo PDF não encontrado');
      return false;
    }

    try {
      const formData = new FormData();
      formData.append('pdf', fs.createReadStream(caminhoPDF));

      const response = await this.axios.post('/verify', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      if (response.data.success) {
        const { verification, signatureInfo } = response.data.data;
        
        console.log(`✅ Assinatura válida: ${verification.isValid ? 'SIM' : 'NÃO'}`);
        console.log(`📝 Mensagem: ${verification.message}`);
        console.log(`⏰ Assinado em: ${verification.signedAt}`);
        
        if (signatureInfo.hasSignature) {
          console.log(`📊 Número de assinaturas: ${signatureInfo.signatureCount}`);
          console.log(`📋 Motivo: ${signatureInfo.signatureInfo.reason}`);
          console.log(`📍 Local: ${signatureInfo.signatureInfo.location}`);
        }
        
        return verification.isValid;
      }
    } catch (error) {
      console.error('❌ Erro ao verificar assinatura:', error.message);
      return false;
    }
  }

  /**
   * Exemplo 7: Fluxo completo de assinatura
   */
  async executarFluxoCompleto() {
    console.log('🚀 Iniciando fluxo completo de assinatura digital\n');
    
    // 1. Verificar se a API está funcionando
    const apiFuncionando = await this.verificarAPI();
    if (!apiFuncionando) {
      console.log('❌ Não foi possível conectar com a API. Encerrando.');
      return;
    }

    // 2. Listar certificados existentes
    const certificados = await this.listarCertificados();
    
    let nomeCertificado = null;
    
    // 3. Se não houver certificados, procurar por certificado de teste
    if (certificados.length === 0) {
      console.log('\n📤 Nenhum certificado encontrado. Procurando certificado de teste...');
      
      // Procurar por certificado de teste no diretório certificates
      const certDir = './certificates';
      if (fs.existsSync(certDir)) {
        const files = fs.readdirSync(certDir);
        const testCertPfx = files.find(file => file.endsWith('.pfx') && file.includes('teste'));
        
        if (testCertPfx) {
          console.log(`📋 Encontrado certificado PFX de teste: ${testCertPfx}`);
          nomeCertificado = testCertPfx;
        } else {
          console.log('❌ Certificado de teste PFX não encontrado.');
          console.log('💡 Execute: npm run generate-test-cert');
          return;
        }
      } else {
        console.log('❌ Diretório de certificados não encontrado.');
        console.log('💡 Execute: npm run generate-test-cert');
        return;
      }
    } else {
      // Usar o primeiro certificado PFX da lista
      const pfxCert = certificados.find(cert => cert.type === 'PFX');
      if (pfxCert) {
        nomeCertificado = pfxCert.filename;
        console.log(`\n📋 Usando certificado PFX: ${nomeCertificado}`);
      } else {
        console.log('❌ Nenhum certificado PFX encontrado.');
        console.log('💡 Execute: npm run generate-test-cert');
        return;
      }
    }

    // 4. Validar certificado
    const senhaCertificado = 'senha_teste'; // Senha padrão do certificado de teste
    const certificadoValido = await this.validarCertificado(nomeCertificado, senhaCertificado);
    
    if (!certificadoValido) {
      console.log('❌ Certificado inválido. Verifique a senha.');
      return;
    }

    // 5. Procurar PDF de teste
    console.log('\n📄 Procurando PDF de teste...');
    const examplesDir = './examples';
    let caminhoPDF = null;
    
    if (fs.existsSync(examplesDir)) {
      const files = fs.readdirSync(examplesDir);
      const testPdf = files.find(file => file.endsWith('.pdf') && file.includes('teste'));
      
      if (testPdf) {
        caminhoPDF = path.join(examplesDir, testPdf);
        console.log(`📄 Encontrado PDF de teste: ${testPdf}`);
      } else {
        console.log('❌ PDF de teste não encontrado.');
        console.log('💡 Execute: npm run generate-test-pdf');
        return;
      }
    } else {
      console.log('❌ Diretório de exemplos não encontrado.');
      console.log('💡 Execute: npm run generate-test-pdf');
      return;
    }
    
    // 6. Assinar PDF
    const opcoesAssinatura = {
      motivo: 'Assinatura Digital ICP-Brasil - Exemplo de Teste',
      local: 'Brasil',
      contato: 'teste@empresa.com.br'
    };
    
    const pdfAssinado = await this.assinarPDF(
      caminhoPDF, 
      nomeCertificado, 
      senhaCertificado, 
      opcoesAssinatura
    );
    
    if (!pdfAssinado) {
      console.log('❌ Falha na assinatura do PDF. Encerrando.');
      return;
    }

    // 7. Verificar assinatura
    await this.verificarAssinatura(pdfAssinado);

    console.log('\n✅ Fluxo completo finalizado com sucesso!');
    console.log('📁 PDF assinado salvo como:', pdfAssinado);
  }
}

// Função principal para executar os exemplos
async function main() {
  const exemplo = new ExemploAssinaturaDigital();
  
  console.log('=' * 60);
  console.log('📚 EXEMPLOS DE USO - API DE ASSINATURA DIGITAL ICP-BRASIL');
  console.log('=' * 60);
  
  // Executar fluxo completo
  await exemplo.executarFluxoCompleto();
  
  console.log('\n' + '=' * 60);
  console.log('📖 Para mais informações, consulte a documentação:');
  console.log('🌐 http://localhost:3000/api/pdf/system-info');
  console.log('📄 README.md ou README-PT.md');
  console.log('=' * 60);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ExemploAssinaturaDigital; 