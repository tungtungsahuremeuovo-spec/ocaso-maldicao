// modules/ficha/ficha.js
import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

let periciasTemp = [];
let cicatrizesTemp = [];
let feiticosTemp = []; // array de {nome, desc}
let itensTemp = [];    // array de {nome, desc}

export function init() {
    if (!appState.get('characters')) appState.set('characters', []);
    renderFicha();
    appState.subscribe('characters', renderFicha);

    document.getElementById('btnNewFicha').addEventListener('click', showCreateForm);
    document.getElementById('btnSaveFicha').addEventListener('click', saveCharacter);
    document.getElementById('btnCancelFicha').addEventListener('click', cancelEdit);
    document.getElementById('btnAddPericia').addEventListener('click', () => addTextTag('pericia'));
    document.getElementById('btnAddCicatriz').addEventListener('click', () => addTextTag('cicatriz'));
    document.getElementById('btnAddFeitico').addEventListener('click', addFeitico);
    document.getElementById('btnAddItem').addEventListener('click', addItem);

    // Enter para adicionar rapidamente
    document.getElementById('fPericiaInput').addEventListener('keypress', e => { if (e.key === 'Enter') addTextTag('pericia'); });
    document.getElementById('fCicatrizInput').addEventListener('keypress', e => { if (e.key === 'Enter') addTextTag('cicatriz'); });
    document.getElementById('fFeiticoNome').addEventListener('keypress', e => { if (e.key === 'Enter') addFeitico(); });
    document.getElementById('fItemNome').addEventListener('keypress', e => { if (e.key === 'Enter') addItem(); });

    // Abas internas
    document.querySelectorAll('.tab-btn[data-ftab]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.ftab;
            document.querySelectorAll('.ftab-content').forEach(c => c.style.display = 'none');
            document.getElementById(`ftab-${tab}`).style.display = 'block';
            document.querySelectorAll('.tab-btn[data-ftab]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
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
        const feiticos = (char.feiticos || []).map(f => `<span class="tag blue">${escapeHtml(f.nome)}: ${escapeHtml(f.desc)}</span>`).join(' ') || 'Nenhum';
        const itens = (char.itens || []).map(i => `<span class="tag green">${escapeHtml(i.nome)}: ${escapeHtml(i.desc)}</span>`).join(' ') || 'Nenhum';
        const lore = char.lore || 'Não definida.';
        const tecnica = char.tecnica || 'Não definida.';
        const dominio = char.dominio?.nome ? `<strong>${escapeHtml(char.dominio.nome)}</strong>: ${escapeHtml(char.dominio.desc)}` : 'Não definido.';

        container.innerHTML = `
            <div class="card-item" style="flex-direction:column; align-items:flex-start;">
                <h2>${escapeHtml(char.nome)} <span class="tag purple">${escapeHtml(char.estilo)}</span> <span class="tag">${char.grau}º Grau</span></h2>
                ${char.origem ? `<p><strong>Origem:</strong> <span class="tag green">${escapeHtml(char.origem)}</span></p>` : ''}
                <p><strong>Perícias:</strong> ${pericias}</p>
                <p><strong>Cicatrizes:</strong> ${cicatrizes}</p>
                <p><strong>Ambição:</strong> ${escapeHtml(char.ambicao || 'Não definida')}</p>
                <div style="width:100%; margin-top:10px;"><span>HP: ${char.hp} / ${char.hpMax}</span><div class="bar-bg"><div class="bar-fill ${hpPct<30?'red':hpPct<60?'gold':'green'}" style="width:${hpPct}%"></div></div></div>
                <div style="width:100%; margin-top:5px;"><span>EA: ${char.ea} / ${char.eaMax}</span><div class="bar-bg"><div class="bar-fill purple" style="width:${eaPct}%"></div></div></div>
                <p style="margin-top:10px;"><strong>Lore:</strong> ${escapeHtml(lore).substring(0,100)}${lore.length > 100 ? '…' : ''}</p>
                <p><strong>Técnica Inata:</strong> ${escapeHtml(tecnica)}</p>
                <p><strong>Feitiços:</strong> ${feiticos}</p>
                <p><strong>Itens:</strong> ${itens}</p>
                <p><strong>Domínio:</strong> ${dominio}</p>
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
        container.innerHTML = '<p class="empty-state">Nenhum personagem criado.</p>';
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
    document.getElementById('fLore').value = char.lore || '';
    document.getElementById('fTecnica').value = char.tecnica || '';
    document.getElementById('fDominioNome').value = char.dominio?.nome || '';
    document.getElementById('fDominioDesc').value = char.dominio?.desc || '';
    periciasTemp = (char.pericias || '').split(',').filter(Boolean).map(s => s.trim());
    cicatrizesTemp = (char.cicatrizes || '').split(',').filter(Boolean).map(s => s.trim());
    feiticosTemp = char.feiticos ? [...char.feiticos] : [];
    itensTemp = char.itens ? [...char.itens] : [];
    renderAllTags();
    document.getElementById('btnCancelFicha').style.display = 'inline-block';
}

function clearForm() {
    ['fNome','fAmbicao','fNotas','fLore','fTecnica','fDominioNome','fDominioDesc'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('fOrigem').value = '';
    document.getElementById('fHpMax').value = 25;
    document.getElementById('fHp').value = 25;
    document.getElementById('fEaMax').value = 30;
    document.getElementById('fEa').value = 30;
    periciasTemp = [];
    cicatrizesTemp = [];
    feiticosTemp = [];
    itensTemp = [];
    renderAllTags();
}

// ---------- Tags de Perícias e Cicatrizes (texto simples) ----------
function addTextTag(type) {
    const input = document.getElementById(type === 'pericia' ? 'fPericiaInput' : 'fCicatrizInput');
    const val = input.value.trim();
    if (!val) return;
    const arr = type === 'pericia' ? periciasTemp : cicatrizesTemp;
    if (!arr.includes(val)) arr.push(val);
    input.value = '';
    renderAllTags();
}

function renderTextTags(type) {
    const containerId = type === 'pericia' ? 'fPericiasTags' : 'fCicatrizesTags';
    const arr = type === 'pericia' ? periciasTemp : cicatrizesTemp;
    const container = document.getElementById(containerId);
    container.innerHTML = arr.map((item, i) => 
        `<span class="tag ${type === 'cicatriz' ? 'red' : ''}">${escapeHtml(item)} <button class="tag-remove" data-type="${type}" data-index="${i}">×</button></span>`
    ).join('');
}

// ---------- Feitiços ----------
function addFeitico() {
    const nome = document.getElementById('fFeiticoNome').value.trim();
    const desc = document.getElementById('fFeiticoDesc').value.trim();
    if (!nome) return window.showToast?.('⚠️ Nome do feitiço obrigatório');
    feiticosTemp.push({ nome, desc });
    document.getElementById('fFeiticoNome').value = '';
    document.getElementById('fFeiticoDesc').value = '';
    renderAllTags();
}

function renderFeiticosTags() {
    const container = document.getElementById('fFeiticosTags');
    container.innerHTML = feiticosTemp.map((f, i) => 
        `<span class="tag blue">${escapeHtml(f.nome)}: ${escapeHtml(f.desc)} <button class="tag-remove" data-type="feitico" data-index="${i}">×</button></span>`
    ).join('');
}

// ---------- Itens ----------
function addItem() {
    const nome = document.getElementById('fItemNome').value.trim();
    const desc = document.getElementById('fItemDesc').value.trim();
    if (!nome) return window.showToast?.('⚠️ Nome do item obrigatório');
    itensTemp.push({ nome, desc });
    document.getElementById('fItemNome').value = '';
    document.getElementById('fItemDesc').value = '';
    renderAllTags();
}

function renderItensTags() {
    const container = document.getElementById('fItensTags');
    container.innerHTML = itensTemp.map((item, i) => 
        `<span class="tag green">${escapeHtml(item.nome)}: ${escapeHtml(item.desc)} <button class="tag-remove" data-type="item" data-index="${i}">×</button></span>`
    ).join('');
}

// ---------- Renderização unificada e remoção ----------
function renderAllTags() {
    renderTextTags('pericia');
    renderTextTags('cicatriz');
    renderFeiticosTags();
    renderItensTags();
    attachRemoveListeners();
}

function attachRemoveListeners() {
    document.querySelectorAll('.tag-remove').forEach(btn => {
        btn.removeEventListener('click', handleRemove); // evita duplicidade
        btn.addEventListener('click', handleRemove);
    });
}

function handleRemove(e) {
    const btn = e.currentTarget;
    const type = btn.dataset.type;
    const index = parseInt(btn.dataset.index, 10);
    if (type === 'pericia') periciasTemp.splice(index, 1);
    else if (type === 'cicatriz') cicatrizesTemp.splice(index, 1);
    else if (type === 'feitico') feiticosTemp.splice(index, 1);
    else if (type === 'item') itensTemp.splice(index, 1);
    renderAllTags();
}

// ---------- Salvar e Cancelar ----------
function saveCharacter() {
    const nome = document.getElementById('fNome').value.trim();
    if (!nome) return window.showToast?.('⚠️ Nome obrigatório');
    const existing = getPlayerCharacter();
    const char = {
        id: existing ? existing.id : generateId(),
        nome,
        origem: document.getElementById('fOrigem').value,
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
        lore: document.getElementById('fLore').value,
        tecnica: document.getElementById('fTecnica').value,
        feiticos: feiticosTemp,
        itens: itensTemp,
        dominio: {
            nome: document.getElementById('fDominioNome').value,
            desc: document.getElementById('fDominioDesc').value
        },
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