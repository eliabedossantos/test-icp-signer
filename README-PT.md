# Assinador de PDFs com Padrão ICP-Brasil

Sistema robusto para assinatura digital de PDFs utilizando certificados digitais da ICP-Brasil (Infraestrutura de Chaves Públicas Brasileira) em Node.js.

## 🚀 Características

- ✅ **Certificados ICP-Brasil**: Suporte completo para certificados A1 e A3
- ✅ **Formatos Suportados**: PFX/P12 e PEM
- ✅ **Padrão PAdES**: Implementação do padrão PDF Advanced Electronic Signatures
- ✅ **Validação Robusta**: Verificação de validade e autenticidade dos certificados
- ✅ **API REST**: Interface completa para integração
- ✅ **Segurança**: Implementação de boas práticas de segurança
- ✅ **Logs Detalhados**: Sistema de logging para auditoria
- ✅ **Rate Limiting**: Proteção contra abuso da API
- ✅ **Validação de Entrada**: Validação rigorosa de todos os dados de entrada

## 📋 Pré-requisitos

- Node.js 16+ 
- npm ou yarn
- Certificado digital ICP-Brasil (A1 ou A3)

## 🛠️ Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd assinador-icp
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Crie os diretórios necessários**
```bash
mkdir certificates temp
```

5. **Inicie o servidor**
```bash
npm start
```

## 📖 Uso da API

### 1. Assinar PDF

**Endpoint:** `POST /api/pdf/sign`

**Formato:** `multipart/form-data`

**Parâmetros:**
- `pdf` (file): Arquivo PDF a ser assinado
- `certificateFile` (string): Nome do arquivo do certificado
- `certificatePassword` (string): Senha do certificado
- `reason` (string, opcional): Motivo da assinatura
- `location` (string, opcional): Local da assinatura
- `contactInfo` (string, opcional): Informações de contato

**Exemplo com cURL:**
```bash
curl -X POST http://localhost:3000/api/pdf/sign \
  -F "pdf=@documento.pdf" \
  -F "certificateFile=meu_certificado.pfx" \
  -F "certificatePassword=minha_senha" \
  -F "reason=Assinatura Digital ICP-Brasil" \
  -F "location=Brasil" \
  --output documento_assinado.pdf
```

### 2. Verificar Assinatura

**Endpoint:** `POST /api/pdf/verify`

**Formato:** `multipart/form-data`

**Parâmetros:**
- `pdf` (file): Arquivo PDF assinado

**Exemplo:**
```bash
curl -X POST http://localhost:3000/api/pdf/verify \
  -F "pdf=@documento_assinado.pdf"
```

### 3. Listar Certificados

**Endpoint:** `GET /api/pdf/certificates`

**Exemplo:**
```bash
curl http://localhost:3000/api/pdf/certificates
```

### 4. Validar Certificado

**Endpoint:** `POST /api/pdf/certificates/validate`

**Parâmetros:**
- `certificateFile` (string): Nome do arquivo do certificado
- `certificatePassword` (string): Senha do certificado

**Exemplo:**
```bash
curl -X POST http://localhost:3000/api/pdf/certificates/validate \
  -H "Content-Type: application/json" \
  -d '{
    "certificateFile": "meu_certificado.pfx",
    "certificatePassword": "minha_senha"
  }'
```

### 5. Upload de Certificado

**Endpoint:** `POST /api/pdf/certificates/upload`

**Formato:** `multipart/form-data`

**Parâmetros:**
- `certificate` (file): Arquivo do certificado
- `certificateType` (string): Tipo do certificado (pfx ou pem)
- `description` (string, opcional): Descrição do certificado

**Exemplo:**
```bash
curl -X POST http://localhost:3000/api/pdf/certificates/upload \
  -F "certificate=@meu_certificado.pfx" \
  -F "certificateType=pfx" \
  -F "description=Certificado A1 da empresa"
```

## 🔧 Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | 3000 |
| `NODE_ENV` | Ambiente de execução | development |
| `CERTIFICATE_PATH` | Diretório dos certificados | ./certificates |
| `TEMP_DIR` | Diretório de arquivos temporários | ./temp |
| `ALLOWED_ORIGINS` | Origens permitidas para CORS | * |
| `LOG_LEVEL` | Nível de log | info |

### Estrutura de Diretórios

```
assinador-icp/
├── src/
│   ├── config/
│   │   └── certificate.js
│   ├── controllers/
│   │   └── pdfController.js
│   ├── middleware/
│   │   └── validation.js
│   ├── routes/
│   │   └── pdfRoutes.js
│   ├── services/
│   │   └── pdfSigner.js
│   └── index.js
├── certificates/     # Certificados digitais
├── temp/            # Arquivos temporários
├── .env.example
├── package.json
└── README.md
```

## 🔒 Segurança

### Certificados Digitais

- **Validação de Validade**: Verifica se o certificado está dentro do período de validade
- **Verificação ICP-Brasil**: Confirma se o certificado é da ICP-Brasil
- **Proteção de Senha**: Senhas não são armazenadas em logs
- **Isolamento de Arquivos**: Certificados são armazenados em diretório seguro

### API Security

- **Rate Limiting**: Limite de 100 requisições por 15 minutos por IP
- **CORS**: Configuração restritiva de origens permitidas
- **Helmet**: Headers de segurança HTTP
- **Validação de Entrada**: Validação rigorosa de todos os dados
- **Sanitização**: Limpeza de dados de entrada

## 🧪 Testes

```bash
# Executar testes
npm test

# Executar testes com coverage
npm run test:coverage

# Executar testes em modo watch
npm run test:watch
```

## 📝 Logs

O sistema gera logs detalhados para auditoria:

- **Requisições**: Todas as requisições são logadas
- **Erros**: Erros são logados com stack trace
- **Assinaturas**: Operações de assinatura são registradas
- **Certificados**: Validações de certificados são logadas

## 🚨 Troubleshooting

### Problemas Comuns

1. **Certificado não encontrado**
   - Verifique se o arquivo está no diretório `certificates/`
   - Confirme se o nome do arquivo está correto

2. **Senha incorreta**
   - Verifique se a senha do certificado está correta
   - Certifique-se de que não há espaços extras

3. **PDF não válido**
   - Verifique se o arquivo é um PDF válido
   - Confirme se o arquivo não está corrompido

4. **Erro de permissão**
   - Verifique as permissões dos diretórios `certificates/` e `temp/`
   - Execute com permissões adequadas

### Logs de Debug

Para ativar logs detalhados, configure:

```bash
LOG_LEVEL=debug
```

## 📚 Referências

- [ICP-Brasil](https://www.gov.br/iti/pt-br/assuntos/repositorio/certificados-das-acs-da-icp-brasil)
- [PAdES Standard](https://www.etsi.org/deliver/etsi_ts/119100_119199/11914401/01.01.01_60/ts_11914401v010101p.pdf)
- [Node.js Crypto](https://nodejs.org/api/crypto.html)
- [PDF-Lib](https://pdf-lib.js.org/)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC. Veja o arquivo `LICENSE` para mais detalhes.

## ⚠️ Aviso Legal

Este software é fornecido "como está" sem garantias. O uso de certificados digitais para assinatura de documentos deve seguir as regulamentações locais e as políticas da ICP-Brasil.

## 📞 Suporte

Para suporte técnico ou dúvidas:

- Abra uma issue no GitHub
- Consulte a documentação da API em `/api/pdf/system-info`
- Verifique os logs do servidor para informações detalhadas 