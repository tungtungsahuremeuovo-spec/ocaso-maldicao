// modules/configuracoes/configuracoes.js
import appState from '../../assets/js/app.js';

export function init() {
    const role = appState.getRole();

    // Mostra/esconde controles de mestre
    const configMaster = document.getElementById('configMaster');
    if (role === 'master') {
        configMaster.style.display = 'block';
        carregarControlesMestre();
    } else {
        configMaster.style.display = 'none';
    }

    // Tema (para todos)
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

    // Atualiza modo atual
    const currentRoleSpan = document.getElementById('currentRole');
    if (currentRoleSpan) {
        currentRoleSpan.textContent = role === 'master' ? '👑 Mestre' : '🎮 Jogador';
    }
}

function carregarControlesMestre() {
    // Exportar
    document.getElementById('btnExport')?.addEventListener('click', () => {
        const data = JSON.stringify(appState.data, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ocaso_${appState.get('campaign').replace(/\s+/g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        window.showToast?.('📤 Dados exportados!');
    });

    // Exportar pacote do jogador
    document.getElementById('btnExportPlayer')?.addEventListener('click', () => {
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
        a.download = `pacote_jogador_${appState.get('campaign').replace(/\s+/g, '_')}.ocaso`;
        a.click();
        URL.revokeObjectURL(url);
        window.showToast?.('📦 Pacote do jogador exportado!');
    });

    // Importar
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
                        if (key !== 'campaign') appState.set(key, data[key]);
                    });
                    window.showToast?.('📥 Campanha importada!');
                } catch {
                    window.showToast?.('❌ Arquivo inválido.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    // Reset
    document.getElementById('btnReset')?.addEventListener('click', () => {
        if (confirm('⚠️ Resetar TODOS os dados da campanha?')) {
            appState.reset();
            window.showToast?.('🗑️ Campanha resetada.');
        }
    });

    // Sala online...
    // (código da sala que já estava, mantido)
    const roomInfo = document.getElementById('roomInfo');
    const btnCreate = document.getElementById('btnCreateRoom');
    const btnLeave = document.getElementById('btnLeaveRoom');
    const btnCopy = document.getElementById('btnCopyRoomId');
    const savedHostId = localStorage.getItem('ocaso_hostId') || null;

    if (savedHostId) {
        appState.hostId = savedHostId;
        roomInfo.textContent = `🆔 ID da sala: ${savedHostId}`;
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
                    roomInfo.textContent = `🆔 ID da sala: ${id}`;
                    btnCreate.style.display = 'none';
                    btnLeave.style.display = '';
                    btnCopy.style.display = '';
                    window.showToast?.('🏠 Sala criada! ID: ' + id);
                }
            } else {
                const fakeId = 'sala-' + Date.now().toString(36);
                localStorage.setItem('ocaso_hostId', fakeId);
                roomInfo.textContent = `🆔 ID da sala (simulado): ${fakeId}`;
                btnCreate.style.display = 'none';
                btnLeave.style.display = '';
                btnCopy.style.display = '';
                window.showToast?.('🏠 Sala simulada criada!');
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
            navigator.clipboard.writeText(id).catch(() => {
                window.showToast?.('📋 ID: ' + id);
            });
        }
    });

    // Slots
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
        } catch {
            window.showToast?.('❌ Erro ao carregar slot.');
        }
    });

    // Discord
    const webhookInput = document.getElementById('discordWebhook');
    const savedWebhook = localStorage.getItem('ocaso_discord_webhook') || '';
    if (webhookInput) webhookInput.value = savedWebhook;

    document.getElementById('btnTestarWebhook')?.addEventListener('click', () => {
        const url = webhookInput.value.trim();
        if (!url) return window.showToast?.('⚠️ Insira uma URL.');
        localStorage.setItem('ocaso_discord_webhook', url);
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: '🧪 Teste de conexão!' })
        }).then(r => {
            if (r.ok) {
                window.showToast?.('✅ Webhook funcionando!');
                document.getElementById('webhookStatus').textContent = '✅ Conectado';
            } else {
                window.showToast?.('❌ Erro ao enviar.');
            }
        }).catch(() => window.showToast?.('❌ Falha na conexão.'));
    });

    // PDF
    document.getElementById('btnExportCampanhaPDF')?.addEventListener('click', () => {
        const data = appState.data;
        const html = `<html><head><title>Campanha - ${data.campaign}</title>
        <style>body{font-family:sans-serif;padding:20px;} h1{color:#c9a24e;}</style>
        </head><body><h1>📖 ${data.campaign}</h1>
        <div><h2>📋 Personagens</h2>${(data.characters||[]).map(c => `<li>${c.nome} - ${c.estilo} (${c.grau}º)</li>`).join('')}</div>
        <div><h2>🏴 Missões</h2>${(data.quests||[]).map(q => `<li>${q.titulo} - ${q.status}</li>`).join('')}</div>
        </body></html>`;
        const win = window.open('', '_blank', 'width=800,height=600');
        if (win) {
            win.document.write(html);
            win.document.close();
            win.focus();
            win.print();
        } else {
            window.showToast?.('❌ Bloqueie o pop-up.');
        }
    });
}