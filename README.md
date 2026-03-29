# Reimbursement Management System

A complete full-stack web application for managing employee expense reimbursements with multi-level approval workflows.

##  Features

### Core Functionality
- **JWT-based Authentication** - Secure login/signup system
- **Role-based Access Control** - Admin, Manager, and Employee roles
- **Company Setup** - Multi-company support with currency configuration
- **Expense Management** - Submit, track, and manage expense claims
- **Multi-level Approval Workflow** - Configurable approval chains
- **Conditional Approval Rules** - Percentage-based, specific approver, or hybrid rules
- **Currency Conversion** - Real-time conversion to company base currency
- **OCR Support** - Receipt scanning for automatic data extraction
- **File Upload** - Attach receipts (PDF, images)
- **Responsive UI** - Clean, modern interface built with Tailwind CSS

### Technical Features
- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Flask + Flask-RESTful + SQLAlchemy
- Database: SQLite (easily switchable to PostgreSQL/MySQL)
- API: RESTful architecture
- State Management: React Context API
- HTTP Client: Axios with interceptors
- Notifications: React Toastify

## 📁 Project Structure

```
yo/
├── backend/
│   ├── app.py                 # Flask application entry point
│   ├── config.py              # Configuration management
│   ├── decorators.py          # Authentication decorators
│   ├── models.py              # SQLAlchemy models
│   ├── requirements.txt       # Python dependencies
│   ├── routes/
│   │   ├── auth_routes.py     # Authentication endpoints
│   │   ├── user_routes.py     # User management endpoints
│   │   ├── expense_routes.py  # Expense CRUD endpoints
│   │   └── approval_routes.py # Approval workflow endpoints
│   ├── services/
│   │   ├── currency_service.py      # Currency conversion
│   │   ├── ocr_service.py           # Receipt OCR processing
│   │   └── approval_workflow_service.py  # Approval logic
│   └── uploads/             # Uploaded receipts storage
│
└── frontend/
    ├── src/
    │   ├── App.jsx          # Main app component with routing
    │   ├── main.jsx         # React entry point
    │   ├── index.css        # Global styles + Tailwind
    │   ├── components/
    │   │   ├── Layout.jsx           # App layout with navigation
    │   │   ├── ProtectedRoute.jsx   # Route guard
    │   │   ├── Button.jsx           # Reusable button
    │   │   ├── Input.jsx            # Form input
    │   │   ├── Select.jsx           # Dropdown select
    │   │   ├── Modal.jsx            # Modal dialog
    │   │   ├── Badge.jsx            # Status badge
    │   │   └── Spinner.jsx          # Loading spinner
    │   ├── context/
    │   │   └── AuthContext.jsx      # Authentication context
    │   ├── pages/
    │   │   ├── Login.jsx            # Login page
    │   │   ├── Signup.jsx           # Company signup
    │   │   ├── Dashboard.jsx        # Role-specific dashboard
    │   │   ├── SubmitExpense.jsx    # Expense submission form
    │   │   ├── ExpenseList.jsx      # Expense history
    │   │   ├── ApprovalsDashboard.jsx # Manager approval queue
    │   │   ├── UserManagement.jsx   # Admin user management
    │   │   └── ApprovalRules.jsx    # Rule configuration
    │   └── services/
    │       └── api.js         # Axios API client
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── index.html
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- pip

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file (copy from `.env.example`):
```bash
FLASK_ENV=development
SECRET_KEY=your-secret-key-change-this
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=sqlite:///reimbursement.db
EXCHANGE_RATE_API_KEY=your-api-key-here  # Optional
```

5. Run the Flask server:
```bash
python app.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
VITE_API_URL=http://localhost:5000/api
```

4. Start development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/signup`
Create new company and admin user
```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "password": "securepassword",
  "company_name": "Acme Corp",
  "country": "United States"
}
```

#### POST `/api/auth/login`
User login
```json
{
  "email": "john@company.com",
  "password": "securepassword"
}
```

Response includes JWT tokens and user info.

### User Management Endpoints (Admin Only)

#### GET `/api/users/`
Get all users in company

#### POST `/api/users/`
Create new user
```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "password": "password123",
  "role": "manager",
  "manager_id": 1
}
```

#### PUT `/api/users/:id`
Update user details

#### POST `/api/users/:id/reset-password`
Reset user password

### Expense Endpoints

#### POST `/api/expenses/`
Submit new expense (multipart/form-data)
```
amount: 100.50
currency: USD
category: travel
description: Client meeting dinner
expense_date: 2024-01-15
receipt: [file]
```

#### GET `/api/expenses/my`
Get current user's expenses

#### GET `/api/expenses/company`
Get all company expenses (Admin/Manager)

#### PUT `/api/expenses/:id`
Update expense (only if pending)

#### DELETE `/api/expenses/:id`
Delete expense (only if pending)

### Approval Endpoints

#### GET `/api/approvals/pending`
Get pending approvals for current user

#### POST `/api/expenses/:id/approve`
Approve expense
```json
{
  "comment": "Looks good!"
}
```

#### POST `/api/expenses/:id/reject`
Reject expense
```json
{
  "comment": "Missing receipt"
}
```

### Approval Rules Endpoints (Admin Only)

#### GET `/api/approvals/rules`
Get all approval rules

#### POST `/api/approvals/rules`
Create approval rule
```json
{
  "rule_type": "percentage",
  "category": "travel",
  "percentage": 60.0,
  "is_sequential": true,
  "description": "Travel expenses need 60% approval"
}
```

#### PUT `/api/approvals/rules/:id`
Update rule

#### DELETE `/api/approvals/rules/:id`
Delete rule (soft delete)

## 🎯 Usage Guide

### 1. Getting Started

1. **Sign Up**: Create your company account
   - Go to signup page
   - Enter your details and company name
   - Select your country (auto-detects currency)
   - You'll be logged in as admin

2. **Add Users**: As admin, add employees and managers
   - Go to Users page
   - Click "Add User"
   - Assign roles (Employee, Manager, Admin)
   - Set manager relationships

3. **Configure Approval Rules**: Set up your workflow
   - Go to Approval Rules page
   - Create rules for different categories
   - Choose rule type (Percentage, Specific Approver, Hybrid)
   - Set sequential or parallel approval

### 2. Submitting Expenses (Employees)

1. Click "Submit Expense" or "+ New Expense"
2. Fill in details:
   - Amount and currency
   - Category
   - Description
   - Date
   - Upload receipt (optional but recommended)
3. Submit - expense goes into approval workflow

### 3. Approving Expenses (Managers/Admins)

1. View pending approvals in dashboard or Approvals page
2. Review expense details and receipt
3. Approve or reject with comments
4. Expense moves through approval chain

### 4. Tracking Expenses

All users can view their expense history:
- **Pending**: Awaiting approval
- **Approved**: Fully approved, will be reimbursed
- **Rejected**: Denied (see comments for reason)

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: Bcrypt for password storage
- **Role-based Access**: Different permissions per role
- **Token Refresh**: Automatic token refresh mechanism
- **Input Validation**: Server-side validation on all inputs
- **CORS Protection**: Configured for production

## 💡 Advanced Features

### Currency Conversion
- Supports 10+ major currencies
- Real-time conversion using exchange rate API
- Stores both original and converted amounts
- Falls back to mock rates if API unavailable

### OCR Processing
- Extracts data from receipt images/PDFs
- Auto-fills amount, date, description
- Supports multiple image formats
- Graceful fallback if OCR fails

### Approval Workflow Engine
- **Sequential**: One approver after another
- **Parallel**: All approvers notified simultaneously
- **Conditional Rules**:
  - Percentage-based (e.g., 60% must approve)
  - Specific approver (e.g., CFO approval auto-approves)
  - Hybrid (either percentage OR specific person)

## 🧪 Testing

### Backend Testing
```bash
# Run pytest (if tests are added)
pytest
```

### Frontend Testing
```bash
# Run tests (if configured)
npm test
```

## 🚀 Deployment

### Backend (Production)

1. Set environment variables:
```bash
FLASK_ENV=production
SECRET_KEY=<strong-random-key>
JWT_SECRET_KEY=<strong-random-key>
DATABASE_URL=postgresql://user:pass@host:5432/db
```

2. Use a production WSGI server:
```bash
gunicorn app:app
```

### Frontend (Production)

1. Build for production:
```bash
npm run build
```

2. Serve the build folder with a static server (Nginx, Apache, etc.)

## 📝 Environment Variables

### Backend (.env)
```env
FLASK_ENV=development
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
DATABASE_URL=sqlite:///reimbursement.db
EXCHANGE_RATE_API_KEY=your-api-key
MAX_CONTENT_LENGTH=16777216
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is open source and available under the MIT License.

##  Troubleshooting

### Common Issues

**Backend won't start:**
- Check if virtual environment is activated
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Verify port 5000 is not in use

**Frontend can't connect to backend:**
- Check VITE_API_URL in .env
- Ensure backend is running
- Check CORS settings in app.py

**Database errors:**
- Delete reimbursement.db and restart
- Check database URL format

**Import errors:**
- For pytesseract: Install Tesseract OCR
- For PyPDF2: Ensure it's in requirements.txt

## 📞 Support

For issues or questions:
1. Check the documentation above
2. Review error logs in browser console
3. Check backend terminal for server errors
4. Verify API requests in Network tab

---

**Built with ❤️ using React, Flask, and Tailwind CSS**
