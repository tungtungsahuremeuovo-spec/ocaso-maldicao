// modules/ferramentas/ferramentas.js
import appState from '../../assets/js/app.js';

export function init() {
    document.getElementById('btnGerarMaldicao').addEventListener('click', gerarMaldicao);
}

function gerarMaldicao() {
    const prefixos = ['Kyō', 'Yami', 'Shi', 'Ku', 'Aku', 'Jigoku', 'Mugen', 'Yoru', 'Kage', 'Chi', 'Hakai', 'Zetsu', 'Rin', 'Ten', 'Kami'];
    const sufixos = [' no Kamen', ' no Kiba', ' no Tsume', ' no Ha', ' no Me', ' no Tamashi', ' no Koe', ' no Yami', ' no Honō', ' no Kaze', ' no Tsubasa', ' no Kage'];
    const tipos = ['Maldição de Nível Baixo', 'Maldição de Nível Médio', 'Maldição de Nível Alto', 'Maldição Especial'];
    const efeitos = [
        'Drena energia vital a cada rodada.',
        'Causa alucinações no alvo.',
        'Aumenta a força do usuário em +2.',
        'Concede visão sobrenatural.',
        'Atrai espíritos menores.',
        'Permite controlar sombras.',
        'Gera chamas negras.',
        'Paralisa o alvo por 1 rodada.'
    ];
    const nome = prefixos[Math.floor(Math.random() * prefixos.length)] + 
                 sufixos[Math.floor(Math.random() * sufixos.length)];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    const efeito = efeitos[Math.floor(Math.random() * efeitos.length)];
    const nivel = Math.floor(Math.random() * 5) + 1;

    const html = `
        <h3>👹 ${nome}</h3>
        <p><strong>Tipo:</strong> ${tipo}</p>
        <p><strong>Nível:</strong> ${nivel}</p>
        <p><strong>Efeito:</strong> ${efeito}</p>
        <button class="btn btn-sm mt-1" onclick="navigator.clipboard.writeText('${nome} - ${tipo} - Nível ${nivel} - ${efeito}')">📋 Copiar</button>
    `;
    document.getElementById('maldicaoResult').innerHTML = html;
    appState.logAction(`👹 Maldição gerada: ${nome}`);
}