# MeStock - Inventory Management System

A modern, full-stack inventory management application for retail shops with POS integration, offline capabilities, and mobile deployment as a Progressive Web App (PWA).

## 🌐 Live Demo

- **Frontend:** [https://me-inventory.vercel.app](https://me-inventory.vercel.app)
- **Backend API:** [https://mestock-api.onrender.com](https://mestock-api.onrender.com)
- **API Docs:** [https://mestock-api.onrender.com/docs](https://mestock-api.onrender.com/docs)
- **Default PIN:** `1234`

## 🚀 Features

### Core Functionality

- ✅ **Product Management**: Add, edit, and delete products with categories and barcodes
- ✅ **Inventory Tracking**: Real-time stock levels with low-stock alerts
- ✅ **Sales Transactions**: Create sales with automatic stock deduction
- ✅ **POS Integration**: REST API endpoint for external POS systems
- ✅ **Sales History**: View past transactions with detailed breakdowns
- ✅ **Analytics Dashboard**: Sales trends, top products, and revenue insights

### Offline Support

- ✅ **Offline-First Design**: Works without internet connection
- ✅ **Local Data Storage**: IndexedDB for products and pending transactions
- ✅ **Auto-Sync**: Automatically syncs when connection is restored

### Mobile & Deployment

- ✅ **Progressive Web App**: Installable on any device (Android, iOS, Desktop)
- ✅ **Mobile-Responsive**: Optimized for all screen sizes
- ✅ **Modern UI**: Glassmorphism design with smooth animations

## 🛠️ Technology Stack

| Layer        | Technologies                                           |
| ------------ | ------------------------------------------------------ |
| **Backend**  | Python 3.11, FastAPI, SQLAlchemy, PostgreSQL, JWT Auth |
| **Frontend** | React 18, TypeScript, Vite, Zustand, Recharts          |
| **Offline**  | IndexedDB, Service Workers, Workbox                    |
| **Hosting**  | Render (Backend), Vercel (Frontend)                    |

## 📦 Local Development

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
python seed_data.py            # Seed demo data
python main.py                 # Start server at http://localhost:8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev                    # Start at http://localhost:5173
```

## � Deployment

### Backend (Render)

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo
3. Set **Root Directory**: `backend`
4. Set **Build Command**: `pip install -r requirements.txt`
5. Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `SECRET_KEY` - Random 32+ character string
   - `ALLOWED_ORIGINS` - Your Vercel frontend URL
   - `DEFAULT_PIN` - `1234` (or your preferred PIN)

### Frontend (Vercel)

1. Import project on [Vercel](https://vercel.com)
2. Set **Root Directory**: `frontend`
3. Add environment variable:
   - `VITE_API_URL` - `https://your-render-backend.onrender.com/api`

## 📱 Install as PWA

| Platform    | Instructions                                    |
| ----------- | ----------------------------------------------- |
| **Android** | Chrome → Menu (⋮) → "Install app"               |
| **iOS**     | Safari → Share → "Add to Home Screen"           |
| **Desktop** | Chrome/Edge → Click install icon in address bar |

## 🔌 POS API Integration

```bash
POST /api/pos/sale
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ]
}
```

## � API Endpoints

| Category      | Endpoint                       | Description          |
| ------------- | ------------------------------ | -------------------- |
| **Auth**      | `POST /api/auth/login`         | Login with PIN       |
| **Products**  | `GET/POST /api/products/`      | List/Create products |
| **Inventory** | `GET /api/inventory/`          | Get stock levels     |
| **Sales**     | `POST /api/sales/`             | Create sale          |
| **Analytics** | `GET /api/analytics/dashboard` | Dashboard metrics    |

Full documentation at `/docs` endpoint.

## 📝 License

MIT License - free for commercial use.

---

**Built with ❤️ for retail businesses**
