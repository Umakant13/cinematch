// ========== SORTING FUNCTIONS ==========

function handleSort(sortType) {
    currentSort = sortType;
    localStorage.setItem('preferredSort', sortType);
    
    if (currentRecommendations) {
        const sortedRecommendations = sortMovies(currentRecommendations, sortType);
        displayRecommendations(sortedRecommendations, selectedMovieData, false);
    }
}

function sortMovies(movies, sortType) {
    const sorted = [...movies];
    
    switch(sortType) {
        case 'similarity':
            return sorted.sort((a, b) => b.similarity - a.similarity);
        
        case 'rating':
            return sorted.sort((a, b) => b.rating - a.rating);
        
        case 'rating-low':
            return sorted.sort((a, b) => a.rating - b.rating);
        
        case 'title':
            return sorted.sort((a, b) => a.title.localeCompare(b.title));
        
        case 'title-desc':
            return sorted.sort((a, b) => b.title.localeCompare(a.title));
        
        case 'year':
            return sorted.sort((a, b) => {
                const yearA = a.release_date ? parseInt(a.release_date.split('-')[0]) : 0;
                const yearB = b.release_date ? parseInt(b.release_date.split('-')[0]) : 0;
                return yearB - yearA;
            });
        
        case 'year-old':
            return sorted.sort((a, b) => {
                const yearA = a.release_date ? parseInt(a.release_date.split('-')[0]) : 0;
                const yearB = b.release_date ? parseInt(b.release_date.split('-')[0]) : 0;
                return yearA - yearB;
            });
        
        default:
            return sorted;
    }
}

// ========== VIEW SWITCHING ==========

function switchView(view, shouldRender = true) {
    currentView = view;
    const container = document.getElementById('recommendationsContainer');
    const viewBtns = document.querySelectorAll('#viewControlsBar .view-btn');
    
    if (typeof saveViewPreference === 'function') {
        saveViewPreference(view);
    }
    
    // Update active button
    viewBtns.forEach(btn => {
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // CRITICAL FIX: Clear all classes first, then apply correct one
    if (container) {
        container.className = ''; // Clear everything
        if (view === 'list') {
            container.classList.add('recommendations-list');
        } else {
            container.classList.add('recommendations-grid');
        }
    }
    
    // Re-render if recommendations exist and shouldRender is true
    if (shouldRender && currentRecommendations) {
        displayRecommendations(currentRecommendations, selectedMovieData, false);
    }
}

// ========== DISPLAY FUNCTIONS ==========

function displayRecommendations(recommendations, selectedMovie = null, shouldSave = true) {
    currentRecommendations = recommendations;
    
    // Save to localStorage
    if (shouldSave && typeof saveRecommendations === 'function') {
        saveRecommendations(recommendations, selectedMovie);
    }
    
    // Apply current sort
    const sortedRecommendations = sortMovies(recommendations, currentSort);
    
    // Display selected movie if provided
    if (selectedMovie) {
        selectedMovieData = selectedMovie;
        displaySelectedMovie(selectedMovie);
    }
    
    const recommendationsContainer = document.getElementById('recommendationsContainer');
    const viewControlsBar = document.getElementById('viewControlsBar');
    const recommendationsSection = document.getElementById('recommendations');
    const isListView = currentView === 'list';
    
    if (!recommendationsContainer) return;
    
    // CRITICAL FIX: Properly set container classes based on current view
    recommendationsContainer.className = ''; // Clear all classes first
    if (isListView) {
        recommendationsContainer.classList.add('recommendations-list');
    } else {
        recommendationsContainer.classList.add('recommendations-grid');
    }
    
    // Show recommendations section
    if (recommendationsSection) {
        recommendationsSection.style.display = 'block';
    }
    
    // Show view controls and loading bar
    if (viewControlsBar) viewControlsBar.style.display = 'block';
    if (typeof showLoadingBar === 'function') {
        showLoadingBar('loadingBar');
    }
    
    // Set sort select value
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.value = currentSort;
    }
    
    // Update view buttons active state
    const viewBtns = document.querySelectorAll('#viewControlsBar .view-btn');
    viewBtns.forEach(btn => {
        if (btn.dataset.view === currentView) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Add a small delay to show loading animation
    setTimeout(() => {
        const cardsHTML = sortedRecommendations.map((movie, index) => {
            return createMovieCard(movie, index, isListView, false);
        }).join('');
        
        recommendationsContainer.innerHTML = cardsHTML;
        
        if (typeof hideLoadingBar === 'function') {
            hideLoadingBar('loadingBar');
        }
        
        // Update results count
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            resultsCount.textContent = sortedRecommendations.length;
        }
    }, 300);
}

function displaySelectedMovie(movie) {
    const selectedMovieInfo = document.getElementById('selectedMovieInfo');
    if (selectedMovieInfo && movie) {
        selectedMovieInfo.innerHTML = `
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                    <h3 class="selected-movie-title mb-2">
                        <i class="fas fa-film me-2"></i>Recommendations based on:
                    </h3>
                    <h4 class="text-primary mb-0">${typeof escapeHtml === 'function' ? escapeHtml(movie.title) : movie.title}</h4>
                </div>
                <button class="btn btn-outline-danger" onclick="clearRecommendations()">
                    <i class="fas fa-times me-2"></i>Clear Recommendations
                </button>
            </div>
        `;
        selectedMovieInfo.style.display = 'block';
    }
}

// ========== SHARED CARD CREATION ==========

function createMovieCard(movie, index, isListView, isFavoritePage) {
    const escapedTitle = typeof escapeHtml === 'function' ? escapeHtml(movie.title) : movie.title;
    const escapedOverview = movie.overview && typeof escapeHtml === 'function' ? escapeHtml(movie.overview) : (movie.overview || 'No description available');
    const isFav = typeof isFavorite === 'function' ? isFavorite(movie.id) : false;
    
    if (isListView) {
        return `
            <div class="movie-card" style="animation-delay: ${index * 0.05}s">
                <div class="movie-poster-wrapper">
                    <img src="${movie.poster}" alt="${escapedTitle}" class="movie-poster" loading="lazy" onerror="this.src='https://via.placeholder.com/500x750?text=No+Poster'">
                    
                    <button class="favorite-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(${movie.id}, '${escapedTitle}', '${movie.poster}', event)">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                
                <div class="movie-details">
                    <div>
                        ${!isFavoritePage && movie.similarity ? `
                            <div class="mb-2">
                                <span class="similarity-badge">
                                    <i class="fas fa-chart-line me-1"></i>${movie.similarity}% Match
                                </span>
                            </div>
                        ` : ''}
                        
                        <h5 class="movie-title">${escapedTitle}</h5>
                        
                        <div class="movie-meta">
                            <div class="rating">
                                <i class="fas fa-star"></i>
                                <span>${movie.rating ? movie.rating.toFixed(1) : 'N/A'}</span>
                            </div>
                            <span>
                                <i class="fas fa-calendar me-1"></i>
                                ${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}
                            </span>
                            ${movie.runtime && movie.runtime !== 'N/A' ? `
                                <span>
                                    <i class="fas fa-clock me-1"></i>
                                    ${movie.runtime}m
                                </span>
                            ` : ''}
                        </div>
                        
                        ${movie.overview ? `
                            <p class="movie-overview">${escapedOverview.substring(0, 250)}${escapedOverview.length > 250 ? '...' : ''}</p>
                        ` : '<p class="movie-overview">No description available.</p>'}
                        
                        ${movie.genres && movie.genres.length > 0 ? `
                            <div class="genres">
                                ${movie.genres.map(genre => `
                                    <span class="genre-badge">${genre}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="list-actions mt-3">
                        <button class="btn btn-gradient" onclick="showMovieDetails(${movie.id})">
                            <i class="fas fa-info-circle me-2"></i>View Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    } else {
        return `
            <div class="movie-card" style="animation-delay: ${index * 0.05}s">
                <div class="movie-poster-wrapper">
                    <img src="${movie.poster}" alt="${escapedTitle}" class="movie-poster" loading="lazy" onerror="this.src='https://via.placeholder.com/500x750?text=No+Poster'">
                    
                    ${!isFavoritePage && movie.similarity ? `
                        <span class="similarity-badge">
                            <i class="fas fa-chart-line me-1"></i>${movie.similarity}% Match
                        </span>
                    ` : ''}
                    
                    <button class="favorite-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(${movie.id}, '${escapedTitle}', '${movie.poster}', event)">
                        <i class="fas fa-heart"></i>
                    </button>
                    
                    <div class="movie-overlay">
                        <p>${movie.overview ? escapedOverview.substring(0, 120) + '...' : 'No description available'}</p>
                        <button class="btn btn-sm btn-gradient" onclick="showMovieDetails(${movie.id})">
                            <i class="fas fa-info-circle me-2"></i>View Details
                        </button>
                    </div>
                </div>
                
                <div class="movie-details">
                    <h5 class="movie-title">${escapedTitle}</h5>
                    
                    <div class="movie-meta">
                        <div class="rating">
                            <i class="fas fa-star"></i>
                            <span>${movie.rating ? movie.rating.toFixed(1) : 'N/A'}</span>
                        </div>
                        <span>
                            <i class="fas fa-calendar me-1"></i>
                            ${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}
                        </span>
                        ${movie.runtime && movie.runtime !== 'N/A' ? `
                            <span>
                                <i class="fas fa-clock me-1"></i>
                                ${movie.runtime}m
                            </span>
                        ` : ''}
                    </div>
                    
                    ${movie.genres && movie.genres.length > 0 ? `
                        <div class="genres">
                            ${movie.genres.slice(0, 3).map(genre => `
                                <span class="genre-badge">${genre}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
}