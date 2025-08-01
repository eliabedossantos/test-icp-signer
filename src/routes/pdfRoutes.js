const express = require('express');
const multer = require('multer');
const Joi = require('joi');
const PDFController = require('../controllers/pdfController');
const {
  validateRequest,
  validatePDFFile,
  validateCertificateFile,
  validateQueryParams,
  signPDFSchema,
  verifySignatureSchema,
  uploadCertificateSchema,
  paginationSchema
} = require('../middleware/validation');

const router = express.Router();
const pdfController = new PDFController();

// Configuração do multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Configuração do multer para upload de certificados
const uploadCertificate = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024 // 1MB
  }
});

/**
 * @route POST /api/pdf/sign
 * @desc Assina um PDF com certificado digital ICP-Brasil
 * @access Public
 */
router.post('/sign', 
  upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'certificate', maxCount: 1 }
  ]),
  validatePDFFile,
  validateRequest(signPDFSchema),
  pdfController.signPDF.bind(pdfController)
);

/**
 * @route POST /api/pdf/verify
 * @desc Verifica a assinatura de um PDF
 * @access Public
 */
router.post('/verify',
  upload.single('pdf'),
  validatePDFFile,
  pdfController.verifySignature.bind(pdfController)
);

/**
 * @route GET /api/pdf/certificates
 * @desc Lista certificados disponíveis
 * @access Public
 */
router.get('/certificates',
  validateQueryParams(paginationSchema),
  pdfController.listCertificates.bind(pdfController)
);

/**
 * @route POST /api/pdf/certificates/validate
 * @desc Valida um certificado digital
 * @access Public
 */
router.post('/certificates/validate',
  validateRequest(Joi.object({
    certificateFile: Joi.string().required(),
    certificatePassword: Joi.string().required()
  })),
  pdfController.validateCertificate.bind(pdfController)
);

/**
 * @route POST /api/pdf/certificates/upload
 * @desc Upload de certificado digital
 * @access Public
 */
router.post('/certificates/upload',
  uploadCertificate.single('certificate'),
  validateCertificateFile,
  validateRequest(uploadCertificateSchema),
  pdfController.uploadCertificate.bind(pdfController)
);

/**
 * @route DELETE /api/pdf/certificates/:filename
 * @desc Remove um certificado
 * @access Public
 */
router.delete('/certificates/:filename',
  pdfController.removeCertificate.bind(pdfController)
);

/**
 * @route GET /api/pdf/system-info
 * @desc Informações do sistema
 * @access Public
 */
router.get('/system-info',
  pdfController.getSystemInfo.bind(pdfController)
);

/**
 * @route GET /api/pdf/health
 * @desc Health check da API
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API de Assinatura Digital ICP-Brasil está funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router; 