const Joi = require('joi');

// Schema para validação de assinatura de PDF
const signPDFSchema = Joi.object({
  password: Joi.string().required().min(1).messages({
    'string.empty': 'Senha do certificado é obrigatória',
    'string.min': 'Senha do certificado não pode estar vazia',
    'any.required': 'Senha do certificado é obrigatória'
  }),
  reason: Joi.string().max(255).optional().default('Assinatura Digital ICP-Brasil'),
  location: Joi.string().max(255).optional().default('Brasil'),
  contactInfo: Joi.string().max(255).optional().default(''),
  signatureField: Joi.string().max(100).optional().default('Signature1'),
  signaturePosition: Joi.object({
    x: Joi.number().min(0).max(1000).optional().default(50),
    y: Joi.number().min(0).max(1000).optional().default(50),
    width: Joi.number().min(10).max(500).optional().default(200),
    height: Joi.number().min(10).max(200).optional().default(50)
  }).optional()
});

// Schema para validação de verificação de assinatura
const verifySignatureSchema = Joi.object({
  // Para verificação, apenas o arquivo é necessário
});

// Schema para validação de upload de certificado
const uploadCertificateSchema = Joi.object({
  certificateType: Joi.string().valid('pfx', 'pem').required().messages({
    'any.only': 'Tipo de certificado deve ser pfx ou pem',
    'any.required': 'Tipo de certificado é obrigatório'
  }),
  description: Joi.string().max(255).optional()
});

// Middleware de validação genérico
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Dados de entrada inválidos',
        errors: errorDetails
      });
    }

    // Substitui req.body pelos dados validados
    req.body = value;
    next();
  };
};

// Middleware para validação de arquivo PDF
const validatePDFFile = (req, res, next) => {
  if (!req.files || !req.files.pdf) {
    return res.status(400).json({
      success: false,
      message: 'Arquivo PDF é obrigatório'
    });
  }

  const pdfFile = req.files.pdf[0];

  // Verificar tipo MIME
  if (pdfFile.mimetype !== 'application/pdf') {
    return res.status(400).json({
      success: false,
      message: 'Arquivo deve ser um PDF válido'
    });
  }

  // Verificar tamanho do arquivo (máximo 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (pdfFile.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: 'Arquivo muito grande. Tamanho máximo: 10MB'
    });
  }

  next();
};

// Middleware para validação de arquivo de certificado
const validateCertificateFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Arquivo de certificado é obrigatório'
    });
  }

  // Verificar tipos de arquivo permitidos
  const allowedMimeTypes = [
    'application/x-pkcs12',
    'application/pkcs12',
    'application/x-pem-file',
    'text/plain' // Para arquivos .pem
  ];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Tipo de arquivo não suportado. Use .pfx ou .pem'
    });
  }

  // Verificar tamanho do arquivo (máximo 1MB)
  const maxSize = 1 * 1024 * 1024; // 1MB
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: 'Arquivo de certificado muito grande. Tamanho máximo: 1MB'
    });
  }

  next();
};

// Middleware para validação de parâmetros de consulta
const validateQueryParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Parâmetros de consulta inválidos',
        errors: errorDetails
      });
    }

    req.query = value;
    next();
  };
};

// Schema para validação de parâmetros de consulta
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  sortBy: Joi.string().valid('createdAt', 'filename', 'size').optional().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc')
});

module.exports = {
  validateRequest,
  validatePDFFile,
  validateCertificateFile,
  validateQueryParams,
  signPDFSchema,
  verifySignatureSchema,
  uploadCertificateSchema,
  paginationSchema
}; 