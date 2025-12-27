// Données globales pour l'admin
let adminGames = [];
let adminSales = [];
let adminSettings = {};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    loadAdminData();
    showSection('dashboard');
    
    // Événements
    document.getElementById('game-search-admin').addEventListener('input', searchGamesAdmin);
});

// Charger les données
async function loadAdminData() {
    try {
        // Charger les jeux
        const gamesResponse = await fetch('data/games.json');
        const gamesData = await gamesResponse.json();
        adminGames = gamesData.games || [];
        
        // Charger les ventes depuis localStorage
        adminSales = JSON.parse(localStorage.getItem('amine_sales')) || [];
        
        // Charger les paramètres
        adminSettings = JSON.parse(localStorage.getItem('amine_settings')) || {
            storeName: 'Amine Games & Services',
            minItems: 3,
            discountPercent: 10,
            inactivityTimeout: 15,
            imagePath: 'uploads/images/'
        };
        
        // Mettre à jour le tableau de bord
        updateDashboard();
        loadGamesList();
        loadSalesList();
        loadSettings();
        
    } catch (error) {
        console.error('Erreur de chargement des données admin:', error);
    }
}

// Navigation entre sections
function showSection(sectionId) {
    // Mettre à jour les boutons de navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    // Afficher la section
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(`${sectionId}-section`).classList.add('active');
}

// Tableau de bord
function updateDashboard() {
    const totalGames = adminGames.length;
    const totalSales = adminSales.length;
    const totalRevenue = adminSales.reduce((sum, sale) => sum + sale.total, 0);
    const lowStock = adminGames.filter(game => game.stock < 3).length;
    
    document.getElementById('total-games').textContent = totalGames;
    document.getElementById('total-sales').textContent = totalSales;
    document.getElementById('total-revenue').textContent = `${totalRevenue} DH`;
    document.getElementById('low-stock').textContent = lowStock;
    
    // Afficher les dernières ventes
    const recentSales = adminSales.slice(-5).reverse();
    const salesHtml = recentSales.map(sale => `
        <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between;">
                <div>
                    <strong>${sale.id}</strong>
                    <div style="font-size: 0.9rem; color: #aaa;">${sale.date}</div>
                </div>
                <div style="color: var(--accent); font-weight: bold;">${sale.total} DH</div>
            </div>
            <div style="font-size: 0.9rem; margin-top: 0.5rem;">
                ${sale.items.length} article(s)
            </div>
        </div>
    `).join('');
    
    document.getElementById('recent-sales').innerHTML = salesHtml || '<p style="text-align: center; color: #aaa;">Aucune vente</p>';
}

function refreshData() {
    loadAdminData();
    alert('Données actualisées !');
}

// Gestion des jeux
function loadGamesList() {
    const container = document.getElementById('games-list');
    if (adminGames.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #aaa;">Aucun jeu enregistré</p>';
        return;
    }
    
    const gamesHtml = adminGames.map(game => `
        <div class="file-item">
            <div>
                <div style="font-weight: bold;">${game.name}</div>
                <div style="font-size: 0.9rem; color: #aaa;">
                    ${game.platform} • ${game.category} • ${game.price} DH
                </div>
                <div style="font-size: 0.9rem;">
                    Stock: ${game.stock} • Popularité: ${game.popularity || 0}%
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-warning" onclick="editGame(${game.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteGame(${game.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = gamesHtml;
}

function searchGamesAdmin() {
    const query = document.getElementById('game-search-admin').value.toLowerCase();
    const filteredGames = adminGames.filter(game => 
        game.name.toLowerCase().includes(query) ||
        game.platform.toLowerCase().includes(query) ||
        game.category.toLowerCase().includes(query)
    );
    
    const container = document.getElementById('games-list');
    const gamesHtml = filteredGames.map(game => `
        <div class="file-item">
            <div>
                <div style="font-weight: bold;">${game.name}</div>
                <div style="font-size: 0.9rem; color: #aaa;">
                    ${game.platform} • ${game.category} • ${game.price} DH
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-warning" onclick="editGame(${game.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteGame(${game.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = gamesHtml || '<p style="text-align: center; padding: 2rem; color: #aaa;">Aucun résultat</p>';
}

function openAddGameModal() {
    document.getElementById('game-modal-title').textContent = 'Ajouter un nouveau jeu';
    
    const formHtml = `
        <div class="form-group">
            <label>Nom du jeu *</label>
            <input type="text" id="game-name" required>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Plateforme *</label>
                <select id="game-platform" required>
                    <option value="">Sélectionner</option>
                    <option value="PS5">PlayStation 5</option>
                    <option value="PS4">PlayStation 4</option>
                    <option value="XBOX Series">XBOX Series</option>
                    <option value="Switch">Nintendo Switch</option>
                    <option value="PS3">PlayStation 3</option>
                    <option value="XBOX 360">XBOX 360</option>
                    <option value="Wii U">Wii U</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Catégorie *</label>
                <select id="game-category" required>
                    <option value="">Sélectionner</option>
                    <option value="Action-Aventure">Action-Aventure</option>
                    <option value="FPS">FPS</option>
                    <option value="RPG">RPG</option>
                    <option value="Sport">Sport</option>
                    <option value="Course">Course</option>
                    <option value="Combat">Combat</option>
                    <option value="Stratégie">Stratégie</option>
                </select>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Prix (DH) *</label>
                <input type="number" id="game-price" min="0" required>
            </div>
            
            <div class="form-group">
                <label>Stock *</label>
                <input type="number" id="game-stock" min="0" required>
            </div>
        </div>
        
        <div class="form-group">
            <label>Nom de l'image</label>
            <input type="text" id="game-image" placeholder="ex: god-of-war.jpg">
            <small style="color: #aaa;">L'image doit être dans uploads/images/[plateforme]/</small>
        </div>
        
        <div class="form-group">
            <label>Description</label>
            <textarea id="game-description" rows="3"></textarea>
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
            <button class="btn btn-primary" onclick="saveGame()">
                <i class="fas fa-save"></i> Enregistrer
            </button>
            <button class="btn" onclick="closeGameModal()">
                Annuler
            </button>
        </div>
    `;
    
    document.getElementById('game-modal-content').innerHTML = formHtml;
    document.getElementById('game-modal-overlay').style.display = 'flex';
}

function editGame(gameId) {
    const game = adminGames.find(g => g.id === gameId);
    if (!game) return;
    
    document.getElementById('game-modal-title').textContent = 'Modifier le jeu';
    
    const formHtml = `
        <input type="hidden" id="game-id" value="${game.id}">
        
        <div class="form-group">
            <label>Nom du jeu *</label>
            <input type="text" id="game-name" value="${game.name}" required>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Plateforme *</label>
                <select id="game-platform" required>
                    <option value="">Sélectionner</option>
                    <option value="PS5" ${game.platform === 'PS5' ? 'selected' : ''}>PlayStation 5</option>
                    <option value="PS4" ${game.platform === 'PS4' ? 'selected' : ''}>PlayStation 4</option>
                    <option value="XBOX Series" ${game.platform === 'XBOX Series' ? 'selected' : ''}>XBOX Series</option>
                    <option value="Switch" ${game.platform === 'Switch' ? 'selected' : ''}>Nintendo Switch</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Catégorie *</label>
                <select id="game-category" required>
                    <option value="">Sélectionner</option>
                    <option value="Action-Aventure" ${game.category === 'Action-Aventure' ? 'selected' : ''}>Action-Aventure</option>
                    <option value="FPS" ${game.category === 'FPS' ? 'selected' : ''}>FPS</option>
                    <option value="RPG" ${game.category === 'RPG' ? 'selected' : ''}>RPG</option>
                    <option value="Sport" ${game.category === 'Sport' ? 'selected' : ''}>Sport</option>
                </select>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Prix (DH) *</label>
                <input type="number" id="game-price" value="${game.price}" min="0" required>
            </div>
            
            <div class="form-group">
                <label>Stock *</label>
                <input type="number" id="game-stock" value="${game.stock}" min="0" required>
            </div>
        </div>
        
        <div class="form-group">
            <label>Nom de l'image</label>
            <input type="text" id="game-image" value="${game.image || ''}" placeholder="ex: god-of-war.jpg">
        </div>
        
        <div class="form-group">
            <label>Description</label>
            <textarea id="game-description" rows="3">${game.description || ''}</textarea>
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
            <button class="btn btn-primary" onclick="saveGame()">
                <i class="fas fa-save"></i> Mettre à jour
            </button>
            <button class="btn" onclick="closeGameModal()">
                Annuler
            </button>
        </div>
    `;
    
    document.getElementById('game-modal-content').innerHTML = formHtml;
    document.getElementById('game-modal-overlay').style.display = 'flex';
}

function saveGame() {
    const id = document.getElementById('game-id') ? parseInt(document.getElementById('game-id').value) : Date.now();
    const name = document.getElementById('game-name').value;
    const platform = document.getElementById('game-platform').value;
    const category = document.getElementById('game-category').value;
    const price = parseFloat(document.getElementById('game-price').value);
    const stock = parseInt(document.getElementById('game-stock').value);
    const image = document.getElementById('game-image').value;
    const description = document.getElementById('game-description').value;
    
    if (!name || !platform || !category || isNaN(price) || isNaN(stock)) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    const gameData = {
        id,
        name,
        platform,
        category,
        price,
        stock,
        image: image || 'default.jpg',
        description,
        popularity: 50 // Valeur par défaut
    };
    
    // Vérifier si c'est une modification
    const existingIndex = adminGames.findIndex(g => g.id === id);
    if (existingIndex >= 0) {
        adminGames[existingIndex] = gameData;
    } else {
        adminGames.push(gameData);
    }
    
    // Sauvegarder les données
    saveAdminData();
    
    // Fermer le modal et rafraîchir la liste
    closeGameModal();
    loadGamesList();
    updateDashboard();
    
    alert('Jeu enregistré avec succès !');
}

function deleteGame(gameId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce jeu ?')) {
        return;
    }
    
    adminGames = adminGames.filter(game => game.id !== gameId);
    saveAdminData();
    loadGamesList();
    updateDashboard();
    
    alert('Jeu supprimé avec succès !');
}

function closeGameModal() {
    document.getElementById('game-modal-overlay').style.display = 'none';
}

// Import Excel/Images
function downloadTemplate() {
    // Créer un template Excel simple
    const templateData = [
        ['Nom', 'Plateforme', 'Catégorie', 'Prix', 'Stock', 'Image', 'Description'],
        ['God of War Ragnarök', 'PS5', 'Action-Aventure', '300', '5', 'god-of-war.jpg', 'Jeu d\'action-aventure'],
        ['FIFA 23', 'PS5', 'Sport', '250', '8', 'fifa-23.jpg', 'Jeu de football'],
        ['Halo Infinite', 'XBOX Series', 'FPS', '280', '6', 'halo-infinite.jpg', 'Jeu de tir']
    ];
    
    // Convertir en CSV
    const csvContent = templateData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-jeux.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function handleExcelUpload(file) {
    if (!file) return;
    
    // Vérifier l'extension
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
        alert('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
        return;
    }
    
    const preview = document.getElementById('excel-preview');
    preview.innerHTML = `
        <div class="file-item">
            <div>
                <i class="fas fa-file-excel" style="color: green; margin-right: 10px;"></i>
                ${file.name} (${(file.size / 1024).toFixed(1)} KB)
            </div>
            <div>
                <button class="btn btn-primary" onclick="processExcelFile('${file.name}')">
                    <i class="fas fa-check"></i> Importer
                </button>
            </div>
        </div>
    `;
}

async function processExcelFile(fileName) {
    alert('Import Excel en cours de développement...');
    // Ici, vous implémenteriez la lecture du fichier Excel
    // avec une bibliothèque comme SheetJS (xlsx)
}

function handleImageUpload(files) {
    if (!files || files.length === 0) return;
    
    const preview = document.getElementById('image-preview');
    preview.innerHTML = '';
    
    Array.from(files).forEach(file => {
        if (!file.type.match('image.*')) {
            alert(`Le fichier ${file.name} n'est pas une image`);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div>
                    <img src="${e.target.result}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; margin-right: 10px;">
                    ${file.name} (${(file.size / 1024).toFixed(1)} KB)
                </div>
                <div>
                    <select class="platform-select" style="margin-right: 10px;">
                        <option value="">Plateforme</option>
                        <option value="ps5">PS5</option>
                        <option value="ps4">PS4</option>
                        <option value="xbox">XBOX Series</option>
                        <option value="switch">Switch</option>
                    </select>
                    <button class="btn btn-primary" onclick="uploadImage(this, '${file.name}')">
                        <i class="fas fa-upload"></i>
                    </button>
                </div>
            `;
            preview.appendChild(fileItem);
        };
        reader.readAsDataURL(file);
    });
}

function uploadImage(button, fileName) {
    const fileItem = button.closest('.file-item');
    const platformSelect = fileItem.querySelector('.platform-select');
    const platform = platformSelect.value;
    
    if (!platform) {
        alert('Veuillez sélectionner une plateforme pour cette image');
        return;
    }
    
    // Ici, vous enverriez l'image au serveur
    alert(`Image ${fileName} serait uploadée dans: uploads/images/${platform}/`);
    
    // Simuler l'upload
    fileItem.style.opacity = '0.5';
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-check"></i>';
}

function processImport() {
    alert('Traitement de l\'import en cours...');
    // Ici, vous traiteriez tous les fichiers uploadés
}

// Gestion des ventes
function loadSalesList() {
    const container = document.getElementById('sales-list');
    if (adminSales.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #aaa;">Aucune vente enregistrée</p>';
        return;
    }
    
    const salesHtml = adminSales.map(sale => `
        <div class="file-item">
            <div>
                <div style="font-weight: bold;">${sale.id}</div>
                <div style="font-size: 0.9rem; color: #aaa;">
                    ${sale.date} • ${sale.items.length} article(s)
                </div>
                <div style="font-size: 0.9rem;">
                    Remise: ${sale.discount || 0} DH • Total: ${sale.total} DH
                </div>
            </div>
            <div>
                <button class="btn" onclick="viewSaleDetails('${sale.id}')">
                    <i class="fas fa-eye"></i> Détails
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = salesHtml;
}

function viewSaleDetails(saleId) {
    const sale = adminSales.find(s => s.id === saleId);
    if (!sale) return;
    
    const detailsHtml = `
        <div style="padding: 1rem;">
            <h3 style="color: var(--accent); margin-bottom: 1rem;">Détails de la vente ${sale.id}</h3>
            <p><strong>Date:</strong> ${sale.date}</p>
            <p><strong>Articles:</strong> ${sale.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
            <p><strong>Sous-total:</strong> ${sale.subtotal} DH</p>
            <p><strong>Remise:</strong> ${sale.discount || 0} DH</p>
            <p><strong>Total:</strong> ${sale.total} DH</p>
            
            <h4 style="margin-top: 1.5rem; color: var(--accent);">Articles:</h4>
            <div style="margin-top: 1rem;">
                ${sale.items.map(item => `
                    <div style="background: rgba(255,255,255,0.05); padding: 0.5rem; border-radius: 5px; margin-bottom: 0.5rem;">
                        ${item.name} (x${item.quantity}) - ${item.price * item.quantity} DH
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    alert(detailsHtml.replace(/<[^>]*>/g, '')); // Version texte simple
}

function exportSales() {
    const exportData = {
        sales: adminSales,
        exportDate: new Date().toISOString(),
        totalSales: adminSales.length,
        totalRevenue: adminSales.reduce((sum, sale) => sum + sale.total, 0)
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventes-amine-games-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Paramètres
function loadSettings() {
    document.getElementById('store-name').value = adminSettings.storeName;
    document.getElementById('min-items').value = adminSettings.minItems;
    document.getElementById('discount-percent').value = adminSettings.discountPercent;
    document.getElementById('inactivity-timeout').value = adminSettings.inactivityTimeout;
    document.getElementById('image-path').value = adminSettings.imagePath;
}

function saveSettings() {
    adminSettings = {
        storeName: document.getElementById('store-name').value,
        minItems: parseInt(document.getElementById('min-items').value),
        discountPercent: parseInt(document.getElementById('discount-percent').value),
        inactivityTimeout: parseInt(document.getElementById('inactivity-timeout').value),
        imagePath: document.getElementById('image-path').value
    };
    
    localStorage.setItem('amine_settings', JSON.stringify(adminSettings));
    alert('Paramètres sauvegardés avec succès !');
}

function resetSettings() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
        localStorage.removeItem('amine_settings');
        loadSettings();
        alert('Paramètres réinitialisés !');
    }
}

function backupData() {
    const backup = {
        games: adminGames,
        sales: adminSales,
        settings: adminSettings,
        backupDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-amine-games-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function restoreData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const backup = JSON.parse(event.target.result);
                
                if (backup.games && backup.sales && backup.settings) {
                    if (confirm('Cette opération écrasera toutes les données actuelles. Continuer ?')) {
                        localStorage.setItem('amine_games_data', JSON.stringify({ games: backup.games }));
                        localStorage.setItem('amine_sales', JSON.stringify(backup.sales));
                        localStorage.setItem('amine_settings', JSON.stringify(backup.settings));
                        
                        alert('Données restaurées avec succès ! Redémarrage nécessaire.');
                        location.reload();
                    }
                } else {
                    alert('Fichier de sauvegarde invalide');
                }
            } catch (error) {
                alert('Erreur lors de la restauration des données');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Sauvegarder toutes les données
function saveAdminData() {
    const data = {
        games: adminGames,
        categories: [], // Vous devriez aussi gérer les catégories
        lastUpdate: new Date().toISOString()
    };
    
    // Dans un environnement réel, vous enverriez cela au serveur
    localStorage.setItem('amine_games_data', JSON.stringify(data));
    console.log('Données admin sauvegardées');
}