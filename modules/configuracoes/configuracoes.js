// modules/configuracoes/configuracoes.js
import appState from '../../assets/js/app.js';

export function init() {
    const role = appState.getRole();
    const campaignName = appState.get('campaign') || 'campanha';
    const sanitized = campaignName.replace(/\s+/g, '_');

    const currentRoleSpan = document.getElementById('currentRole');
    if (currentRoleSpan) {
        currentRoleSpan.textContent = role === 'master' ? '👑 Mestre' : '🎮 Jogador';
    }

    // ============================================================
    // ✅ SALA ONLINE – USANDO APENAS O QUE EXISTE
    // ============================================================
    const roomInfo = document.getElementById('roomInfo');
    const btnCreate = document.getElementById('btnCreateRoom');
    const btnLeave = document.getElementById('btnLeaveRoom');
    const btnCopy = document.getElementById('btnCopyRoomId');

    const savedHostId = localStorage.getItem('ocaso_hostId') || null;

    if (role === 'master') {
        if (savedHostId) {
            appState.hostId = savedHostId;
            roomInfo.textContent = `🆔 ID da sala: ${savedHostId} (copie e envie para os jogadores)`;
            btnCreate.style.display = 'none';
            btnLeave.style.display = '';
            btnCopy.style.display = '';
        } else {
            roomInfo.textContent = 'Nenhuma sala ativa.';
            btnCreate.style.display = '';
            btnLeave.style.display = 'none';
            btnCopy.style.display = 'none';
        }

        btnCreate.addEventListener('click', async () => {
            try {
                if (typeof appState.createOnlineRoom === 'function') {
                    const id = await appState.createOnlineRoom();
                    if (id) {
                        appState.hostId = id;
                        localStorage.setItem('ocaso_hostId', id);
                        roomInfo.textContent = `🆔 ID da sala: ${id} (copie e envie para os jogadores)`;
                        btnCreate.style.display = 'none';
                        btnLeave.style.display = '';
                        btnCopy.style.display = '';
                        window.showToast?.('🏠 Sala criada! ID: ' + id);
                    }
                } else {
                    // Fallback: se a função não existir, apenas gera um ID simbólico
                    const fakeId = 'sala-' + Date.now().toString(36);
                    localStorage.setItem('ocaso_hostId', fakeId);
                    roomInfo.textContent = `🆔 ID da sala (simulado): ${fakeId}`;
                    btnCreate.style.display = 'none';
                    btnLeave.style.display = '';
                    btnCopy.style.display = '';
                    window.showToast?.('🏠 Sala simulada criada! (função P2P não disponível)');
                }
            } catch (err) {
                window.showToast?.('❌ Erro: ' + err.message);
            }
        });

        btnLeave.addEventListener('click', () => {
            if (typeof appState.destroyOnlineRoom === 'function') {
                appState.destroyOnlineRoom();
            }
            localStorage.removeItem('ocaso_hostId');
            roomInfo.textContent = 'Nenhuma sala ativa.';
            btnLeave.style.display = 'none';
            btnCreate.style.display = '';
            btnCopy.style.display = 'none';
            window.showToast?.('🚪 Saiu da sala.');
        });

        btnCopy.addEventListener('click', () => {
            const id = appState.hostId || localStorage.getItem('ocaso_hostId');
            if (id) {
                navigator.clipboard.writeText(id).then(() => {
                    window.showToast?.('📋 ID da sala copiado!');
                }).catch(() => {
                    window.showToast?.('📋 ID: ' + id);
                });
            }
        });
    } else {
        // Jogador: esconde controles de sala
        document.getElementById('roomInfo').parentElement.style.display = 'none';
    }

    // ============================================================
    // ✅ EXPORTAR (apenas dados locais)
    // ============================================================
    document.getElementById('btnExport')?.addEventListener('click', () => {
        const data = JSON.stringify(appState.data, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ocaso_${sanitized}.json`;
        a.click();
        URL.revokeObjectURL(url);
        window.showToast?.('📤 Dados exportados!');
    });

    // ============================================================
    // ✅ EXPORTAR PACOTE DO JOGADOR
    // ============================================================
    document.getElementById('btnExportPlayer')?.addEventListener('click', () => {
        if (role !== 'master') return;
        const pkg = {
            campaign: appState.get('campaign'),
            characters: (appState.get('characters') || []).filter(c => c.isPlayerCharacter),
            quests: (appState.get('quests') || []).filter(q => q.visivelJogadores)
        };
        const data = JSON.stringify(pkg, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pacote_jogador_${sanitized}.ocaso`;
        a.click();
        URL.revokeObjectURL(url);
        window.showToast?.('📦 Pacote do jogador exportado!');
    });

    // ============================================================
    // ✅ IMPORTAR
    // ============================================================
    document.getElementById('btnImport')?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.ocaso';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    Object.keys(data).forEach(key => {
                        if (key !== 'campaign') {
                            appState.set(key, data[key]);
                        }
                    });
                    window.showToast?.('📥 Campanha importada!');
                } catch (err) {
                    window.showToast?.('❌ Arquivo inválido.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    // ============================================================
    // ✅ RESET
    // ============================================================
    document.getElementById('btnReset')?.addEventListener('click', () => {
        if (role !== 'master') return;
        if (confirm('⚠️ Resetar TODOS os dados da campanha?')) {
            appState.reset();
            window.showToast?.('🗑️ Campanha resetada.');
        }
    });

    // ============================================================
    // ✅ SLOTS
    // ============================================================
    document.getElementById('btnSalvarSlot')?.addEventListener('click', () => {
        const slot = document.getElementById('slotSelector').value;
        localStorage.setItem(`ocaso_slot_${slot}`, JSON.stringify(appState.data));
        window.showToast?.('✅ Slot salvo!');
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

    // ============================================================
    // ✅ EXPORTAR PDF
    // ============================================================
    document.getElementById('btnExportCampanhaPDF')?.addEventListener('click', function() {
        const data = appState.data;
        const html = `
            <html><head><title>Campanha - ${escapeHtml(data.campaign)}</title>
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
    });

    // Helper local para escapeHtml (caso não exista)
    function escapeHtml(text) {
        if (!text) return '';
        return String(text).replace(/[&<>"']/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            if (m === '"') return '&quot;';
            if (m === "'") return '&#039;';
            return m;
        });
    }
}