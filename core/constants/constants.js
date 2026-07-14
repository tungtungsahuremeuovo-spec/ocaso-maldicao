export const GRAU_OPTIONS = [
    { value: '4', label: '4º Grau', hp: 25, ea: 30, dano: '1d6', bt: 1 },
    { value: '3', label: '3º Grau', hp: 35, ea: 45, dano: '1d8', bt: 2 },
    { value: '2', label: '2º Grau', hp: 50, ea: 60, dano: '1d10', bt: 3 },
    { value: '1', label: '1º Grau', hp: 70, ea: 80, dano: '1d12', bt: 4 },
    { value: 'E', label: 'Especial', hp: 100, ea: 110, dano: '2d8', bt: 4 },
];

export const ESTILOS_LUTA = [
    'Lutador', 'Especialista em Combate', 'Controlador', 'Suporte', 'Entoador', 'Restringido'
];

export const ORIGENS_ESPECIAIS = [
    '', 'Semi-Restringido', 'Meio-Maldição', 'Feiticeiro Reencarnado',
    'Parasita Espiritual', 'Escolhido do Voto', 'Vaso Imperfeito',
    'Restrição Sensorial', 'Herdeiro Amaldiçoado', 'Corpo Adaptativo',
    'Filho de Domínio', 'Sobrevivente da Morte', 'Sangue Profano',
    'Corpo Vazio', 'Fragmentado', 'Devorador', 'Gêmeo Espiritual',
    'Restrição Invertida', 'Aberração Temporal', 'Nascido na Barreira', 'Monstro Artificial'
];

export const CONDICOES = {
    LEVES: ['Caído', 'Enfraquecido', 'Surdo', 'Sangramento Leve'],
    MEDIAS: ['Enredado', 'Cego', 'Silenciado', 'Queimando', 'Desbalanceado'],
    SEVERAS: ['Atordoado', 'Imóvel', 'Paralisado']
};

export const RARIDADES = ['Comum', 'Incomum', 'Raro', 'Lendário', 'Relíquia Amaldiçoada'];

export const FACCOES = [
    'Conservadores', 'Renegados', 'Fanáticos', 'Independentes',
    'Véu Negro', 'Culto da Mão', 'Coletores', 'Observadores'
];

export const TIPOS_LORE = ['Local', 'NPC Importante', 'Evento', 'Organização', 'Facção', 'Técnica Perdida'];

export const SPELL_COSTS = {
    1: { pontos: 5, ea: 5, cd: 12 },
    2: { pontos: 10, ea: 10, cd: 14 },
    3: { pontos: 15, ea: 20, cd: 16 },
    4: { pontos: 20, ea: 35, cd: 18 },
    5: { pontos: 25, ea: 50, cd: 20 },
};