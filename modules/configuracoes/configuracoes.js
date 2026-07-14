import appState from '../../assets/js/app.js';
import { exportData, triggerImport } from '../../core/database/importExport.js';

export function init() {
    const role = appState.getRole();
    const campaignName = appState.get('campaign') || 'campanha';
    const sanitized = campaignName.replace(/\s+/g, '_');

    // Atualiza indicador de modo
    const currentRoleSpan = document.getElementById('currentRole');
    if (currentRoleSpan) {
        currentRoleSpan.textContent = role === 'master' ? '👑 Mestre' : '🎮 Jogador';
    }

    // --- Botão Exportar Campanha ---
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

    // --- Botão Exportar Pacote do Jogador (apenas mestre) ---
    const btnExportPlayer = document.getElementById('btnExportPlayer');
    if (btnExportPlayer) {
        if (role !== 'master') {
            btnExportPlayer.style.display = 'none';
        } else {
            btnExportPlayer.style.display = '';
            btnExportPlayer.addEventListener('click', () => {
                const pkg = appState.exportPlayerPackage();
                const filename = `pacote_jogador_${sanitized}.ocaso`;
                exportData(pkg, filename);
                window.showToast?.('📦 Pacote do jogador exportado!');
            });
        }
    }

    // --- Botão Importar Campanha ---
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

    // --- Botão Resetar Tudo (apenas mestre) ---
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

    // --- Controles de Sala Online (apenas mestre) ---
    const roomControls = document.getElementById('roomControls');
    const roomInfo = document.getElementById('roomInfo');
    const btnCreate = document.getElementById('btnCreateRoom');
    const btnLeave = document.getElementById('btnLeaveRoom');

    if (role === 'master') {
        // Mostra o container
        if (roomControls) roomControls.style.display = 'block';

        // Verifica se já existe uma sala salva (hostId)
        const savedHostId = localStorage.getItem('ocaso_hostId') || null;
        if (savedHostId && appState.hostId) {
            if (roomInfo) {
                roomInfo.textContent = `🆔 ID da sala: ${savedHostId} (copie e envie para os jogadores)`;
            }
            if (btnLeave) btnLeave.style.display = '';
            if (btnCreate) btnCreate.style.display = 'none';
        } else {
            if (roomInfo) roomInfo.textContent = 'Nenhuma sala criada.';
            if (btnLeave) btnLeave.style.display = 'none';
            if (btnCreate) btnCreate.style.display = '';
        }

        // Criar sala
        if (btnCreate) {
            btnCreate.addEventListener('click', async () => {
                try {
                    const id = await appState.createOnlineRoom();
                    if (id) {
                        if (roomInfo) roomInfo.textContent = `🆔 ID da sala: ${id} (copie e envie para os jogadores)`;
                        btnCreate.style.display = 'none';
                        btnLeave.style.display = '';
                        window.showToast?.('🏠 Sala criada! ID: ' + id);
                    } else {
                        window.showToast?.('❌ Erro ao criar sala.');
                    }
                } catch (err) {
                    window.showToast?.('❌ Erro: ' + err.message);
                }
            });
        }

        // Sair da sala
        if (btnLeave) {
            btnLeave.addEventListener('click', () => {
                appState.destroyOnlineRoom();
                if (roomInfo) roomInfo.textContent = 'Nenhuma sala criada.';
                btnLeave.style.display = 'none';
                btnCreate.style.display = '';
                window.showToast?.('🚪 Saiu da sala.');
            });
        }
    } else {
        // Jogador: esconde tudo relacionado a sala
        if (roomControls) roomControls.style.display = 'none';
    }
}