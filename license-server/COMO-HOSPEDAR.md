# Como Hospedar o Servidor de Licenças (GRÁTIS)

## Opção 1 — Railway (Recomendado, mais fácil)

1. Acesse https://railway.app e crie uma conta gratuita
2. Clique em "New Project" → "Deploy from GitHub"
3. Faça upload da pasta `license-server` para um repositório GitHub privado
4. Railway detecta automaticamente o Node.js e faz o deploy
5. Copie a URL gerada (ex: `https://evad-licenses.up.railway.app`)
6. Cole essa URL no `server.js` do painel:
   ```
   const LICENSE_SERVER_URL = 'https://evad-licenses.up.railway.app';
   ```

## Opção 2 — Render (Também gratuito)

1. Acesse https://render.com e crie uma conta
2. Clique em "New Web Service"
3. Conecte ao GitHub com a pasta `license-server`
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Copie a URL e cole no `server.js` do painel

## Opção 3 — VPS (Mais controle)

Se tiver um VPS (DigitalOcean, Hostinger, etc):
```bash
# No servidor
git clone seu-repo
cd license-server
npm install
npm install -g pm2
pm2 start server.js --name evad-licenses
pm2 save
```

---

## Após Hospedar

1. Abra `create/EVAD Panel/resources/app/server.js`
2. Mude a linha:
   ```javascript
   const LICENSE_SERVER_URL = 'https://SEU-SERVIDOR.com';
   ```
   Para a URL real do seu servidor.

3. **IMPORTANTE:** Mude a senha admin em `license-server/server.js`:
   ```javascript
   const ADMIN_PASSWORD = 'SUA_SENHA_AQUI'; // Linha ~17 e ~37 e ~52
   ```
   E também em `admin-tool.js`:
   ```javascript
   const ADMIN_PASSWORD = 'SUA_SENHA_AQUI';
   ```

---

## Como Gerar Licenças

Com o servidor rodando localmente:
```bash
cd license-server
npm install
node admin-tool.js
```

Escolha opção 1 para gerar uma nova chave.

---

## Estrutura do Sistema

```
Cliente abre o painel
       ↓
Painel verifica license.key local
       ↓
Envia chave + HWID para seu servidor
       ↓
Servidor valida e responde OK/NEGADO
       ↓
Se OK → painel funciona normalmente
Se NEGADO → tela de ativação aparece
```
