import appState from '../../assets/js/app.js';
import { exportData, triggerImport } from '../../core/database/importExport.js';

export function init() {
    document.getElementById('btnExport').addEventListener('click', () => {
        exportData(appState.data, `ocaso_${appState.get('campaign').replace(/\s+/g, '_')}.json`);
        window.showToast?.('📤 Campanha exportada!');
    });
    document.getElementById('btnImport').addEventListener('click', () => {
        triggerImport((data) => {
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