import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

let periciasTemp = [];
let cicatrizesTemp = [];

export function init() {
    if (!appState.get('characters')) appState.set('characters', []);
    renderFicha();
    appState.subscribe('characters', renderFicha);

    document.getElementById('btnNewFicha').addEventListener('click', showCreateForm);
    document.getElementById('btnSaveFicha').addEventListener('click', saveCharacter);
    document.getElementById('btnCancelFicha').addEventListener('click', cancelEdit);
    document.getElementById('btnAddPericia').addEventListener('click', () => addTag('pericia'));
    document.getElementById('btnAddCicatriz').addEventListener('click', () => addTag('cicatriz'));
    document.getElementById('fPericiaInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') addTag('pericia'); });
    document.getElementById('fCicatrizInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') addTag('cicatriz'); });
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
        const pericias = (char.pericias || '').split(',').filter(Boolean).map(p => `<span class="tag">${escapeHtml(p.trim())}</span>`).join(' ') || 'Nenhuma';
        const cicatrizes = (char.cicatrizes || '').split(',').filter(Boolean).map(c => `<span class="tag red">${escapeHtml(c.trim())}</span>`).join(' ') || 'Nenhuma';
        container.innerHTML = `
            <div class="card-item" style="flex-direction:column; align-items:flex-start;">
                <h2>${escapeHtml(char.nome)} <span class="tag purple">${escapeHtml(char.estilo)}</span> <span class="tag">${char.grau}º Grau</span></h2>
                ${char.origem ? `<p><strong>Origem:</strong> <span class="tag green">${escapeHtml(char.origem)}</span></p>` : ''}
                <p><strong>Perícias:</strong> ${pericias}</p>
                <p><strong>Cicatrizes:</strong> ${cicatrizes}</p>
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
                <button class="btn btn-sm mt-1" id="btnEditFicha">✏️ Editar</button>
            </div>`;
        document.getElementById('btnEditFicha').addEventListener('click', () => {
            form.style.display = 'block';
            btnNew.style.display = 'none';
            fillFormForEdit(char);
        });
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

function fillFormForEdit(char) {
    document.getElementById('formTitle').textContent = 'Editar Personagem';
    document.getElementById('fNome').value = char.nome || '';
    document.getElementById('fOrigem').value = char.origem || '';
    document.getElementById('fEstilo').value = char.estilo || 'Lutador';
    document.getElementById('fGrau').value = char.grau || '4';
    document.getElementById('fHpMax').value = char.hpMax;
    document.getElementById('fHp').value = char.hp;
    document.getElementById('fEaMax').value = char.eaMax;
    document.getElementById('fEa').value = char.ea;
    document.getElementById('fAmbicao').value = char.ambicao || '';
    document.getElementById('fNotas').value = char.notas || '';
    periciasTemp = (char.pericias || '').split(',').filter(Boolean).map(s => s.trim());
    cicatrizesTemp = (char.cicatrizes || '').split(',').filter(Boolean).map(s => s.trim());
    renderTags('pericia');
    renderTags('cicatriz');
    document.getElementById('btnCancelFicha').style.display = 'inline-block';
}

function clearForm() {
    ['fNome', 'fAmbicao', 'fNotas'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('fOrigem').value = '';
    document.getElementById('fHpMax').value = 25;
    document.getElementById('fHp').value = 25;
    document.getElementById('fEaMax').value = 30;
    document.getElementById('fEa').value = 30;
    periciasTemp = [];
    cicatrizesTemp = [];
    renderTags('pericia');
    renderTags('cicatriz');
}

function addTag(type) {
    const inputId = type === 'pericia' ? 'fPericiaInput' : 'fCicatrizInput';
    const input = document.getElementById(inputId);
    const value = input.value.trim();
    if (!value) return;
    if (type === 'pericia') {
        if (!periciasTemp.includes(value)) periciasTemp.push(value);
    } else {
        if (!cicatrizesTemp.includes(value)) cicatrizesTemp.push(value);
    }
    input.value = '';
    renderTags(type);
}

function removeTag(type, index) {
    if (type === 'pericia') {
        periciasTemp.splice(index, 1);
    } else {
        cicatrizesTemp.splice(index, 1);
    }
    renderTags(type);
}

function renderTags(type) {
    const containerId = type === 'pericia' ? 'fPericiasTags' : 'fCicatrizesTags';
    const arr = type === 'pericia' ? periciasTemp : cicatrizesTemp;
    const container = document.getElementById(containerId);
    container.innerHTML = arr.map((item, i) => 
        `<span class="tag ${type === 'cicatriz' ? 'red' : ''}">${escapeHtml(item)} <button type="button" class="tag-remove" data-type="${type}" data-index="${i}" style="background:none;border:none;color:inherit;cursor:pointer;font-weight:bold;margin-left:4px;">×</button></span>`
    ).join('');
    container.querySelectorAll('.tag-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const t = e.target.dataset.type;
            const idx = parseInt(e.target.dataset.index);
            removeTag(t, idx);
        });
    });
}

function saveCharacter() {
    const nome = document.getElementById('fNome').value.trim();
    if (!nome) return window.showToast?.('⚠️ Nome obrigatório');
    const existing = getPlayerCharacter();
    const char = {
        id: existing ? existing.id : generateId(),
        nome,
        origem: document.getElementById('fOrigem').value,
        classe: '',
        estilo: document.getElementById('fEstilo').value,
        grau: document.getElementById('fGrau').value,
        hpMax: +document.getElementById('fHpMax').value || 25,
        hp: +document.getElementById('fHp').value || 25,
        eaMax: +document.getElementById('fEaMax').value || 30,
        ea: +document.getElementById('fEa').value || 30,
        pericias: periciasTemp.join(', '),
        cicatrizes: cicatrizesTemp.join(', '),
        ambicao: document.getElementById('fAmbicao').value,
        notas: document.getElementById('fNotas').value,
        isPlayerCharacter: true
    };
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