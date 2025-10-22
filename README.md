<div align="center">

# 🎬 CineMatch

### AI-Powered Movie Recommendation System

[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge)](https://your-app.onrender.com)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/cinematch.git
cd cinematch

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Setup Django
python manage.py migrate
python manage.py collectstatic --noinput

# Run server
python manage.py runserver

8000

🛠️ Tech Stack
<div align="center">
Python
Django
JavaScript
Bootstrap
Pandas
NumPy
scikit-learn

</div>
✨ Features
🔍 Smart Search - AI-powered movie recommendations
💾 Favorites - Save & organize your collection
📊 Sorting - By rating, title, year, similarity
🎨 Grid/List View - Toggle display modes
📱 Responsive - Works on all devices
🌙 Dark Theme - Eye-friendly interface
📁 Project Structure
text

cinematch/
├── movie_recommender/      # Django project
├── recommender/            # Main app
│   ├── templates/         # HTML files
│   ├── views.py          # Backend logic
│   └── urls.py           # Routes
├── static/
│   ├── css/              # Styles
│   └── js/               # Scripts
├── notebooks/            # ML notebooks & data
│   ├── movies.csv       # Dataset
│   └── *.ipynb          # Jupyter notebooks
├── requirements.txt      # Dependencies
└── manage.py            # Django CLI
🔧 Environment Setup
Create .env file:

env

DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
Generate secret key:

Bash

python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
📦 Dependencies
txt

Django>=4.2.0
gunicorn>=21.2.0
whitenoise>=6.6.0
pandas>=2.1.0
numpy>=1.24.0
scikit-learn>=1.3.0
requests>=2.31.0
python-dotenv>=1.0.0
🌐 Deploy to Render
1. Create render.yaml:

YAML

services:
  - type: web
    name: cinematch
    runtime: python
    plan: free
    buildCommand: pip install -r requirements.txt && python manage.py collectstatic --noinput
    startCommand: gunicorn movie_recommender.wsgi:application --bind 0.0.0.0:$PORT
    envVars:
      - key: DJANGO_SECRET_KEY
        generateValue: true
      - key: DJANGO_DEBUG
        value: "False"
      - key: DJANGO_ALLOWED_HOSTS
        value: ".onrender.com"
2. Push to GitHub:

Bash

git add .
git commit -m "Deploy to Render"
git push origin main
3. Deploy:

Go to render.com
New → Web Service
Connect your repo
Click "Create Web Service"
🐳 Docker Setup
Bash

# Build image
docker build -t cinematch .

# Run container
docker run -d -p 8000:8000 \
  -e DJANGO_SECRET_KEY='your-key' \
  -e DJANGO_DEBUG=False \
  cinematch
🤖 Machine Learning
Algorithm: Content-Based Filtering with TF-IDF & Cosine Similarity

Python

# Feature extraction
from sklearn.feature_extraction.text import TfidfVectorizer
tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(df['combined_features'])

# Similarity calculation
from sklearn.metrics.pairwise import cosine_similarity
cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

# Get recommendations
def get_recommendations(title):
    idx = df[df['title'] == title].index[0]
    sim_scores = sorted(list(enumerate(cosine_sim[idx])), 
                       key=lambda x: x[1], reverse=True)[1:11]
    return df.iloc[[i[0] for i in sim_scores]]
Run Jupyter Notebooks:

Bash

cd notebooks
pip install jupyter
jupyter notebook
🔑 API Endpoints
http

GET /api/search/?q=matrix
GET /api/recommendations/?movie=The Matrix
GET /api/movie/603/
📸 Screenshots
<div align="center">
Home
Recommendations

</div>
🤝 Contributing
Bash

# Fork & clone
git clone https://github.com/yourusername/cinematch.git

# Create branch
git checkout -b feature/YourFeature

# Commit & push
git commit -m 'Add YourFeature'
git push origin feature/YourFeature

# Open Pull Request
📝 License
MIT License - See LICENSE file

📧 Contact
Your Name - @yourusername

Live Demo: cinematch.onrender.com

<div align="center">
Made with ❤️ using Django & Machine Learning

⭐ Star this repo if you found it helpful!

</div> ```
