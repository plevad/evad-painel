const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// CORS headers para permitir requisições do Electron
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Caminho do banco de licenças
const DB_PATH = path.join(__dirname, 'licenses.json');

// Carrega ou cria o banco de licenças
function loadLicenses() {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
        return {};
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveLicenses(licenses) {
    fs.writeFileSync(DB_PATH, JSON.stringify(licenses, null, 2));
}

// Gera hash do HWID para não armazenar em texto puro
function hashHWID(hwid) {
    return crypto.createHash('sha256').update(hwid).digest('hex');
}

// Endpoint de validação
app.post('/api/validate', (req, res) => {
    const { key, hwid } = req.body;

    if (!key || !hwid) {
        return res.json({ valid: false, message: 'Chave ou HWID ausente' });
    }

    const licenses = loadLicenses();
    const license = licenses[key];

    // Verifica se a chave existe
    if (!license) {
        console.log(`[NEGADO] Chave não encontrada: ${key}`);
        return res.json({ valid: false, message: 'Chave de licença inválida' });
    }

    // Verifica se está ativa
    if (!license.active) {
        console.log(`[NEGADO] Licença desativada: ${key}`);
        return res.json({ valid: false, message: 'Licença desativada pelo administrador' });
    }

    // Verifica expiração
    if (license.expiresAt && new Date() > new Date(license.expiresAt)) {
        console.log(`[NEGADO] Licença expirada: ${key}`);
        return res.json({ valid: false, message: 'Licença expirada' });
    }

    const hwidHash = hashHWID(hwid);

    // Primeira ativação - vincula ao HWID
    if (!license.hwid) {
        license.hwid = hwidHash;
        license.activatedAt = new Date().toISOString();
        license.lastSeen = new Date().toISOString();
        saveLicenses(licenses);
        console.log(`[ATIVADO] Nova licença ativada: ${key}`);
        return res.json({ valid: true, message: 'Licença ativada com sucesso' });
    }

    // Valida HWID
    if (license.hwid !== hwidHash) {
        console.log(`[NEGADO] HWID não corresponde: ${key}`);
        return res.json({ valid: false, message: 'Esta licença está vinculada a outro computador' });
    }

    // Atualiza último acesso
    license.lastSeen = new Date().toISOString();
    saveLicenses(licenses);

    console.log(`[OK] Licença validada: ${key}`);
    res.json({ valid: true, message: 'Licença válida' });
});

// Endpoint para gerar novas licenças (protegido por senha admin)
app.post('/api/admin/generate', (req, res) => {
    const { adminPassword, expiresAt, note } = req.body;

// Senha admin
    const ADMIN_PASSWORD = 'Evad@2025#PL';

    if (adminPassword !== ADMIN_PASSWORD) {
        return res.json({ success: false, message: 'Senha admin incorreta' });
    }

    // Gera chave única
    const key = 'EVAD-' + Array(4).fill(0).map(() => 
        Math.random().toString(36).substr(2, 4).toUpperCase()
    ).join('-');

    const licenses = loadLicenses();
    licenses[key] = {
        active: true,
        hwid: null,
        expiresAt: expiresAt || null, // null = sem expiração
        createdAt: new Date().toISOString(),
        activatedAt: null,
        lastSeen: null,
        note: note || ''
    };
    saveLicenses(licenses);

    console.log(`[ADMIN] Nova licença gerada: ${key}`);
    res.json({ success: true, key, license: licenses[key] });
});

// Endpoint para listar licenças (protegido)
app.post('/api/admin/list', (req, res) => {
    const { adminPassword } = req.body;
    const ADMIN_PASSWORD = 'Evad@2025#PL';

    if (adminPassword !== ADMIN_PASSWORD) {
        return res.json({ success: false, message: 'Senha admin incorreta' });
    }

    const licenses = loadLicenses();
    res.json({ success: true, licenses });
});

// Endpoint para desativar licença
app.post('/api/admin/deactivate', (req, res) => {
    const { adminPassword, key } = req.body;
    const ADMIN_PASSWORD = 'Evad@2025#PL';

    if (adminPassword !== ADMIN_PASSWORD) {
        return res.json({ success: false, message: 'Senha admin incorreta' });
    }

    const licenses = loadLicenses();
    if (!licenses[key]) {
        return res.json({ success: false, message: 'Licença não encontrada' });
    }

    licenses[key].active = false;
    saveLicenses(licenses);

    console.log(`[ADMIN] Licença desativada: ${key}`);
    res.json({ success: true, message: 'Licença desativada' });
});

// Endpoint para deletar licença permanentemente
app.post('/api/admin/delete', (req, res) => {
    const { adminPassword, key } = req.body;
    const ADMIN_PASSWORD = 'Evad@2025#PL';

    if (adminPassword !== ADMIN_PASSWORD) {
        return res.json({ success: false, message: 'Senha admin incorreta' });
    }

    const licenses = loadLicenses();
    if (!licenses[key]) {
        return res.json({ success: false, message: 'Licença não encontrada' });
    }

    delete licenses[key];
    saveLicenses(licenses);

    console.log(`[ADMIN] Licença deletada: ${key}`);
    res.json({ success: true, message: 'Licença deletada' });
});
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🔐 Servidor de Licenças EVAD rodando na porta ${PORT}`);
    console.log(`📝 Banco de dados: ${DB_PATH}`);
});
