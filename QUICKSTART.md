# Quick Start Guide

## Getting Started in 5 Minutes

### Step 1: Start the Backend Server

Open a terminal and run:
```bash
cd backend
python app.py
```

The backend will start on `http://localhost:5000`

### Step 2: Start the Frontend Server

Open another terminal and run:
```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

### Step 3: Access the Application

Open your browser and navigate to: **http://localhost:3000**

---

## First Time Setup

### 1. Create Your Company Account

1. Click "Sign Up" on the login page
2. Fill in the form:
   - **Your Name**: John Doe
   - **Email**: john@yourcompany.com
   - **Password**: Create a secure password
   - **Company Name**: Your Company Ltd.
   - **Country**: Select from dropdown (auto-detects currency)
3. Click "Create Account"
4. You'll be logged in as **Admin**

### 2. Add Employees and Managers

As an admin:

1. Go to **Users** tab
2. Click **+ Add User**
3. Fill in user details:
   - Name, Email, Password
   - **Role**: Choose Employee, Manager, or Admin
   - **Manager**: Select if this user reports to someone
4. Click "Create User"

**Example Hierarchy:**
- CEO (Admin) → No manager
- Department Head (Manager) → Reports to CEO
- Employee → Reports to Department Head

### 3. Configure Approval Rules

Set up your expense approval workflow:

1. Go to **Approval Rules** tab
2. Click **+ Add Rule**
3. Choose rule type:
   - **Percentage**: Requires X% of approvers to approve
   - **Specific Approver**: Requires specific person's approval
   - **Hybrid**: Either percentage OR specific person
4. Select category (or leave blank for default)
5. Configure settings:
   - Percentage (e.g., 60%)
   - Sequential vs Parallel approval
6. Click "Create Rule"

**Example Rules:**
- Travel expenses: 60% approval required
- Software purchases: CFO approval mandatory
- Meals: Sequential approval (Manager → Finance → Director)

---

## Using the System

### As an Employee

#### Submit an Expense

1. Click **+ Submit Expense** or go to Expenses → New
2. Fill in the form:
   - **Amount**: How much did you spend?
   - **Currency**: What currency did you use?
   - **Category**: What type of expense?
   - **Date**: When did you spend it?
   - **Description**: What was it for?
   - **Receipt**: Upload a photo/PDF (optional but recommended)
3. Click "Submit Expense"
4. Track status in **Expenses** page

#### View Your Expenses

- **Pending**: Awaiting approval
- **Approved**: Fully approved
- **Rejected**: Denied (check comments for reason)

---

### As a Manager

#### Approve/Reject Expenses

1. Go to **Approvals** tab
2. See all pending approvals
3. Review expense details:
   - Employee name
   - Amount (converted to company currency)
   - Description and receipt
4. Click **Approve** or **Reject**
5. Add optional comment (required for rejection)
6. Expense moves to next approver or gets final status

---

### As an Admin

#### Manage Users

- Add/edit/delete employees and managers
- Reset passwords
- Assign reporting relationships
- Activate/deactivate accounts

#### Configure Approval Workflow

- Create approval rules by category
- Set percentage requirements
- Designate specific approvers
- Choose sequential or parallel approval

#### Override Decisions

- Admin can override any approval/rejection
- View all company expenses
- Generate reports

---

## Example Workflow

### Scenario: Employee submits $500 travel expense

**Day 1:**
1. Sarah (Employee) submits $500 dinner expense with client
   - Category: Meals & Entertainment
   - Currency: USD
   - Uploads receipt photo
   - Status: Pending

2. System automatically routes to her manager (John)

**Day 2:**
3. John (Manager) reviews and approves
   - Adds comment: "Legitimate client meeting"
   - Status: Still Pending (needs more approvals)

4. Routes to Finance Manager (Lisa)

**Day 3:**
5. Lisa (Finance) approves
   - Checks budget allocation
   - Status: Approved ✅

6. Sarah gets notification: Expense approved for reimbursement

---

## Features at a Glance

### Multi-Currency Support
- Submit expenses in any currency
- Auto-converted to company's base currency
- Real-time exchange rates
- Shows both original and converted amounts

### Receipt OCR
- Upload receipt images or PDFs
- Automatic data extraction
- Pre-fills amount, date, merchant
- Manual override available

### Flexible Approval Chains
- **Sequential**: One after another (Manager → Finance → CEO)
- **Parallel**: All approvers notified simultaneously
- **Conditional**: Based on amount, category, or other rules

### Smart Notifications
- Toast notifications for all actions
- Success/error feedback
- Loading states

---

## Tips & Best Practices

### For Employees
✅ Always upload receipts - faster approval
✅ Add detailed descriptions - reduces back-and-forth
✅ Submit promptly - don't wait until month-end
✅ Check status regularly - respond to rejections quickly

### For Managers
✅ Review expenses within 48 hours
✅ Provide clear rejection reasons
✅ Set up delegation when on vacation
✅ Monitor team spending patterns

### For Admins
✅ Configure rules before adding users
✅ Start with simple approval chains
✅ Train managers on their responsibilities
✅ Audit expenses monthly
✅ Keep employee hierarchy updated

---

## Troubleshooting

### Can't Login?
- Check email/password spelling
- Ensure account is active (contact admin)
- Try password reset

### Expense Won't Submit?
- Check all required fields are filled
- Receipt file size < 16MB
- Internet connection stable

### Approval Not Working?
- Check approval rules configuration
- Verify manager assignments
- Ensure you have permission (manager/admin only)

### Currency Conversion Wrong?
- Exchange rates update daily
- Check if API key is configured (optional)
- Falls back to mock rates if unavailable

---

## Keyboard Shortcuts

- `Ctrl + K`: Quick search (coming soon)
- `Esc`: Close modals
- `Enter`: Submit forms

---

## Need Help?

1. Check the full README.md for detailed documentation
2. Review error messages in browser console
3. Contact your system administrator
4. Check API logs in backend terminal

---

**Happy expense tracking! 🎉**
