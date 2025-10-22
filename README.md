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
