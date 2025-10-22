// =======================================
// FAVORITES.JS - WORKING VERSION (No API Required)
// =======================================

// const FAVORITES_KEY = 'cinematch_favorites';
let currentFavoritesView = 'grid';
let currentFavoritesSort = 'recent';

// --- DOM ELEMENTS ---
const favoritesContainer = document.getElementById('favoritesContainer');
const emptyFavorites = document.getElementById('emptyFavorites');
const favoritesControlsBar = document.getElementById('favoritesControlsBar');
const favoritesCountHero = document.getElementById('favoritesCountHero');
const favoritesCountControls = document.getElementById('favoritesCount');
const genresCount = document.getElementById('genresCount');
const watchTime = document.getElementById('watchTime');
const fabBtn = document.getElementById('fabBtn');
const fabContainer = document.querySelector('.fab-container');

document.addEventListener('DOMContentLoaded', function() {
    console.log("Favorites page loaded");
    loadAndDisplayFavorites();
    initEventListeners();
});

function loadAndDisplayFavorites() {
    // Get favorites directly from localStorage
    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    console.log(`Found ${favorites.length} favorites in localStorage`);
    
    // Update counts
    if (favoritesCountHero) favoritesCountHero.textContent = favorites.length;
    if (favoritesCountControls) favoritesCountControls.textContent = favorites.length;
    
    // For now, set genres and watch time to placeholder values
    // (since we don't have full movie data without the API)
    if (genresCount) genresCount.textContent = favorites.length * 2; // Estimate
    if (watchTime) watchTime.textContent = favorites.length * 2; // Estimate 2 hours per movie
    
    if (favorites.length === 0) {
        // Show empty state
        if (emptyFavorites) emptyFavorites.style.display = 'block';
        if (favoritesControlsBar) favoritesControlsBar.style.display = 'none';
        if (favoritesContainer) favoritesContainer.innerHTML = '';
        return;
    }
    
    // Show the content
    if (emptyFavorites) emptyFavorites.style.display = 'none';
    if (favoritesControlsBar) favoritesControlsBar.style.display = 'block';
    
    // Sort and render the favorites
    const sortedFavorites = sortFavorites(favorites, currentFavoritesSort);
    renderFavoriteCards(sortedFavorites);
}

function renderFavoriteCards(favorites) {
    if (!favoritesContainer) return;
    
    const cardsHTML = favorites.map((movie, index) => `
        <div class="favorite-card" onclick="showMovieDetails(${movie.id})" style="animation-delay: ${index * 0.05}s">
            <button class="remove-favorite-btn" title="Remove from Favorites" onclick="removeFavorite(${movie.id}, event)">
                <i class="fas fa-times"></i>
            </button>
            <div class="favorite-card-poster">
                <img src="${movie.poster}" alt="${escapeHtml(movie.title)}" loading="lazy" onerror="this.src='https://via.placeholder.com/500x750?text=No+Poster'">
            </div>
            <div class="favorite-card-info">
                <h5 class="favorite-card-title">${escapeHtml(movie.title)}</h5>
                <div class="favorite-card-meta">
                    ${movie.year || movie.release_date ? `
                        <span><i class="fas fa-calendar-alt me-1"></i> ${movie.year || movie.release_date.split('-')[0]}</span>
                    ` : ''}
                    ${movie.rating ? `
                        <span><i class="fas fa-star me-1" style="color: #ffd700;"></i> ${movie.rating.toFixed(1)}</span>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    favoritesContainer.innerHTML = cardsHTML;
    applyView();
}

function applyView() {
    if (!favoritesContainer) return;
    
    if (currentFavoritesView === 'list') {
        favoritesContainer.className = 'favorites-list';
    } else {
        favoritesContainer.className = 'favorites-grid';
    }
    
    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === currentFavoritesView);
    });
}

function initEventListeners() {
    // FAB button
    if (fabBtn && fabContainer) {
        fabBtn.addEventListener('click', () => {
            fabContainer.classList.toggle('active');
        });
    }
    
    // Close FAB when clicking outside
    document.addEventListener('click', (e) => {
        if (fabContainer && !fabContainer.contains(e.target)) {
            fabContainer.classList.remove('active');
        }
    });
}

// --- ACTION HANDLERS ---

function handleFavoritesSort(sortType) {
    currentFavoritesSort = sortType;
    loadAndDisplayFavorites();
}

function switchFavoritesView(view) {
    currentFavoritesView = view;
    applyView();
}

function removeFavorite(movieId, event) {
    event.stopPropagation();
    
    if (confirm('Remove this movie from favorites?')) {
        let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
        favorites = favorites.filter(fav => fav.id !== movieId);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        
        // Reload the display
        loadAndDisplayFavorites();
        
        // Show a toast if you have that function
        if (typeof showToast === 'function') {
            showToast('Removed from favorites', 'info');
        }
    }
}

function clearAllFavorites() {
    if (confirm('Are you sure you want to remove all favorites?')) {
        localStorage.setItem(FAVORITES_KEY, '[]');
        loadAndDisplayFavorites();
        
        if (typeof showToast === 'function') {
            showToast('All favorites cleared', 'info');
        }
    }
}

function goToSearch() {
    window.location.href = '/';
}

// --- UTILITIES ---

function sortFavorites(favorites, sortType) {
    const sorted = [...favorites];
    
    switch(sortType) {
        case 'recent':
            // Most recently added first (based on addedAt timestamp)
            return sorted.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
        
        case 'title':
            return sorted.sort((a, b) => a.title.localeCompare(b.title));
        
        case 'title-desc':
            return sorted.sort((a, b) => b.title.localeCompare(a.title));
        
        case 'rating':
            return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        
        case 'rating-low':
            return sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        
        default:
            return sorted;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

function showMovieDetails(movieId) {
    // If you have a modal function in main.js, it will be called
    if (typeof window.showMovieDetails === 'function') {
        window.showMovieDetails(movieId);
    } else {
        console.log('Movie details for ID:', movieId);
    }
}

// Placeholder functions for FAB actions
function exportFavorites() {
    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    const dataStr = JSON.stringify(favorites, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'cinematch_favorites.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// ======================================= 
// FAB & SHARE FUNCTIONALITY
// =======================================

// Initialize FAB menu
document.addEventListener('DOMContentLoaded', function() {
    const fabBtn = document.getElementById('fabBtn');
    const fabContainer = document.querySelector('.fab-container');
    
    if (fabBtn && fabContainer) {
        // Toggle FAB menu
        fabBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            fabContainer.classList.toggle('active');
        });
        
        // Close FAB menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!fabContainer.contains(e.target)) {
                fabContainer.classList.remove('active');
            }
        });
    }
    
    // Initialize share buttons
    initShareButtons();
});

// Initialize share functionality
function initShareButtons() {
    const shareButtons = document.querySelectorAll('.share-btn');
    
    shareButtons.forEach(button => {
        button.addEventListener('click', function() {
            const platform = this.getAttribute('data-platform');
            shareToSocial(platform);
        });
    });
}

// Share functionality
function shareToSocial(platform) {
    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    const movieCount = favorites.length;
    const movieTitles = favorites.slice(0, 3).map(m => m.title).join(', ');
    const shareUrl = window.location.href;
    
    const shareText = movieCount > 0 
        ? `Check out my ${movieCount} favorite movies on CineMatch: ${movieTitles}${movieCount > 3 ? ' and more!' : '!'}`
        : 'Check out CineMatch - AI-powered movie recommendations!';
    
    switch(platform) {
        case 'twitter':
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
            break;
            
        case 'facebook':
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
            break;
            
        case 'whatsapp':
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank');
            break;
            
        case 'copy':
            const textToCopy = `${shareText}\n${shareUrl}`;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showToast('Link copied to clipboard!', 'success');
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('shareModal'));
                    if (modal) modal.hide();
                });
            } else {
                // Fallback
                const textarea = document.createElement('textarea');
                textarea.value = textToCopy;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                showToast('Link copied!', 'success');
            }
            break;
    }
}