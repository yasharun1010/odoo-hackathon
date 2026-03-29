# API Testing Guide

## Test the API with cURL or Postman

### 1. Health Check

```bash
curl http://localhost:5000/
```

Expected response:
```json
{
  "message": "Reimbursement Management System API",
  "version": "1.0.0"
}
```

---

### 2. Sign Up (Create Company + Admin)

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "company_name": "Acme Corp",
    "country": "United States"
  }'
```

Response will include:
- `access_token`: JWT access token
- `refresh_token`: JWT refresh token
- `user`: User object
- `company`: Company object

Save the `access_token` for subsequent requests.

---

### 3. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

---

### 4. Get Current User Info

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 5. Create a New User (Admin Only)

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "password123",
    "role": "manager",
    "manager_id": null
  }'
```

Roles: `admin`, `manager`, `employee`

---

### 6. Get All Users (Admin Only)

```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 7. Submit an Expense

For file upload, use FormData:

```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "amount=100.50" \
  -F "currency=USD" \
  -F "category=travel" \
  -F "description=Client meeting dinner" \
  -F "expense_date=2024-01-15" \
  -F "receipt=@/path/to/receipt.pdf"
```

Without file:

```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "amount": 100.50,
    "currency": "USD",
    "category": "travel",
    "description": "Client meeting dinner",
    "expense_date": "2024-01-15"
  }'
```

---

### 8. Get My Expenses

```bash
curl -X GET http://localhost:5000/api/expenses/my \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Filter by status:
```bash
curl -X GET "http://localhost:5000/api/expenses/my?status=pending" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 9. Get Company Expenses (Manager/Admin Only)

```bash
curl -X GET http://localhost:5000/api/expenses/company \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 10. Create Approval Rule (Admin Only)

```bash
curl -X POST http://localhost:5000/api/approvals/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "rule_type": "percentage",
    "category": "travel",
    "percentage": 60.0,
    "is_sequential": true,
    "description": "Travel expenses need 60% approval"
  }'
```

---

### 11. Get Pending Approvals

```bash
curl -X GET http://localhost:5000/api/approvals/pending \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 12. Approve an Expense

```bash
curl -X POST http://localhost:5000/api/approvals/1/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "comment": "Looks good!"
  }'
```

---

### 13. Reject an Expense

```bash
curl -X POST http://localhost:5000/api/approvals/1/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "comment": "Missing receipt"
  }'
```

---

## Using Postman

### Setup

1. **Create a new Collection**: "Reimbursement API"

2. **Add Collection Variable**:
   - Name: `base_url`
   - Value: `http://localhost:5000/api`
   - Current value: `http://localhost:5000/api`

3. **Add Auth Token Variable**:
   - Name: `access_token`
   - Value: (will be set after login)

4. **Add Authorization** to collection:
   - Type: `Bearer Token`
   - Token: `{{access_token}}`

### Example Requests in Postman

#### Signup Request
- Method: `POST`
- URL: `{{base_url}}/auth/signup`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "company_name": "Acme Corp",
  "country": "United States"
}
```

#### Tests Script (to auto-save token)
In the Tests tab of signup/login request:
```javascript
if (pm.response.code === 200 || pm.response.code === 201) {
    const jsonData = pm.response.json();
    pm.collectionVariables.set('access_token', jsonData.access_token);
    console.log('Access token saved:', jsonData.access_token);
}
```

---

## Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Sample Test Workflow

1. **Sign up** → Save token
2. **Create manager user**
3. **Create employee user** (reports to manager)
4. **Create approval rule**
5. **Login as employee** → Get employee token
6. **Submit expense** as employee
7. **Login as manager** → Get manager token
8. **View pending approvals**
9. **Approve expense**
10. **Check expense status** → Should be approved

---

## Python Test Script

Here's a simple Python script to test the API:

```python
import requests

BASE_URL = 'http://localhost:5000/api'

# 1. Sign up
signup_data = {
    'name': 'Test Admin',
    'email': 'admin@test.com',
    'password': 'password123',
    'company_name': 'Test Corp',
    'country': 'United States'
}

response = requests.post(f'{BASE_URL}/auth/signup', json=signup_data)
print('Signup:', response.status_code)

token = response.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

# 2. Create user
user_data = {
    'name': 'Test Employee',
    'email': 'employee@test.com',
    'password': 'password123',
    'role': 'employee',
    'manager_id': None
}

response = requests.post(f'{BASE_URL}/users/', json=user_data, headers=headers)
print('Create user:', response.status_code)

# 3. Submit expense
expense_data = {
    'amount': 100.50,
    'currency': 'USD',
    'category': 'meals',
    'description': 'Team lunch',
    'expense_date': '2024-01-15'
}

response = requests.post(f'{BASE_URL}/expenses/', json=expense_data, headers=headers)
print('Submit expense:', response.status_code)
expense_id = response.json()['expense']['id']

# 4. Get expenses
response = requests.get(f'{BASE_URL}/expenses/my', headers=headers)
print('Get expenses:', response.status_code)
print(response.json())
```

---

## Debugging Tips

1. **Check backend terminal** for error logs
2. **Use browser DevTools** Network tab for frontend requests
3. **Verify tokens** are being sent correctly
4. **Check CORS** if getting cross-origin errors
5. **Validate JSON** syntax in requests

---

Happy testing! 🧪
