# API Documentation

Complete REST API documentation for the MeStock Inventory Management System.

## Base URL

```
http://localhost:8000/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header.

### Login

```http
POST /auth/login
```

**Request Body:**

```json
{
  "pin": "1234"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Use token in subsequent requests:**

```http
Authorization: Bearer {access_token}
```

---

## Products

### List Products

```http
GET /products/
```

**Query Parameters:**

- `category` (optional): Filter by category
- `skip` (optional): Pagination offset (default: 0)
- `limit` (optional): Max results (default: 100)

**Response:**

```json
[
  {
    "id": 1,
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse",
    "category": "Electronics",
    "price": 25.99,
    "barcode": "ELC001",
    "created_at": "2026-01-15T10:00:00",
    "updated_at": "2026-01-15T10:00:00",
    "inventory": {
      "id": 1,
      "product_id": 1,
      "quantity": 50,
      "min_stock_level": 10,
      "last_updated": "2026-01-15T10:00:00"
    }
  }
]
```

### Get Single Product

```http
GET /products/{product_id}
```

### Create Product

```http
POST /products/
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "name": "Product Name",
  "description": "Product description",
  "category": "Category Name",
  "price": 19.99,
  "barcode": "ABC123",
  "initial_quantity": 100,
  "min_stock_level": 20
}
```

### Update Product

```http
PUT /products/{product_id}
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "name": "Updated Name",
  "price": 24.99
}
```

### Delete Product

```http
DELETE /products/{product_id}
Authorization: Bearer {token}
```

### Get Categories

```http
GET /products/categories/list
```

**Response:**

```json
["Electronics", "Beverages", "Snacks"]
```

---

## Inventory

### Get Inventory Status

```http
GET /inventory/
```

**Query Parameters:**

- `low_stock` (optional): true to show only low stock items
- `skip`, `limit`: Pagination

### Get Product Inventory

```http
GET /inventory/{product_id}
```

### Update Inventory

```http
PUT /inventory/{product_id}
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "quantity": 150,
  "min_stock_level": 25
}
```

### Adjust Inventory

```http
POST /inventory/{product_id}/adjust?adjustment=10
Authorization: Bearer {token}
```

**Parameters:**

- `adjustment`: Number to add (positive) or remove (negative)

---

## Sales

### List Sales

```http
GET /sales/
```

**Query Parameters:**

- `days` (optional): Filter sales from last N days
- `skip`, `limit`: Pagination

**Response:**

```json
[
  {
    "id": 1,
    "sale_date": "2026-01-15T15:30:00",
    "total_amount": 45.97,
    "status": "completed",
    "sync_status": "synced",
    "created_at": "2026-01-15T15:30:00",
    "items": [
      {
        "id": 1,
        "sale_id": 1,
        "product_id": 1,
        "quantity": 2,
        "unit_price": 19.99,
        "subtotal": 39.98,
        "product": {
          "name": "Product Name"
        }
      }
    ]
  }
]
```

### Get Sale Details

```http
GET /sales/{sale_id}
```

### Create Sale

```http
POST /sales/
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 3,
      "quantity": 1
    }
  ]
}
```

**Response:** Returns created sale with all details

**Error Responses:**

- `400`: Insufficient stock
  ```json
  {
    "detail": "Insufficient stock for Product Name. Available: 5, Requested: 10"
  }
  ```
- `404`: Product not found

### Delete Sale

```http
DELETE /sales/{sale_id}?restore_inventory=true
Authorization: Bearer {token}
```

**Parameters:**

- `restore_inventory`: Whether to restore stock (default: true)

---

## POS Integration

### Submit POS Sale

```http
POST /pos/sale
```

**Request Body:**

```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ]
}
```

**Response:** Same as Create Sale

**Features:**

- Thread-safe with row-level locking
- Handles concurrent requests
- Automatic stock deduction
- Validates inventory before processing

**Error Handling:**

```json
{
  "detail": "Error message describing the issue"
}
```

---

## Sync

### Add to Sync Queue

```http
POST /sync/queue
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "transaction_type": "sale",
  "payload": "{\"items\": [{\"product_id\": 1, \"quantity\": 2}]}"
}
```

### Get Sync Queue

```http
GET /sync/queue?status_filter=pending
Authorization: Bearer {token}
```

### Process Sync Queue

```http
POST /sync/process
Authorization: Bearer {token}
```

**Response:**

```json
{
  "message": "Sync complete. Processed: 5, Failed: 0",
  "success": true
}
```

---

## Analytics

### Dashboard Analytics

```http
GET /analytics/dashboard?days=30
```

**Response:**

```json
{
  "total_sales": 1250.5,
  "total_transactions": 45,
  "average_sale": 27.79,
  "top_products": [
    {
      "product_id": 1,
      "product_name": "Product Name",
      "quantity_sold": 150,
      "revenue": 450.0
    }
  ],
  "sales_by_category": [
    {
      "category": "Electronics",
      "revenue": 750.0,
      "quantity_sold": 100
    }
  ],
  "daily_sales": [
    {
      "date": "2026-01-15",
      "total_sales": 125.5,
      "transaction_count": 5
    }
  ]
}
```

### Low Stock Report

```http
GET /analytics/low-stock
```

**Response:**

```json
[
  {
    "product_id": 5,
    "name": "Product Name",
    "category": "Category",
    "current_stock": 8,
    "min_stock_level": 10,
    "units_needed": 2
  }
]
```

### Revenue Trend

```http
GET /analytics/revenue-trend?days=30
```

**Response:**

```json
[
  {
    "date": "2026-01-15",
    "revenue": 125.5
  }
]
```

---

## Error Codes

### Common Errors

**400 Bad Request**

- Invalid input data
- Insufficient stock
- Negative inventory

**401 Unauthorized**

- Missing or invalid token
- Token expired

**404 Not Found**

- Product not found
- Sale not found
- Resource doesn't exist

**500 Internal Server Error**

- Database error
- Unexpected server error

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider:

- 100 requests per minute per IP
- 1000 requests per hour per token

---

## Interactive Documentation

Visit `/docs` for interactive API documentation with Swagger UI where you can:

- Test endpoints directly
- See request/response schemas
- Try authentication flow

---

## Client Examples

### Python

```python
import requests

# Login
response = requests.post('http://localhost:8000/api/auth/login', json={'pin': '1234'})
token = response.json()['access_token']

# Create sale
headers = {'Authorization': f'Bearer {token}'}
sale_data = {
    'items': [
        {'product_id': 1, 'quantity': 2}
    ]
}
response = requests.post(
    'http://localhost:8000/api/sales/',
    json=sale_data,
    headers=headers
)
```

### JavaScript

```javascript
// Login
const loginResponse = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ pin: "1234" }),
});
const { access_token } = await loginResponse.json();

// Create sale
const saleResponse = await fetch("/api/sales/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${access_token}`,
  },
  body: JSON.stringify({
    items: [{ product_id: 1, quantity: 2 }],
  }),
});
```

### cURL

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"pin": "1234"}'

# Create sale (replace TOKEN with actual token)
curl -X POST http://localhost:8000/api/sales/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"items": [{"product_id": 1, "quantity": 2}]}'
```

---

**Need help? Check `/docs` for the interactive API documentation!**
