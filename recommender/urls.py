# Create file: recommender/urls.py

from django.urls import path
from . import views

app_name = 'recommender'

urlpatterns = [
    path('', views.index, name='index'),
    path('favorites/', views.favorites, name='favorites'),  # Add this line
    path('api/recommendations/', views.get_recommendations, name='recommendations'),
    path('api/search/', views.search_movies, name='search'),
    path('api/movie/<int:movie_id>/', views.get_movie_details, name='movie_details'),
]