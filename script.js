// Banco de dados interno com correção automática para evitar o erro 'undefined'
let dadosTreino = JSON.parse(localStorage.getItem('dadosSaitama')) || {
    totalTreinos: 0,
    sequenciaDias: 0,
    recordeSemanal: 0,
    recordeMensal: 0,
    recordeAnual: 0,
    historicoDias: [] 
};

// Segurança contra o erro do localStorage antigo do seu navegador
if (dadosTreino.recordeSemanal === undefined) dadosTreino.recordeSemanal = 0;
if (dadosTreino.recordeMensal === undefined) dadosTreino.recordeMensal = 0;
if (dadosTreino.recordeAnual === undefined) dadosTreino.recordeAnual = 0;
if (!dadosTreino.historicoDias) dadosTreino.historicoDias = [];

let progressoDoDia = { flexoes: 0, agachamentos: 0, abdominais: 0, corrida: 0 };

// Referências dos Áudios
const somRocky = document.getElementById('musica-rocky');
const somSaitama = document.getElementById('musica-saitama');
const btnPlayerRocky = document.getElementById('btn-player-rocky');

// Configuração do Banco de Dados Público para o Treino do Saitama
// (Substitua pelas suas chaves reais do Firebase quando criar o seu próprio painel)
const firebaseConfig = {
    apiKey: "AIzaSyDcWBSszVfCCoXbb9I3xjqN837v7IXOKE4",
    authDomain: "treino-saitama.firebaseapp.com",
    projectId: "treino-saitama",
    storageBucket: "treino-saitama.firebasestorage.app",
    messagingSenderId: "40811947614",
    appId: "1:40811947614:web:962ac688186e8753e6f6cf",
    measurementId: "G-DW9JLMTCBK"
  };

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Tipo de ranking atual ('sequencia' ou 'total')
let tipoRankingAtual = 'sequencia';

// Inicializa o layout da página
atualizarPainelEstatisticas();
gerarCalendario();

// Controle manual de som do Rocky de fundo
function controlarMusicaRocky() {
    if (somRocky.paused) {
        somRocky.play().then(() => {
            btnPlayerRocky.textContent = "⏸️ Pausar Tema do Rocky";
            btnPlayerRocky.style.background = "#2ecc71";
        }).catch(err => {
            alert("Clique em qualquer lugar da tela primeiro para permitir o áudio do navegador.");
        });
    } else {
        somRocky.pause();
        btnPlayerRocky.textContent = "▶️ Tocar Tema do Rocky";
        btnPlayerRocky.style.background = "#eab543";
    }
}

function mudarQtd(exercicio, valor) {
    progressoDoDia[exercicio] += valor;
    if (progressoDoDia[exercicio] < 0) progressoDoDia[exercicio] = 0;
    
    document.getElementById(`qtd-${exercicio}`).textContent = progressoDoDia[exercicio];
}

// --- BOTÃO CONCLUIR TREINO (MÁGICA UNIFICADA AQUI) ---
document.getElementById('btn-concluir').addEventListener('click', () => {
    if (progressoDoDia.flexoes >= 100 && progressoDoDia.agachamentos >= 100 && progressoDoDia.abdominais >= 100 && progressoDoDia.corrida >= 10) {
        
        let hoje = new Date().toISOString().split('T')[0];

        if (dadosTreino.historicoDias.includes(hoje)) {
            alert("Você já completou o treino de hoje! Vá descansar para não perder o cabelo!");
            return;
        }

        // Guarda a sequência antiga para verificar se vai quebrar o recorde semanal
        let sequenciaAntiga = dadosTreino.sequenciaDias;

        // Para a música de treino para tocar o som da vitória
        somRocky.pause(); 

        dadosTreino.totalTreinos++;
        dadosTreino.sequenciaDias++;
        dadosTreino.historicoDias.push(hoje);

        // Verifica se bateu o recorde semanal e dispara a animação do soco
        let bateuRecorde = false;
        if (dadosTreino.sequenciaDias > dadosTreino.recordeSemanal) {
            dadosTreino.recordeSemanal = Math.min(dadosTreino.sequenciaDias, 7);
            bateuRecorde = true;
        }
        if (dadosTreino.sequenciaDias > dadosTreino.recordeMensal) {
            dadosTreino.recordeMensal = Math.min(dadosTreino.sequenciaDias, 30);
        }
        if (dadosTreino.sequenciaDias > dadosTreino.recordeAnual) {
            dadosTreino.recordeAnual = Math.min(dadosTreino.sequenciaDias, 365);
        }

        salvarNoLocalStorage();
        atualizarPainelEstatisticas();
        gerarCalendario();
        resetarContadores();

        // Se quebrou a própria marca antiga, o Saitama entra destruindo tudo!
        if (bateuRecorde) {
            dispararSocoSaitama(sequenciaAntiga);
        } else {
            // Caso não seja recorde, toca a trilha de conclusão normal
            somSaitama.currentTime = 0;
            somSaitama.play().catch(e => console.log("Erro ao tocar som do Saitama:", e));
            alert("🚀 INCRÍVEL! Treino do Saitama concluído com Sucesso!");
        }

        // Sincroniza o novo progresso com o Ranking Online se o nome estiver registrado
        const nomeSalvo = localStorage.getItem('nomeGuerreiro');
        if (nomeSalvo) {
            salvarDadosNoFirebase(nomeSalvo, dadosTreino.sequenciaDias, dadosTreino.totalTreinos);
        }

        somSaitama.onended = () => {
            somRocky.play().catch(e => {});
            btnPlayerRocky.textContent = "⏸️ Pausar Tema do Rocky";
            btnPlayerRocky.style.background = "#2ecc71";
        };

    } else {
        alert("❌ Você ainda não atingiu as metas mínimas de hoje (100 flexões, agachamentos, abdominais e 10km de corrida)!");
    }
});

document.getElementById('btn-salvar').addEventListener('click', () => {
    salvarNoLocalStorage();
    alert("Progresso salvo com sucesso!");
});

function resetarContadores() {
    progressoDoDia = { flexoes: 0, agachamentos: 0, abdominais: 0, corrida: 0 };
    document.getElementById('qtd-flexoes').textContent = 0;
    document.getElementById('qtd-agachamentos').textContent = 0;
    document.getElementById('qtd-abdominais').textContent = 0;
    document.getElementById('qtd-corrida').textContent = 0;
}

function salvarNoLocalStorage() {
    localStorage.setItem('dadosSaitama', JSON.stringify(dadosTreino));
}

function atualizarPainelEstatisticas() {
    document.getElementById('total-treinos').textContent = dadosTreino.totalTreinos;
    document.getElementById('sequencia-dias').textContent = `${dadosTreino.sequenciaDias} dias`;
    document.getElementById('recorde-semanal').textContent = `${dadosTreino.recordeSemanal} / 7`;
    document.getElementById('recorde-mensal').textContent = `${dadosTreino.recordeMensal} / 30`;
    document.getElementById('recorde-anual').textContent = `${dadosTreino.recordeAnual} / 365`;
}

function gerarCalendario() {
    const container = document.getElementById('calendario-dias');
    if(!container) return;
    container.innerHTML = '';

    const espacosVazios = 1; 
    const totalDiasMes = 30;

    for (let i = 0; i < espacosVazios; i++) {
        let divVazia = document.createElement('div');
        divVazia.className = 'dia-vazio';
        container.appendChild(divVazia);
    }

    let hojeNum = new Date().getDate();
    let mesAtual = new Date().getMonth(); 

    for (let dia = 1; dia <= totalDiasMes; dia++) {
        let divDia = document.createElement('div');
        divDia.className = 'dia-num';
        divDia.textContent = dia;

        let diaFormatado = dia < 10 ? `0${dia}` : dia;
        let dataString = `2026-06-${diaFormatado}`;

        if (dadosTreino.historicoDias.includes(dataString)) {
            divDia.classList.add('treinado');
        }

        if (dia === hojeNum && mesAtual === 5) {
            divDia.classList.add('hoje');
        }

        container.appendChild(divDia);
    }
}

// --- ANIMAÇÃO IMPACTANTE DO SOCO ---
function dispararSocoSaitama(valorAntigo) {
    const overlay = document.getElementById('tela-superacao');
    const numElement = document.getElementById('numero-antigo');
    
    numElement.textContent = valorAntigo;
    numElement.classList.remove('quebrar');
    
    overlay.style.display = 'flex';
    document.body.classList.add('tremer-tela');

    if (somSaitama) {
        somSaitama.currentTime = 0;
        somSaitama.play().catch(e => console.log("Erro ao tocar áudio:", e));
    }

    setTimeout(() => {
        numElement.classList.add('quebrar');
    }, 300);

    setTimeout(() => {
        document.body.classList.remove('tremer-tela');
    }, 400);

    setTimeout(() => {
        overlay.style.display = 'none';
    }, 3500);
}

// --- SISTEMA DE RANKING DO FIREBASE ---

function registrarNoRanking() {
    const inputNome = document.getElementById('nome-usuario');
    const nome = inputNome.value.trim();

    if (nome === "") {
        alert("Digite seu nome de herói!");
        return;
    }

    localStorage.setItem('nomeGuerreiro', nome);
    inputNome.disabled = true;
    
    const botao = document.querySelector('.registro-nome button');
    if (botao) {
        botao.disabled = true;
        botao.innerText = "OK";
    }

    // Salva o usuário mandando o progresso real que ele já tem acumulado no app
    salvarDadosNoFirebase(nome, dadosTreino.sequenciaDias, dadosTreino.totalTreinos); 
}

function salvarDadosNoFirebase(nome, sequencia, total) {
    db.collection("guerreiros").doc(nome).set({
        nome: nome,
        sequencia: parseInt(sequencia) || 0,
        totalDias: parseInt(total) || 0,
        ultimaAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
    .then(() => {
        carregarRankingOnline();
    })
    .catch((error) => console.error("Erro ao salvar no banco: ", error));
}

function carregarRankingOnline() {
    const campoOrdenacao = tipoRankingAtual === 'sequencia' ? 'sequencia' : 'totalDias';
    
    db.collection("guerreiros")
        .orderBy(campoOrdenacao, "desc")
        .limit(5)
        .get()
        .then((querySnapshot) => {
            const lista = document.getElementById('lista-ranking');
            if (!lista) return;
            lista.innerHTML = ""; 
            
            let posicao = 1;
            querySnapshot.forEach((doc) => {
                const dados = doc.data();
                const valor = tipoRankingAtual === 'sequencia' ? `${dados.sequencia} dias` : `${dados.totalDias} totais`;
                
                const item = document.createElement('li');
                item.innerHTML = `<span><strong>${posicao}° ${dados.nome}</strong></span> <span>${valor}</span>`;
                lista.appendChild(item);
                posicao++;
            });

            for (let i = posicao; i <= 5; i++) {
                const itemVazio = document.createElement('li');
                itemVazio.innerHTML = `<span>${i}° Vazio</span> <span>0 dias</span>`;
                lista.appendChild(itemVazio);
            }
        });
}

function mostrarRanking(tipo) {
    tipoRankingAtual = tipo;
    carregarRankingOnline();
}

// Configuração executada ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    carregarRankingOnline();
    
    const nomeSalvo = localStorage.getItem('nomeGuerreiro');
    if (nomeSalvo) {
        const inputNome = document.getElementById('nome-usuario');
        if (inputNome) {
            inputNome.value = nomeSalvo;
            inputNome.disabled = true;
        }
        const botao = document.querySelector('.registro-nome button');
        if (botao) {
            botao.disabled = true;
            botao.innerText = "OK";
        }
    }
});
