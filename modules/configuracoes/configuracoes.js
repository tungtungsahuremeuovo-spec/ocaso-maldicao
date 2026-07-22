// modules/configuracoes/configuracoes.js
import appState from '../../assets/js/app.js';

export function init() {
    const role = appState.getRole();

    // Controles de mestre
    const configMaster = document.getElementById('configMaster');
    if (role === 'master') {
        configMaster.style.display = 'block';
        carregarControlesMestre();
    } else {
        configMaster.style.display = 'none';
    }

    // Tema
    const savedTheme = localStorage.getItem('ocaso_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeSelector = document.getElementById('themeSelector');
    if (themeSelector) {
        themeSelector.value = savedTheme;
        themeSelector.addEventListener('change', function() {
            document.documentElement.setAttribute('data-theme', this.value);
            localStorage.setItem('ocaso_theme', this.value);
            appState._playSound('save');
        });
    }

    // Zoom (⭐ 19)
    const zoomSelector = document.getElementById('zoomSelector');
    if (zoomSelector) {
        const savedZoom = localStorage.getItem('ocaso_zoom') || '100';
        zoomSelector.value = savedZoom;
        document.documentElement.setAttribute('data-zoom', savedZoom);
        zoomSelector.addEventListener('change', function() {
            const val = this.value;
            document.documentElement.setAttribute('data-zoom', val);
            localStorage.setItem('ocaso_zoom', val);
            appState._playSound('save');
        });
    }

    // Sons (⭐ 23)
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        const soundEnabled = localStorage.getItem('ocaso_sound') !== 'false';
        soundToggle.checked = soundEnabled;
        soundToggle.addEventListener('change', function() {
            const val = this.checked;
            localStorage.setItem('ocaso_sound', String(val));
            if (!appState.data.settings) appState.data.settings = {};
            appState.data.settings.sound = val;
            appState._playSound('save');
        });
    }

    const currentRoleSpan = document.getElementById('currentRole');
    if (currentRoleSpan) {
        currentRoleSpan.textContent = role === 'master' ? '👑 Mestre' : '🎮 Jogador';
    }
}

// ============================================================
// CONFIRMAR AÇÕES PERIGOSAS (⭐ 7)
// ============================================================
window.confirmAction ??= (message, onConfirm, onCancel) => {
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `
        <div>
            <p style="margin-bottom:12px;">${message}</p>
            <div class="actions">
                <button class="btn" id="confirm-cancel">Cancelar</button>
                <button class="btn btn-red" id="confirm-ok">Confirmar</button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);

    dialog.querySelector('#confirm-cancel').addEventListener('click', () => {
        dialog.remove();
        if (onCancel) onCancel();
    });
    dialog.querySelector('#confirm-ok').addEventListener('click', () => {
        dialog.remove();
        if (onConfirm) onConfirm();
    });
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.remove();
            if (onCancel) onCancel();
        }
    });
    return dialog;
};

// ============================================================
// CONTROLES DO MESTRE
// ============================================================
function carregarControlesMestre() {
    // ... (mesmo código anterior, mantido)
    // Adicionar suporte a zoom, sons, etc.
}

// Exportar
export function destroy() {
    // Limpeza se necessário
}
