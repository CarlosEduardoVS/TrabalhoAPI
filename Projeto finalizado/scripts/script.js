let API_KEY = "RGAPI-e26a2178-0de2-4229-8d3c-23c98f904842";

// Atualiza as tabelas Solo-Duo e Flex
function updateTable(obj, tableClass, flex = false) {
    let table = document.querySelector(`.${tableClass}`);
    table.innerHTML = ""; // Limpa o conteúdo da tabela antes de preencher novamente

    for (let i = 0; i < 3; i++) {
        let linha = document.createElement('tr'); // Cria uma nova linha

        // Coluna de número
        let numeroColuna = document.createElement('td');
        numeroColuna.textContent = i + 1;
        linha.appendChild(numeroColuna);

        // Coluna de jogador (será preenchida depois)
        let playerColuna = document.createElement('td');
        linha.appendChild(playerColuna);

        // Coluna de rank
        let rankColuna = document.createElement('td');
        rankColuna.textContent = obj.entries[i].leaguePoints;
        linha.appendChild(rankColuna);

        table.appendChild(linha); // Adiciona a linha completa à tabela
        fetchSummonerName(obj.entries[i].summonerId, playerColuna, flex);
    }
}

// Obtém o nome do invocador e atualiza a célula
function fetchSummonerName(summonerId, playerColuna, flex) {
    fetch(`https://br1.api.riotgames.com/lol/summoner/v4/summoners/${summonerId}?api_key=${API_KEY}`)
        .then(response => response.json())
        .then(data => fetchGameNickPuuid(data.puuid, playerColuna, flex));
}

// Busca nome e tag do jogador pelo PUUID e atualiza a célula
function fetchGameNickPuuid(puuid, playerColuna, flex) {
    fetch(`/api/riotProxy?endpoint=riot/account/v1/accounts/by-puuid/${puuid}`)
        .then(response => response.json())
        .then(data => {
            playerColuna.textContent = `${data.gameName}#${data.tagLine}`;
        });
}

// Função principal para atualizar as tabelas
function updatePlayers() {
    fetch(`https://br1.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5?api_key=${API_KEY}`)
        .then(response => response.json())
        .then(data => updateTable(data, "table-top-players-solo-duo", false));

    fetch(`https://br1.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_FLEX_SR?api_key=${API_KEY}`)
        .then(response => response.json())
        .then(data => updateTable(data, "table-top-players-flex", true));
}

// Função para exibir a rotação gratuita de campeões
function freeWeekRotation() {
    fetch(`https://br1.api.riotgames.com/lol/platform/v3/champion-rotations?api_key=${API_KEY}`)
        .then(response => response.json())
        .then(rotation => {
            fetch(`https://ddragon.leagueoflegends.com/cdn/14.21.1/data/pt_BR/champion.json`)
                .then(response => response.json())
                .then(data => {
                    let table = document.querySelector('.table-champs-popular');
                    table.innerHTML = ""; // Limpa a tabela antes de adicionar novas imagens
                    rotation.freeChampionIds.forEach(champId => {
                        let champion = Object.values(data.data).find(champ => champ.key === champId.toString());
                        if (champion) addChampionTable(champion.id);
                    });
                });
        });
}

// Adiciona a imagem do campeão à tabela
function addChampionTable(championId) {
    let imageUrl = `https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/${championId}.png`;
    let table = document.querySelector('.table-champs-popular');
    let linha = document.createElement('tr');
    let coluna = document.createElement('td');
    let img = document.createElement('img');

    img.src = imageUrl;
    img.alt = `${championId} - Champion Image`;
    img.className = `champion-image`;
    img.title = championId;

    coluna.appendChild(img);
    linha.appendChild(coluna);
    table.appendChild(linha);
}


// Pesquisar e armazenar jogador
function pesquisarJogador(event) {
    event.preventDefault();
    let jogador = document.getElementById('user').value;
    localStorage.setItem('nomeJogador', jogador);
    window.location.href = 'historico.html';
}



// Buscar histórico de partidas do jogador
function historicoJogador() {
    let jogador = localStorage.getItem("nomeJogador").split("#");
    let [nick, tag] = jogador;

    // Fetch para pegar as informações do jogador
    fetch(`https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${nick}/${tag}?api_key=${API_KEY}`)
        .then(response => response.json())
        .then(data => {
            // Exibe o nome do invocador
            let nomeInvocador = document.querySelector('.nome-invocador');
            let tagInvocador = document.querySelector('.tag-invocador');
            nomeInvocador.textContent = data.gameName;
            tagInvocador.textContent = `#${data.tagLine}`;

            // Fetch para pegar os ícones do jogador
            fetch(`https://br1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${data.puuid}?api_key=${API_KEY}`)
                .then(response => response.json())
                .then(profile => {
                    let icon = document.querySelector('.image-invocador');
                    icon.src = `https://ddragon.leagueoflegends.com/cdn/14.21.1/img/profileicon/${profile.profileIconId}.png`;
                });

            // Agora vamos pegar as partidas
            fetch(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${data.puuid}/ids?start=0&count=10&api_key=${API_KEY}`)
                .then(response => response.json())
                .then(matches => {
                    // Carrega as partidas
                    matches.forEach(matchId => {
                        fetch(`https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${API_KEY}`)
                            .then(response => response.json())
                            .then(obj => {
                                let historicoDiv = document.querySelector('.historico');
                                let partidaDiv = document.createElement('div');
                                partidaDiv.classList.add('partida');

                                // Encontra o resultado da partida
                                let resultado = obj.info.participants.find(player => player.riotIdGameName.toLowerCase() === nick.toLowerCase());
                               

                                // Obtemos a descrição da fila (tipo de partida)
                                fetch('https://static.developer.riotgames.com/docs/lol/queues.json')
                                    .then(response => response.json())
                                    .then(queueData => {
                                        let queue = queueData.find(q => q.queueId === obj.info.queueId);
                                        if (queue) {
                                            // Título da partida
                                            let tituloPartida = document.createElement('h2');
                                            tituloPartida.textContent = `Partida: ${queue.description}`;
                                            partidaDiv.appendChild(tituloPartida);

                                            // Status da partida
                                            let statusPartida = document.createElement('div');
                                            statusPartida.classList.add('status-partida');
                                            if (resultado.win) {
                                                statusPartida.style.backgroundColor = "green";
                                                statusPartida.textContent = "Vitória";
                                            } else {
                                                statusPartida.style.backgroundColor = "red";
                                                statusPartida.textContent = "Derrota";
                                            }
                                            partidaDiv.appendChild(statusPartida);

                                            // Para cada jogador, mostramos as informações
                                            obj.info.participants.forEach(player => {
                                                let jogadorDiv = document.createElement('div');
                                                jogadorDiv.classList.add('jogador');

                                                let jogadorNome = document.createElement('p');
                                                jogadorNome.textContent = `${player.riotIdGameName} (${player.championName})`;

                                                let jogadorStatus = document.createElement('span');
                                                jogadorStatus.textContent = player.win ? 'Vitória' : 'Derrota';

                                                let jogadorImagemCampeao = document.createElement('img');
                                                jogadorImagemCampeao.src = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${player.championName}_0.jpg`;
                                                jogadorImagemCampeao.alt = `Imagem do campeão ${player.championName}`;

                                                jogadorDiv.appendChild(jogadorNome);
                                                jogadorDiv.appendChild(jogadorStatus);
                                                jogadorDiv.appendChild(jogadorImagemCampeao);

                                                partidaDiv.appendChild(jogadorDiv);
                                            });

                                            // Adiciona a partida ao histórico
                                            historicoDiv.appendChild(partidaDiv);
                                        }
                                    });
                            });
                    });
                });
        })

    // localStorage.removeItem("nomeJogador");
}

function nameChampions(){
    fetch("https://ddragon.leagueoflegends.com/cdn/14.22.1/data/pt_BR/champion.json").then(resp => resp.json())
    .then(obj => {
        Object.values(obj.data).forEach(champion => infoChampion(champion.id));
    });
}

function infoChampion(idChampion) {
    let container = document.querySelector('.div-champion-container');
    let championImage = document.createElement('img');
    let nomeDiv = document.createElement('div');
    let nomeChampion = document.createElement('p');
    let championContainer = document.createElement('div');
    let deleteButton = document.createElement('button'); // Botão de excluir

    // Estilo do botão de excluir
    deleteButton.className = 'delete-button';
    deleteButton.innerHTML = 'X'; // O texto ou ícone do botão
    deleteButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Impede o clique de propagar para os elementos pais
        championContainer.remove(); // Remove apenas o contêiner específico do campeão
    });

    nomeDiv.className = 'container-nome-champions';
    championContainer.className = 'champion-container';

    // Cria a imagem do campeão
    championImage.src = `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${idChampion}_0.jpg`;
    championImage.alt = `${idChampion} - Champion Image`;
    championImage.className = 'champion-galeria';
    championImage.title = idChampion;

    // Cria o nome do campeão
    nomeChampion.className = 'champion-name';
    nomeChampion.textContent = idChampion;

    // Adiciona a imagem e o nome ao container
    championContainer.appendChild(championImage);
    championContainer.appendChild(nomeDiv);
    nomeDiv.appendChild(nomeChampion);
    championContainer.appendChild(deleteButton); // Adiciona o botão de excluir ao container

    // Adiciona o container à célula
    container.appendChild(championContainer);
}

function stats(){

    document.getElementById('edit-status').addEventListener('click', function() {
        // Mostra o campo de input e oculta o texto de status
        let statusText = document.getElementById('status-text');
        let inputStatus = document.getElementById('input-status');
        
        // Define o valor atual do status no campo de input
        inputStatus.value = statusText.textContent.trim(); // Adicionando .trim() para limpar espaços extras
    
        // Mostra o campo de input e esconde o texto
        inputStatus.style.display = 'block';
        statusText.style.display = 'none';
        
        // Foca no campo de input para facilitar a edição
        inputStatus.focus();
        inputStatus.select(); // Seleciona o texto para facilitar a edição
    });
    
    document.getElementById('input-status').addEventListener('blur', function() {
        let statusText = document.getElementById('status-text');
        let inputStatus = document.getElementById('input-status');
    
        // Atualiza o texto do status com o valor digitado no campo de input (limita a 20 caracteres)
        statusText.textContent = inputStatus.value.trim().substring(0, 20); // Limita o valor a 20 caracteres
    
        // Esconde o campo de input e mostra o texto de status novamente
        inputStatus.style.display = 'none';
        statusText.style.display = 'block';
    });
    
    document.getElementById('input-status').addEventListener('input', function() {
        // Faz o input ajustar sua largura dinamicamente conforme o conteúdo
        this.style.width = `${this.value.length + 1}ch`; // Calcula largura com base no número de caracteres
        if (this.value.length > 20) {
            this.value = this.value.substring(0, 20); // Limita a 20 caracteres
        }
    });
    
    // Adiciona a funcionalidade de pressionar "Enter" para salvar o status
    document.getElementById('input-status').addEventListener('keydown', function(event) {
        if (event.key === "Enter") {
            let statusText = document.getElementById('status-text');
            let inputStatus = document.getElementById('input-status');
    
            // Atualiza o texto do status com o valor digitado no campo de input (limita a 20 caracteres)
            statusText.textContent = inputStatus.value.trim().substring(0, 20); // Limita o valor a 20 caracteres
    
            // Esconde o campo de input e mostra o texto de status novamente
            inputStatus.style.display = 'none';
            statusText.style.display = 'block';
        }
    });

}
// Detectar e executar funções específicas de página ao carregar
document.addEventListener("DOMContentLoaded", () => {
    let currentPath = window.location.pathname;
    updatePlayers();
    freeWeekRotation();
    if (currentPath.includes("historico.html")) {
        stats()
        historicoJogador();
    } else if (currentPath.includes("champions.html")){
        nameChampions();
    }
});
