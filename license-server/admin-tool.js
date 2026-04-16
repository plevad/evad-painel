const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// URL do servidor (mude quando hospedar)
const SERVER_URL = 'http://localhost:3001';
const ADMIN_PASSWORD = 'Evad@2025#PL'; // Senha admin

function question(prompt) {
    return new Promise(resolve => rl.question(prompt, resolve));
}

async function generateLicense() {
    console.log('\n=== GERAR NOVA LICENÇA ===\n');
    
    const days = await question('Dias de validade (0 = sem expiração): ');
    const note = await question('Nota/Cliente (opcional): ');

    let expiresAt = null;
    if (parseInt(days) > 0) {
        const date = new Date();
        date.setDate(date.getDate() + parseInt(days));
        expiresAt = date.toISOString();
    }

    try {
        const response = await fetch(`${SERVER_URL}/api/admin/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminPassword: ADMIN_PASSWORD, expiresAt, note })
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('\n✅ LICENÇA GERADA COM SUCESSO!\n');
            console.log('━'.repeat(50));
            console.log(`🔑 CHAVE: ${data.key}`);
            console.log(`📅 Criada em: ${new Date(data.license.createdAt).toLocaleString('pt-BR')}`);
            console.log(`⏰ Expira em: ${expiresAt ? new Date(expiresAt).toLocaleString('pt-BR') : 'Nunca'}`);
            console.log(`📝 Nota: ${note || 'Nenhuma'}`);
            console.log('━'.repeat(50));
        } else {
            console.log(`\n❌ Erro: ${data.message}`);
        }
    } catch (err) {
        console.log(`\n❌ Erro ao conectar ao servidor: ${err.message}`);
    }
}

async function listLicenses() {
    console.log('\n=== LISTAR LICENÇAS ===\n');

    try {
        const response = await fetch(`${SERVER_URL}/api/admin/list`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminPassword: ADMIN_PASSWORD })
        });

        const data = await response.json();
        
        if (data.success) {
            const licenses = Object.entries(data.licenses);
            
            if (licenses.length === 0) {
                console.log('Nenhuma licença cadastrada ainda.\n');
                return;
            }

            console.log(`Total: ${licenses.length} licença(s)\n`);
            console.log('━'.repeat(100));

            licenses.forEach(([key, lic]) => {
                const status = lic.active ? '🟢 ATIVA' : '🔴 DESATIVADA';
                const hwid = lic.hwid ? '🔒 Vinculada' : '⚪ Não ativada';
                const expires = lic.expiresAt ? new Date(lic.expiresAt).toLocaleDateString('pt-BR') : '∞ Sem expiração';
                const lastSeen = lic.lastSeen ? new Date(lic.lastSeen).toLocaleString('pt-BR') : 'Nunca';
                
                console.log(`\n🔑 ${key}`);
                console.log(`   Status: ${status} | ${hwid}`);
                console.log(`   Expira: ${expires}`);
                console.log(`   Último acesso: ${lastSeen}`);
                if (lic.note) console.log(`   Nota: ${lic.note}`);
            });

            console.log('\n' + '━'.repeat(100));
        } else {
            console.log(`\n❌ Erro: ${data.message}`);
        }
    } catch (err) {
        console.log(`\n❌ Erro ao conectar ao servidor: ${err.message}`);
    }
}

async function deactivateLicense() {
    console.log('\n=== DESATIVAR LICENÇA ===\n');
    
    const key = await question('Chave da licença: ');

    try {
        const response = await fetch(`${SERVER_URL}/api/admin/deactivate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminPassword: ADMIN_PASSWORD, key })
        });

        const data = await response.json();
        
        if (data.success) {
            console.log(`\n✅ Licença ${key} desativada com sucesso!\n`);
        } else {
            console.log(`\n❌ Erro: ${data.message}\n`);
        }
    } catch (err) {
        console.log(`\n❌ Erro ao conectar ao servidor: ${err.message}\n`);
    }
}

async function main() {
    console.clear();
    console.log('╔════════════════════════════════════════╗');
    console.log('║   EVAD - GERENCIADOR DE LICENÇAS      ║');
    console.log('╚════════════════════════════════════════╝\n');

    while (true) {
        console.log('\n[1] Gerar nova licença');
        console.log('[2] Listar licenças');
        console.log('[3] Desativar licença');
        console.log('[0] Sair\n');

        const choice = await question('Escolha uma opção: ');

        switch (choice) {
            case '1':
                await generateLicense();
                break;
            case '2':
                await listLicenses();
                break;
            case '3':
                await deactivateLicense();
                break;
            case '0':
                console.log('\nAté logo!\n');
                rl.close();
                process.exit(0);
            default:
                console.log('\n❌ Opção inválida!\n');
        }
    }
}

main();
