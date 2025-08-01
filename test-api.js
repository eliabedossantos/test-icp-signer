const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

async function testAPI() {
  console.log('🧪 Testando API de assinatura...');
  
  try {
    const certDir = './certificates';
    if (!fs.existsSync(certDir)) {
      console.log('❌ Diretório de certificados não encontrado');
      return;
    }
    
    const files = fs.readdirSync(certDir);
    const pfxFiles = files.filter(file => file.endsWith('.pfx'));
    
    if (pfxFiles.length === 0) {
      console.log('❌ Nenhum certificado PFX encontrado');
      console.log('💡 Execute: npm run generate-test-cert');
      return;
    }
    
    const latestCert = pfxFiles.sort().pop();
    const certPath = path.join(certDir, latestCert);
    
    console.log(`📋 Usando certificado: ${latestCert}`);
    
    const pdfPath = './examples/pdfServico_57952bf8ca7af_24-07-2016_17-58-32.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ PDF  não encontrado');
      console.log('💡 Verifique se o arquivo existe em: examples/pdfServico_57952bf8ca7af_24-07-2016_17-58-32.pdf');
      return;
    }
    
    console.log(`📄 Usando PDF real: pdfServico_57952bf8ca7af_24-07-2016_17-58-32.pdf`);
    console.log(`🔐 Senha do certificado: senha_teste`);
    
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));
    form.append('certificate', fs.createReadStream(certPath));
    form.append('password', 'senha_teste');
    form.append('reason', 'Teste de Assinatura Digital com PDF Real');
    form.append('location', 'Brasil');
    
    console.log(`📊 Tamanho do certificado: ${fs.statSync(certPath).size} bytes`);
    console.log(`📊 Tamanho do PDF: ${fs.statSync(pdfPath).size} bytes`);
    
    // Fazer requisição
    const response = await axios.post('http://localhost:3000/api/pdf/sign', form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 30000
    });
    
    if (response.data.success) {
      console.log('✅ PDF assinado com sucesso!');
      console.log(`📁 Arquivo salvo: ${response.data.signedPdfPath}`);
    } else {
      console.log('❌ Erro na assinatura:', response.data.message);
    }
    
  } catch (error) {
    console.log('❌ Erro na API:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Status Text: ${error.response.statusText}`);
      console.log(`Resposta: ${JSON.stringify(error.response.data)}`);
    }
    console.log(`Mensagem: ${error.message}`);
  }
}

testAPI(); 