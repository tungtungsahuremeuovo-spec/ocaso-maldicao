import DiceEngine from '../../core/engine/diceEngine.js';

export function init() {
    document.getElementById('btnRoll').addEventListener('click', roll);
}

function roll() {
    const faces = parseInt(document.getElementById('diceFaces').value);
    const qtd = parseInt(document.getElementById('diceQtd').value) || 1;
    const mod = parseInt(document.getElementById('diceMod').value) || 0;
    const result = DiceEngine.roll(faces, qtd, mod);
    document.getElementById('diceResult').innerHTML = `🎲 ${result.formula}: <strong>${result.total}</strong>`;
    const history = document.getElementById('diceHistory');
    history.innerHTML += `<div>${result.formula}: ${result.total}</div>`;
}