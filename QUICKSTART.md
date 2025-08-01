# 🚀 Guia de Início Rápido - Assinador ICP-Brasil

## ⚡ Instalação e Configuração em 5 Minutos

### 1. Pré-requisitos
```bash
# Node.js 16+ instalado
node --version

# npm ou yarn
npm --version
```

### 2. Clone e Instale
```bash
git clone <repository-url>
cd assinador-icp
npm install
```

### 3. Configure o Ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Crie os diretórios necessários
mkdir certificates temp
```

### 4. Gere Certificados e PDFs de Teste
```bash
# Gerar certificado de teste auto-assinado
npm run generate-test-cert

# Gerar PDF de teste
npm run generate-test-pdf

# Ou gerar tudo de uma vez
npm run setup-test
```

### 5. Inicie o Servidor
```bash
npm start
```

### 6. Teste a API
```bash
# Verifique se está funcionando
curl http://localhost:3000/api/pdf/health

# Execute o exemplo completo
npm run example
```

## 📋 Uso Básico

### Upload de Certificado (se você tiver um real)
```bash
curl -X POST http://localhost:3000/api/pdf/certificates/upload \
  -F "certificate=@seu_certificado.pfx" \
  -F "certificateType=pfx" \
  -F "description=Meu certificado A1"
```

### Assinar PDF com Certificado de Teste
```bash
# Use o certificado gerado automaticamente
curl -X POST http://localhost:3000/api/pdf/sign \
  -F "pdf=@examples/documento_teste_*.pdf" \
  -F "certificateFile=teste_certificado_*.pfx" \
  -F "certificatePassword=senha_teste" \
  -F "reason=Assinatura Digital ICP-Brasil" \
  --output documento_assinado.pdf
```

### Verificar Assinatura
```bash
curl -X POST http://localhost:3000/api/pdf/verify \
  -F "pdf=@documento_assinado.pdf"
```

## 🔧 Configuração Avançada

### Variáveis de Ambiente (.env)
```bash
# Servidor
PORT=3000
NODE_ENV=development

# Diretórios
CERTIFICATE_PATH=./certificates
TEMP_DIR=./temp

# Segurança
ALLOWED_ORIGINS=http://localhost:3000
LOG_LEVEL=info
```

### Scripts Disponíveis
```bash
npm start                    # Iniciar servidor
npm run dev                  # Desenvolvimento com hot reload
npm run test                 # Executar testes
npm run example              # Executar exemplo de uso
npm run generate-test-cert   # Gerar certificado de teste
npm run generate-test-pdf    # Gerar PDF de teste
npm run setup-test           # Gerar certificado e PDF de teste
npm run lint                 # Verificar código
npm run format               # Formatar código
```

## 🧪 Certificados de Teste

### Certificado Auto-assinado
O projeto inclui um gerador de certificado de teste auto-assinado:

```bash
npm run generate-test-cert
```

**Credenciais do certificado de teste:**
- **Arquivo**: `teste_certificado_*.pfx` (no diretório `certificates/`)
- **Senha**: `senha_teste`
- **Validade**: 1 ano
- **⚠️ IMPORTANTE**: NÃO é um certificado ICP-Brasil válido!

### PDF de Teste
Gera um PDF simples para testar a assinatura:

```bash
npm run generate-test-pdf
```

**Arquivo gerado**: `documento_teste_*.pdf` (no diretório `examples/`)

## 📖 Documentação Completa

- **README.md** - Documentação em inglês
- **README-PT.md** - Documentação em português
- **RESUMO.md** - Resumo executivo do projeto
- **examples/exemplo-uso.js** - Exemplo prático completo

## 🆘 Troubleshooting

### Problemas Comuns

1. **Erro de porta em uso**
   ```bash
   # Altere a porta no .env
   PORT=3001
   ```

2. **Certificado não encontrado**
   ```bash
   # Gere um certificado de teste
   npm run generate-test-cert
   ```

3. **PDF não encontrado**
   ```bash
   # Gere um PDF de teste
   npm run generate-test-pdf
   ```

4. **Erro de permissão**
   ```bash
   # Verifique as permissões dos diretórios
   chmod 755 certificates temp
   ```

### Logs de Debug
```bash
# Ative logs detalhados
LOG_LEVEL=debug npm start
```

## 🎯 Próximos Passos

1. **Execute o setup completo**: `npm run setup-test`
2. **Teste a API**: `npm run example`
3. **Leia a documentação completa** (README-PT.md)
4. **Configure seu certificado digital real** (opcional)
5. **Integre em sua aplicação**

## 🔒 Certificados Reais vs Teste

| Aspecto | Certificado de Teste | Certificado Real |
|---------|---------------------|------------------|
| **Validade Legal** | ❌ Não válido | ✅ Válido |
| **ICP-Brasil** | ❌ Não | ✅ Sim |
| **Custo** | 💰 Gratuito | 💰 Pago |
| **Uso** | 🧪 Desenvolvimento | 🏭 Produção |
| **Emissor** | Auto-assinado | Autoridade certificadora |

## 📞 Suporte

- **Documentação**: `/api/pdf/system-info`
- **Health Check**: `/api/pdf/health`
- **Logs**: Verifique o console do servidor
- **Issues**: Abra uma issue no GitHub

---

**🎉 Parabéns! Você tem um sistema completo de assinatura digital ICP-Brasil funcionando!**

**💡 Dica**: Para uso em produção, substitua o certificado de teste por um certificado ICP-Brasil válido. 