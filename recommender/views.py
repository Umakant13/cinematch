import pickle
import requests
import os
import json
import time
import numpy as np
from django.shortcuts import render
from django.http import JsonResponse
from django.conf import settings
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry # type: ignore
import logging
from django.views.decorators.http import require_http_methods

logger = logging.getLogger(__name__)

# Load models once when server starts
BASE_DIR = settings.BASE_DIR
try:
    movies_df = pickle.load(open(os.path.join(BASE_DIR, 'model/movie_list.pkl'), 'rb'))
    similarity = pickle.load(open(os.path.join(BASE_DIR, 'model/similarity.pkl'), 'rb'))
    logger.info(f"Models loaded successfully. Total movies: {len(movies_df)}")
except Exception as e:
    logger.error(f"Error loading models: {e}")
    movies_df = None
    similarity = None

# TMDB Configuration
TMDB_API_KEY = '8265bd1679663a7ea12ac168da84d2e8'
TMDB_BASE_URL = 'https://api.themoviedb.org/3'

# Create a session with retry strategy
def create_session():
    """Create a requests session with retry logic"""
    session = requests.Session()
    retry = Retry(
        total=3,
        read=3,
        connect=3,
        backoff_factor=0.3,
        status_forcelist=(500, 502, 504, 503)
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=10, pool_maxsize=10)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    return session

# Global session
api_session = create_session()

def convert_to_json_serializable(obj):
    """Convert numpy types to Python native types"""
    if isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj

def fetch_movie_details_cached(movie_id):
    """Fetch movie details with caching and fallback"""
    movie_id = convert_to_json_serializable(movie_id)
    
    # Check cache first
    cache_key = f'movie_detail_{movie_id}'
    cached_data = cache.get(cache_key)
    
    if cached_data:
        logger.info(f"Cache hit for movie {movie_id}")
        return cached_data
    
    # If not in cache, try to fetch from API
    try:
        movie_details = fetch_from_tmdb_with_retry(movie_id)
        if movie_details:
            # Cache for 24 hours
            cache.set(cache_key, movie_details, 86400)
            return movie_details
    except Exception as e:
        logger.error(f"Error fetching movie {movie_id}: {e}")
    
    # Fallback: Return basic data from dataframe
    return create_fallback_movie_data(movie_id)

def fetch_from_tmdb_with_retry(movie_id, max_retries=3):
    """Fetch from TMDB with retry logic and timeout"""
    for attempt in range(max_retries):
        try:
            # Movie details
            url = f"{TMDB_BASE_URL}/movie/{movie_id}"
            params = {'api_key': TMDB_API_KEY, 'language': 'en-US'}
            
            response = api_session.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                # Try to get credits (but don't fail if it doesn't work)
                cast = []
                director = 'N/A'
                try:
                    credits_url = f"{TMDB_BASE_URL}/movie/{movie_id}/credits"
                    credits_response = api_session.get(
                        credits_url, 
                        params={'api_key': TMDB_API_KEY}, 
                        timeout=3
                    )
                    if credits_response.status_code == 200:
                        credits = credits_response.json()
                        cast = [actor['name'] for actor in credits.get('cast', [])[:5]]
                        director = next(
                            (crew['name'] for crew in credits.get('crew', []) 
                             if crew['job'] == 'Director'), 
                            'N/A'
                        )
                except:
                    pass  # Ignore credits errors
                
                return {
                    'id': movie_id,
                    'title': data.get('title', 'Unknown'),
                    'poster': f"https://image.tmdb.org/t/p/w500{data['poster_path']}" 
                              if data.get('poster_path') 
                              else 'https://via.placeholder.com/500x750?text=No+Poster',
                    'backdrop': f"https://image.tmdb.org/t/p/original{data['backdrop_path']}" 
                                if data.get('backdrop_path') 
                                else None,
                    'overview': data.get('overview', 'No overview available'),
                    'rating': float(data.get('vote_average', 0)),
                    'release_date': data.get('release_date', 'N/A'),
                    'runtime': int(data.get('runtime', 0)) if data.get('runtime') else 'N/A',
                    'genres': [genre['name'] for genre in data.get('genres', [])][:3],
                    'cast': cast,
                    'director': director
                }
            
            elif response.status_code == 429:  # Rate limited
                wait_time = int(response.headers.get('Retry-After', 2))
                logger.warning(f"Rate limited. Waiting {wait_time} seconds...")
                time.sleep(wait_time)
                continue
                
        except requests.exceptions.Timeout:
            logger.warning(f"Timeout on attempt {attempt + 1} for movie {movie_id}")
            if attempt < max_retries - 1:
                time.sleep(1)
        except requests.exceptions.ConnectionError:
            logger.warning(f"Connection error on attempt {attempt + 1} for movie {movie_id}")
            if attempt < max_retries - 1:
                time.sleep(2)
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            break
    
    return None

def create_fallback_movie_data(movie_id):
    """Create fallback movie data when API fails"""
    # Try to get movie title from dataframe
    movie_title = 'Unknown Movie'
    try:
        movie_row = movies_df[movies_df['movie_id'] == movie_id]
        if not movie_row.empty:
            movie_title = movie_row.iloc[0]['title']
    except:
        pass
    
    return {
        'id': movie_id,
        'title': movie_title,
        'poster': 'https://via.placeholder.com/500x750?text=' + movie_title.replace(' ', '+'),
        'backdrop': None,
        'overview': 'Movie information temporarily unavailable',
        'rating': 7.0,  # Default rating
        'release_date': 'N/A',
        'runtime': 'N/A',
        'genres': ['Drama', 'Action'],  # Default genres
        'cast': [],
        'director': 'N/A'
    }

def index(request):
    """Main page view"""
    if movies_df is None:
        return render(request, 'recommender/error.html', {
            'error_code': '500',
            'error_title': 'Data Not Loaded',
            'error_message': 'Movie data could not be loaded. Please check if model files exist.'
        })
    
    movie_list = movies_df['title'].values.tolist()
    return render(request, 'recommender/index.html', {
        'movies': movie_list
    })

def get_recommendations(request):
    """Optimized recommendations endpoint with batch processing"""
    if request.method == 'GET':
        movie_name = request.GET.get('movie', '')
        
        if not movie_name:
            return JsonResponse({'error': 'No movie selected'}, status=400)
        
        if movies_df is None or similarity is None:
            return JsonResponse({'error': 'Model data not loaded'}, status=500)
        
        try:
            # Check cache for recommendations
            cache_key = f'recommendations_{movie_name}'
            cached_recommendations = cache.get(cache_key)
            
            if cached_recommendations:
                logger.info(f"Cache hit for recommendations: {movie_name}")
                return JsonResponse({
                    'success': True,
                    'recommendations': cached_recommendations,
                    'from_cache': True
                })
            
            # Find movie index
            movie_matches = movies_df[movies_df['title'] == movie_name]
            if movie_matches.empty:
                return JsonResponse({'error': 'Movie not found'}, status=404)
            
            index = movie_matches.index[0]
            
            # Get similar movies
            distances = sorted(list(enumerate(similarity[index])), reverse=True, key=lambda x: x[1])
            
            # Process recommendations in smaller batches
            recommendations = []
            batch_size = 4  # Process 4 movies at a time
            
            for i in range(1, min(13, len(distances))):  # Get top 12 recommendations
                movie_id = convert_to_json_serializable(movies_df.iloc[distances[i][0]].movie_id)
                similarity_score = convert_to_json_serializable(distances[i][1])
                
                # Get movie details (with caching and fallback)
                movie_details = fetch_movie_details_cached(movie_id)
                
                if movie_details:
                    movie_details['similarity'] = round(float(similarity_score) * 100, 2)
                    recommendations.append(movie_details)
                
                # Add small delay every batch to avoid overwhelming API
                if i % batch_size == 0:
                    time.sleep(0.1)
            
            # Cache recommendations for 1 hour
            cache.set(cache_key, recommendations, 3600)
            
            return JsonResponse({
                'success': True,
                'recommendations': recommendations,
                'from_cache': False
            })
            
        except Exception as e:
            logger.error(f"Error in get_recommendations: {e}")
            return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@cache_page(60 * 15)  # Cache for 15 minutes
def search_movies(request):
    """Search endpoint with caching"""
    query = request.GET.get('q', '').lower()
    if len(query) < 2:
        return JsonResponse({'results': []})
    
    try:
        matching_movies = movies_df[
            movies_df['title'].str.lower().str.contains(query, na=False)
        ]['title'].head(10).tolist()
        return JsonResponse({'results': matching_movies})
    except Exception as e:
        logger.error(f"Search error: {e}")
        return JsonResponse({'results': []})

def get_movie_details(request, movie_id):
    """Get movie details with caching"""
    try:
        movie_id = convert_to_json_serializable(movie_id)
        details = fetch_movie_details_cached(movie_id)
        return JsonResponse(details)
    except Exception as e:
        logger.error(f"Error getting movie details: {e}")
        return JsonResponse({'error': 'Movie not found'}, status=404)

# Error handlers
def error_404(request, exception):
    return render(request, 'recommender/error.html', {
        'error_code': '404',
        'error_title': 'Page Not Found',
        'error_message': 'The page you are looking for does not exist.'
    }, status=404)

def error_500(request):
    return render(request, 'recommender/error.html', {
        'error_code': '500',
        'error_title': 'Server Error',
        'error_message': 'Something went wrong. Please try again.'
    }, status=500)

def favorites(request):
    """Favorites page view"""
    return render(request, 'recommender/favorites.html')

@require_http_methods(["GET"])
def search_movies(request):
    """
    Search movies endpoint that handles both search queries and popular movies
    """
    query = request.GET.get('q', '').strip()
    limit = int(request.GET.get('limit', 15))
    
    # If query is empty or 'popular', return popular/trending movies
    if not query or query.lower() == 'popular':
        return get_popular_movies(limit)
    
    # Otherwise, search for movies matching the query
    return search_by_query(query, limit)


def get_popular_movies(limit=15):
    """
    Fetch popular/trending movies from TMDB
    """
    try:
        # Option 1: Get Popular Movies
        url = f"https://api.themoviedb.org/3/movie/popular"
        params = {
            'api_key': settings.TMDB_API_KEY,
            'language': 'en-US',
            'page': 1
        }
        
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        # Extract movie titles
        movies = [movie['title'] for movie in data.get('results', [])[:limit]]
        
        return JsonResponse({
            'success': True,
            'results': movies,
            'count': len(movies)
        })
        
    except Exception as e:
        # Fallback to predefined popular movies
        popular_movies = [
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
            'Star Wars: Episode V',
            'Avengers: Endgame',
            'Parasite',
            'Titanic'
        ]
        
        return JsonResponse({
            'success': True,
            'results': popular_movies[:limit],
            'count': len(popular_movies[:limit])
        })


def search_by_query(query, limit=15):
    """
    Search movies by query string
    """
    try:
        url = f"https://api.themoviedb.org/3/search/movie"
        params = {
            'api_key': settings.TMDB_API_KEY,
            'language': 'en-US',
            'query': query,
            'page': 1,
            'include_adult': False
        }
        
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        # Extract movie titles
        movies = [movie['title'] for movie in data.get('results', [])[:limit]]
        
        return JsonResponse({
            'success': True,
            'results': movies,
            'count': len(movies)
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
            'results': []
        }, status=500)


# Alternative: Get Trending Movies (Updated Daily)
def get_trending_movies(limit=15):
    """
    Fetch trending movies from TMDB
    """
    try:
        url = f"https://api.themoviedb.org/3/trending/movie/day"
        params = {
            'api_key': settings.TMDB_API_KEY,
            'language': 'en-US'
        }
        
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        movies = [movie['title'] for movie in data.get('results', [])[:limit]]
        
        return JsonResponse({
            'success': True,
            'results': movies,
            'count': len(movies)
        })
        
    except Exception as e:
        # Fallback
        return get_popular_movies(limit)
