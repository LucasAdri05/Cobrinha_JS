const tela = document.getElementById("jogo");
const contexto = tela.getContext("2d");
const refs = {
    nome: document.getElementById("nomeJogador"),
    pontos: document.getElementById("pontuacao"),
    recorde: document.getElementById("recorde"),
    vidas: document.getElementById("vidas"),
    status: document.getElementById("status"),
    menu: document.getElementById("menu"),
    entrada: document.getElementById("entradaNome"),
    historico: document.getElementById("listaHistorico")
};

const tamanhoGrade = 20;
const tamanhoCelula = tela.width / tamanhoGrade;
const tiposDeAlimento = [
    { cor: "#ef4444", pontos: 10 },
    { cor: "#facc15", pontos: 20 },
    { cor: "#38bdf8", pontos: 30 }
];

let estado = {
    cobrinha: [],
    direcao: { x: 1, y: 0 },
    alimento: null,
    pontuacao: 0,
    recorde: Number(localStorage.getItem("recordeCobrinha")) || 0,
    vidas: 3,
    velocidade: 150,
    emExecucao: false,
    temporizador: null,
    exibindoMenu: true,
    nomeDoJogador: ""
};

function atualizarPainel() {
    refs.nome.textContent = estado.nomeDoJogador || "-";
    refs.pontos.textContent = estado.pontuacao;
    refs.recorde.textContent = estado.recorde;
    refs.vidas.textContent = estado.vidas;
}

function setStatus(texto) {
    refs.status.textContent = texto;
}

function gerarAlimento() {
    let posicao;
    do {
        posicao = {
            x: Math.floor(Math.random() * tamanhoGrade),
            y: Math.floor(Math.random() * tamanhoGrade)
        };
    } while (estado.cobrinha.some(parte => parte.x === posicao.x && parte.y === posicao.y));
    return { ...posicao, tipo: tiposDeAlimento[Math.floor(Math.random() * tiposDeAlimento.length)] };
}

function desenharCelula(x, y, cor) {
    contexto.fillStyle = cor;
    contexto.fillRect(x * tamanhoCelula, y * tamanhoCelula, tamanhoCelula - 1, tamanhoCelula - 1);
}

function desenharTela() {
    contexto.fillStyle = "#0f172a";
    contexto.fillRect(0, 0, tela.width, tela.height);
    desenharCelula(estado.alimento.x, estado.alimento.y, estado.alimento.tipo.cor);
    estado.cobrinha.forEach((parte, indice) => {
        const cor = indice === 0 ? "#22c55e" : "#16a34a";
        desenharCelula(parte.x, parte.y, cor);
    });
}

function iniciarJogo(nome = "") {
    const jogador = nome || estado.nomeDoJogador || "Jogador";
    estado = {
        ...estado,
        nomeDoJogador: jogador,
        cobrinha: [
            { x: 9, y: 9 },
            { x: 8, y: 9 },
            { x: 7, y: 9 }
        ],
        direcao: { x: 1, y: 0 },
        pontuacao: 0,
        vidas: 3,
        velocidade: 150,
        alimento: gerarAlimento(),
        emExecucao: false,
        temporizador: null
    };
    atualizarPainel();
    desenharTela();
    setStatus("Pressione iniciar para jogar.");
}

function atualizarJogo() {
    if (!estado.emExecucao) return;

    const cabeca = {
        x: estado.cobrinha[0].x + estado.direcao.x,
        y: estado.cobrinha[0].y + estado.direcao.y
    };

    const bateuParede = cabeca.x < 0 || cabeca.x >= tamanhoGrade || cabeca.y < 0 || cabeca.y >= tamanhoGrade;
    const bateuCorpo = estado.cobrinha.some(parte => parte.x === cabeca.x && parte.y === cabeca.y);

    if (bateuParede || bateuCorpo) {
        perderVida(bateuParede ? "parede" : "corpo");
        return;
    }

    estado.cobrinha.unshift(cabeca);

    if (cabeca.x === estado.alimento.x && cabeca.y === estado.alimento.y) {
        estado.pontuacao += estado.alimento.tipo.pontos;
        estado.velocidade = Math.max(60, estado.velocidade - 5);
        estado.alimento = gerarAlimento();
    } else {
        estado.cobrinha.pop();
    }

    refs.pontos.textContent = estado.pontuacao;
    desenharTela();
    estado.temporizador = setTimeout(atualizarJogo, estado.velocidade);
}

function perderVida(motivo) {
    estado.vidas -= 1;
    refs.vidas.textContent = estado.vidas;

    if (estado.vidas > 0) {
        setStatus(`Opa! Bateu na ${motivo}. Tente de novo.`);
        estado.cobrinha = [
            { x: 9, y: 9 },
            { x: 8, y: 9 },
            { x: 7, y: 9 }
        ];
        estado.direcao = { x: 1, y: 0 };
        estado.temporizador = setTimeout(atualizarJogo, 600);
        return;
    }

    encerrarJogo(motivo);
}

function encerrarJogo(motivo) {
    estado.emExecucao = false;
    clearTimeout(estado.temporizador);
    setStatus(`Fim! Bateu na ${motivo}.`);

    if (estado.pontuacao > estado.recorde) {
        localStorage.setItem("recordeCobrinha", estado.pontuacao);
        estado.recorde = estado.pontuacao;
        refs.recorde.textContent = estado.recorde;
    }

    salvarNoHistorico(estado.nomeDoJogador, estado.pontuacao);
    atualizarHistorico();
    refs.menu.style.display = "block";
    estado.exibindoMenu = true;
    refs.entrada.value = "";
    setStatus("Fim! Pressione Enter para novo jogador.");
}

window.addEventListener("keydown", evento => {
    if (estado.exibindoMenu && evento.key === "Enter") {
        const nome = refs.entrada.value.trim();
        if (!nome) {
            alert("Digite um nome para seguir.");
            return;
        }
        refs.menu.style.display = "none";
        estado.exibindoMenu = false;
        iniciarJogo(nome);
        iniciarExecucao();
    }

    const tecla = evento.key;
    if (tecla === "ArrowUp" && estado.direcao.y === 0) estado.direcao = { x: 0, y: -1 };
    if (tecla === "ArrowDown" && estado.direcao.y === 0) estado.direcao = { x: 0, y: 1 };
    if (tecla === "ArrowLeft" && estado.direcao.x === 0) estado.direcao = { x: -1, y: 0 };
    if (tecla === "ArrowRight" && estado.direcao.x === 0) estado.direcao = { x: 1, y: 0 };
});

function iniciarExecucao() {
    if (!estado.emExecucao) {
        estado.emExecucao = true;
        setStatus("Jogando!");
        atualizarJogo();
    }
}

function pausarJogo() {
    estado.emExecucao = false;
    clearTimeout(estado.temporizador);
    setStatus("Pausado.");
}

function reiniciarJogo() {
    const estavaRodando = estado.emExecucao;
    clearTimeout(estado.temporizador);
    iniciarJogo(estado.nomeDoJogador);
    setStatus("Recomeçando...");
    if (estavaRodando) {
        iniciarExecucao();
    }
}

function salvarNoHistorico(nome, pontos) {
    const historico = JSON.parse(localStorage.getItem("historicoCobrinha")) || [];
    historico.push({ nome, pontos });
    localStorage.setItem("historicoCobrinha", JSON.stringify(historico));
}

function atualizarHistorico() {
    const historico = JSON.parse(localStorage.getItem("historicoCobrinha")) || [];
    refs.historico.innerHTML = "";

    if (historico.length === 0) {
        refs.historico.innerHTML = "<li>Nenhum registro ainda.</li>";
        return;
    }

    historico.slice().reverse().forEach(jogador => {
        const item = document.createElement("li");
        item.textContent = `${jogador.nome}: ${jogador.pontos} pts`;
        refs.historico.appendChild(item);
    });
}

function limparHistorico() {
    if (confirm("Apagar o histórico?")) {
        localStorage.removeItem("historicoCobrinha");
        atualizarHistorico();
    }
}

iniciarJogo();
desenharTela();

atualizarHistorico();
