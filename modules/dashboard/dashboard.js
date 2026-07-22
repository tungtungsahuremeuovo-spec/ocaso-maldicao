// modules/dashboard/dashboard.js
import { BaseModule } from '../../core/module.js';
import appState from '../../assets/js/app.js';

class DashboardModule extends BaseModule {
    init() {
        // Garante que não haja listeners duplicados
        this.destroy();

        super.init(); // marca como inicializado

        this.atualizarContadores();

        // Registra listeners com a classe base (com bind para manter this)
        this.on('characters', this.atualizarContadores.bind(this));
        this.on('quests', this.atualizarContadores.bind(this));
        this.on('combat', this.atualizarContadores.bind(this));
        this.on('npcs', this.atualizarContadores.bind(this));

        console.log('📊 Dashboard inicializado.');
    }

    /**
     * Atualiza todos os contadores e estatísticas da dashboard
     * Usa updateElement() para segurança contra elementos ausentes
     */
    atualizarContadores = () => {
        // Busca dados atualizados
        const chars = appState.get('characters') || [];
        const quests = appState.get('quests') || [];
        const combat = appState.get('combat') || { combatants: [] };
        const npcs = appState.get('npcs') || [];

        // Atualiza contadores individuais (cada um com segurança)
        this.updateElement('personagensCount', chars.length);
        this.updateElement('missoesCount', quests.length);
        this.updateElement('combatesCount', combat.combatants?.length || 0);
        this.updateElement('npcsCount', npcs.length);

        // Estatísticas detalhadas (com HTML)
        const totalMissoes = quests.length;
        const concluidas = quests.filter(q => q.status === 'Concluída').length;
        const bfTotal = chars.reduce((sum, c) => sum + (c.blackFlashCount || 0), 0);
        const danoTotal = chars.reduce((sum, c) => sum + (c.danoTotal || 0), 0);

        const estatisticasHTML = `
            📋 Missões: ${totalMissoes} (${concluidas} concluídas)<br>
            👥 Personagens: ${chars.length}<br>
            🧟 NPCs: ${npcs.length}<br>
            ⚔️ Combatentes em campo: ${combat.combatants?.length || 0}<br>
            ⚡ Black Flashes totais: ${bfTotal}<br>
            💥 Dano total causado: ${danoTotal}
        `;

        // Atualiza estatísticas com método 'html'
        this.updateElement('estatisticasText', estatisticasHTML, 'html');
    };
}

// Instância única
const dashboard = new DashboardModule();

// Funções que o bootstrap.js espera
export function init() {
    dashboard.init();
}

export function destroy() {
    dashboard.destroy();
}