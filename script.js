// Estado do jogo
let dinheiro = 1000;
let custoJogada = 50;
let bonusAtivo = false;
let gameOver = false;
let girando = false;

// Símbolos e valores
const simbolos = ['🍒', '🍋', '🍊', '💎', '⭐', '🎰', '👑'];
const valores = {
    '🍒': 20,
    '🍋': 30,
    '🍊': 40,
    '💎': 100,
    '⭐': 150,
    '🎰': 200,
    '👑': 500
};

// Rolos
let rolos = [
    ['❓', '❓', '❓'],
    ['❓', '❓', '❓'],
    ['❓', '❓', '❓']
];

// Upgrades
let upgrades = {
    multiplicador: { nivel: 1, maxNivel: 5, custo: 200 },
    bonus_chance: { nivel: 1, maxNivel: 5, custo: 300 },
    desconto: { nivel: 1, maxNivel: 5, custo: 250 },
    jackpot: { nivel: 1, maxNivel: 3, custo: 500 }
};

// Habilidades
let habilidades = {
    segunda_chance: { disponivel: true, cooldown: 0, maxCooldown: 3 },
    dobrar_ganhos: { disponivel: true, cooldown: 0, maxCooldown: 5 },
    giro_gratis: { disponivel: true, cooldown: 0, maxCooldown: 4 }
};

// Bônus e estatísticas
let bonusMultiplier = 1;
let jackpotPool = 1000;
let sequenciaVitorias = 0;
let totalGanho = 0;

// Timer para cooldowns
let cooldownTimer;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    atualizarInterface();
    iniciarCooldownTimer();
});

function atualizarInterface() {
    // Atualizar status
    document.getElementById('dinheiro').textContent = `$${dinheiro}`;
    document.getElementById('custo').textContent = `$${aplicarDesconto()}`;
    document.getElementById('bonus').textContent = `x${bonusMultiplier}`;
    document.getElementById('jackpot').textContent = `$${jackpotPool}`;
    document.getElementById('sequencia').textContent = sequenciaVitorias;
    document.getElementById('totalGanho').textContent = `$${totalGanho}`;
    
    // Atualizar upgrades
    for (let nome in upgrades) {
        document.getElementById(`lvl-${nome}`).textContent = upgrades[nome].nivel;
        document.getElementById(`custo-${nome}`).textContent = upgrades[nome].custo;
    }
    
    // Atualizar habilidades
    for (let nome in habilidades) {
        const hab = habilidades[nome];
        const btn = document.getElementById(`hab-${nome}`);
        const status = document.getElementById(`status-${nome}`);
        
        if (hab.cooldown > 0) {
            btn.disabled = true;
            status.textContent = `CD: ${hab.cooldown}s`;
            status.style.color = '#e74c3c';
        } else if (!hab.disponivel) {
            btn.disabled = true;
            status.textContent = 'Em uso';
            status.style.color = '#f39c12';
        } else {
            btn.disabled = false;
            status.textContent = 'PRONTO';
            status.style.color = '#2ecc71';
        }
    }
}

function aplicarDesconto() {
    const desconto = upgrades.desconto.nivel * 5;
    return Math.max(10, custoJogada - desconto);
}

function jogar() {
    if (girando || gameOver) return;
    
    const custoAtual = aplicarDesconto();
    const giroGratis = !habilidades.giro_gratis.disponivel && habilidades.giro_gratis.cooldown === 0;
    
    if (!giroGratis && dinheiro < custoAtual) {
        mostrarMensagem('❌ Dinheiro insuficiente!', 'lose');
        return;
    }
    
    // Deduzir custo
    if (!giroGratis) {
        dinheiro -= custoAtual;
    } else {
        habilidades.giro_gratis.disponivel = false;
        habilidades.giro_gratis.cooldown = habilidades.giro_gratis.maxCooldown;
        mostrarMensagem('🎁 GIRO GRÁTIS!', 'bonus');
    }
    
    girando = true;
    document.getElementById('btnJogar').disabled = true;
    atualizarInterface();
    
    // Animação de girar
    animarGiros();
}

function animarGiros() {
    let passos = 0;
    const maxPassos = 15;
    
    const interval = setInterval(() => {
        // Girar visualmente
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (Math.random() < 0.4) {
                    const simboloTemp = simbolos[Math.floor(Math.random() * simbolos.length)];
                    rolos[i][j] = simboloTemp;
                    document.getElementById(`slot-${i}-${j}`).textContent = simboloTemp;
                }
            }
        }
        
        passos++;
        
        if (passos >= maxPassos) {
            clearInterval(interval);
            finalizarGiros();
        }
    }, 100);
}

function finalizarGiros() {
    // Gerar resultado final
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const pesos = [40, 30, 20, 5, 3, 1.5, 0.5];
            const simbolo = escolherComPeso(simbolos, pesos);
            rolos[i][j] = simbolo;
            document.getElementById(`slot-${i}-${j}`).textContent = simbolo;
        }
    }
    
    processarResultado();
}

function escolherComPeso(opcoes, pesos) {
    const total = pesos.reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    
    for (let i = 0; i < opcoes.length; i++) {
        random -= pesos[i];
        if (random <= 0) {
            return opcoes[i];
        }
    }
    return opcoes[0];
}

function processarResultado() {
    const { ganho, combinacoes } = verificarVitoria();
    
    if (ganho > 0) {
        dinheiro += ganho;
        totalGanho += ganho;
        sequenciaVitorias++;
        jackpotPool += Math.floor(aplicarDesconto() / 2);
        
        let msg = `🎉 VOCÊ GANHOU $${ganho}!`;
        if (combinacoes.length > 0) {
            msg += `\n${combinacoes[0]}`;
        }
        mostrarMensagem(msg, 'win');
        
        // Chance de bônus
        if (chanceBonus()) {
            ativarBonus();
        }
    } else {
        sequenciaVitorias = 0;
        bonusMultiplier = 1;
        bonusAtivo = false;
        
        mostrarMensagem('😢 Não foi dessa vez...', 'lose');
        
        // Verificar segunda chance
        if (habilidades.segunda_chance.disponivel && habilidades.segunda_chance.cooldown === 0) {
            setTimeout(() => {
                mostrarMensagem('⚡ Usando SEGUNDA CHANCE!', 'bonus');
                habilidades.segunda_chance.disponivel = false;
                habilidades.segunda_chance.cooldown = habilidades.segunda_chance.maxCooldown;
                atualizarInterface();
                setTimeout(() => jogar(), 1500);
            }, 1000);
            girando = false;
            document.getElementById('btnJogar').disabled = false;
            return;
        }
    }
    
    atualizarInterface();
    girando = false;
    document.getElementById('btnJogar').disabled = false;
    
    // Verificar game over
    if (dinheiro <= 0) {
        setTimeout(gameOverFalencia, 1000);
    }
}

function verificarVitoria() {
    let ganho = 0;
    const combinacoes = [];
    
    // Linhas horizontais
    for (let linha = 0; linha < 3; linha++) {
        if (rolos[linha][0] === rolos[linha][1] && rolos[linha][1] === rolos[linha][2]) {
            const simbolo = rolos[linha][0];
            const valor = valores[simbolo] * upgrades.multiplicador.nivel;
            ganho += valor * bonusMultiplier;
            combinacoes.push(`Linha ${linha + 1}: 3x ${simbolo}`);
        }
    }
    
    // Colunas verticais
    for (let coluna = 0; coluna < 3; coluna++) {
        if (rolos[0][coluna] === rolos[1][coluna] && rolos[1][coluna] === rolos[2][coluna]) {
            const simbolo = rolos[0][coluna];
            const valor = valores[simbolo] * upgrades.multiplicador.nivel;
            ganho += valor * bonusMultiplier;
            combinacoes.push(`Coluna ${coluna + 1}: 3x ${simbolo}`);
        }
    }
    
    // Diagonais
    if (rolos[0][0] === rolos[1][1] && rolos[1][1] === rolos[2][2]) {
        const simbolo = rolos[0][0];
        const valor = valores[simbolo] * upgrades.multiplicador.nivel * 2;
        ganho += valor * bonusMultiplier;
        combinacoes.push(`Diagonal \\\\: 3x ${simbolo}`);
    }
    
    if (rolos[0][2] === rolos[1][1] && rolos[1][1] === rolos[2][0]) {
        const simbolo = rolos[0][2];
        const valor = valores[simbolo] * upgrades.multiplicador.nivel * 2;
        ganho += valor * bonusMultiplier;
        combinacoes.push(`Diagonal /: 3x ${simbolo}`);
    }
    
    // Jackpot
    if (upgrades.jackpot.nivel > 1) {
        if (Math.random() < 0.05 * upgrades.jackpot.nivel) {
            ganho += jackpotPool;
            combinacoes.push(`🎰 JACKPOT! +$${jackpotPool}`);
            jackpotPool = 1000;
        }
    }
    
    return { ganho, combinacoes };
}

function chanceBonus() {
    const chanceBase = 0.1;
    const chanceBonus = chanceBase + (upgrades.bonus_chance.nivel - 1) * 0.05;
    return Math.random() < chanceBonus;
}

function ativarBonus() {
    bonusAtivo = true;
    bonusMultiplier = 2 + upgrades.bonus_chance.nivel;
    mostrarMensagem(`🎉 BÔNUS ATIVADO! Multiplicador x${bonusMultiplier}`, 'bonus');
    atualizarInterface();
}

function comprarUpgrade(nome) {
    const upgrade = upgrades[nome];
    
    if (upgrade.nivel >= upgrade.maxNivel) {
        mostrarMensagem('❌ Upgrade já está no máximo!', 'lose');
        return;
    }
    
    if (dinheiro >= upgrade.custo) {
        dinheiro -= upgrade.custo;
        upgrade.nivel++;
        upgrade.custo = Math.floor(upgrade.custo * 1.5);
        mostrarMensagem(`✅ ${nome} melhorado para nível ${upgrade.nivel}!`, 'win');
        atualizarInterface();
    } else {
        mostrarMensagem(`❌ Dinheiro insuficiente! Precisa de $${upgrade.custo}`, 'lose');
    }
}

function usarHabilidade(nome) {
    const habilidade = habilidades[nome];
    
    if (!habilidade.disponivel || habilidade.cooldown > 0) {
        mostrarMensagem('❌ Habilidade em cooldown!', 'lose');
        return;
    }
    
    if (nome === 'segunda_chance') {
        mostrarMensagem('⚡ Segunda Chance ativada!', 'bonus');
    } else if (nome === 'dobrar_ganhos') {
        bonusMultiplier *= 2;
        mostrarMensagem(`💰 Ganhos dobrados! Multiplicador: x${bonusMultiplier}`, 'bonus');
    } else if (nome === 'giro_gratis') {
        mostrarMensagem('🎁 Próximo giro será gratuito!', 'bonus');
    }
    
    habilidade.disponivel = false;
    habilidade.cooldown = habilidade.maxCooldown;
    atualizarInterface();
}

function iniciarCooldownTimer() {
    cooldownTimer = setInterval(() => {
        let mudou = false;
        
        for (let nome in habilidades) {
            const hab = habilidades[nome];
            if (hab.cooldown > 0) {
                hab.cooldown--;
                if (hab.cooldown === 0) {
                    hab.disponivel = true;
                }
                mudou = true;
            }
        }
        
        if (mudou) {
            atualizarInterface();
        }
    }, 1000);
}

function mostrarMensagem(texto, tipo) {
    const msgElement = document.getElementById('mensagem');
    msgElement.textContent = texto;
    msgElement.className = `mensagem ${tipo}`;
    
    setTimeout(() => {
        if (msgElement.textContent === texto) {
            msgElement.textContent = '';
            msgElement.className = 'mensagem';
        }
    }, 3000);
}

function gameOverFalencia() {
    gameOver = true;
    document.getElementById('finalTotalGanho').textContent = `$${totalGanho}`;
    document.getElementById('finalSequencia').textContent = sequenciaVitorias;
    document.getElementById('finalJackpot').textContent = `$${jackpotPool}`;
    document.getElementById('gameOverModal').classList.add('active');
}

function reiniciarJogo() {
    // Resetar todas as variáveis
    dinheiro = 1000;
    custoJogada = 50;
    bonusAtivo = false;
    gameOver = false;
    girando = false;
    
    rolos = [
        ['❓', '❓', '❓'],
        ['❓', '❓', '❓'],
        ['❓', '❓', '❓']
    ];
    
    upgrades = {
        multiplicador: { nivel: 1, maxNivel: 5, custo: 200 },
        bonus_chance: { nivel: 1, maxNivel: 5, custo: 300 },
        desconto: { nivel: 1, maxNivel: 5, custo: 250 },
        jackpot: { nivel: 1, maxNivel: 3, custo: 500 }
    };
    
    habilidades = {
        segunda_chance: { disponivel: true, cooldown: 0, maxCooldown: 3 },
        dobrar_ganhos: { disponivel: true, cooldown: 0, maxCooldown: 5 },
        giro_gratis: { disponivel: true, cooldown: 0, maxCooldown: 4 }
    };
    
    bonusMultiplier = 1;
    jackpotPool = 1000;
    sequenciaVitorias = 0;
    totalGanho = 0;
    
    // Resetar interface
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            document.getElementById(`slot-${i}-${j}`).textContent = '❓';
        }
    }
    
    document.getElementById('gameOverModal').classList.remove('active');
    document.getElementById('btnJogar').disabled = false;
    document.getElementById('mensagem').textContent = '';
    document.getElementById('mensagem').className = 'mensagem';
    
    atualizarInterface();
}

function confirmarFalencia() {
    if (gameOver) {
        mostrarMensagem('❌ Você já está em falência!', 'lose');
        return;
    }
    
    document.getElementById('confirmacaoFalenciaModal').classList.add('active');
}

function fecharModalConfirmacao() {
    document.getElementById('confirmacaoFalenciaModal').classList.remove('active');
}

function declararFalencia() {
    // Fechar modal de confirmação
    document.getElementById('confirmacaoFalenciaModal').classList.remove('active');
    
    // Mostrar mensagem dramática
    mostrarMensagem('💸 VOCÊ DECLAROU FALÊNCIA! 💸', 'lose');
    
    // Aguardar um momento e mostrar game over
    setTimeout(() => {
        gameOverFalencia();
    }, 1500);
}