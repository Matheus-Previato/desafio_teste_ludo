import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, rollDice, movePiece } from '../src/game.js';

// Progresso -1 = base; 0..51 = pista; 52..56 = corredor; 57 = chegada.
function scenario({ positions = [[-1,-1,-1,-1],[-1,-1,-1,-1]], turn = 0, die = null,
    consecutiveSixes = 0 } = {}) {
    return { ...createGame(), positions: structuredClone(positions), turn, die,
        consecutiveSixes, status:'playing', winner:null };
}

test('LU01: inicia com dois jogadores, quatro peões na base e turno zero', () => {
    const game = createGame();
    assert.deepEqual(game.positions, [[-1,-1,-1,-1],[-1,-1,-1,-1]]);
    assert.equal(game.turn, 0);
    assert.equal(game.die, null);
    assert.equal(game.consecutiveSixes, 0);
    assert.equal(game.status, 'playing');
    assert.equal(game.winner, null);
});

test('LU02: sem seis e com todos na base passa a vez automaticamente', () => {
    for (let die = 1; die <= 5; die++) {
        const game = rollDice(createGame(), die);
        assert.equal(game.turn, 1);
        assert.equal(game.die, null);
        assert.deepEqual(game.positions, [[-1,-1,-1,-1],[-1,-1,-1,-1]]);
    }
});

test('LU03: seis permite escolher um peão para sair da base na casa inicial', () => {
    const rolled = rollDice(createGame(), 6);
    assert.equal(rolled.turn, 0);
    assert.equal(rolled.die, 6);
    const game = movePiece(rolled, 2);
    assert.equal(game.positions[0][2], 0);
    assert.equal(game.positions[0][0], -1);
    assert.equal(game.die, null);
    assert.equal(game.turn, 0);
});

test('LU04: peão em pista avança o valor exato do dado e passa a vez', () => {
    const game = movePiece(rollDice(scenario({positions:[[0,-1,-1,-1],[-1,-1,-1,-1]]}), 4), 0);
    assert.equal(game.positions[0][0], 4);
    assert.equal(game.turn, 1);
});

test('LU05: jogador um também inicia seu progresso em zero', () => {
    const game = movePiece(rollDice(scenario({turn:1}), 6), 0);
    assert.equal(game.positions[1][0], 0);
    assert.equal(game.turn, 1);
});

test('LU06: base exige seis mesmo quando há outro peão capaz de mover', () => {
    const game = rollDice(scenario({positions:[[0,-1,-1,-1],[-1,-1,-1,-1]]}), 3);
    assert.throws(() => movePiece(game, 1));
    assert.equal(game.die, 3);
});

test('LU07: proíbe mover sem lançar ou lançar duas vezes com dado pendente', () => {
    assert.throws(() => movePiece(createGame(), 0));
    const game = rollDice(createGame(), 6);
    assert.throws(() => rollDice(game, 3));
});

test('LU08: dado deve ser inteiro entre um e seis', () => {
    for (const die of [0,7,-1,1.5,NaN,'6',null]) assert.throws(() => rollDice(createGame(), die));
});

test('LU09: índice de peão inválido é rejeitado', () => {
    const game = rollDice(createGame(), 6);
    for (const index of [-1,4,0.5]) assert.throws(() => movePiece(game, index));
});

test('LU10: captura adversário em casa comum e devolve-o à base', () => {
    // Jogador 1 com progresso 27 está na posição global (26+27)%52 = 1.
    const game = movePiece(rollDice(scenario({positions:[[0,-1,-1,-1],[27,-1,-1,-1]]}), 1), 0);
    assert.equal(game.positions[0][0], 1);
    assert.equal(game.positions[1][0], -1);
    assert.equal(game.turn, 1);
});

test('LU11: captura usa os diferentes pontos de partida dos jogadores', () => {
    // Jogador 1 avança de 0 para 1, posição global 27, ocupada pelo jogador 0.
    const game = movePiece(rollDice(scenario({positions:[[27,-1,-1,-1],[0,-1,-1,-1]],turn:1}), 1), 0);
    assert.equal(game.positions[0][0], -1);
    assert.equal(game.positions[1][0], 1);
});

test('LU12: casa segura permite coexistência sem captura', () => {
    const game = movePiece(rollDice(scenario({positions:[[7,-1,-1,-1],[34,-1,-1,-1]]}), 1), 0);
    assert.equal(game.positions[0][0], 8);
    assert.equal(game.positions[1][0], 34);
});

test('LU13: saída da base em casa inicial segura não captura adversário', () => {
    const game = movePiece(rollDice(scenario({positions:[[-1,-1,-1,-1],[26,-1,-1,-1]]}), 6), 0);
    assert.equal(game.positions[0][0], 0);
    assert.equal(game.positions[1][0], 26);
});

test('LU14: permite empilhar peões próprios e cruzar casas ocupadas', () => {
    const game = movePiece(rollDice(scenario({positions:[[0,2,-1,-1],[27,-1,-1,-1]]}), 2), 0);
    assert.deepEqual(game.positions[0], [2,2,-1,-1]);
    assert.equal(game.positions[1][0], 27);
});

test('LU15: captura todos os peões adversários na casa comum de destino', () => {
    const game = movePiece(rollDice(scenario({positions:[[0,-1,-1,-1],[27,27,-1,-1]]}), 1), 0);
    assert.deepEqual(game.positions[1], [-1,-1,-1,-1]);
});

test('LU16: após progresso 51 entra no corredor exclusivo', () => {
    const game = movePiece(rollDice(scenario({positions:[[51,-1,-1,-1],[26,-1,-1,-1]]}), 1), 0);
    assert.equal(game.positions[0][0], 52);
    assert.equal(game.positions[1][0], 26);
});

test('LU17: peões em corredores próprios não capturam uns aos outros', () => {
    const game = movePiece(rollDice(scenario({positions:[[52,-1,-1,-1],[53,-1,-1,-1]]}), 1), 0);
    assert.equal(game.positions[0][0], 53);
    assert.equal(game.positions[1][0], 53);
});

test('LU18: chegada exige valor exato e não permite ultrapassagem', () => {
    const game = movePiece(rollDice(scenario({positions:[[55,-1,-1,-1],[-1,-1,-1,-1]]}), 2), 0);
    assert.equal(game.positions[0][0], 57);
    assert.equal(game.status, 'playing');
    const blocked = scenario({positions:[[56,0,-1,-1],[-1,-1,-1,-1]]});
    const rolled = rollDice(blocked, 2);
    assert.throws(() => movePiece(rolled, 0));
});

test('LU19: sem movimento possível no corredor passa automaticamente', () => {
    const game = rollDice(scenario({positions:[[56,-1,-1,-1],[-1,-1,-1,-1]]}), 2);
    assert.equal(game.turn, 1);
    assert.equal(game.die, null);
});

test('LU20: peão que chegou não pode voltar a mover', () => {
    const game = rollDice(scenario({positions:[[57,0,-1,-1],[-1,-1,-1,-1]]}), 1);
    assert.throws(() => movePiece(game, 0));
});

test('LU21: terceiro seis consecutivo cancela somente o lançamento atual e passa a vez', () => {
    let game = movePiece(rollDice(createGame(), 6), 0);
    game = movePiece(rollDice(game, 6), 0);
    assert.equal(game.positions[0][0], 6);
    const ended = rollDice(game, 6);
    assert.equal(ended.turn, 1);
    assert.equal(ended.die, null);
    assert.equal(ended.consecutiveSixes, 0);
    assert.deepEqual(ended.positions, game.positions);
});

test('LU22: lançamento diferente de seis zera a sequência', () => {
    const game = rollDice(scenario({positions:[[0,-1,-1,-1],[-1,-1,-1,-1]],consecutiveSixes:2}), 2);
    assert.equal(game.consecutiveSixes, 0);
    assert.equal(movePiece(game, 0).turn, 1);
});

test('LU23: sexto sem movimento possível passa a vez e zera a sequência', () => {
    const game = rollDice(scenario({positions:[[56,56,56,56],[-1,-1,-1,-1]]}), 6);
    assert.equal(game.turn, 1);
    assert.equal(game.consecutiveSixes, 0);
    assert.equal(game.die, null);
});

test('LU24: quarto peão na chegada vence e bloqueia novas ações', () => {
    const game = movePiece(rollDice(scenario({positions:[[57,57,57,56],[-1,-1,-1,-1]]}), 1), 3);
    assert.equal(game.status, 'won');
    assert.equal(game.winner, 0);
    assert.throws(() => rollDice(game, 1));
    assert.throws(() => movePiece(game, 0));
});

test('LU25: ações válidas e inválidas preservam o estado de entrada', () => {
    const game = createGame();
    const before = structuredClone(game);
    const rolled = rollDice(game, 6);
    assert.deepEqual(game, before);
    const snapshot = structuredClone(rolled);
    movePiece(rolled, 0);
    assert.throws(() => movePiece(rolled, -1));
    assert.deepEqual(rolled, snapshot);
});

test('LU26: todas as oito casas seguras impedem captura', () => {
    for (const globalSquare of [0,8,13,21,26,34,39,47]) {
        const origin = (globalSquare + 51) % 52;
        const opponentProgress = (globalSquare + 26) % 52;
        // Na casa zero, saída com seis evita cruzar a entrada do corredor.
        const ownProgress = globalSquare === 0 ? -1 : origin;
        const die = globalSquare === 0 ? 6 : 1;
        const game = movePiece(rollDice(scenario({positions:
            [[ownProgress,-1,-1,-1],[opponentProgress,-1,-1,-1]]}), die), 0);
        assert.equal(game.positions[1][0], opponentProgress);
        assert.equal(game.positions[0][0], globalSquare);
    }
});

test('LU27: jogador um também vence ao levar seu quarto peão à chegada', () => {
    const game = movePiece(rollDice(scenario({positions:[[-1,-1,-1,-1],[57,57,57,56]],turn:1}), 1), 3);
    assert.equal(game.status, 'won');
    assert.equal(game.winner, 1);
});
