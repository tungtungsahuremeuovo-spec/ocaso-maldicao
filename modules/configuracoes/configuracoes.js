import appState from '../../assets/js/app.js';
import { exportData, triggerImport } from '../../core/database/importExport.js';

export function init() {
    const role = appState.getRole();
    document.getElementById('currentRole').textContent = role === 'master' ? 'Mestre' : 'Jogador';

    document.getElementById('btnExport').addEventListener('click', () => {
        if (role === 'master') {
            exportData(appState.data, `ocaso_${appState.get('campaign').replace(/\s+/g, '_')}.json`);
        } else {
            exportData(appState.data, `minha_campanha_${appState.get('campaign').replace(/\s+/g, '_')}.json`);
        }
        window.showToast?.('📤 Dados exportados!');
    });

    const btnExportPlayer = document.getElementById('btnExportPlayer');
    if (role === 'master') {
        btnExportPlayer.style.display = '';
        btnExportPlayer.addEventListener('click', () => {
            const pkg = appState.exportPlayerPackage();
            exportData(pkg, `pacote_jogador_${appState.get('campaign').replace(/\s+/g, '_')}.ocaso`);
            window.showToast?.('📦 Pacote do jogador exportado!');
        });
    }

    document.getElementById('btnImport').addEventListener('click', () => {
        triggerImport((data) => {
            Object.keys(data).forEach(key => {
                if (key !== 'campaign') appState.set(key, data[key]);
            });
            window.showToast?.('📥 Campanha importada!');
        });
    });

    const btnReset = document.getElementById('btnReset');
    if (role === 'master') {
        btnReset.style.display = '';
        btnReset.addEventListener('click', () => {
            if (confirm('⚠️ Resetar TODOS os dados da campanha?')) {
                appState.reset();
                window.showToast?.('🗑️ Campanha resetada.');
            }
        });
    }
}