// modules/ficha/ficha.js
import appState from '../../assets/js/app.js';
import { generateId, escapeHtml } from '../../core/utils/utils.js';

let periciasTemp = [];
let cicatrizesTemp = [];
let feiticosTemp = [];
let itensTemp = [];
let aliadosTemp = [];
let votosTemp = [];
let avatarBase64 = null;

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
    document.getElementById('btnAddAliado').addEventListener('click', addAliado);
    document.getElementById('btnAddVoto').addEventListener('click', addVoto);
    document.getElementById('btnExportPDF').addEventListener('click', exportPDF);
    document.getElementById('btnRemoveAvatar').addEventListener('click', removeAvatar);

    // Avatar
    const avatarInput = document.getElementById('fAvatar');
    const avatarPreview = document.getElementById('fAvatarPreview');
    avatarPreview.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', handleAvatarUpload);

    // Fôlego automático para Restringido
    document.getElementById('fEstilo').addEventListener('change', updateFolegoVisibility);
    updateFolegoVisibility();

    // Enter para adicionar rapidamente
    document.getElementById('fPericiaInput').addEventListener('keypress', e => { if (e.key === 'Enter') addTextTag('pericia'); });
    document.getElementById('fCicatrizInput').addEventListener('keypress', e => { if (e.key === 'Enter') addTextTag('cicatriz'); });
    document.getElementById('fFeiticoNome').addEventListener('keypress', e => { if (e.key === 'Enter') addFeitico(); });
    document.getElementById('fItemNome').addEventListener('keypress', e => { if (e.key === 'Enter') addItem(); });
    document.getElementById('fAliadoNome').addEventListener('keypress', e => { if (e.key === 'Enter') addAliado(); });
    document.getElementById('fVotoNome').addEventListener('keypress', e => { if (e.key === 'Enter') addVoto(); });

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

function updateFolegoVisibility() {
    const estilo = document.getElementById('fEstilo').value;
    const folegoInput = document.getElementById('fFolego');
    if (estilo === 'Restringido') {
        folegoInput.disabled = false;
        folegoInput.style.opacity = '1';
    } else {
        folegoInput.disabled = true;
        folegoInput.style.opacity = '0.5';
    }
}

function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        avatarBase64 = ev.target.result;
        document.getElementById('fAvatarPreview').src = avatarBase64;
        document.getElementById('btnRemoveAvatar').style.display = '';
    };
    reader.readAsDataURL(file);
}

function removeAvatar() {
    avatarBase64 = null;
    document.getElementById('fAvatarPreview').src = '';
    document.getElementById('btnRemoveAvatar').style.display = 'none';
}

function getPlayerCharacter() {
    return appState.get('characters').find(c => c.isPlayerCharacter) || null;
}

function renderFicha() {
    const container = document.getElementById('playerFicha');
    const char = getPlayerCharacter();
    const btnNew = document.getElementById('btnNewFicha');
    const form = document.getElementById('fichaForm');
    const btnExport = document.getElementById('btnExportPDF');

    if (char) {
        const hpPct = (char.hp / char.hpMax) * 100;
        const eaPct = (char.ea / char.eaMax) * 100;
        const pericias = (char.pericias || '').split(',').filter(Boolean).map(p => `<span class="tag">${escapeHtml(p.trim())}</span>`).join(' ') || 'Nenhuma';
        const cicatrizes = (char.cicatrizes || '').split(',').filter(Boolean).map(c => `<span class="tag red">${escapeHtml(c.trim())}</span>`).join(' ') || 'Nenhuma';
        const feiticos = (char.feiticos || []).map(f => `<span class="tag blue">${escapeHtml(f.nome)}: ${escapeHtml(f.desc)}</span>`).join(' ') || 'Nenhum';
        const itens = (char.itens || []).map(i => `<span class="tag green">${escapeHtml(i.nome)}: ${escapeHtml(i.desc)}</span>`).join(' ') || 'Nenhum';
        const aliados = (char.aliados || []).map(a => `<span class="tag">${escapeHtml(a.nome)} (${escapeHtml(a.relacao)})</span>`).join(' ') || 'Nenhum';
        const votos = (char.votos || []).map(v => `<span class="tag purple">${escapeHtml(v.nome)}: ${escapeHtml(v.desc)}</span>`).join(' ') || 'Nenhum';
        const statusBadge = { na_escola: '🏫 Na Escola', em_missao: '⚔️ Em Missão', ferido: '🏥 Ferido', ausente: '❓ Ausente' }[char.status] || '🏫 Na Escola';
        const exaustaoBar = char.exaustao > 0 ? `<span style="color:var(--red);">⚠️ Exaustão: ${char.exaustao}/5</span>` : '';

        container.innerHTML = `
            <div class="card-item" style="flex-direction:column; align-items:flex-start;">
                <div style="display:flex; align-items:center; gap:12px; width:100%;">
                    ${char.avatar ? `<img src="${char.avatar}" style="width:60px; height:60px; border-radius:50%; object-fit:cover;">` : ''}
                    <div>
                        <h2>${escapeHtml(char.nome)} <span class="tag purple">${escapeHtml(char.estilo)}</span> <span class="tag">${char.grau}º Grau</span> <span class="tag green">${statusBadge}</span></h2>
                        ${char.origem ? `<p><strong>Origem:</strong> <span class="tag green">${escapeHtml(char.origem)}</span></p>` : ''}
                    </div>
                </div>
                ${exaustaoBar ? `<p>${exaustaoBar}</p>` : ''}
                <p><strong>Perícias:</strong> ${pericias}</p>
                <p><strong>Cicatrizes:</strong> ${cicatrizes}</p>
                <p><strong>Ambição:</strong> ${escapeHtml(char.ambicao || 'Não definida')}</p>
                <div style="width:100%; margin-top:10px;"><span>HP: ${char.hp} / ${char.hpMax}</span><div class="bar-bg"><div class="bar-fill ${hpPct<30?'red':hpPct<60?'gold':'green'}" style="width:${hpPct}%"></div></div></div>
                <div style="width:100%; margin-top:5px;"><span>EA: ${char.ea} / ${char.eaMax}</span><div class="bar-bg"><div class="bar-fill purple" style="width:${eaPct}%"></div></div></div>
                ${char.estilo === 'Restringido' ? `<div style="width:100%; margin-top:5px;"><span>Fôlego: ${char.folego || 0}</span><div class="bar-bg"><div class="bar-fill" style="width:${(char.folego||0)/30*100}%; background:var(--blue);"></div></div></div>` : ''}
                <p style="margin-top:10px;"><strong>Lore:</strong> ${escapeHtml(char.lore || '').substring(0,100)}${(char.lore||'').length > 100 ? '…' : ''}</p>
                <p><strong>Aparência:</strong> ${escapeHtml(char.aparencia || '').substring(0,80)}</p>
                <p><strong>Clã:</strong> ${escapeHtml(char.cla || 'Nenhum')}</p>
                <p><strong>Técnica Inata:</strong> ${escapeHtml(char.tecnica || 'Não definida')}</p>
                <p><strong>Feitiços:</strong> ${feiticos}</p>
                <p><strong>Votos:</strong> ${votos}</p>
                <p><strong>Itens:</strong> ${itens}</p>
                <p><strong>Aliados:</strong> ${aliados}</p>
                <p><strong>Domínio:</strong> ${char.dominio?.nome ? `<strong>${escapeHtml(char.dominio.nome)}</strong>: ${escapeHtml(char.dominio.desc)}` : 'Não definido'}</p>
                <p><strong>Medos:</strong> ${escapeHtml(char.medos || 'Nenhum')}</p>
                <p><strong>Nível de Poder:</strong> ${char.nivelPoder || 1}</p>
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
        btnExport.style.display = '';
    } else {
        container.innerHTML = '<p class="empty-state">Nenhum personagem criado.</p>';
        btnNew.style.display = 'block';
        form.style.display = 'none';
        btnExport.style.display = 'none';
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
    document.getElementById('fStatus').value = char.status || 'na_escola';
    document.getElementById('fHpMax').value = char.hpMax;
    document.getElementById('fHp').value = char.hp;
    document.getElementById('fEaMax').value = char.eaMax;
    document.getElementById('fEa').value = char.ea;
    document.getElementById('fFolego').value = char.folego || 30;
    document.getElementById('fExaustao').value = char.exaustao || 0;
    document.getElementById('fNivelPoder').value = char.nivelPoder || 1;
    document.getElementById('fAmbicao').value = char.ambicao || '';
    document.getElementById('fMedos').value = char.medos || '';
    document.getElementById('fNotas').value = char.notas || '';
    document.getElementById('fLore').value = char.lore || '';
    document.getElementById('fAparencia').value = char.aparencia || '';
    document.getElementById('fCla').value = char.cla || '';
    document.getElementById('fTecnica').value = char.tecnica || '';
    document.getElementById('fDominioNome').value = char.dominio?.nome || '';
    document.getElementById('fDominioDesc').value = char.dominio?.desc || '';

    periciasTemp = (char.pericias || '').split(',').filter(Boolean).map(s => s.trim());
    cicatrizesTemp = (char.cicatrizes || '').split(',').filter(Boolean).map(s => s.trim());
    feiticosTemp = char.feiticos ? [...char.feiticos] : [];
    itensTemp = char.itens ? [...char.itens] : [];
    aliadosTemp = char.aliados ? [...char.aliados] : [];
    votosTemp = char.votos ? [...char.votos] : [];
    avatarBase64 = char.avatar || null;

    if (avatarBase64) {
        document.getElementById('fAvatarPreview').src = avatarBase64;
        document.getElementById('btnRemoveAvatar').style.display = '';
    } else {
        document.getElementById('fAvatarPreview').src = '';
        document.getElementById('btnRemoveAvatar').style.display = 'none';
    }

    renderAllTags();
    renderHistorico(char);
    updateFolegoVisibility();
    document.getElementById('btnCancelFicha').style.display = 'inline-block';
}

function clearForm() {
    ['fNome','fAmbicao','fMedos','fNotas','fLore','fAparencia','fCla','fTecnica','fDominioNome','fDominioDesc'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('fOrigem').value = '';
    document.getElementById('fHpMax').value = 25;
    document.getElementById('fHp').value = 25;
    document.getElementById('fEaMax').value = 30;
    document.getElementById('fEa').value = 30;
    document.getElementById('fFolego').value = 30;
    document.getElementById('fExaustao').value = 0;
    document.getElementById('fNivelPoder').value = 1;
    document.getElementById('fStatus').value = 'na_escola';
    periciasTemp = [];
    cicatrizesTemp = [];
    feiticosTemp = [];
    itensTemp = [];
    aliadosTemp = [];
    votosTemp = [];
    avatarBase64 = null;
    document.getElementById('fAvatarPreview').src = '';
    document.getElementById('btnRemoveAvatar').style.display = 'none';
    renderAllTags();
    document.getElementById('fHistoricoList').innerHTML = '';
}

// ========== TAGS ==========

// Texto simples (perícias, cicatrizes)
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

// Feitiços
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

// Itens
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

// Aliados
function addAliado() {
    const nome = document.getElementById('fAliadoNome').value.trim();
    const relacao = document.getElementById('fAliadoRelacao').value.trim();
    if (!nome) return window.showToast?.('⚠️ Nome do aliado obrigatório');
    aliadosTemp.push({ nome, relacao });
    document.getElementById('fAliadoNome').value = '';
    document.getElementById('fAliadoRelacao').value = '';
    renderAllTags();
}

function renderAliadosTags() {
    const container = document.getElementById('fAliadosTags');
    container.innerHTML = aliadosTemp.map((a, i) =>
        `<span class="tag">${escapeHtml(a.nome)} (${escapeHtml(a.relacao)}) <button class="tag-remove" data-type="aliado" data-index="${i}">×</button></span>`
    ).join('');
}

// Votos
function addVoto() {
    const nome = document.getElementById('fVotoNome').value.trim();
    const desc = document.getElementById('fVotoDesc').value.trim();
    if (!nome) return window.showToast?.('⚠️ Nome do voto obrigatório');
    votosTemp.push({ nome, desc });
    document.getElementById('fVotoNome').value = '';
    document.getElementById('fVotoDesc').value = '';
    renderAllTags();
}

function renderVotosTags() {
    const container = document.getElementById('fVotosTags');
    container.innerHTML = votosTemp.map((v, i) =>
        `<span class="tag purple">${escapeHtml(v.nome)}: ${escapeHtml(v.desc)} <button class="tag-remove" data-type="voto" data-index="${i}">×</button></span>`
    ).join('');
}

// Renderização unificada e remoção
function renderAllTags() {
    renderTextTags('pericia');
    renderTextTags('cicatriz');
    renderFeiticosTags();
    renderItensTags();
    renderAliadosTags();
    renderVotosTags();
    attachRemoveListeners();
}

function attachRemoveListeners() {
    document.querySelectorAll('.tag-remove').forEach(btn => {
        btn.removeEventListener('click', handleRemove);
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
    else if (type === 'aliado') aliadosTemp.splice(index, 1);
    else if (type === 'voto') votosTemp.splice(index, 1);
    renderAllTags();
}

// ========== HISTÓRICO ==========
function renderHistorico(char) {
    const history = char.history || [];
    const container = document.getElementById('fHistoricoList');
    if (history.length === 0) {
        container.innerHTML = '<p style="color:var(--text-dim);">Nenhuma alteração registrada.</p>';
        return;
    }
    container.innerHTML = history.slice().reverse().map(h => {
        const date = new Date(h.timestamp).toLocaleString('pt-BR');
        const changes = h.changes.map(c => `${c.field}: "${c.old}" → "${c.new}"`).join('; ');
        return `<div style="margin-bottom:6px; padding:4px 0; border-bottom:1px solid var(--border);">
            <strong>${date}</strong><br>${escapeHtml(changes)}
        </div>`;
    }).join('');
}

// ========== SALVAR ==========
async function saveCharacter() {
    const nome = document.getElementById('fNome').value.trim();
    if (!nome) return window.showToast?.('⚠️ Nome obrigatório');
    const existing = getPlayerCharacter();

    const newChar = {
        id: existing ? existing.id : generateId(),
        nome,
        origem: document.getElementById('fOrigem').value,
        estilo: document.getElementById('fEstilo').value,
        grau: document.getElementById('fGrau').value,
        status: document.getElementById('fStatus').value,
        hpMax: +document.getElementById('fHpMax').value || 25,
        hp: +document.getElementById('fHp').value || 25,
        eaMax: +document.getElementById('fEaMax').value || 30,
        ea: +document.getElementById('fEa').value || 30,
        folego: +document.getElementById('fFolego').value || 30,
        exaustao: +document.getElementById('fExaustao').value || 0,
        nivelPoder: +document.getElementById('fNivelPoder').value || 1,
        pericias: periciasTemp.join(', '),
        cicatrizes: cicatrizesTemp.join(', '),
        ambicao: document.getElementById('fAmbicao').value,
        medos: document.getElementById('fMedos').value,
        notas: document.getElementById('fNotas').value,
        lore: document.getElementById('fLore').value,
        aparencia: document.getElementById('fAparencia').value,
        cla: document.getElementById('fCla').value,
        tecnica: document.getElementById('fTecnica').value,
        feiticos: feiticosTemp,
        itens: itensTemp,
        aliados: aliadosTemp,
        votos: votosTemp,
        dominio: {
            nome: document.getElementById('fDominioNome').value,
            desc: document.getElementById('fDominioDesc').value
        },
        avatar: avatarBase64 || '',
        isPlayerCharacter: true,
        history: existing ? [...(existing.history || [])] : []
    };

    // Registra alterações no histórico
    if (existing) {
        const changes = [];
        const fieldsToCompare = [
            'nome','origem','estilo','grau','status','hpMax','hp','eaMax','ea',
            'folego','exaustao','nivelPoder','ambicao','medos','notas','lore',
            'aparencia','cla','tecnica'
        ];
        fieldsToCompare.forEach(field => {
            const oldVal = existing[field] !== undefined ? String(existing[field]) : '';
            const newVal = newChar[field] !== undefined ? String(newChar[field]) : '';
            if (oldVal !== newVal) {
                changes.push({ field, old: oldVal || '(vazio)', new: newVal || '(vazio)' });
            }
        });
        // Compara arrays complexos
        if (JSON.stringify(existing.feiticos) !== JSON.stringify(newChar.feiticos)) {
            changes.push({ field: 'feiticos', old: `${(existing.feiticos||[]).length} feitiços`, new: `${newChar.feiticos.length} feitiços` });
        }
        if (JSON.stringify(existing.itens) !== JSON.stringify(newChar.itens)) {
            changes.push({ field: 'itens', old: `${(existing.itens||[]).length} itens`, new: `${newChar.itens.length} itens` });
        }
        if (JSON.stringify(existing.aliados) !== JSON.stringify(newChar.aliados)) {
            changes.push({ field: 'aliados', old: `${(existing.aliados||[]).length} aliados`, new: `${newChar.aliados.length} aliados` });
        }
        if (JSON.stringify(existing.votos) !== JSON.stringify(newChar.votos)) {
            changes.push({ field: 'votos', old: `${(existing.votos||[]).length} votos`, new: `${newChar.votos.length} votos` });
        }
        if (existing.avatar !== newChar.avatar) {
            changes.push({ field: 'avatar', old: existing.avatar ? 'com avatar' : 'sem avatar', new: newChar.avatar ? 'com avatar' : 'sem avatar' });
        }
        if (changes.length) {
            newChar.history.push({ timestamp: Date.now(), changes });
        }
    }

    const chars = appState.get('characters').filter(c => !c.isPlayerCharacter);
    chars.push(newChar);
    appState.set('characters', chars);

    // ✅ LOG – adicionado aqui
    appState.logAction(`📋 Personagem "${nome}" ${existing ? 'atualizado' : 'criado'}.`);

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

// ========== EXPORTAR PDF ==========
function exportPDF() {
    const char = getPlayerCharacter();
    if (!char) return;
    const original = document.getElementById('playerFicha').innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
        <html><head><title>Ficha - ${escapeHtml(char.nome)}</title>
        <style>
            body{font-family:sans-serif;padding:20px;color:#333;background:#fff;}
            .tag{display:inline-block;padding:2px 8px;border-radius:4px;margin:2px;font-size:0.8rem;background:#eee;border:1px solid #ccc;}
            .tag.red{background:#fdd;border-color:#f99;}
            .tag.green{background:#dfd;border-color:#9c9;}
            .tag.blue{background:#ddf;border-color:#99f;}
            .tag.purple{background:#fdf;border-color:#c9c;}
            .bar-bg{height:8px;background:#ddd;border-radius:4px;margin:4px 0;}
            .bar-fill{height:100%;border-radius:4px;background:#5a9e6f;}
            .bar-fill.red{background:#c44;}
            .bar-fill.gold{background:#c90;}
            .bar-fill.purple{background:#96b;}
            .card-item{border:1px solid #ddd;border-radius:8px;padding:16px;background:#fff;}
        </style>
        </head><body>${original}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}