# MeStock - Inventory Management System

A modern, full-stack inventory management application for retail shops with POS integration, offline capabilities, and mobile deployment as a Progressive Web App (PWA).

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
- ✅ **No Data Loss**: All offline sales are queued and synced

### Mobile & Deployment

- ✅ **Progressive Web App**: Installable on any device (Android, iOS, Desktop)
- ✅ **Mobile-Responsive**: Optimized for all screen sizes
- ✅ **Modern UI**: Glassmorphism design with smooth animations

## 🛠️ Technology Stack

### Backend

- **Python 3.10+**
- **FastAPI**: Modern, fast web framework
- **SQLAlchemy**: ORM for database management
- **SQLite**: Lightweight database
- **JWT Authentication**: Secure token-based auth

### Frontend

- **React 18+** with TypeScript
- **Vite**: Fast build tool
- **Zustand**: State management
- **IndexedDB**: Offline storage
- **Recharts**: Data visualization
- **Workbox**: Service worker management

## 📦 Installation

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Seed the database with demo data:

```bash
python seed_data.py
```

5. Start the backend server:

```bash
python main.py
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🔐 Authentication

- **Default PIN**: `1234`
- Change this in `backend/auth.py` for production use

## 📱 Installing as PWA

### Android

1. Open the app in Chrome
2. Tap the menu (⋮) → "Install app" or "Add to Home screen"
3. Follow the prompts

### iOS

1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

### Desktop

1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Click "Install"

## 🔌 POS API Integration

The application exposes a REST API endpoint for POS systems:

### Endpoint

```
POST /api/pos/sale
```

### Request Body

```json
{
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ]
}
```

### Response

```json
{
  "id": 123,
  "sale_date": "2026-01-15T22:00:00",
  "total_amount": 45.97,
  "status": "completed",
  "items": [...]
}
```

### Error Responses

- `400`: Insufficient stock or invalid data
- `404`: Product not found
- `500`: Server error

## 📊 API Documentation

Full API documentation is available at `/docs` when running the backend server.

### Main Endpoints

**Authentication**

- `POST /api/auth/login` - Login with PIN

**Products**

- `GET /api/products/` - List all products
- `POST /api/products/` - Create product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

**Inventory**

- `GET /api/inventory/` - Get inventory status
- `PUT /api/inventory/{id}` - Update inventory
- `POST /api/inventory/{id}/adjust` - Adjust stock levels

**Sales**

- `GET /api/sales/` - List sales
- `POST /api/sales/` - Create sale
- `GET /api/sales/{id}` - Get sale details

**Analytics**

- `GET /api/analytics/dashboard` - Get dashboard metrics
- `GET /api/analytics/low-stock` - Low stock report
- `GET /api/analytics/revenue-trend` - Revenue trends

**Sync**

- `POST /api/sync/queue` - Add to sync queue
- `POST /api/sync/process` - Process pending syncs

## 🗄️ Database Schema

### Products

- id, name, description, category, price, barcode
- timestamps: created_at, updated_at

### Inventory

- product_id, quantity, min_stock_level, last_updated

### Sales

- id, sale_date, total_amount, status, sync_status

### Sale Items

- sale_id, product_id, quantity, unit_price, subtotal

### Sync Queue

- transaction_type, payload, status, created_at, synced_at

## 🚢 Deployment

### Production Build

**Backend**

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Frontend**

```bash
cd frontend
npm run build
npm run preview  # or serve the dist folder
```

### Deployment Options

**Backend**

- Railway.app
- Render.com
- Heroku
- Any VPS (DigitalOcean, AWS, etc.)

**Frontend**

- Netlify (recommended for PWA)
- Vercel
- GitHub Pages
- Any static hosting

See `DEPLOYMENT.md` for detailed deployment instructions.

## 📈 Future Scalability

### Recommended Enhancements

1. **Database**: Migrate to PostgreSQL/MySQL for better performance
2. **Multi-Store**: Add support for multiple store locations
3. **User Roles**: Implement role-based access control
4. **Barcode Scanning**: Add camera-based barcode scanner
5. **Receipt Printing**: Integrate thermal printer support
6. **Cloud Sync**: Add cloud backup and sync across devices
7. **Advanced Analytics**: More detailed reports and forecasting
8. **Notifications**: Email/SMS alerts for low stock

See `SCALABILITY.md` for detailed recommendations.

## 🐛 Troubleshooting

### Backend Issues

- **Database locked**: Ensure only one instance is running
- **Import errors**: Check Python version and virtual environment

### Frontend Issues

- **Service worker errors**: Clear browser cache and reinstall PWA
- **Offline sync not working**: Check browser console for errors
- **Charts not rendering**: Ensure Recharts is installed correctly

## 📝 License

MIT License - feel free to use this project for commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues and questions:

- Check the API documentation at `/docs`
- Review the troubleshooting section
- Open an issue on GitHub

---

**Built with ❤️ for retail businesses**
