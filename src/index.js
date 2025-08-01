require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const pdfRoutes = require('./routes/pdfRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações de segurança
app.use(helmet({
  contentSecurityPolicy: false, // Desabilitado para permitir uploads
  crossOriginEmbedderPolicy: false
}));

// Configuração do CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requisições por IP
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em alguns minutos.'
  }
});
app.use('/api/', limiter);

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rotas da API
app.use('/api/pdf', pdfRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Assinatura Digital ICP-Brasil',
    version: '1.0.0',
    endpoints: {
      sign: 'POST /api/pdf/sign',
      verify: 'POST /api/pdf/verify',
      certificates: 'GET /api/pdf/certificates',
      validateCertificate: 'POST /api/pdf/certificates/validate',
      uploadCertificate: 'POST /api/pdf/certificates/upload',
      removeCertificate: 'DELETE /api/pdf/certificates/:filename',
      systemInfo: 'GET /api/pdf/system-info',
      health: 'GET /api/pdf/health'
    },
    documentation: 'Consulte a documentação para mais detalhes sobre cada endpoint'
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    availableEndpoints: [
      'GET /',
      'POST /api/pdf/sign',
      'POST /api/pdf/verify',
      'GET /api/pdf/certificates',
      'POST /api/pdf/certificates/validate',
      'POST /api/pdf/certificates/upload',
      'DELETE /api/pdf/certificates/:filename',
      'GET /api/pdf/system-info',
      'GET /api/pdf/health'
    ]
  });
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Assinatura Digital ICP-Brasil rodando na porta ${PORT}`);
  console.log(`📋 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Certificados: ${process.env.CERTIFICATE_PATH || './certificates'}`);
  console.log(`📁 Arquivos temporários: ${process.env.TEMP_DIR || './temp'}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📖 Documentação: http://localhost:${PORT}/api/pdf/system-info`);
});
