// modules/configuracoes/configuracoes.js
import appState from '../../assets/js/app.js';

export function init() {
    const role = appState.getRole();

    // Controles de mestre
    const configMaster = document.getElementById('configMaster');
    if (role === 'master') {
        configMaster.style.display = 'block';
        carregarControlesMestre();
    } else {
        configMaster.style.display = 'none';
    }

    // Tema
    const savedTheme = localStorage.getItem('ocaso_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeSelector = document.getElementById('themeSelector');
    if (themeSelector) {
        themeSelector.value = savedTheme;
        themeSelector.addEventListener('change', function() {
            document.documentElement.setAttribute('data-theme', this.value);
            localStorage.setItem('ocaso_theme', this.value);
            appState._playSound?.('save');
        });
    }

    // Zoom (⭐ 19)
    const zoomSelector = document.getElementById('zoomSelector');
    if (zoomSelector) {
        const savedZoom = localStorage.getItem('ocaso_zoom') || '100';
        zoomSelector.value = savedZoom;
        document.documentElement.setAttribute('data-zoom', savedZoom);
        zoomSelector.addEventListener('change', function() {
            const val = this.value;
            document.documentElement.setAttribute('data-zoom', val);
            localStorage.setItem('ocaso_zoom', val);
            appState._playSound?.('save');
        });
    }

    // Sons (⭐ 23)
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        const soundEnabled = localStorage.getItem('ocaso_sound') !== 'false';
        soundToggle.checked = soundEnabled;
        soundToggle.addEventListener('change', function() {
            const val = this.checked;
            localStorage.setItem('ocaso_sound', String(val));
            if (!appState.data.settings) appState.data.settings = {};
            appState.data.settings.sound = val;
            appState._playSound?.('save');
        });
    }

    const currentRoleSpan = document.getElementById('currentRole');
    if (currentRoleSpan) {
        currentRoleSpan.textContent = role === 'master' ? '👑 Mestre' : '🎮 Jogador';
    }
}

// ============================================================
// CONFIRMAR AÇÕES PERIGOSAS (⭐ 7)
// ============================================================
window.confirmAction = function(message, onConfirm, onCancel) {
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `
        <div>
            <p style="margin-bottom:12px;">${message}</p>
            <div class="actions">
                <button class="btn" id="confirm-cancel">Cancelar</button>
                <button class="btn btn-red" id="confirm-ok">Confirmar</button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);

    dialog.querySelector('#confirm-cancel').addEventListener('click', () => {
        dialog.remove();
        if (onCancel) onCancel();
    });
    dialog.querySelector('#confirm-ok').addEventListener('click', () => {
        dialog.remove();
        if (onConfirm) onConfirm();
    });
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.remove();
            if (onCancel) onCancel();
        }
    });
    return dialog;
};

// ============================================================
// CONTROLES DO MESTRE
// ============================================================
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
        appState._showToast?.('📤 Dados exportados!', 'success');
        appState._playSound?.('save');
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
        appState._showToast?.('📦 Pacote do jogador exportado!', 'success');
        appState._playSound?.('save');
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
                        if (key !== 'campaign') {
                            appState.set(key, data[key]);
                        }
                    });
                    appState._showToast?.('📥 Campanha importada!', 'success');
                    appState._playSound?.('save');
                } catch (err) {
                    appState._showToast?.('❌ Arquivo inválido.', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    // Reset
    document.getElementById('btnReset')?.addEventListener('click', () => {
        if (appState.getRole() !== 'master') return;
        window.confirmAction('⚠️ Resetar TODOS os dados da campanha?', async () => {
            await appState.reset();
            appState._showToast?.('🗑️ Campanha resetada.', 'warning');
        });
    });

    // Sala online
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
                    appState._showToast?.('🏠 Sala criada! ID: ' + id, 'success');
                }
            } else {
                const fakeId = 'sala-' + Date.now().toString(36);
                localStorage.setItem('ocaso_hostId', fakeId);
                roomInfo.textContent = `🆔 ID da sala (simulado): ${fakeId}`;
                btnCreate.style.display = 'none';
                btnLeave.style.display = '';
                btnCopy.style.display = '';
                appState._showToast?.('🏠 Sala simulada criada!', 'info');
            }
        } catch (err) {
            appState._showToast?.('❌ Erro: ' + err.message, 'error');
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
        appState._showToast?.('🚪 Saiu da sala.', 'info');
    });

    btnCopy.addEventListener('click', () => {
        const id = appState.hostId || localStorage.getItem('ocaso_hostId');
        if (id) {
            navigator.clipboard.writeText(id).catch(() => {
                appState._showToast?.('📋 ID: ' + id, 'info');
            });
        }
    });

    // Slots
    document.getElementById('btnSalvarSlot')?.addEventListener('click', () => {
        const slot = document.getElementById('slotSelector').value;
        localStorage.setItem(`ocaso_slot_${slot}`, JSON.stringify(appState.data));
        appState._showToast?.('✅ Slot salvo!', 'success');
        appState._playSound?.('save');
    });

    document.getElementById('btnCarregarSlot')?.addEventListener('click', () => {
        const slot = document.getElementById('slotSelector').value;
        const data = localStorage.getItem(`ocaso_slot_${slot}`);
        if (!data) return appState._showToast?.('❌ Slot vazio.', 'warning');
        try {
            const parsed = JSON.parse(data);
            Object.keys(parsed).forEach(key => {
                if (key !== 'campaign') appState.set(key, parsed[key]);
            });
            appState._showToast?.('📂 Slot carregado!', 'success');
            appState._playSound?.('save');
        } catch (err) {
            appState._showToast?.('❌ Erro ao carregar slot.', 'error');
        }
    });

    // Discord
    const webhookInput = document.getElementById('discordWebhook');
    const savedWebhook = localStorage.getItem('ocaso_discord_webhook') || '';
    if (webhookInput) webhookInput.value = savedWebhook;

    document.getElementById('btnTestarWebhook')?.addEventListener('click', () => {
        const url = webhookInput.value.trim();
        if (!url) return appState._showToast?.('⚠️ Insira uma URL.', 'warning');
        localStorage.setItem('ocaso_discord_webhook', url);
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: '🧪 Teste de conexão!' })
        }).then(r => {
            if (r.ok) {
                appState._showToast?.('✅ Webhook funcionando!', 'success');
                document.getElementById('webhookStatus').textContent = '✅ Conectado';
            } else {
                appState._showToast?.('❌ Erro ao enviar.', 'error');
            }
        }).catch(() => appState._showToast?.('❌ Falha na conexão.', 'error'));
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
            appState._showToast?.('❌ Bloqueie o pop-up.', 'warning');
        }
    });
}

export function destroy() {
    // Limpeza se necessário
}