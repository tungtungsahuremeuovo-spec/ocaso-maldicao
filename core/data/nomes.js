// core/data/nomes.js
const sobrenomes = [
    'Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito',
    'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Saito', 'Yoshida',
    'Matsumoto', 'Inoue', 'Kimura', 'Shimizu', 'Hayashi', 'Shibata',
    'Ueda', 'Mori'
];

const nomesMasculinos = [
    'Haruto', 'Yuki', 'Sora', 'Hinata', 'Riku', 'Ren',
    'Yuto', 'Sho', 'Daiki', 'Kaito', 'Takumi', 'Ryota',
    'Kenta', 'Shota', 'Tsubasa'
];

const nomesFemininos = [
    'Aoi', 'Rin', 'Yuna', 'Sakura', 'Hina', 'Miyu',
    'Nanami', 'Mio', 'Kokoro', 'Yui', 'Mei', 'Shiori',
    'Ayaka', 'Momoka', 'Riko'
];

export function gerarNome(genero = 'aleatorio') {
    const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
    let nome;
    if (genero === 'masculino') {
        nome = nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)];
    } else if (genero === 'feminino') {
        nome = nomesFemininos[Math.floor(Math.random() * nomesFemininos.length)];
    } else {
        const todos = [...nomesMasculinos, ...nomesFemininos];
        nome = todos[Math.floor(Math.random() * todos.length)];
    }
    return `${sobrenome} ${nome}`;
}

export function gerarNomeMaldicao() {
    const prefixos = ['Kyō', 'Yami', 'Shi', 'Ku', 'Aku', 'Jigoku', 'Mugen', 'Yoru', 'Kage', 'Chi'];
    const sufixos = [' no Kamen', ' no Kiba', ' no Tsume', ' no Ha', ' no Me', ' no Tamashi', ' no Koe', ' no Yami', ' no Honō', ' no Kaze'];
    return prefixos[Math.floor(Math.random() * prefixos.length)] + sufixos[Math.floor(Math.random() * sufixos.length)];
}