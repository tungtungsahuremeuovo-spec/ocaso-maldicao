import appState from '../../assets/js/app.js';
import { exportData, triggerImport } from '../../core/database/importExport.js';

export function init() {
    const role = appState.getRole();
    document.getElementById('currentRole').textContent = role === 'master' ? 'Mestre' : 'Jogador';

    // Sempre mostra export (se for mestre, exporta completo; jogador não deveria exportar, mas pode ser útil)
    document.getElementById('btnExport').addEventListener('click', () => {
        if (role === 'master') {
            exportData(appState.data, `ocaso_${appState.get('campaign').replace(/\s+/g, '_')}.json`);
        } else {
            exportData(appState.data, `minha_campanha_${appState.get('campaign').replace(/\s+/g, '_')}.json`);
        }
        window.showToast?.('📤 Dados exportados!');
    });

    // Botão "Exportar Pacote do Jogador" só aparece para mestre
    const btnExportPlayer = document.getElementById('btnExportPlayer');
    if (role !== 'master') {
        btnExportPlayer.style.display = 'none';
    } else {
        btnExportPlayer.addEventListener('click', () => {
            const pkg = appState.exportPlayerPackage();
            exportData(pkg, `pacote_jogador_${appState.get('campaign').replace(/\s+/g, '_')}.ocaso`);
            window.showToast?.('📦 Pacote do jogador exportado! Compartilhe com seus jogadores.');
        });
    }

    // Importar: jogador pode importar um novo pacote (útil se o mestre atualizar)
    document.getElementById('btnImport').addEventListener('click', () => {
        triggerImport((data) => {
            Object.keys(data).forEach(key => {
                if (key !== 'campaign') appState.set(key, data[key]);
            });
            window.showToast?.('📥 Campanha importada!');
        });
    });

    // Reset: apenas mestre vê
    const btnReset = document.getElementById('btnReset');
    if (role !== 'master') {
        btnReset.style.display = 'none';
    } else {
        btnReset.addEventListener('click', () => {
            if (confirm('⚠️ Resetar TODOS os dados da campanha?')) {
                appState.reset();
                window.showToast?.('🗑️ Campanha resetada.');
            }
        });
    }
}