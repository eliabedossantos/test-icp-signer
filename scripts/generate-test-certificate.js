/**
 * Script para gerar certificado de teste auto-assinado
 * ⚠️ ATENÇÃO: Este certificado NÃO é válido para uso em produção
 * ⚠️ Use apenas para desenvolvimento e testes
 */

const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

class TestCertificateGenerator {
  constructor() {
    this.certificatesDir = './certificates';
    this.ensureDirectory();
  }

  ensureDirectory() {
    if (!fs.existsSync(this.certificatesDir)) {
      fs.mkdirSync(this.certificatesDir, { recursive: true });
    }
  }

  /**
   * Gera um certificado de teste auto-assinado
   */
  generateTestCertificate() {
    console.log('🔧 Gerando certificado de teste auto-assinado...');
    console.log('⚠️  ATENÇÃO: Este certificado NÃO é válido para uso em produção!');
    console.log('⚠️  Use apenas para desenvolvimento e testes!\n');

    try {
      // Gerar par de chaves RSA
      const keys = forge.pki.rsa.generateKeyPair(2048);
      
      // Criar certificado
      const cert = forge.pki.createCertificate();
      
      // Definir chave pública
      cert.publicKey = keys.publicKey;
      
      // Definir número de série
      cert.serialNumber = '01';
      
      // Definir período de validade (1 ano)
      const now = new Date();
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(now.getFullYear() + 1);
      
      cert.validity.notBefore = now;
      cert.validity.notAfter = oneYearFromNow;
      
      // Definir atributos do sujeito
      const attrs = [
        { name: 'commonName', value: 'Teste Assinador ICP-Brasil' },
        { name: 'countryName', value: 'BR' },
        { name: 'stateOrProvinceName', value: 'São Paulo' },
        { name: 'localityName', value: 'São Paulo' },
        { name: 'organizationName', value: 'Empresa de Teste LTDA' },
        { name: 'organizationalUnitName', value: 'TI' },
        { name: 'emailAddress', value: 'teste@empresa.com.br' }
      ];
      
      cert.setSubject(attrs);
      cert.setIssuer(attrs); // Auto-assinado
      
      // Definir extensões
      cert.setExtensions([
        {
          name: 'basicConstraints',
          cA: true
        },
        {
          name: 'keyUsage',
          keyCertSign: true,
          digitalSignature: true,
          nonRepudiation: true,
          keyEncipherment: true,
          dataEncipherment: true
        },
        {
          name: 'extKeyUsage',
          serverAuth: true,
          clientAuth: true
        },
        {
          name: 'subjectAltName',
          altNames: [
            {
              type: 6, // URI
              value: 'http://localhost'
            }
          ]
        }
      ]);
      
      // Assinar o certificado
      cert.sign(keys.privateKey, forge.md.sha256.create());
      
      // Converter para formatos diferentes
      const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
      const certificatePem = forge.pki.certificateToPem(cert);
      
      // Criar arquivo PFX/P12
      const p12 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], 'senha_teste');
      const p12Der = forge.asn1.toDer(p12).getBytes();
      
      // Salvar arquivos
      const timestamp = Date.now();
      const baseName = `teste_certificado_${timestamp}`;
      
      // Salvar certificado PEM
      const certPemPath = path.join(this.certificatesDir, `${baseName}.pem`);
      fs.writeFileSync(certPemPath, certificatePem);
      
      // Salvar chave privada PEM
      const keyPemPath = path.join(this.certificatesDir, `${baseName}_key.pem`);
      fs.writeFileSync(keyPemPath, privateKeyPem);
      
      // Salvar certificado PFX
      const certPfxPath = path.join(this.certificatesDir, `${baseName}.pfx`);
      fs.writeFileSync(certPfxPath, p12Der, 'binary');
      
      console.log('✅ Certificado de teste gerado com sucesso!');
      console.log('\n📁 Arquivos criados:');
      console.log(`   📄 Certificado PEM: ${certPemPath}`);
      console.log(`   🔑 Chave privada PEM: ${keyPemPath}`);
      console.log(`   📦 Certificado PFX: ${certPfxPath}`);
      
      console.log('\n🔐 Informações do certificado:');
      console.log(`   👤 Sujeito: ${cert.subject.attributes.find(attr => attr.name === 'commonName')?.value}`);
      console.log(`   🏢 Organização: ${cert.subject.attributes.find(attr => attr.name === 'organizationName')?.value}`);
      console.log(`   📧 Email: ${cert.subject.attributes.find(attr => attr.name === 'emailAddress')?.value}`);
      console.log(`   📅 Válido de: ${cert.validity.notBefore}`);
      console.log(`   📅 Válido até: ${cert.validity.notAfter}`);
      
      console.log('\n🔑 Credenciais para teste:');
      console.log(`   📁 Arquivo PFX: ${baseName}.pfx`);
      console.log(`   🔐 Senha: senha_teste`);
      
      console.log('\n⚠️  IMPORTANTE:');
      console.log('   - Este certificado NÃO é da ICP-Brasil');
      console.log('   - Use apenas para desenvolvimento');
      console.log('   - Não use em produção');
      console.log('   - Para uso real, obtenha um certificado ICP-Brasil válido');
      
      return {
        pfxFile: `${baseName}.pfx`,
        password: 'senha_teste',
        certificateInfo: {
          subject: cert.subject.attributes.find(attr => attr.name === 'commonName')?.value,
          organization: cert.subject.attributes.find(attr => attr.name === 'organizationName')?.value,
          email: cert.subject.attributes.find(attr => attr.name === 'emailAddress')?.value,
          validFrom: cert.validity.notBefore,
          validTo: cert.validity.notAfter
        }
      };
      
    } catch (error) {
      console.error('❌ Erro ao gerar certificado de teste:', error.message);
      throw error;
    }
  }

  /**
   * Valida o certificado gerado
   */
  validateGeneratedCertificate(pfxFile, password) {
    try {
      const pfxPath = path.join(this.certificatesDir, pfxFile);
      
      if (!fs.existsSync(pfxPath)) {
        throw new Error('Arquivo PFX não encontrado');
      }
      
      const pfxBuffer = fs.readFileSync(pfxPath);
      const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
      
      let privateKey = null;
      let certificate = null;
      
      p12.safeContents.forEach((safeContent) => {
        safeContent.safeBags.forEach((safeBag) => {
          if (safeBag.type === forge.pki.oids.keyBag || 
              safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag) {
            privateKey = forge.pki.privateKeyToPem(safeBag.key);
          } else if (safeBag.type === forge.pki.oids.certBag) {
            certificate = forge.pki.certificateToPem(safeBag.cert);
          }
        });
      });
      
      if (!privateKey || !certificate) {
        throw new Error('Chave privada ou certificado não encontrados');
      }
      
      console.log('✅ Certificado de teste validado com sucesso!');
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao validar certificado:', error.message);
      return false;
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const generator = new TestCertificateGenerator();
  
  try {
    const result = generator.generateTestCertificate();
    
    // Validar o certificado gerado
    console.log('\n🔍 Validando certificado gerado...');
    generator.validateGeneratedCertificate(result.pfxFile, result.password);
    
    console.log('\n🎉 Certificado de teste pronto para uso!');
    console.log('💡 Use o arquivo PFX e a senha para testar a API');
    
  } catch (error) {
    console.error('❌ Falha ao gerar certificado de teste:', error.message);
    process.exit(1);
  }
}

module.exports = TestCertificateGenerator; 