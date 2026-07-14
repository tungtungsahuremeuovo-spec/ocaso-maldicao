import appState from '../../assets/js/app.js';

export function init() {
    renderFicha();
    appState.subscribe('characters', renderFicha);
}

function renderFicha() {
    const container = document.getElementById('playerFicha');
    const chars = appState.get('characters');
    if (!chars || chars.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum personagem importado. Peça ao mestre o arquivo da campanha.</p>';
        return;
    }
    // Mostra o primeiro personagem (pode ser expandido para selecionar)
    const c = chars[0];
    const hpPct = (c.hp / c.hpMax) * 100;
    let cls = hpPct < 30 ? 'red' : hpPct < 60 ? 'gold' : 'green';
    container.innerHTML = `
        <div class="card-item" style="flex-direction:column; align-items:flex-start;">
            <h2>${c.nome} <span class="tag purple">${c.estilo}</span> <span class="tag">${c.grau}º Grau</span></h2>
            <p><strong>Classe:</strong> ${c.classe || 'Aventureiro'}</p>
            <p><strong>Perícias:</strong> ${c.pericias || 'Nenhuma'}</p>
            <p><strong>Cicatrizes:</strong> ${c.cicatrizes || 'Nenhuma'}</p>
            <p><strong>Ambição:</strong> ${c.ambicao || 'Não definida'}</p>
            <div style="width:100%; margin-top:10px;">
                <span>HP: ${c.hp} / ${c.hpMax}</span>
                <div class="bar-bg"><div class="bar-fill ${cls}" style="width:${hpPct}%"></div></div>
            </div>
            <div style="width:100%; margin-top:5px;">
                <span>EA: ${c.ea} / ${c.eaMax}</span>
                <div class="bar-bg"><div class="bar-fill purple" style="width:${(c.ea/c.eaMax)*100}%"></div></div>
            </div>
            ${c.notas ? `<p style="margin-top:10px; font-style:italic;">📝 ${c.notas}</p>` : ''}
        </div>
    `;
}