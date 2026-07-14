import appState from '../../assets/js/app.js';
import { exportData, triggerImport } from '../../core/database/importExport.js';

export function init() {
    const role = appState.getRole();
    const campaignName = appState.get('campaign') || 'campanha';
    const sanitizedCampaign = campaignName.replace(/\s+/g, '_');

    // Atualiza o indicador de modo atual
    const currentRoleSpan = document.getElementById('currentRole');
    if (currentRoleSpan) {
        currentRoleSpan.textContent = role === 'master' ? '👑 Mestre' : '🎮 Jogador';
    }

    // --- Botão Exportar Campanha ---
    const btnExport = document.getElementById('btnExport');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const filename = role === 'master'
                ? `ocaso_${sanitizedCampaign}.json`
                : `minha_campanha_${sanitizedCampaign}.json`;
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
            btnExportPlayer.addEventListener('click', () => {
                const pkg = appState.exportPlayerPackage();
                const filename = `pacote_jogador_${sanitizedCampaign}.ocaso`;
                exportData(pkg, filename);
                window.showToast?.('📦 Pacote do jogador exportado! Compartilhe com seus jogadores.');
            });
        }
    }

    // --- Botão Importar Campanha ---
    const btnImport = document.getElementById('btnImport');
    if (btnImport) {
        btnImport.addEventListener('click', () => {
            triggerImport((data) => {
                // Importa todas as chaves, exceto 'campaign' (mantém o nome atual)
                Object.keys(data).forEach(key => {
                    if (key !== 'campaign') {
                        appState.set(key, data[key]);
                    }
                });
                window.showToast?.('📥 Campanha importada com sucesso!');
            });
        });
    }

    // --- Botão Resetar Tudo (apenas mestre) ---
    const btnReset = document.getElementById('btnReset');
    if (btnReset) {
        if (role !== 'master') {
            btnReset.style.display = 'none';
        } else {
            btnReset.addEventListener('click', () => {
                if (confirm('⚠️ Tem certeza que deseja resetar TODOS os dados da campanha? Esta ação não pode ser desfeita.')) {
                    appState.reset();
                    window.showToast?.('🗑️ Campanha resetada. Recarregue a página para ver os efeitos.');
                }
            });
        }
    }
}