// modules/configuracoes/configuracoes.js
import appState from '../../assets/js/app.js';
import { exportData, triggerImport } from '../../core/database/importExport.js';

export function init() {
    const role = appState.getRole();
    const campaignName = appState.get('campaign') || 'campanha';
    const sanitized = campaignName.replace(/\s+/g, '_');

    const currentRoleSpan = document.getElementById('currentRole');
    if (currentRoleSpan) {
        currentRoleSpan.textContent = role === 'master' ? '👑 Mestre' : '🎮 Jogador';
    }

    // --- Exportar Campanha ---
    const btnExport = document.getElementById('btnExport');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const filename = role === 'master'
                ? `ocaso_${sanitized}.json`
                : `minha_campanha_${sanitized}.json`;
            exportData(appState.data, filename);
            window.showToast?.('📤 Dados exportados!');
        });
    }

    // --- Exportar Pacote do Jogador ---
    const btnExportPlayer = document.getElementById('btnExportPlayer');
    if (btnExportPlayer) {
        if (role !== 'master') {
            btnExportPlayer.style.display = 'none';
        } else {
            btnExportPlayer.style.display = '';
            btnExportPlayer.addEventListener('click', () => {
                const pkg = appState.exportPlayerPackage?.() || {};
                const filename = `pacote_jogador_${sanitized}.ocaso`;
                exportData(pkg, filename);
                window.showToast?.('📦 Pacote do jogador exportado!');
            });
        }
    }

    // --- Importar ---
    const btnImport = document.getElementById('btnImport');
    if (btnImport) {
        btnImport.addEventListener('click', () => {
            triggerImport((data) => {
                Object.keys(data).forEach(key => {
                    if (key !== 'campaign') {
                        appState.set(key, data[key]);
                    }
                });
                window.showToast?.('📥 Campanha importada!');
            });
        });
    }

    // --- Reset ---
    const btnReset = document.getElementById('btnReset');
    if (btnReset) {
        if (role !== 'master') {
            btnReset.style.display = 'none';
        } else {
            btnReset.style.display = '';
            btnReset.addEventListener('click', () => {
                if (confirm('⚠️ Resetar TODOS os dados da campanha?')) {
                    appState.reset();
                    window.showToast?.('🗑️ Campanha resetada.');
                }
            });
        }
    }

    // ============================================================
    // ✅ SLOTS
    // ============================================================
    document.getElementById('btnSalvarSlot')?.addEventListener('click', () => {
        const slot = document.getElementById('slotSelector').value;
        localStorage.setItem(`ocaso_slot_${slot}`, JSON.stringify(appState.data));
        window.showToast?.('✅ Slot salvo!');
        appState.logAction(`💾 Slot ${slot} salvo.`);
    });

    document.getElementById('btnCarregarSlot')?.addEventListener('click', () => {
        const slot = document.getElementById('slotSelector').value;
        const data = localStorage.getItem(`ocaso_slot_${slot}`);
        if (!data) return window.showToast?.('❌ Slot vazio.');
        try {
            const parsed = JSON.parse(data);
            Object.keys(parsed).forEach(key => {
                if (key !== 'campaign') appState.set(key, parsed[key]);
            });
            window.showToast?.('📂 Slot carregado!');
            appState.logAction(`📂 Slot ${slot} carregado.`);
        } catch(e) {
            window.showToast?.('❌ Erro ao carregar slot.');
        }
    });

    // ============================================================
    // ✅ TEMA
    // ============================================================
    const savedTheme = localStorage.getItem('ocaso_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeSelector = document.getElementById('themeSelector');
    if (themeSelector) {
        themeSelector.value = savedTheme;
        themeSelector.addEventListener('change', function() {
            document.documentElement.setAttribute('data-theme', this.value);
            localStorage.setItem('ocaso_theme', this.value);
            appState.logAction(`🎨 Tema alterado para ${this.value}.`);
        });
    }

    // ============================================================
    // ✅ DISCORD WEBHOOK
    // ============================================================
    const webhookInput = document.getElementById('discordWebhook');
    const savedWebhook = localStorage.getItem('ocaso_discord_webhook') || '';
    if (webhookInput) webhookInput.value = savedWebhook;

    document.getElementById('btnTestarWebhook')?.addEventListener('click', () => {
        const url = webhookInput.value.trim();
        if (!url) return window.showToast?.('⚠️ Insira uma URL de webhook.');
        localStorage.setItem('ocaso_discord_webhook', url);
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: '🧪 Teste de conexão com o webhook!' })
        }).then(r => {
            if (r.ok) {
                window.showToast?.('✅ Webhook funcionando!');
                document.getElementById('webhookStatus').textContent = '✅ Conectado';
            } else {
                window.showToast?.('❌ Erro ao enviar.');
            }
        }).catch(() => window.showToast?.('❌ Falha na conexão.'));
    });

    window._sendDiscord = (message) => {
        const url = localStorage.getItem('ocaso_discord_webhook');
        if (!url) return;
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message })
        }).catch(() => {});
    };

    // ============================================================
    // ✅ EXPORTAR PDF
    // ============================================================
    document.getElementById('btnExportCampanhaPDF')?.addEventListener('click', exportarCampanhaPDF);

    function exportarCampanhaPDF() {
        const data = appState.data;
        const html = `
            <html><head><title>Campanha - ${data.campaign}</title>
            <style>
                body{font-family:sans-serif;padding:20px;color:#333;background:#fff;}
                h1{color:#c9a24e;}
                .section{margin:20px 0;}
                table{width:100%;border-collapse:collapse;margin-top:8px;}
                th,td{border:1px solid #ddd;padding:6px;text-align:left;}
                th{background:#f5f3f0;}
            </style>
            </head><body>
            <h1>📖 ${escapeHtml(data.campaign)}</h1>
            <div class="section"><h2>📋 Personagens</h2>
                ${(data.characters||[]).length ? 
                    `<table><tr><th>Nome</th><th>Estilo</th><th>Grau</th></tr>
                    ${(data.characters||[]).map(c => `<tr><td>${escapeHtml(c.nome)}</td><td>${escapeHtml(c.estilo)}</td><td>${c.grau}º</td></tr>`).join('')}</table>` :
                    '<p>Nenhum personagem.</p>'
                }
            </div>
            <div class="section"><h2>🏴 Missões</h2>
                ${(data.quests||[]).length ?
                    `<table><tr><th>Título</th><th>Status</th></tr>
                    ${(data.quests||[]).map(q => `<tr><td>${escapeHtml(q.titulo)}</td><td>${q.status}</td></tr>`).join('')}</table>` :
                    '<p>Nenhuma missão.</p>'
                }
            </div>
            <div class="section"><h2>👥 NPCs</h2>
                ${(data.npcs||[]).length ?
                    `<table><tr><th>Nome</th><th>Tipo</th><th>Grau</th></tr>
                    ${(data.npcs||[]).map(n => `<tr><td>${escapeHtml(n.nome)}</td><td>${escapeHtml(n.tipo)}</td><td>${n.grau}º</td></tr>`).join('')}</table>` :
                    '<p>Nenhum NPC.</p>'
                }
            </div>
            <div class="section"><h2>📜 Lore</h2>
                ${(data.lores||[]).length ?
                    `<ul>${(data.lores||[]).map(l => `<li>${escapeHtml(l.titulo||'Lore')}</li>`).join('')}</ul>` :
                    '<p>Nenhum registro de lore.</p>'
                }
            </div>
            </body></html>
        `;
        const win = window.open('', '_blank', 'width=800,height=600');
        if (win) {
            win.document.write(html);
            win.document.close();
            win.focus();
            win.print();
        } else {
            window.showToast?.('❌ Bloqueie o pop-up para exportar.');
        }
    }
}