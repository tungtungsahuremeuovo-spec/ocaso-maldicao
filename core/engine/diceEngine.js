export class DiceEngine {
    static roll(faces, quantity = 1, modifier = 0) {
        const results = [];
        for (let i = 0; i < quantity; i++) {
            results.push(Math.floor(Math.random() * faces) + 1);
        }
        const total = results.reduce((a, b) => a + b, 0) + modifier;
        return {
            results,
            total,
            faces,
            quantity,
            modifier,
            formula: `${quantity}d${faces}${modifier !== 0 ? (modifier > 0 ? '+' : '') + modifier : ''}`,
            isNatural20: faces === 20 && results[0] === 20,
            isNatural1: faces === 20 && results[0] === 1
        };
    }

    static rollInitiative(modifier = 0) {
        return DiceEngine.roll(20, 1, modifier);
    }

    static rollAttack(modifier = 0) {
        return DiceEngine.roll(20, 1, modifier);
    }

    static rollDamage(formula) {
        // Ex: "1d6+2" ou "2d8"
        const match = formula.match(/(\d+)d(\d+)([+-]\d+)?/);
        if (!match) return { total: 0, results: [] };
        const quantity = parseInt(match[1]);
        const faces = parseInt(match[2]);
        const modifier = match[3] ? parseInt(match[3]) : 0;
        return DiceEngine.roll(faces, quantity, modifier);
    }

    static rollBlackFlash() {
        return DiceEngine.roll(20, 1);
    }

    static rollSavingThrow(modifier = 0) {
        return DiceEngine.roll(20, 1, modifier);
    }
}

export default DiceEngine;