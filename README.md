# 🎬 CineMatch - Movie Recommendation System

<div align="center">

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)

AI-powered movie recommendation system using content-based filtering

[Live Demo](https://cinematch-ilc7.onrender.com/)

</div>

---

## 📸 Screenshots

### Home Page
[Home Page](https://drive.google.com/uc?export=view&id=1PEKXU1n6-udz_AtNpRwzAJu1KYcq47QY)
[](https://github.com/Umakant13/cinematch/blob/master/assets/images/movie_by_genere.png)
[](https://github.com/Umakant13/cinematch/blob/master/assets/images/our_features.png)

### Movie Search & Recommendations
[Movie Search](https://github.com/Umakant13/cinematch/blob/master/assets/images/searching%20a%20movie.png)
[Recommendations](https://github.com/Umakant13/cinematch/blob/master/assets/images/getting%20recommendations.png)

### Movie Details
[Movie Details](https://github.com/Umakant13/cinematch/blob/master/assets/images/movie%20details.png)

### Add a movie to Favorites

[Add a movie to Favorites](https://github.com/Umakant13/cinematch/blob/master/assets/images/adding%20movie%20to%20fav.png)

### Favorites Page

[Stats](https://github.com/Umakant13/cinematch/blob/master/assets/images/fav%20page.png)
[Favorites](https://github.com/Umakant13/cinematch/blob/master/assets/images/saving%20fav%20movies.png)


---



## 🚀 Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/cinematch.git
cd cinematch

```
### 2. Create Virtual Environment
``` bash

python -m venv venv
```
#### Windows:
``` bash
.\venv\Scripts\activate
```

#### Mac/Linux:
```bash
source venv/bin/activate
```

### 3. Install Dependencies
``` bash

pip install -r requirements.txt
```

### 4. Run Migrations
``` bash

python manage.py migrate
python manage.py collectstatic --noinput
```

### 5. Start Server
``` bash

python manage.py runserver
```

#### Open browser: http://127.0.0.1:8000

## Features
- 🔍 Smart movie search with AI recommendations
- 💾 Save favorites to personal collection
- 📊 Sort by rating, title, year, or similarity
- 🎨 Grid and list view modes
- 📱 Fully responsive design


## 🛠️ Technologies Used

- Backend: Django 4.2, Python 3.11  
- Frontend: HTML5, CSS3, JavaScript ES6, Bootstrap 5  
- ML: Scikit-learn, Pandas, NumPy  
- Deployment: Render.com, Gunicorn, WhiteNoise  

## 📝 License

MIT License - feel free to use for your projects

<div align="center">
Made with ❤️ by [Umakant Dodtalle](https://github.com/Umakant13)  
⭐ Star this repo if you like it!
</div>
