# odoo-hackathon
# ?? Expense Management System (Multi-Level Approval SaaS)

A scalable expense management system designed to automate reimbursement workflows with multi-level and conditional approvals.

---

## ?? Problem Statement

Manual expense reimbursement processes are:

* Time-consuming ?
* Error-prone ?
* Lack transparency ??

This system solves these issues with automation, structured approval workflows, and smart rules.

---

## ? Features

### ?? Authentication & User Management

* Company auto-created on signup
* Role-based access:

  * Admin
  * Manager
  * Employee
* Manager hierarchy assignment

---

### ?? Expense Submission

* Submit expenses with:

  * Amount (multi-currency)
  * Category
  * Description
  * Date
* OCR-based receipt scanning (auto-fill fields)
* Track status: Approved / Rejected / Pending

---

### ? Approval Workflow

* Multi-level approval system
* Custom approval sequences:

  * Manager ? Finance ? Director
* Comments on approval/rejection
* Auto-forwarding to next approver

---

### ?? Conditional Approval Rules

* Percentage-based approval (e.g., 60%)
* Specific approver override (e.g., CFO)
* Hybrid rules (60% OR CFO approval)

---

### ?? Role Permissions

| Role     | Permissions                                            |
| -------- | ------------------------------------------------------ |
| Admin    | Manage users, roles, approval rules, view all expenses |
| Manager  | Approve/reject, view team expenses                     |
| Employee | Submit expenses, view own history                      |

---

### ?? OCR Integration

* Auto-extract:

  * Amount
  * Date
  * Merchant name
  * Category

---

## ??? Tech Stack

### Frontend

* React.js (Vite)
* Custom CSS

### Backend

* Flask (Python)
* SQLAlchemy
* Flask-JWT-Extended

### Database

* SQLite (default)
* PostgreSQL (optional)

### APIs

* Country & Currency:  https://restcountries.com/v3.1/all?fields=name,currencies
* Currency Conversion:  https://api.exchangerate-api.com/v4/latest/{BASE_CURRENCY}

### Other Tools

* Tesseract.js (OCR)
* Cloudinary / AWS S3 (file uploads)
* JWT Authentication

---

## ??? System Design Highlights

* Role-based access control (RBAC)
* Event-driven approval workflow
* Modular rule engine for conditional approvals
* Multi-currency support

---

## ?? Installation

```bash
# Clone repo
git clone https://github.com/yasharun1010/odoo-hackathon.git

# Backend setup (Flask)
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
cd ..
python -m backend.app

# Frontend setup (React)
cd frontend
npm install
npm run dev
```

## Exchange Rate API

The backend exposes a simple exchange-rate endpoint that proxies data from
https://api.exchangerate-api.com:

GET /api/exchange-rate?base=USD&symbols=INR,EUR

Query params:
* base: 3-letter currency code (default USD)
* symbols: comma-separated list of target currencies (optional)

The response includes the requested rates, missing symbols (if any), and
whether the data came from cache.

## ????? Author

Tejasvi 

---

## ? Contribute

Pull requests are welcome!








