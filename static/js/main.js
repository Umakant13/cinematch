
// ============================================
// GLOBAL VARIABLES
// ============================================
let allRecommendations = [];
let favorites = [];
let currentSort = 'similarity';
let currentView = 'grid';
let selectedMovieData = null;
let currentRecommendations = null;
let favoritesView = 'grid';
let favoritesSort = 'recent';


// ============================================
// DOM ELEMENTS
// ============================================
const movieSearch = document.getElementById('movieSearch');
const searchBtn = document.getElementById('searchBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const recommendationsContainer = document.getElementById('recommendationsContainer');
const selectedMovieInfo = document.getElementById('selectedMovieInfo');
const searchSuggestions = document.getElementById('searchSuggestions');
const themeToggle = document.getElementById('themeToggle');
const favoritesBtn = document.getElementById('favoritesBtn');
const scrollTopBtn = document.getElementById('scrollTopBtn');

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    animateStats();
    updateFavoritesCounter();
    checkScrollPosition();
    initNavbarScroll();
    loadTheme();
    loadSavedRecommendations();
    loadViewPreference();

    const favoritesSection = document.getElementById('favorites-section');
    if (favoritesSection && window.location.hash === '#favorites') {
        showFavoritesPage();
    }
});

// ============================================
// EVENT LISTENERS
// ============================================
function initEventListeners() {
    // Search
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    if (movieSearch) {
        movieSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
        
        // Live search
        movieSearch.addEventListener('input', debounce(handleSearchInput, 300));
                // Show suggestions on click/focus
        movieSearch.addEventListener('click', handleSearchInputClick);
        movieSearch.addEventListener('focus', handleSearchInputClick);

    }
    
    // Click outside to close suggestions
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-input-wrapper')) {
            hideSuggestions();
        }
    });
    
    // Quick search tags
    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const movie = this.getAttribute('data-movie');
            if (movieSearch) movieSearch.value = movie;
            getRecommendations(movie);
        });
    });
    
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Favorites
    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', showFavoritesPage);
    }
    
    // Scroll to top
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    window.addEventListener('scroll', checkScrollPosition);
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
function handleSearch() {
    const movie = movieSearch ? movieSearch.value.trim() : '';
    if (movie) {
        getRecommendations(movie);
    } else {
        showToast('Please enter a movie name', 'warning');
    }
}

async function handleSearchInput() {
    if (!movieSearch) return;
    const query = movieSearch.value.trim();
    
    if (query.length < 2) {
        hideSuggestions();
        return;
    }
    
    try {
        const response = await fetch(`/api/search/?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        // Pass false for isPopular parameter
        showSuggestions(data.results || [], false);
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

function showSuggestions(results, isPopular = false) {
    console.log('showSuggestions called:', { resultsCount: results?.length, isPopular });
    
    if (!searchSuggestions) {
        console.error('searchSuggestions element not found');
        return;
    }
    
    if (!results || results.length === 0) {
        hideSuggestions();
        return;
    }
    
    // Create header based on type
    const headerText = isPopular ? 
        '<div class="suggestions-header"><i class="fas fa-fire me-2"></i>Popular Movies</div>' : 
        '<div class="suggestions-header"><i class="fas fa-search me-2"></i>Search Results</div>';
    
    // Create suggestion items
    const suggestionsHTML = results.slice(0, 15).map(movie => {
        const escapedMovie = escapeHtml(movie);
        return `
            <div class="suggestion-item" onclick="selectMovie('${escapedMovie}')">
                <i class="fas fa-film text-primary"></i>
                <span>${escapedMovie}</span>
                <i class="fas fa-arrow-right ms-auto suggestion-arrow"></i>
            </div>
        `;
    }).join('');
    
    // Update DOM
    searchSuggestions.innerHTML = headerText + suggestionsHTML;
    searchSuggestions.classList.add('show');
}


function hideSuggestions() {
    if (searchSuggestions) {
        searchSuggestions.classList.remove('show');
    }
}

function selectMovie(movie) {
    if (movieSearch) movieSearch.value = movie;
    hideSuggestions();
    getRecommendations(movie);
}

// ============================================
// GET RECOMMENDATIONS
// ============================================
async function getRecommendations(movie) {
    // Show loading overlay with animation
    showLoading();
    hideSuggestions();
    
    // Show loading bar in recommendations section
    showLoadingBar('loadingBar');
    
    // Show recommendations section but hide container initially
    const recommendationsSection = document.getElementById('recommendations');
    const recommendationsContainer = document.getElementById('recommendationsContainer');
    const viewControlsBar = document.getElementById('viewControlsBar');
    const selectedMovieInfo = document.getElementById('selectedMovieInfo');
    
    if (recommendationsSection) {
        recommendationsSection.style.display = 'block';
    }
    
    if (recommendationsContainer) {
        recommendationsContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-3">Finding perfect recommendations...</p></div>';
    }
    
    if (viewControlsBar) {
        viewControlsBar.style.display = 'none';
    }
    
    if (selectedMovieInfo) {
        selectedMovieInfo.style.display = 'none';
    }
    
    try {
        const response = await fetch(`/api/recommendations/?movie=${encodeURIComponent(movie)}`);
        const data = await response.json();
        
        if (data.success) {
            allRecommendations = data.recommendations;
            currentRecommendations = data.recommendations;
            selectedMovieData = { title: movie };
            
            // Small delay for better UX
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Call displayRecommendations from recommendations.js
            if (typeof displayRecommendations === 'function') {
                displayRecommendations(data.recommendations, selectedMovieData, true);
            }
            
            showToast(`Found ${data.recommendations.length} recommendations!`, 'success');
            
            // Scroll to recommendations
            setTimeout(() => {
                const recSection = document.getElementById('recommendations');
                if (recSection) {
                    recSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }, 300);
        } else {
            // Clear loading state
            if (recommendationsContainer) {
                recommendationsContainer.innerHTML = '';
            }
            if (recommendationsSection) {
                recommendationsSection.style.display = 'none';
            }
            showToast(data.error || 'Movie not found', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        // Clear loading state
        if (recommendationsContainer) {
            recommendationsContainer.innerHTML = '';
        }
        if (recommendationsSection) {
            recommendationsSection.style.display = 'none';
        }
        showToast('An error occurred. Please try again.', 'error');
    } finally {
        hideLoading();
        hideLoadingBar('loadingBar');
    }
}

// ============================================
// STORAGE FUNCTIONS
// ============================================
function saveRecommendations(recommendations, selectedMovie = null) {
    try {
        localStorage.setItem('currentRecommendations', JSON.stringify(recommendations));
        if (selectedMovie) {
            localStorage.setItem('selectedMovie', JSON.stringify(selectedMovie));
        }
        localStorage.setItem('recommendationsTimestamp', Date.now().toString());
    } catch (e) {
        console.error('Error saving recommendations:', e);
    }
}

function loadSavedRecommendations() {
    try {
        const savedRecommendations = localStorage.getItem('currentRecommendations');
        const savedMovie = localStorage.getItem('selectedMovie');
        const timestamp = localStorage.getItem('recommendationsTimestamp');
        const savedSort = localStorage.getItem('preferredSort');
        
        // Check if saved data is valid (not null, not "undefined" string)
        if (!savedRecommendations || savedRecommendations === 'undefined' || savedRecommendations === 'null') {
            console.log('No valid recommendations in localStorage');
            clearSavedRecommendations();
            return;
        }
        
        if (!timestamp || timestamp === 'undefined' || timestamp === 'null') {
            console.log('No valid timestamp in localStorage');
            clearSavedRecommendations();
            return;
        }
        
        // Set sort preference
        if (savedSort && savedSort !== 'undefined') {
            currentSort = savedSort;
        }
        
        // Check timestamp validity
        const age = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (age > maxAge) {
            console.log('Saved recommendations expired');
            clearSavedRecommendations();
            return;
        }
        
        // Parse recommendations
        try {
            currentRecommendations = JSON.parse(savedRecommendations);
        } catch (parseError) {
            console.error('Failed to parse recommendations:', parseError);
            clearSavedRecommendations();
            return;
        }
        
        // Parse selected movie if exists
        if (savedMovie && savedMovie !== 'undefined' && savedMovie !== 'null') {
            try {
                selectedMovieData = JSON.parse(savedMovie);
            } catch (parseError) {
                console.warn('Failed to parse selected movie:', parseError);
                selectedMovieData = null;
            }
        }
        
        // Display if we have valid data
        if (currentRecommendations && Array.isArray(currentRecommendations) && currentRecommendations.length > 0) {
            if (typeof displayRecommendations === 'function') {
                displayRecommendations(currentRecommendations, selectedMovieData, false);
                
                setTimeout(() => {
                    const recommendationsSection = document.getElementById('recommendations');
                    if (recommendationsSection) {
                        recommendationsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
            }
        } else {
            console.log('No recommendations to display');
            clearSavedRecommendations();
        }
    } catch (e) {
        console.error('Error loading recommendations:', e);
        clearSavedRecommendations();
    }
}

function clearSavedRecommendations() {
    localStorage.removeItem('currentRecommendations');
    localStorage.removeItem('selectedMovie');
    localStorage.removeItem('recommendationsTimestamp');
}

function saveViewPreference(view) {
    localStorage.setItem('preferredView', view);
}

function loadViewPreference() {
    const savedView = localStorage.getItem('preferredView');
    if (savedView) {
        currentView = savedView;
    }
}

function clearRecommendations() {
    if (confirm('Are you sure you want to clear current recommendations?')) {
        clearSavedRecommendations();
        currentRecommendations = null;
        selectedMovieData = null;
        allRecommendations = [];
        
        if (recommendationsContainer) recommendationsContainer.innerHTML = '';
        if (selectedMovieInfo) selectedMovieInfo.style.display = 'none';
        
        const controlsBar = document.getElementById('viewControlsBar');
        if (controlsBar) controlsBar.style.display = 'none';
        
        if (movieSearch) movieSearch.value = '';
        
        const searchSection = document.getElementById('search-section') || document.querySelector('.hero-section');
        if (searchSection) {
            searchSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        showToast('Recommendations cleared', 'info');
    }
}

// ============================================
// MOVIE DETAILS MODAL
// ============================================
async function showMovieDetails(movieId) {
    const modalContent = document.getElementById('modalContent');
    const movieModal = new bootstrap.Modal(document.getElementById('movieModal'));

    if (!modalContent) return;

    // 1. Show a temporary loading state inside the modal
    modalContent.innerHTML = `
        <div class="d-flex justify-content-center align-items-center" style="min-height: 400px;">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
    movieModal.show();

    try {
        const response = await fetch(`/api/movie/${movieId}/`);
        if (!response.ok) throw new Error('API request failed');
        const movie = await response.json();
        
        // 2. Generate the new, styled HTML
        modalContent.innerHTML = `
            <div class="modal-backdrop-container">
                <img src="${movie.backdrop || movie.poster}" class="modal-backdrop-image" alt="">
                <div class="modal-title-overlay">
                    <h2>${escapeHtml(movie.title)}</h2>
                </div>
            </div>
            
            <div class="modal-details-body">
                <div class="row">
                    <!-- Left Column: Details -->
                    <div class="col-md-8">
                        <div class="movie-meta-info">
                            <div class="movie-rating">
                                <span class="stars">${generateStars(movie.rating)}</span>
                                <span class="rating-value ms-2">${movie.rating.toFixed(1)} / 10</span>
                            </div>
                            <div>
                                <i class="far fa-calendar me-2"></i>${movie.release_date}
                            </div>
                            ${movie.runtime !== 'N/A' ? `
                                <div>
                                    <i class="far fa-clock me-2"></i>${movie.runtime} min
                                </div>
                            ` : ''}
                        </div>
                        
                        <h5>Overview</h5>
                        <p class="overview-text mb-4">${escapeHtml(movie.overview)}</p>
                        
                        ${movie.genres && movie.genres.length > 0 ? `
                            <div class="mb-4">
                                <h5>Genres</h5>
                                <div class="movie-genres">
                                    ${movie.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${movie.director && movie.director !== 'N/A' ? `
                            <div class="mb-4">
                                <h5>Director</h5>
                                <p class="director-info"><i class="fas fa-user-tie me-2"></i>${escapeHtml(movie.director)}</p>
                            </div>
                        ` : ''}
                        
                        ${movie.cast && movie.cast.length > 0 ? `
                            <div>
                                <h5>Cast</h5>
                                <div class="d-flex flex-wrap">
                                    ${movie.cast.slice(0, 5).map(actor => `<span class="cast-tag">${escapeHtml(actor)}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Right Column: Poster -->
                    <div class="col-md-4 poster-col">
                        <img src="${movie.poster}" alt="${escapeHtml(movie.title)}" class="img-fluid rounded" onerror="this.src='https://via.placeholder.com/500x750?text=No+Poster'">
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error fetching movie details:', error);
        // 3. Show a user-friendly error message inside the modal
        modalContent.innerHTML = `
            <div class="text-center p-5 d-flex flex-column align-items-center justify-content-center" style="min-height: 400px;">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <h4 style="color: var(--dark-text);">Failed to Load Details</h4>
                <p style="color: var(--dark-text-secondary);">Could not retrieve information for this movie. Please try again later.</p>
            </div>
        `;
        showToast('Failed to load movie details', 'error');
    }
}

// ============================================
// FAVORITES SYSTEM
// ============================================
function toggleFavorite(movieId, title, poster, event, extraData = {}) {
    event.stopPropagation();
    event.preventDefault();
    
    let favorites = getFavorites();
    const index = favorites.findIndex(fav => fav.id === movieId);
    
    if (index > -1) {
        favorites.splice(index, 1);
        showToast('Removed from favorites', 'info');
    } else {
        // Save MORE data about the movie
        favorites.push({ 
            id: movieId, 
            title, 
            poster,
            rating: extraData.rating || null,
            year: extraData.year || null,
            release_date: extraData.release_date || null,
            runtime: extraData.runtime || null,
            genres: extraData.genres || [],
            addedAt: Date.now()
        });
        showToast('Added to favorites', 'success');
    }
    
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    
    const btn = event.currentTarget;
    if (btn) btn.classList.toggle('active');
    updateNavbarCounter();
}

function isFavorite(movieId) {
    const favorites = getFavorites();
    return favorites.some(fav => fav.id === movieId);
}

function updateFavoritesCounter() {
    const favorites = getFavorites();
    const counter = document.getElementById('favoritesCounter');
    if (counter) {
        counter.textContent = favorites.length;
        counter.style.display = favorites.length > 0 ? 'flex' : 'none';
    }
}

function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem('favorites') || '[]');
    } catch (e) {
        console.error('Error getting favorites:', e);
        return [];
    }
}

function showFavoritesPage() {
    const sections = ['recommendations', 'search-section', 'hero-section'];
    sections.forEach(id => {
        const section = document.getElementById(id);
        if (section) section.style.display = 'none';
    });
    
    const favoritesSection = document.getElementById('favorites-section');
    if (favoritesSection) {
        favoritesSection.style.display = 'block';
        
        if (typeof displayFavorites === 'function') {
            displayFavorites();
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function generateStars(rating) {
    const stars = Math.round(rating / 2);
    let starsHTML = '';
    for (let i = 0; i < 5; i++) {
        if (i < stars) {
            starsHTML += '<i class="fas fa-star"></i>';
        } else {
            starsHTML += '<i class="far fa-star"></i>';
        }
    }
    return starsHTML;
}

// FIXED: Added elementId parameter
function showLoading() {
    const loadingBar = document.getElementById('loadingBar');
    if (loadingBar) {
        loadingBar.style.display = 'block';
        const progress = loadingBar.querySelector('.loading-bar-progress');
        if (progress) {
            progress.style.animation = 'none';
            setTimeout(() => {
                progress.style.animation = 'loadingProgress 1.5s ease-in-out';
            }, 10);
        }
    }
}

// FIXED: Added elementId parameter
function hideLoading() {
    const loadingBar = document.getElementById('loadingBar');
    if (loadingBar) {
        setTimeout(() => {
            loadingBar.style.display = 'none';
        }, 1500);
    }
}

// Helper functions for other loading bars
function showLoadingBar(elementId = 'loadingBar') {
    const loadingBar = document.getElementById(elementId);
    if (loadingBar) {
        loadingBar.style.display = 'block';
        const progress = loadingBar.querySelector('.loading-bar-progress');
        if (progress) {
            progress.style.animation = 'none';
            setTimeout(() => {
                progress.style.animation = 'loadingProgress 1.5s ease-in-out';
            }, 10);
        }
    }
}

function hideLoadingBar(elementId = 'loadingBar') {
    const loadingBar = document.getElementById(elementId);
    if (loadingBar) {
        setTimeout(() => {
            loadingBar.style.display = 'none';
        }, 1500);
    }
}

function showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${escapeHtml(message)}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
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

function updateView() {
    if (currentView === 'list' && recommendationsContainer) {
        recommendationsContainer.classList.add('list-view');
    } else if (recommendationsContainer) {
        recommendationsContainer.classList.remove('list-view');
    }
}

function checkScrollPosition() {
    if (scrollTopBtn) {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    }
}

function initNavbarScroll() {
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.glass-navbar');
        if (navbar) {
            if (window.pageYOffset > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });
}

function animateStats() {
    const stats = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateValue(entry.target, 0, target, 2000);
                observer.unobserve(entry.target);
            }
        });
    });
    
    stats.forEach(stat => observer.observe(stat));
}

function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            element.textContent = end.toString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toString();
        }
    }, 16);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('cinematch_theme', newTheme);
    
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = newTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
    
    showToast(`Switched to ${newTheme} mode`, 'info');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('cinematch_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = savedTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

// ============================================
// GENRE BROWSING
// ============================================
function searchByGenre(genre) {
    const genreMovies = {
        'action': ['Die Hard', 'Mad Max: Fury Road', 'John Wick', 'The Dark Knight'],
        'superhero': ['The Avengers', 'Spider-Man', 'Batman Begins', 'Iron Man'],
        'drama': ['The Shawshank Redemption', 'Forrest Gump', 'The Godfather'],
        'horror': ['The Conjuring', 'IT', 'Hereditary', 'Get Out'],
        'comedy': ['The Hangover', 'Superbad', 'Bridesmaids', 'Anchorman'],
        'scifi': ['Inception', 'Interstellar', 'The Matrix', 'Blade Runner'],
        'romance': ['Titanic', 'The Notebook', 'Pride and Prejudice'],
        'animated': ['Toy Story', 'Frozen', 'The Lion King', 'Finding Nemo']
    };
    
    const movies = genreMovies[genre] || [];
    
    if (movies.length > 0 && movieSearch) {
        const randomMovie = movies[Math.floor(Math.random() * movies.length)];
        movieSearch.value = randomMovie;
        
        const searchSection = document.getElementById('search');
        if (searchSection) {
            searchSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
        }
        
        showToast(`Searching for ${genre} movies like "${randomMovie}"`, 'info');
        
        setTimeout(() => {
            getRecommendations(randomMovie);
        }, 1000);
    }
}

// Initialize animations on load
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .animate-fade-in {
            animation: fadeInUp 0.8s ease forwards;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
});


// Add fade-in animation class
const style = document.createElement('style');
style.textContent = `
.animate-fade-in {
animation: fadeInUp 0.8s ease forwards;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
    `;
document.head.appendChild(style);

// ============================================
// ENHANCED MOVIE CAROUSEL INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
// Initialize Swiper Carousel
const movieSwiper = new Swiper('.movieSwiper', {
// Basic settings
slidesPerView: 'auto',
spaceBetween: 30,
centeredSlides: true,
loop: true,
speed: 500,
grabCursor: true,

    // Autoplay configuration
    autoplay: {
        delay: 3000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
    },
    
    // Pagination
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
        dynamicBullets: true,
    },
    
    // Effects
    effect: 'coverflow',
    coverflowEffect: {
        rotate: 20,
        stretch: 0,
        depth: 200,
        modifier: 1,
        slideShadows: true,
    },
    
    // Responsive breakpoints
    breakpoints: {
        320: {
            slidesPerView: 2,
            spaceBetween: 20,
        },
        480: {
            slidesPerView: 2.5,
            spaceBetween: 25,
        },
        640: {
            slidesPerView: 3,
            spaceBetween: 30,
        },
        768: {
            slidesPerView: 3.5,
            spaceBetween: 35,
        },
        1024: {
            slidesPerView: 4,
            spaceBetween: 40,
        },
        1280: {
            slidesPerView: 5,
            spaceBetween: 40,
        },
        1440: {
            slidesPerView: 6,
            spaceBetween: 40,
        }
    },
    
    // Events
    on: {
        init: function() {
            console.log('Movie carousel initialized');
        },
        slideChange: function() {
            // Add animation to active slide
            const activeSlide = this.slides[this.activeIndex];
            activeSlide.querySelector('.carousel-card-inner').style.transform = 'scale(1.05)';
        }
    }
});

// Pause autoplay on hover (enhanced)
const swiperContainer = document.querySelector('.movieSwiper');
if (swiperContainer) {
    swiperContainer.addEventListener('mouseenter', () => {
        movieSwiper.autoplay.stop();
    });
    
    swiperContainer.addEventListener('mouseleave', () => {
        movieSwiper.autoplay.start();
    });
}

});

// ============================================
// SELECT MOVIE FROM CAROUSEL
// ============================================

function selectMovie(movieTitle) {
const movieSearch = document.getElementById('movieSearch');
if (movieSearch) {
// Set the movie title
movieSearch.value = movieTitle;

    // Smooth scroll to search section
    document.getElementById('search').scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
    });
    
    // Show toast notification
    showToast(`Selected: ${movieTitle}`, 'info');
    
    // Optional: Auto-search after a short delay
    setTimeout(() => {
        getRecommendations(movieTitle);
    }, 800);
}
}

// =======================================
// MAIN.JS (for Home Page)
// =======================================

const FAVORITES_KEY = 'cinematch_favorites';

document.addEventListener('DOMContentLoaded', function() {
    updateNavbarCounter();

    // Listen for storage changes from other pages
    window.addEventListener('storage', function(e) {
        if (e.key === FAVORITES_KEY) {
            updateNavbarCounter();
            // If recommendations are showing, re-render them to update heart icons
            if (typeof displayRecommendations === 'function' && document.getElementById('recommendationsContainer').innerHTML !== '') {
                displayRecommendations();
            }
        }
    });
});

function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function updateNavbarCounter() {
    const favorites = getFavorites();
    const counter = document.getElementById('favoritesCounterNavbar');
    if (counter) {
        counter.textContent = favorites.length;
        counter.classList.toggle('show', favorites.length > 0);
    }
}




// Ensure you have a showToast function available in your main.js
function showToast(message, type = 'info') {
    // Your implementation here...
    console.log(`Toast [${type}]: ${message}`);
}

// Handle click/focus on search input
function handleSearchInputClick() {
    if (!movieSearch) {
        console.error('movieSearch element not found');
        return;
    }
    
    const query = movieSearch.value.trim();
    
    // If already has text (2+ chars), show search results from API
    if (query.length >= 2) {
        handleSearchInput();
        return;
    }
    
    // Always show predefined popular movies (no API call)
    showPopularMovies();
}

// Show popular movies (fallback)
function showPopularMovies() {
    const popularMovies = [
        'The Shawshank Redemption',
        'The Godfather',
        'The Dark Knight',
        'Inception',
        'Pulp Fiction',
        'Interstellar',
        'The Matrix',
        'Forrest Gump',
        'Fight Club',
        'Goodfellas',
        'The Lord of the Rings: The Return of the King',
        'Star Wars: Episode V - The Empire Strikes Back',
        'Avengers: Endgame',
        'Parasite',
        'Titanic',
        'Gladiator',
        'The Departed',
        'Whiplash',
        'The Prestige',
        'Django Unchained'
    ];
    
    showSuggestions(popularMovies, true);
}

// Show suggestions dropdown


function saveRecentSearch(movie) {
    let recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    recent = [movie, ...recent.filter(m => m !== movie)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(recent));
}

function showRecentSearches() {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    if (recent.length > 0) {
        showSuggestions(recent, '🕒 Recent Searches');
    } else {
        showPopularMovies();
    }
}

