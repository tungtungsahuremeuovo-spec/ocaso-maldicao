// modules/ferramentas/ferramentas.js
import appState from '../../assets/js/app.js';

export function init() {
    document.getElementById('btnGerarMaldicao').addEventListener('click', gerarMaldicao);
    document.getElementById('btnGerarCidade').addEventListener('click', gerarCidade);
    document.getElementById('btnGerarTecnica').addEventListener('click', gerarTecnica);
    document.getElementById('btnGerarReliquia').addEventListener('click', gerarReliquia);
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

function gerarCidade() {
    const prefixos = ['Kyoto', 'Osaka', 'Tokyo', 'Nagoya', 'Yokohama', 'Kobe', 'Fukuoka', 'Sapporo'];
    const sufixos = ['-no-Yami', '-no-Kage', '-no-Hi', '-no-Shi', '-no-Koe', '-no-Michi', '-no-Hana', '-no-Kiri'];
    const nomes = [
        'Vila do Crepúsculo', 'Cidade das Sombras', 'Aldeia dos Suspiros',
        'Porto das Almas', 'Vale das Maldições', 'Monte dos Ecos',
        'Planície do Silêncio', 'Floresta dos Lamentos'
    ];
    const cidade = prefixos[Math.floor(Math.random() * prefixos.length)] + 
                   sufixos[Math.floor(Math.random() * sufixos.length)];
    const nome = nomes[Math.floor(Math.random() * nomes.length)];
    const resultado = `${cidade} (${nome})`;
    document.getElementById('cidadeResult').innerHTML = `
        <h3>🏯 ${resultado}</h3>
        <p><em>Uma cidade amaldiçoada com segredos ancestrais.</em></p>
        <button class="btn btn-sm mt-1" onclick="navigator.clipboard.writeText('${resultado}')">📋 Copiar</button>
    `;
    appState.logAction(`🏯 Cidade gerada: ${resultado}`);
}

function gerarTecnica() {
    const prefixos = ['Kai', 'Rin', 'Ten', 'Shi', 'Ku', 'Ho', 'Ra', 'Mi', 'Fu', 'Mu'];
    const nucleos = ['-ken', '-jutsu', '-do', '-shiki', '-dan', '-geki', '-zan', '-ryu'];
    const descs = [
        'da Alma Cortante', 'das Sombras Dançantes', 'do Vazio Infinito',
        'do Eco Perfurante', 'da Lua Crescente', 'do Vento Cortante',
        'do Raio Divino', 'do Fogo Purificador', 'da Água Fluente'
    ];
    const nome = prefixos[Math.floor(Math.random() * prefixos.length)] + 
                 nucleos[Math.floor(Math.random() * nucleos.length)];
    const desc = descs[Math.floor(Math.random() * descs.length)];
    const resultado = `${nome} – ${desc}`;
    document.getElementById('tecnicaResult').innerHTML = `
        <h3>⚡ ${resultado}</h3>
        <p><em>Técnica inata poderosa e única.</em></p>
        <button class="btn btn-sm mt-1" onclick="navigator.clipboard.writeText('${resultado}')">📋 Copiar</button>
    `;
    appState.logAction(`⚡ Técnica gerada: ${resultado}`);
}

function gerarReliquia() {
    const nomes = ['Kusanagi', 'Yasakani', 'Ame-no-Murakumo', 'Totsuka', 'Yata', 'Kogarasu', 'Matsukaze'];
    const poderes = [
        'Concede visão do futuro por 1 rodada.',
        'Dobra a energia amaldiçoada do usuário.',
        'Pode selar qualquer maldição de nível baixo.',
        'Atrai espíritos menores para proteger o portador.',
        'Permite controlar o vento ao redor.',
        'Gera um escudo de energia contra ataques físicos.'
    ];
    const maldicoes = [
        'Drena 1 PV por rodada enquanto equipada.',
        'O portador tem pesadelos terríveis.',
        'Atrai maldições de nível médio.',
        'Só pode ser removida com um ritual especial.',
        'O portador perde a capacidade de sentir prazer.'
    ];
    const nome = nomes[Math.floor(Math.random() * nomes.length)];
    const poder = poderes[Math.floor(Math.random() * poderes.length)];
    const maldicao = maldicoes[Math.floor(Math.random() * maldicoes.length)];
    document.getElementById('reliquiaResult').innerHTML = `
        <h3>💎 Relíquia Amaldiçoada</h3>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Poder:</strong> ${poder}</p>
        <p><strong>Maldição:</strong> ${maldicao}</p>
        <button class="btn btn-sm mt-1" onclick="navigator.clipboard.writeText('${nome} - ${poder} - ${maldicao}')">📋 Copiar</button>
    `;
    appState.logAction(`💎 Relíquia gerada: ${nome}`);
}