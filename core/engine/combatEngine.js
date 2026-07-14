import DiceEngine from './diceEngine.js';

export class CombatEngine {
    constructor(state) {
        this.state = state;
    }

    addCombatant(combatant) {
        const combatants = [...this.state.get('combat').combatants, combatant];
        combatants.sort((a, b) => b.iniciativa - a.iniciativa);
        this.state.set('combat', {
            ...this.state.get('combat'),
            combatants,
            turnIndex: 0
        });
    }

    removeCombatant(id) {
        const combat = this.state.get('combat');
        const combatants = combat.combatants.filter(c => c.id !== id);
        let turnIndex = combat.turnIndex;
        if (turnIndex >= combatants.length) turnIndex = 0;
        this.state.set('combat', { ...combat, combatants, turnIndex });
    }

    nextTurn() {
        const combat = this.state.get('combat');
        if (combat.combatants.length === 0) return null;
        const turnIndex = (combat.turnIndex + 1) % combat.combatants.length;
        this.state.set('combat', { ...combat, turnIndex });
        return combat.combatants[turnIndex];
    }

    rollAllInitiatives() {
        const combat = this.state.get('combat');
        const combatants = combat.combatants.map(c => ({
            ...c,
            iniciativa: DiceEngine.rollInitiative().total
        }));
        combatants.sort((a, b) => b.iniciativa - a.iniciativa);
        this.state.set('combat', { ...combat, combatants, turnIndex: 0 });
    }

    attemptBlackFlash() {
        const combat = this.state.get('combat');
        const roll = DiceEngine.rollBlackFlash();
        const success = roll.total >= 20;
        let luckPoints = combat.luckPoints || 0;
        let jackpotUsed = combat.jackpotUsed || false;
        let jackpotTriggered = false;

        if (success) {
            luckPoints++;
            if (luckPoints >= 3 && !jackpotUsed) {
                jackpotUsed = true;
                jackpotTriggered = true;
                luckPoints = 0;
            }
        }

        this.state.set('combat', { ...combat, luckPoints, jackpotUsed });
        return { roll: roll.total, success, jackpotTriggered, luckPoints };
    }

    updateHp(id, newHp) {
        const combat = this.state.get('combat');
        const combatants = combat.combatants.map(c => {
            if (c.id === id) {
                return { ...c, hp: Math.max(0, Math.min(c.hpMax, parseInt(newHp) || 0)) };
            }
            return c;
        });
        this.state.set('combat', { ...combat, combatants });
    }

    clearCombat() {
        this.state.set('combat', { combatants: [], turnIndex: 0, luckPoints: 0, jackpotUsed: false });
    }

    getCurrentCombatant() {
        const combat = this.state.get('combat');
        if (combat.combatants.length === 0) return null;
        return combat.combatants[combat.turnIndex];
    }
}

export default CombatEngine;