import appState from '../../assets/js/app.js';
import { exportData, triggerImport } from '../../core/database/importExport.js';

export function init() {
    document.getElementById('currentRole').textContent = appState.getRole() === 'master' ? 'Mestre' : 'Jogador';

    document.getElementById('btnExport').addEventListener('click', () => {
        exportData(appState.data, `ocaso_${appState.get('campaign').replace(/\s+/g, '_')}.json`);
        window.showToast?.('📤 Campanha completa exportada!');
    });

    document.getElementById('btnExportPlayer').addEventListener('click', () => {
        const pkg = appState.exportPlayerPackage();
        exportData(pkg, `pacote_jogador_${appState.get('campaign').replace(/\s+/g, '_')}.ocaso`);
        window.showToast?.('📦 Pacote do jogador exportado! Compartilhe com seus jogadores.');
    });

    document.getElementById('btnImport').addEventListener('click', () => {
        triggerImport((data) => {
            // Importação completa (apenas mestre deve usar, mas aqui permitimos)
            Object.keys(data).forEach(key => {
                if (key !== 'campaign') appState.set(key, data[key]);
            });
            window.showToast?.('📥 Campanha importada!');
        });
    });

    document.getElementById('btnReset').addEventListener('click', () => {
        if (confirm('⚠️ Resetar TODOS os dados da campanha?')) {
            appState.reset();
            window.showToast?.('🗑️ Campanha resetada.');
        }
    });
}