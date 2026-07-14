import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

export function init() {
    // Garante que o jogador tenha apenas 1 personagem (isPlayerCharacter = true)
    if (!appState.get('characters')) appState.set('characters', []);
    renderFicha();
    appState.subscribe('characters', renderFicha);

    document.getElementById('btnNewFicha').addEventListener('click', showCreateForm);
    document.getElementById('btnSaveFicha').addEventListener('click', saveCharacter);
    document.getElementById('btnCancelFicha').addEventListener('click', cancelEdit);
}

function getPlayerCharacter() {
    return appState.get('characters').find(c => c.isPlayerCharacter) || null;
}

function renderFicha() {
    const container = document.getElementById('playerFicha');
    const char = getPlayerCharacter();
    const btnNew = document.getElementById('btnNewFicha');
    const form = document.getElementById('fichaForm');

    if (char) {
        const hpPct = (char.hp / char.hpMax) * 100;
        const eaPct = (char.ea / char.eaMax) * 100;
        container.innerHTML = `
            <div class="card-item" style="flex-direction:column; align-items:flex-start;">
                <h2>${escapeHtml(char.nome)} <span class="tag purple">${escapeHtml(char.estilo)}</span> <span class="tag">${char.grau}º Grau</span></h2>
                <p><strong>Classe:</strong> ${escapeHtml(char.classe)}</p>
                <p><strong>Perícias:</strong> ${escapeHtml(char.pericias || 'Nenhuma')}</p>
                <p><strong>Cicatrizes:</strong> ${escapeHtml(char.cicatrizes || 'Nenhuma')}</p>
                <p><strong>Ambição:</strong> ${escapeHtml(char.ambicao || 'Não definida')}</p>
                <div style="width:100%; margin-top:10px;">
                    <span>HP: ${char.hp} / ${char.hpMax}</span>
                    <div class="bar-bg"><div class="bar-fill ${hpPct < 30 ? 'red' : hpPct < 60 ? 'gold' : 'green'}" style="width:${hpPct}%"></div></div>
                </div>
                <div style="width:100%; margin-top:5px;">
                    <span>EA: ${char.ea} / ${char.eaMax}</span>
                    <div class="bar-bg"><div class="bar-fill purple" style="width:${eaPct}%"></div></div>
                </div>
                ${char.notas ? `<p style="margin-top:10px; font-style:italic;">📝 ${escapeHtml(char.notas)}</p>` : ''}
                <button class="btn btn-sm mt-1" onclick="document.getElementById('fichaForm').style.display='block'; document.getElementById('btnNewFicha').style.display='none'; fillFormForEdit();">✏️ Editar</button>
            </div>`;
        btnNew.style.display = 'none';
        form.style.display = 'none';
    } else {
        container.innerHTML = '<p class="empty-state">Nenhum personagem criado. Clique em "Criar Personagem" para começar.</p>';
        btnNew.style.display = 'block';
        form.style.display = 'none';
    }
}

function showCreateForm() {
    document.getElementById('fichaForm').style.display = 'block';
    document.getElementById('btnNewFicha').style.display = 'none';
    document.getElementById('formTitle').textContent = 'Criar Personagem';
    clearForm();
    document.getElementById('btnCancelFicha').style.display = 'inline-block';
}

function fillFormForEdit() {
    const char = getPlayerCharacter();
    if (!char) return;
    document.getElementById('formTitle').textContent = 'Editar Personagem';
    document.getElementById('fNome').value = char.nome;
    document.getElementById('fClasse').value = char.classe;
    document.getElementById('fEstilo').value = char.estilo;
    document.getElementById('fGrau').value = char.grau;
    document.getElementById('fHpMax').value = char.hpMax;
    document.getElementById('fHp').value = char.hp;
    document.getElementById('fEaMax').value = char.eaMax;
    document.getElementById('fEa').value = char.ea;
    document.getElementById('fPericias').value = char.pericias || '';
    document.getElementById('fCicatrizes').value = char.cicatrizes || '';
    document.getElementById('fAmbicao').value = char.ambicao || '';
    document.getElementById('fNotas').value = char.notas || '';
    document.getElementById('btnCancelFicha').style.display = 'inline-block';
}

function clearForm() {
    ['fNome', 'fClasse', 'fPericias', 'fCicatrizes', 'fAmbicao', 'fNotas'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('fHpMax').value = 25;
    document.getElementById('fHp').value = 25;
    document.getElementById('fEaMax').value = 30;
    document.getElementById('fEa').value = 30;
}

function saveCharacter() {
    const nome = document.getElementById('fNome').value.trim();
    if (!nome) return window.showToast?.('⚠️ Nome obrigatório');

    const char = {
        id: getPlayerCharacter()?.id || generateId(), // mantém ID se estiver editando
        nome,
        classe: document.getElementById('fClasse').value,
        estilo: document.getElementById('fEstilo').value,
        grau: document.getElementById('fGrau').value,
        hpMax: +document.getElementById('fHpMax').value || 25,
        hp: +document.getElementById('fHp').value || 25,
        eaMax: +document.getElementById('fEaMax').value || 30,
        ea: +document.getElementById('fEa').value || 30,
        pericias: document.getElementById('fPericias').value,
        cicatrizes: document.getElementById('fCicatrizes').value,
        ambicao: document.getElementById('fAmbicao').value,
        notas: document.getElementById('fNotas').value,
        isPlayerCharacter: true
    };

    // Substitui o personagem existente ou adiciona
    const chars = appState.get('characters').filter(c => !c.isPlayerCharacter);
    chars.push(char);
    appState.set('characters', chars);
    window.showToast?.('✅ Personagem salvo!');
    document.getElementById('fichaForm').style.display = 'none';
    document.getElementById('btnNewFicha').style.display = 'none';
    renderFicha();
}

function cancelEdit() {
    document.getElementById('fichaForm').style.display = 'none';
    document.getElementById('btnNewFicha').style.display = getPlayerCharacter() ? 'none' : 'block';
    renderFicha();
}