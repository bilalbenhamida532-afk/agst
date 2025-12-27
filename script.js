// Configuration globale
const CONFIG = {
    DATA_FILE: 'data/games.json',
    IMAGE_BASE_PATH: 'uploads/images/',
    MIN_ITEMS: 3,
    DISCOUNT_PERCENT: 10, // 10% de remise pour 3+ articles
    INACTIVITY_TIMEOUT: 900, // 15 minutes en secondes
    ITEMS_PER_PAGE: 12
};

// Données globales
let gamesData = [];
let categoriesData = [];
let currentGames = [];
let cart = [];
let currentPage = 1;
let totalPages = 1;
let currentCategory = '';
let currentPlatform = '';
let inactivityTimer;
let inactivitySeconds = CONFIG.INACTIVITY_TIMEOUT;
let salesHistory = JSON.parse(localStorage.getItem('amine_sales')) || [];
let searchFilters = {
    platform: '',
    priceMax: 1000,
    sortBy: 'name-asc'
};

// Initialisation
document.addEventListener('DOMContentLoaded', async function() {
    await loadGamesData();
    initializeApp();
    startInactivityTimer();
    
    // Événements
    document.addEventListener('click', resetInactivityTimer);
    document.addEventListener('touchstart', resetInactivityTimer);
    document.addEventListener('keydown', resetInactivityTimer);
    
    // Clavier virtuel
    document.querySelectorAll('.key').forEach(key => {
        if (key.dataset.key) {
            key.addEventListener('click', () => typeKey(key.dataset.key));
        }
    });
    
    // Slider de prix
    const priceSlider = document.getElementById('price-slider');
    const priceMax = document.getElementById('price-max');
    
    priceSlider.addEventListener('input', function() {
        const value = this.value;
        priceMax.textContent = value === '1000' ? '1000+ DH' : `${value} DH`;
    });
});

// Charger les données depuis le fichier JSON
async function loadGamesData() {
    try {
        const response = await fetch(CONFIG.DATA_FILE);
        const data = await response.json();
        
        gamesData = data.games || [];
        categoriesData = data.categories || [];
        
        // Mettre à jour les compteurs
        updateCategoryCounts();
        
        console.log(`${gamesData.length} jeux chargés avec succès`);
    } catch (error) {
        console.error('Erreur de chargement des données:', error);
        // Données par défaut
        gamesData = getDefaultGames();
        categoriesData = getDefaultCategories();
    }
}

// Données par défaut (en cas d'erreur)
function getDefaultGames() {
    return [
        {
            id: 1,
            name: "God of War Ragnarök",
            platform: "PS5",
            category: "Action-Aventure",
            price: 300,
            image: "default-game.jpg",
            description: "Jeu d'action-aventure épique",
            stock: 5,
            popularity: 95
        },
        // ... autres jeux par défaut
    ];
}

function getDefaultCategories() {
    return [
        { id: "PS5", name: "PlayStation 5", icon: "fab fa-playstation", color: "#003791" },
        { id: "PS4", name: "PlayStation 4", icon: "fab fa-playstation", color: "#0066cc" },
        { id: "XBOX Series", name: "XBOX Series", icon: "fab fa-xbox", color: "#107c10" },
        { id: "Switch", name: "Nintendo Switch", icon: "fas fa-gamepad", color: "#e60012" }
    ];
}

// Initialiser l'application
function initializeApp() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Initialiser les filtres de plateforme
    initPlatformFilters();
    
    // Charger les catégories dans la navigation
    loadNavigationCategories();
}

// Mettre à jour l'heure et date
function updateDateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('current-time').textContent = 
        now.toLocaleDateString('fr-FR', options);
}

// Timer d'inactivité
function startInactivityTimer() {
    resetInactivityTimer();
    
    inactivityTimer = setInterval(() => {
        inactivitySeconds--;
        updateInactivityDisplay();
        
        if (inactivitySeconds <= 0) {
            clearInterval(inactivityTimer);
            returnToWelcomeScreen();
        }
    }, 1000);
}

function resetInactivityTimer() {
    inactivitySeconds = CONFIG.INACTIVITY_TIMEOUT;
    updateInactivityDisplay();
}

function updateInactivityDisplay() {
    const minutes = Math.floor(inactivitySeconds / 60);
    const seconds = inactivitySeconds % 60;
    const timerElement = document.getElementById('inactivity-timer');
    if (timerElement) {
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

function returnToWelcomeScreen() {
    document.getElementById('main-interface').style.display = 'none';
    document.getElementById('welcome-screen').classList.add('active');
    clearCart();
}

// Démarrer l'application
function startApp() {
    document.getElementById('welcome-screen').classList.remove('active');
    document.getElementById('main-interface').style.display = 'block';
    resetInactivityTimer();
}

// Navigation
function goHome() {
    showPage('home-page');
    document.getElementById('category-nav').classList.remove('active');
    resetInactivityTimer();
}

function loadCategory(platform) {
    currentPlatform = platform;
    currentCategory = '';
    searchFilters.platform = platform;
    
    // Afficher la navigation des catégories
    const categoryNav = document.getElementById('category-nav');
    categoryNav.classList.add('active');
    
    // Charger les catégories pour cette plateforme
    const categories = getCategoriesForPlatform(platform);
    displayCategoryNavigation(categories);
    
    // Charger les jeux
    loadGamesForPlatform(platform);
    showPage('games-page');
    
    // Mettre à jour le titre
    document.getElementById('games-title').textContent = `Jeux ${platform}`;
    document.getElementById('breadcrumb').innerHTML = 
        `<span>Accueil</span> > <span>${platform}</span>`;
    
    resetInactivityTimer();
}

function getCategoriesForPlatform(platform) {
    const platformGames = gamesData.filter(game => game.platform === platform);
    const categories = [...new Set(platformGames.map(game => game.category))];
    return categories.map(cat => ({
        id: cat,
        name: cat,
        count: platformGames.filter(game => game.category === cat).length
    }));
}

function displayCategoryNavigation(categories) {
    const container = document.getElementById('category-nav');
    container.innerHTML = '';
    
    // Ajouter "Tous"
    const allItem = document.createElement('div');
    allItem.className = 'nav-item active';
    allItem.textContent = 'Tous';
    allItem.onclick = () => filterByCategory('');
    container.appendChild(allItem);
    
    // Ajouter les catégories
    categories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'nav-item';
        item.textContent = `${cat.name} (${cat.count})`;
        item.onclick = () => filterByCategory(cat.id);
        container.appendChild(item);
    });
}

function filterByCategory(category) {
    currentCategory = category;
    
    // Mettre à jour les classes actives
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const items = document.querySelectorAll('.nav-item');
    if (category === '') {
        items[0].classList.add('active');
    } else {
        items[Array.from(items).findIndex(item => item.textContent.includes(category))].classList.add('active');
    }
    
    // Filtrer les jeux
    applyFilters();
}

function loadGamesForPlatform(platform) {
    currentGames = gamesData.filter(game => game.platform === platform);
    displayGames(currentGames);
}

function displayGames(games) {
    const container = document.getElementById('games-container');
    const pagination = document.getElementById('pagination');
    
    if (games.length === 0) {
        container.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-gamepad" style="font-size: 4rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                <h3>Aucun jeu trouvé</h3>
                <p>Essayez de modifier vos filtres</p>
            </div>
        `;
        pagination.innerHTML = '';
        return;
    }
    
    // Pagination
    totalPages = Math.ceil(games.length / CONFIG.ITEMS_PER_PAGE);
    const start = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const end = start + CONFIG.ITEMS_PER_PAGE;
    const pageGames = games.slice(start, end);
    
    // Afficher les jeux
    container.innerHTML = '';
    pageGames.forEach(game => {
        const gameElement = createGameElement(game);
        container.appendChild(gameElement);
    });
    
    // Afficher la pagination
    displayPagination();
}

function createGameElement(game) {
    const div = document.createElement('div');
    div.className = 'game-card';
    div.innerHTML = `
        ${game.stock < 3 ? '<div class="game-badge">Stock bas</div>' : ''}
        ${game.popularity > 90 ? '<div class="game-badge" style="background: var(--accent);">Populaire</div>' : ''}
        
        <img src="${CONFIG.IMAGE_BASE_PATH}${game.platform.toLowerCase()}/${game.image}" 
             alt="${game.name}" 
             class="game-image"
             onerror="this.src='default-game.jpg'">
        
        <div class="game-info">
            <div class="game-title">${game.name}</div>
            <div class="game-platform">
                <i class="${getPlatformIcon(game.platform)}"></i> ${game.platform}
            </div>
            <div class="game-price">
                ${game.price} DH
                <button class="add-to-cart" onclick="addToCart(${game.id})">
                    <i class="fas fa-cart-plus"></i>
                </button>
            </div>
        </div>
    `;
    
    div.onclick = () => showGameDetails(game);
    return div;
}

function getPlatformIcon(platform) {
    if (platform.includes('PlayStation') || platform.includes('PS')) {
        return 'fab fa-playstation';
    } else if (platform.includes('XBOX') || platform.includes('Xbox')) {
        return 'fab fa-xbox';
    } else if (platform.includes('Nintendo') || platform.includes('Switch')) {
        return 'fas fa-gamepad';
    }
    return 'fas fa-tv';
}

function displayPagination() {
    const container = document.getElementById('pagination');
    container.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Bouton précédent
    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.onclick = () => changePage(currentPage - 1);
        container.appendChild(prevBtn);
    }
    
    // Pages
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = currentPage === i ? 'active' : '';
        pageBtn.onclick = () => changePage(i);
        container.appendChild(pageBtn);
    }
    
    // Bouton suivant
    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.onclick = () => changePage(currentPage + 1);
        container.appendChild(nextBtn);
    }
}

function changePage(page) {
    currentPage = page;
    applyFilters();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Filtres
function initPlatformFilters() {
    const container = document.getElementById('platform-filters');
    const platforms = [...new Set(gamesData.map(game => game.platform))];
    
    platforms.forEach(platform => {
        const tag = document.createElement('div');
        tag.className = 'filter-tag';
        tag.textContent = platform;
        tag.onclick = () => togglePlatformFilter(platform, tag);
        container.appendChild(tag);
    });
}

function togglePlatformFilter(platform, element) {
    element.classList.toggle('active');
    
    if (element.classList.contains('active')) {
        searchFilters.platform = platform;
    } else {
        searchFilters.platform = '';
    }
}

function toggleFilters() {
    document.getElementById('filters-panel').classList.toggle('active');
}

function applyFilters() {
    let filtered = gamesData;
    
    // Filtrer par plateforme
    if (searchFilters.platform) {
        filtered = filtered.filter(game => game.platform === searchFilters.platform);
    }
    
    // Filtrer par catégorie
    if (currentCategory) {
        filtered = filtered.filter(game => game.category === currentCategory);
    }
    
    // Filtrer par prix
    filtered = filtered.filter(game => game.price <= searchFilters.priceMax);
    
    // Trier
    filtered = sortGamesArray(filtered, searchFilters.sortBy);
    
    // Mettre à jour l'affichage
    currentGames = filtered;
    currentPage = 1;
    displayGames(filtered);
}

function resetFilters() {
    searchFilters = {
        platform: '',
        priceMax: 1000,
        sortBy: 'name-asc'
    };
    
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.classList.remove('active');
    });
    
    document.getElementById('price-slider').value = 1000;
    document.getElementById('price-max').textContent = '1000+ DH';
    document.getElementById('sort-select').value = 'name-asc';
    
    applyFilters();
}

function sortGames() {
    searchFilters.sortBy = document.getElementById('sort-select').value;
    applyFilters();
}

function sortGamesArray(games, sortBy) {
    switch (sortBy) {
        case 'name-asc':
            return games.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc':
            return games.sort((a, b) => b.name.localeCompare(a.name));
        case 'price-asc':
            return games.sort((a, b) => a.price - b.price);
        case 'price-desc':
            return games.sort((a, b) => b.price - a.price);
        case 'popular':
            return games.sort((a, b) => b.popularity - a.popularity);
        default:
            return games;
    }
}

// Recherche
function searchGames() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    
    if (!query) {
        return;
    }
    
    const results = gamesData.filter(game => 
        game.name.toLowerCase().includes(query) ||
        game.platform.toLowerCase().includes(query) ||
        game.category.toLowerCase().includes(query)
    );
    
    displaySearchResults(results, query);
}

function displaySearchResults(results, query) {
    const container = document.getElementById('search-results');
    const countElement = document.getElementById('search-count');
    
    countElement.textContent = `${results.length} résultat${results.length > 1 ? 's' : ''} pour "${query}"`;
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-search" style="font-size: 4rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                <h3>Aucun résultat</h3>
                <p>Essayez d'autres termes de recherche</p>
            </div>
        `;
    } else {
        container.innerHTML = '';
        results.forEach(game => {
            const gameElement = createGameElement(game);
            container.appendChild(gameElement);
        });
    }
    
    showPage('search-page');
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    goHome();
}

// Clavier virtuel
function showKeyboard() {
    document.getElementById('virtual-keyboard').classList.add('active');
}

function hideKeyboard() {
    document.getElementById('virtual-keyboard').classList.remove('active');
}

function typeKey(key) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value += key;
        searchInput.focus();
    }
}

function backspace() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = searchInput.value.slice(0, -1);
        searchInput.focus();
    }
}

// Panier
function toggleCart() {
    const overlay = document.getElementById('cart-overlay');
    const sidebar = document.getElementById('cart-sidebar');
    
    overlay.classList.toggle('active');
    sidebar.classList.toggle('open');
    
    if (sidebar.classList.contains('open')) {
        updateCartDisplay();
    }
}

function addToCart(gameId) {
    const game = gamesData.find(g => g.id === gameId);
    if (!game) return;
    
    // Vérifier le stock
    if (game.stock <= 0) {
        alert('Ce jeu est en rupture de stock');
        return;
    }
    
    // Vérifier si le jeu est déjà dans le panier
    const existingItem = cart.find(item => item.id === gameId);
    if (existingItem) {
        if (existingItem.quantity >= game.stock) {
            alert(`Stock limité: ${game.stock} exemplaire(s) disponible(s)`);
            return;
        }
        existingItem.quantity++;
    } else {
        cart.push({
            ...game,
            quantity: 1
        });
    }
    
    // Mettre à jour l'affichage
    updateCartCount();
    showAddToCartAnimation();
    resetInactivityTimer();
}

function removeFromCart(gameId) {
    const itemIndex = cart.findIndex(item => item.id === gameId);
    if (itemIndex > -1) {
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity--;
        } else {
            cart.splice(itemIndex, 1);
        }
    }
    
    updateCartDisplay();
    updateCartCount();
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-count').textContent = count;
}

function updateCartDisplay() {
    const container = document.getElementById('cart-items');
    const emptyCart = document.getElementById('empty-cart');
    const subtotalElement = document.getElementById('subtotal');
    const discountElement = document.getElementById('discount');
    const totalElement = document.getElementById('total-price');
    const confirmBtn = document.getElementById('confirm-btn');
    const warningElement = document.getElementById('cart-warning');
    
    if (cart.length === 0) {
        emptyCart.style.display = 'block';
        container.innerHTML = '';
    } else {
        emptyCart.style.display = 'none';
        container.innerHTML = '';
        
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <img src="${CONFIG.IMAGE_BASE_PATH}${item.platform.toLowerCase()}/${item.image}" 
                     alt="${item.name}" 
                     class="cart-item-image"
                     onerror="this.src='default-game.jpg'">
                
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-platform">${item.platform}</div>
                    <div class="cart-item-quantity">
                        <button onclick="changeQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="changeQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
                
                <div class="cart-item-price">
                    ${item.price * item.quantity} DH
                </div>
                
                <button class="remove-item" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(itemElement);
        });
    }
    
    // Calculer les totaux
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems >= CONFIG.MIN_ITEMS) {
        discount = subtotal * (CONFIG.DISCOUNT_PERCENT / 100);
    }
    
    const total = subtotal - discount;
    
    // Mettre à jour les affichages
    subtotalElement.textContent = `${subtotal} DH`;
    discountElement.textContent = `${discount} DH`;
    totalElement.textContent = `${total} DH`;
    
    // Activer/désactiver le bouton de confirmation
    const canConfirm = totalItems >= CONFIG.MIN_ITEMS;
    confirmBtn.disabled = !canConfirm;
    warningElement.style.display = canConfirm ? 'none' : 'flex';
}

function changeQuantity(gameId, delta) {
    const item = cart.find(item => item.id === gameId);
    if (!item) return;
    
    const game = gamesData.find(g => g.id === gameId);
    const newQuantity = item.quantity + delta;
    
    if (newQuantity < 1) {
        removeFromCart(gameId);
    } else if (newQuantity > game.stock) {
        alert(`Stock limité: ${game.stock} exemplaire(s) disponible(s)`);
    } else {
        item.quantity = newQuantity;
        updateCartDisplay();
        updateCartCount();
    }
}

function clearCart() {
    cart = [];
    updateCartDisplay();
    updateCartCount();
}

function showAddToCartAnimation() {
    const cartBtn = document.querySelector('.cart-btn');
    cartBtn.style.transform = 'scale(1.2)';
    setTimeout(() => {
        cartBtn.style.transform = 'scale(1)';
    }, 300);
}

// Commande
function confirmOrder() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems < CONFIG.MIN_ITEMS) {
        alert(`Minimum ${CONFIG.MIN_ITEMS} articles requis pour commander`);
        return;
    }
    
    // Générer le numéro de commande
    const now = new Date();
    const orderId = `AGS-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    
    // Calculer les totaux
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = totalItems >= CONFIG.MIN_ITEMS ? subtotal * (CONFIG.DISCOUNT_PERCENT / 100) : 0;
    const total = subtotal - discount;
    
    // Créer l'objet commande
    const order = {
        id: orderId,
        date: now.toLocaleString('fr-FR'),
        items: [...cart],
        subtotal: subtotal,
        discount: discount,
        total: total,
        status: 'completed'
    };
    
    // Ajouter à l'historique
    salesHistory.push(order);
    localStorage.setItem('amine_sales', JSON.stringify(salesHistory));
    
    // Générer le ticket
    generateTicket(order);
    
    // Afficher la confirmation
    showOrderConfirmation(order);
    
    // Mettre à jour les stocks
    updateStockAfterOrder();
    
    // Vider le panier
    clearCart();
    toggleCart();
}

function showOrderConfirmation(order) {
    document.getElementById('order-number').textContent = order.id;
    
    const details = document.getElementById('order-details');
    details.innerHTML = `
        <p><strong>Date:</strong> ${order.date}</p>
        <p><strong>Articles:</strong> ${order.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
        <p><strong>Sous-total:</strong> ${order.subtotal} DH</p>
        ${order.discount > 0 ? `<p><strong>Remise:</strong> -${order.discount} DH</p>` : ''}
        <p><strong>Total:</strong> <strong style="color: var(--success);">${order.total} DH</strong></p>
    `;
    
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById('confirmation-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.getElementById('confirmation-modal').classList.remove('active');
}

function closeModalAndReset() {
    closeModal();
    goHome();
}

function updateStockAfterOrder() {
    cart.forEach(cartItem => {
        const game = gamesData.find(g => g.id === cartItem.id);
        if (game) {
            game.stock -= cartItem.quantity;
            if (game.stock < 0) game.stock = 0;
        }
    });
    
    // Sauvegarder les nouvelles données
    saveGamesData();
}

// Ticket d'impression
function generateTicket(order) {
    const ticketContent = document.getElementById('ticket-content');
    let html = `
        <div class="ticket">
            <div class="ticket-header">
                <h2>AMINE GAMES & SERVICES</h2>
                <p>Casablanca, Maroc</p>
                <p>Tél: +212 6 XX XX XX XX</p>
                <hr>
                <p><strong>Ticket de vente</strong></p>
                <p>N°: ${order.id}</p>
                <p>Date: ${order.date}</p>
                <hr>
            </div>
            
            <div class="ticket-items">
    `;
    
    order.items.forEach(item => {
        html += `
            <div class="ticket-item">
                <span>${item.name} (x${item.quantity})</span>
                <span>${item.price * item.quantity} DH</span>
            </div>
        `;
    });
    
    html += `
            </div>
            
            <hr>
            <div class="ticket-totals">
                <p>Sous-total: ${order.subtotal} DH</p>
                ${order.discount > 0 ? `<p>Remise (${CONFIG.DISCOUNT_PERCENT}%): -${order.discount} DH</p>` : ''}
                <p><strong>TOTAL: ${order.total} DH</strong></p>
            </div>
            
            <hr>
            <div class="ticket-footer">
                <p><strong>Merci pour votre achat !</strong></p>
                <p>Retour sous 7 jours • Jeux garantis</p>
                <p>www.aminegames.com</p>
            </div>
        </div>
    `;
    
    ticketContent.innerHTML = html;
    
    // Imprimer automatiquement
    setTimeout(printTicket, 1000);
}

function printTicket() {
    const printContent = document.getElementById('ticket-container').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    
    // Recharger l'application
    location.reload();
}

// Fonctions supplémentaires
function showAllCategories() {
    const categories = [...new Set(gamesData.map(game => game.platform))];
    const container = document.getElementById('categories-container');
    
    container.innerHTML = '';
    categories.forEach(platform => {
        const count = gamesData.filter(game => game.platform === platform).length;
        const category = categoriesData.find(cat => cat.id === platform) || {
            name: platform,
            icon: 'fas fa-gamepad',
            color: '#666'
        };
        
        const card = document.createElement('div');
        card.className = 'category-card';
        card.style.borderColor = category.color;
        card.onclick = () => loadCategory(platform);
        card.innerHTML = `
            <i class="${category.icon}" style="color: ${category.color};"></i>
            <h3>${platform}</h3>
            <p>${count} jeux disponibles</p>
        `;
        container.appendChild(card);
    });
    
    document.getElementById('categories-title').textContent = 'Toutes les plateformes';
    showPage('categories-page');
}

function loadAllGames() {
    currentGames = [...gamesData];
    searchFilters.platform = '';
    currentCategory = '';
    
    document.getElementById('games-title').textContent = 'Tous les jeux';
    document.getElementById('breadcrumb').innerHTML = '<span>Accueil</span> > <span>Tous les jeux</span>';
    
    displayGames(currentGames);
    showPage('games-page');
}

function updateCategoryCounts() {
    const counts = {
        'PS5': gamesData.filter(g => g.platform === 'PS5').length,
        'PS4': gamesData.filter(g => g.platform === 'PS4').length,
        'XBOX Series': gamesData.filter(g => g.platform === 'XBOX Series').length,
        'Switch': gamesData.filter(g => g.platform === 'Switch').length,
        'all': gamesData.length
    };
    
    document.getElementById('count-ps5').textContent = `${counts['PS5']} jeux`;
    document.getElementById('count-ps4').textContent = `${counts['PS4']} jeux`;
    document.getElementById('count-xbox').textContent = `${counts['XBOX Series']} jeux`;
    document.getElementById('count-switch').textContent = `${counts['Switch']} jeux`;
    document.getElementById('count-all').textContent = `${counts['all']} jeux`;
}

function loadNavigationCategories() {
    const categories = categoriesData.map(cat => ({
        ...cat,
        count: gamesData.filter(game => game.platform === cat.id).length
    }));
    
    // Afficher dans la navigation si nécessaire
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    const pageElement = document.getElementById(pageId);
    if (pageElement) {
        pageElement.classList.add('active');
    }
    
    // Cacher le clavier et les filtres
    hideKeyboard();
    document.getElementById('filters-panel').classList.remove('active');
}

function goBack() {
    if (document.getElementById('games-page').classList.contains('active')) {
        goHome();
    } else if (document.getElementById('search-page').classList.contains('active')) {
        goHome();
    } else if (document.getElementById('categories-page').classList.contains('active')) {
        goHome();
    }
}

function showGameDetails(game) {
    // Créer un modal pour les détails du jeu
    const modalHTML = `
        <div class="modal-overlay active" onclick="closeGameDetails()">
            <div class="modal" style="max-width: 600px;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3><i class="${getPlatformIcon(game.platform)}"></i> ${game.name}</h3>
                    <button class="close-modal" onclick="closeGameDetails()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="game-details">
                        <div class="game-details-image">
                            <img src="${CONFIG.IMAGE_BASE_PATH}${game.platform.toLowerCase()}/${game.image}" 
                                 alt="${game.name}"
                                 onerror="this.src='default-game.jpg'">
                        </div>
                        
                        <div class="game-details-info">
                            <p><strong>Plateforme:</strong> ${game.platform}</p>
                            <p><strong>Catégorie:</strong> ${game.category}</p>
                            <p><strong>Prix:</strong> <span style="color: var(--success); font-weight: bold;">${game.price} DH</span></p>
                            <p><strong>Stock:</strong> ${game.stock > 0 ? `${game.stock} disponible(s)` : 'Rupture de stock'}</p>
                            <p><strong>Popularité:</strong> ${game.popularity}%</p>
                            
                            ${game.description ? `<p><strong>Description:</strong> ${game.description}</p>` : ''}
                            
                            <div class="game-details-actions">
                                <button class="btn btn-primary" onclick="addToCart(${game.id}); closeGameDetails();">
                                    <i class="fas fa-cart-plus"></i> Ajouter au panier
                                </button>
                                <button class="btn" onclick="closeGameDetails()">
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Ajouter le modal au body
    const modalContainer = document.createElement('div');
    modalContainer.id = 'game-details-modal';
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
}

function closeGameDetails() {
    const modal = document.getElementById('game-details-modal');
    if (modal) {
        modal.remove();
    }
}

// Administration
function openAdmin() {
    // Rediriger vers la page d'administration
    window.location.href = 'admin.html';
}

// Sauvegarde des données
function saveGamesData() {
    const data = {
        games: gamesData,
        categories: categoriesData,
        lastUpdate: new Date().toISOString()
    };
    
    // Dans un environnement réel, on enverrait les données au serveur
    // Pour cette démo, on utilise localStorage
    localStorage.setItem('amine_games_data', JSON.stringify(data));
    console.log('Données sauvegardées');
}

// Charger les données sauvegardées
function loadSavedData() {
    const saved = localStorage.getItem('amine_games_data');
    if (saved) {
        const data = JSON.parse(saved);
        gamesData = data.games || gamesData;
        categoriesData = data.categories || categoriesData;
        updateCategoryCounts();
    }
}

// Exporter les données
function exportData() {
    const data = {
        games: gamesData,
        categories: categoriesData,
        sales: salesHistory,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amine-games-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Importer les données
async function importData(file) {
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data.games && Array.isArray(data.games)) {
            gamesData = data.games;
            categoriesData = data.categories || categoriesData;
            updateCategoryCounts();
            saveGamesData();
            alert('Données importées avec succès !');
            location.reload();
        } else {
            throw new Error('Format de fichier invalide');
        }
    } catch (error) {
        console.error('Erreur d\'import:', error);
        alert('Erreur lors de l\'import des données');
    }
}