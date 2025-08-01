const fs = require('fs');
const path = require('path');
const forge = require('node-forge');

class CertificateManager {
  constructor() {
    this.certificatePath = process.env.CERTIFICATE_PATH || './certificates';
    this.ensureCertificateDirectory();
  }

  ensureCertificateDirectory() {
    if (!fs.existsSync(this.certificatePath)) {
      fs.mkdirSync(this.certificatePath, { recursive: true });
    }
  }

  /**
   * Carrega certificado digital no formato PFX/P12
   * @param {string} filename - Nome do arquivo do certificado
   * @param {string} passphrase - Senha do certificado
   * @param {string} customPath - Caminho personalizado (opcional)
   * @returns {Object} - Objeto contendo chave privada e certificado
   */
  loadPFXCertificate(filename, passphrase, customPath = null) {
    try {
      const certPath = customPath || path.join(this.certificatePath, filename);
      
      if (!fs.existsSync(certPath)) {
        throw new Error(`Certificado não encontrado: ${certPath}`);
      }

      const pfxBuffer = fs.readFileSync(certPath);
      const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, passphrase);

      let privateKey = null;
      let certificate = null;
      let certificateChain = [];

      p12.safeContents.forEach((safeContent) => {
        safeContent.safeBags.forEach((safeBag) => {
          if (safeBag.type === forge.pki.oids.keyBag || 
              safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag) {
            privateKey = forge.pki.privateKeyToPem(safeBag.key);
          } else if (safeBag.type === forge.pki.oids.certBag) {
            if (!certificate) {
              certificate = forge.pki.certificateToPem(safeBag.cert);
            } else {
              certificateChain.push(forge.pki.certificateToPem(safeBag.cert));
            }
          }
        });
      });

      if (!privateKey || !certificate) {
        throw new Error('Chave privada ou certificado não encontrados no arquivo PFX');
      }

      return {
        privateKey,
        certificate,
        certificateChain,
        subject: this.extractSubject(certificate),
        issuer: this.extractIssuer(certificate),
        validFrom: this.extractValidFrom(certificate),
        validTo: this.extractValidTo(certificate)
      };
    } catch (error) {
      throw new Error(`Erro ao carregar certificado: ${error.message}`);
    }
  }

  /**
   * Carrega certificado no formato PEM
   * @param {string} certPath - Caminho para o certificado
   * @param {string} keyPath - Caminho para a chave privada
   * @returns {Object} - Objeto contendo chave privada e certificado
   */
  loadPEMCertificate(certPath, keyPath) {
    try {
      const certificate = fs.readFileSync(certPath, 'utf8');
      const privateKey = fs.readFileSync(keyPath, 'utf8');

      return {
        privateKey,
        certificate,
        subject: this.extractSubject(certificate),
        issuer: this.extractIssuer(certificate),
        validFrom: this.extractValidFrom(certificate),
        validTo: this.extractValidTo(certificate)
      };
    } catch (error) {
      throw new Error(`Erro ao carregar certificado PEM: ${error.message}`);
    }
  }

  /**
   * Valida se o certificado está dentro do período de validade
   * @param {Object} certInfo - Informações do certificado
   * @returns {boolean} - True se válido, false caso contrário
   */
  validateCertificateValidity(certInfo) {
    const now = new Date();
    const validFrom = new Date(certInfo.validFrom);
    const validTo = new Date(certInfo.validTo);

    return now >= validFrom && now <= validTo;
  }

  /**
   * Extrai informações do sujeito do certificado
   * @param {string} certificate - Certificado em formato PEM
   * @returns {Object} - Informações do sujeito
   */
  extractSubject(certificate) {
    try {
      const cert = forge.pki.certificateFromPem(certificate);
      return cert.subject.attributes.reduce((acc, attr) => {
        acc[attr.shortName] = attr.value;
        return acc;
      }, {});
    } catch (error) {
      return {};
    }
  }

  /**
   * Extrai informações do emissor do certificado
   * @param {string} certificate - Certificado em formato PEM
   * @returns {Object} - Informações do emissor
   */
  extractIssuer(certificate) {
    try {
      const cert = forge.pki.certificateFromPem(certificate);
      return cert.issuer.attributes.reduce((acc, attr) => {
        acc[attr.shortName] = attr.value;
        return acc;
      }, {});
    } catch (error) {
      return {};
    }
  }

  /**
   * Extrai data de início da validade
   * @param {string} certificate - Certificado em formato PEM
   * @returns {string} - Data de início da validade
   */
  extractValidFrom(certificate) {
    try {
      const cert = forge.pki.certificateFromPem(certificate);
      return cert.validity.notBefore;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extrai data de fim da validade
   * @param {string} certificate - Certificado em formato PEM
   * @returns {string} - Data de fim da validade
   */
  extractValidTo(certificate) {
    try {
      const cert = forge.pki.certificateFromPem(certificate);
      return cert.validity.notAfter;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verifica se o certificado é da ICP-Brasil
   * @param {Object} certInfo - Informações do certificado
   * @returns {boolean} - True se for da ICP-Brasil
   */
  isICPBrasilCertificate(certInfo) {
    const icpBrasilIssuers = [
      'ICP-Brasil',
      'Autoridade Certificadora da Receita Federal do Brasil',
      'AC da RFB',
      'Autoridade Certificadora Raiz Brasileira'
    ];

    return icpBrasilIssuers.some(issuer => 
      certInfo.issuer.organizationName?.includes(issuer) ||
      certInfo.issuer.commonName?.includes(issuer)
    );
  }
}

module.exports = CertificateManager; 