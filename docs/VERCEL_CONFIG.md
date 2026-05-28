# Configuração no Vercel

Para que o sistema funcione corretamente no Vercel, você precisa configurar as seguintes variáveis de ambiente:

## Variáveis de Ambiente Obrigatórias

No painel do Vercel, vá em **Settings > Environment Variables** e adicione:

### Banco de Dados MySQL

\`\`\`
DB_HOST=seu-host-mysql.com
DB_USER=seu-usuario
DB_PASSWORD=sua-senha
DB_NAME=nome-do-banco
DB_PORT=3306
DB_SSL=true
\`\`\`

### URLs da Aplicação

\`\`\`
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
\`\`\`

## Checklist de Deploy

Antes de fazer o deploy, verifique:

- [ ] Todas as variáveis de ambiente estão configuradas no Vercel
- [ ] O banco de dados MySQL está acessível de fora (não é localhost)
- [ ] As credenciais do banco estão corretas
- [ ] O firewall do banco permite conexões do Vercel
- [ ] SSL está habilitado no banco de dados (se necessário)

## Problemas Comuns

### Erro "fetch failed"

**Causa**: Geralmente relacionado a problemas de conexão com o banco de dados ou variáveis de ambiente não configuradas.

**Solução**:
1. Verifique se todas as variáveis de ambiente estão configuradas no Vercel
2. Confirme que o banco de dados está acessível externamente
3. Verifique os logs no Vercel Dashboard
4. Teste a conexão com o banco usando MySQL Workbench ou similar

### Timeout em requisições

**Causa**: Vercel tem limite de 10 segundos para funções serverless no plano gratuito.

**Solução**:
1. Otimize as queries do banco de dados
2. Adicione índices nas tabelas
3. Considere fazer upgrade do plano Vercel se necessário

### Erro de SSL

**Causa**: Alguns provedores de MySQL exigem SSL em produção.

**Solução**:
1. Configure `DB_SSL=true` nas variáveis de ambiente
2. Se necessário, adicione o certificado SSL do seu provedor

## IPs do Vercel para Whitelist

Se seu banco de dados requer whitelist de IPs, você precisa:

1. Permitir TODOS os IPs (0.0.0.0/0) ou
2. Usar um provedor de MySQL que suporte conexões do Vercel
3. Considerar usar Vercel Postgres ou PlanetScale

## Logs e Debug

Para ver os logs de erro no Vercel:

1. Acesse o dashboard do Vercel
2. Vá em **Deployments**
3. Clique no deployment com erro
4. Acesse a aba **Functions**
5. Clique na função com erro para ver os logs

## Testando Localmente com Variáveis de Produção

Para testar localmente com as mesmas configurações de produção:

1. Crie um arquivo `.env.production.local`
2. Copie as variáveis do Vercel
3. Execute: `npm run build && npm start`

## Suporte

Se o problema persistir:

1. Verifique os logs no Vercel Dashboard
2. Teste a API diretamente via Postman/Insomnia
3. Confirme que o banco está online e acessível
4. Entre em contato com o suporte do seu provedor de MySQL
\`\`\`

Agora vamos criar um endpoint de teste para verificar a conexão:
