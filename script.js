document.addEventListener('DOMContentLoaded', () => {
    const contentGrid = document.getElementById('content-grid');
    const searchInput = document.getElementById('caixa-busca');
    const header = document.querySelector('header');
    const searchButton = document.getElementById('botao-busca');
    let allData = [];

    // Mapeamento de super-categorias. Movido para o escopo superior para ser acessível por todas as funções.
    const superCategories = {
        'Tecnologias Core': ['Motor de Jogo', 'Motor de Física', 'Linguagem de Programação', 'Framework', 'Linguagem de Script', 'Arquitetura', 'Padrão de Projeto', 'Estrutura de Dados'],
        'Gráficos e Renderização': ['Gráficos', 'Renderização', 'API Gráfica', 'Animação', 'Otimização Gráfica', 'Iluminação', 'Gráficos 3D', 'Pipeline Gráfico'],
        'Design e Gameplay': ['Design de Jogos', 'Jogabilidade', 'Simulação', 'Design de IA', 'Mecânica', 'Gênero', 'Design'],
        'Online e Redes': ['Multiplayer', 'Rede', 'Serviços Online', 'Segurança', 'Backend', 'Protocolo', 'Netcode'],
        'Negócios e Monetização': ['Monetização', 'Modelo de Negócios', 'Live Service', 'Economia Digital', 'Analytics', 'Métricas'],
        'Ferramentas e Middleware': ['Middleware', 'Ferramenta de Criação', 'Controle de Versão', 'Áudio', 'Ferramentas', 'Biblioteca']
    };

    // Carrega os dados do JSON
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            allData = data;
            displayContent(allData);
            createCategoryFilters(allData);
        })
        .catch(error => {
            console.error('Erro ao carregar o arquivo data.json:', error);
            contentGrid.innerHTML = '<p>Não foi possível carregar os dados. Verifique o console para mais informações.</p>';
        });

    // Função para exibir o conteúdo na tela
    function displayContent(data) {
        contentGrid.innerHTML = ''; // Limpa o conteúdo atual

        if (data.length === 0) {
            contentGrid.innerHTML = '<p>Nenhum resultado encontrado.</p>';
            return;
        }

        // Agrupa os itens por categoria (usando a primeira tag)
        const categories = data.reduce((acc, item) => {
            // Usa a primeira tag como categoria, ou "Outros" se não houver tags
            const category = item.tags && item.tags.length > 0 ? item.tags[0] : 'Outros';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        }, {});

        // Mapeamento de super-categorias para cores (deve corresponder ao script.js)
        const superCategoryColors = {
            'Tecnologias Core': 'var(--color-core)',
            'Gráficos e Renderização': 'var(--color-graficos)',
            'Design e Gameplay': 'var(--color-design)',
            'Online e Redes': 'var(--color-redes)',
            'Negócios e Monetização': 'var(--color-negocios)',
            'Ferramentas e Middleware': 'var(--color-ferramentas)'
        };

        // Função auxiliar para encontrar a cor de uma sub-categoria
        function getColorForCategory(categoryName) {
            const superCategory = Object.keys(superCategories).find(sc => superCategories[sc].includes(categoryName));
            return superCategory ? superCategoryColors[superCategory] : 'var(--primary-color)';
        }

        // Cria o HTML para cada categoria e seus itens
        for (const categoryName in categories) {
            const items = categories[categoryName];
            
            const categoryWrapper = document.createElement('div');
            categoryWrapper.className = 'category-wrapper';

            // Define a cor da categoria dinamicamente
            const categoryColor = getColorForCategory(categoryName);
            categoryWrapper.style.setProperty('--category-color', categoryColor);

            const categoryTitle = document.createElement('h2');
            categoryTitle.className = 'category-title';
            categoryTitle.textContent = categoryName;
            categoryWrapper.appendChild(categoryTitle);

            const articlesGrid = document.createElement('div');
            articlesGrid.className = 'articles-grid';
            categoryWrapper.appendChild(articlesGrid);

            items.forEach(item => {
                const article = document.createElement('article');

                // Cria o HTML para as tags, envolvendo cada uma em um <span>
                const tagsHtml = item.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

                article.innerHTML = `
                    <h3>${item.nome}</h3>
                    <p><strong>Ano:</strong> ${item.data_criacao}</p>
                    <p>${item.descricao}</p>
                    <div class="tags-container">
                        ${tagsHtml}
                    </div>
                    <a href="${item.link}" target="_blank" class="saiba-mais">Saiba mais</a>
                `;
                articlesGrid.appendChild(article);
            });

            contentGrid.appendChild(categoryWrapper);
        }
    }

    // Função para criar os filtros de categoria
    function createCategoryFilters(data) {
        const searchBar = document.querySelector('.search-bar');
        if (!header || !searchBar) return;

        const allSubCategories = new Set(data.map(item => (item.tags && item.tags.length > 0 ? item.tags[0] : null)).filter(Boolean));

        // --- Cria o container para os botões de filtro ---
        const filterButtonsContainer = document.createElement('div');
        filterButtonsContainer.className = 'filter-buttons-container';
        header.insertBefore(filterButtonsContainer, searchBar);

        // --- Cria a estrutura do Modal ---
        const modal = document.createElement('div');
        modal.id = 'category-modal';
        modal.className = 'modal';
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        const categoryList = document.createElement('ul');
        categoryList.className = 'modal-category-list';
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(categoryList);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // --- Cria os botões das super-categorias ---
        const buttonTodas = document.createElement('button');
        buttonTodas.className = 'filter-btn';
        buttonTodas.textContent = 'Todas';
        buttonTodas.addEventListener('click', () => filterByCategory('Todas'));
        filterButtonsContainer.appendChild(buttonTodas);

        for (const superCategoryName in superCategories) {
            const subCategories = superCategories[superCategoryName].filter(sc => allSubCategories.has(sc));
            if (subCategories.length === 0) continue; // Não cria botão se não houver subcategorias

            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.textContent = superCategoryName;
            button.addEventListener('click', (event) => {
                openModalWith(event, superCategoryName, subCategories);
            });
            filterButtonsContainer.appendChild(button);
        }

        // --- Funções e Eventos do Modal ---
        function openModalWith(event, title, categories) {
            modalHeader.innerHTML = `<h2>${title}</h2><button class="close-btn">&times;</button>`;
            categoryList.innerHTML = ''; // Limpa a lista anterior

            categories.forEach(category => {
                const listItem = document.createElement('li');
                const categoryButton = document.createElement('button');
                categoryButton.textContent = category;
                categoryButton.dataset.category = category;

                categoryButton.addEventListener('click', () => {
                    filterByCategory(category);
                    closeModal();
                });

                listItem.appendChild(categoryButton);
                categoryList.appendChild(listItem);
            });

            // Adiciona o evento de fechar ao novo botão 'x'
            modal.querySelector('.close-btn').addEventListener('click', closeModal);

            // Posiciona o modal abaixo do botão clicado
            const btnRect = event.currentTarget.getBoundingClientRect();
            modalContent.style.top = `${btnRect.bottom + 8}px`; // 8px de espaço
            modalContent.style.left = `${btnRect.left}px`;
            modal.classList.add('active');
        }

        function closeModal() {
            modal.classList.remove('active');
        }

        // Fecha o modal se clicar fora do conteúdo
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
    }

    // Função para filtrar por categoria
    function filterByCategory(category) {
        // Lógica para destacar o botão ativo
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        if (category === 'Todas') {
            document.querySelector('.filter-btn').classList.add('active');
        } else {
            // Encontra qual super-categoria contém a sub-categoria e ativa o botão correspondente
            // (Esta parte pode ser implementada se desejado para um feedback visual mais completo)
        }

        searchInput.value = ''; // Limpa a busca ao usar o filtro
        if (category === 'Todas') {
            displayContent(allData);
            return;
        }

        const filteredData = allData.filter(item => {
            return item.tags && item.tags.length > 0 && item.tags[0] === category;
        });

        displayContent(filteredData);
    }

    // Função de busca
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (!searchTerm) {
            displayContent(allData); // Se a busca estiver vazia, mostra tudo
            return;
        }

        const filteredData = allData.filter(item => {
            const nameMatch = item.nome.toLowerCase().includes(searchTerm);
            const descriptionMatch = item.descricao.toLowerCase().includes(searchTerm);
            const tagsMatch = item.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            
            return nameMatch || descriptionMatch || tagsMatch;
        });

        displayContent(filteredData);
    }

    // Event Listeners para a busca
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    // Limpa a busca e mostra todos os itens se o campo de busca for limpo
    searchInput.addEventListener('input', () => {
        if (searchInput.value.trim() === '') {
            displayContent(allData);
        }
    });
});