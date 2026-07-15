import appState from '../../assets/js/app.js';

export function init() {
    if (!appState.get('faccoes')) appState.set('faccoes', []);
    renderFaccoes();
    if (appState.getRole() === 'master') {
        document.getElementById('btnAddFaccao').style.display = '';
        document.getElementById('btnAddFaccao').addEventListener('click', () => {
            document.getElementById('modalFaccao').style.display = 'block';
        });
        document.getElementById('btnSalvarFaccao').addEventListener('click', salvarFaccao);
    }
    appState.subscribe('faccoes', renderFaccoes);
}

function renderFaccoes() {
    const faccoes = appState.get('faccoes');
    document.getElementById('faccoesList').innerHTML = faccoes.map((f, i) => `
        <div class="card-item">
            <div class="card-info">
                <strong>${f.nome}</strong> - Afinidade: ${f.afinidade}/5
                <div>${f.desc}</div>
            </div>
            ${appState.getRole()==='master' ? `<button class="btn btn-red btn-sm" onclick="window._removeFaccao(${i})">🗑️</button>` : ''}
        </div>
    `).join('') || '<p class="empty-state">Nenhuma facção cadastrada.</p>';
    window._removeFaccao = (idx) => {
        const arr = appState.get('faccoes');
        arr.splice(idx, 1);
        appState.set('faccoes', arr);
    };
}

function salvarFaccao() {
    const nome = document.getElementById('faccaoNome').value.trim();
    if (!nome) return;
    const afinidade = parseInt(document.getElementById('faccaoAfinidade').value);
    const desc = document.getElementById('faccaoDesc').value;
    appState.set('faccoes', [...appState.get('faccoes'), { nome, afinidade, desc }]);
    document.getElementById('modalFaccao').style.display = 'none';
    document.getElementById('faccaoNome').value = '';
    document.getElementById('faccaoDesc').value = '';
}