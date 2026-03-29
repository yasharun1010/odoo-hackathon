# Troubleshooting Guide

## Common Issues and Solutions

---

## 🔴 Backend Issues

### Issue: "ModuleNotFoundError: No module named 'flask'"

**Cause:** Dependencies not installed or virtual environment not activated

**Solution:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

---

### Issue: "Address already in use" error on port 5000

**Cause:** Another process is using port 5000

**Solution (Windows):**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

**Solution (Linux/Mac):**
```bash
# Find process
lsof -i :5000

# Kill the process
kill -9 <PID>
```

**Alternative:** Change port in app.py:
```python
app.run(debug=True, host='0.0.0.0', port=5001)  # Use different port
```

---

### Issue: Database errors or "table doesn't exist"

**Cause:** Database not initialized or corrupted

**Solution:**
1. Delete the database file:
```bash
# In backend directory
del reimbursement.db  # Windows
rm reimbursement.db   # Linux/Mac
```

2. Restart the Flask server - tables will be recreated automatically

---

### Issue: Import errors for pytesseract or PIL

**Cause:** OCR libraries not properly installed

**Solution:**
```bash
# Install Tesseract OCR system package
# Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
# Mac:
brew install tesseract

# Linux:
sudo apt-get install tesseract-ocr

# Then reinstall Python packages
pip uninstall pytesseract Pillow
pip install pytesseract==0.3.10 Pillow==10.1.0
```

Note: OCR is optional. The system will use mock mode if unavailable.

---

### Issue: JWT token errors or "Token has expired"

**Cause:** Token expiry or invalid secret key

**Solution:**
1. Check that `JWT_SECRET_KEY` is set in .env
2. Refresh your token by logging in again
3. Clear browser localStorage:
```javascript
localStorage.clear()
```

---

### Issue: CORS errors when frontend tries to connect

**Cause:** CORS not configured or wrong origin

**Solution:**
Check app.py has CORS enabled:
```python
from flask_cors import CORS
CORS(app)
```

For specific origins:
```python
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
```

---

### Issue: File upload fails or receipt not saved

**Cause:** Upload folder doesn't exist or permissions issue

**Solution:**
```bash
# Create uploads directory manually
mkdir uploads
mkdir uploads\receipts
```

Or check app.py creates it:
```python
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
```

---

### Issue: Currency conversion not working

**Cause:** Missing API key or network issue

**Solution:**
1. Get free API key from https://www.exchangerate-api.com/
2. Add to .env:
```env
EXCHANGE_RATE_API_KEY=your_api_key_here
```

The system will use mock rates if API is unavailable (not ideal but functional).

---

## 🔵 Frontend Issues

### Issue: "npm is not recognized as a command"

**Cause:** Node.js not installed

**Solution:**
1. Download and install Node.js from https://nodejs.org/
2. Verify installation:
```bash
node --version
npm --version
```

---

### Issue: "Cannot find module 'react'"

**Cause:** Dependencies not installed

**Solution:**
```bash
cd frontend
npm install
```

---

### Issue: Frontend won't start or "port 3000 already in use"

**Cause:** Another process using port 3000

**Solution (Windows):**
```powershell
# Find process
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

**Alternative:** Change port in vite.config.js:
```javascript
server: {
  port: 3001,  // Use different port
}
```

---

### Issue: "Network Error" or can't connect to backend

**Cause:** Backend not running or wrong API URL

**Solution:**
1. Check backend is running on http://localhost:5000
2. Verify VITE_API_URL in frontend/.env:
```env
VITE_API_URL=http://localhost:5000/api
```

3. Restart frontend after changing .env:
```bash
# Stop frontend (Ctrl+C)
npm run dev
```

---

### Issue: Login doesn't work or "Unauthorized" error

**Cause:** Token not being stored or sent

**Solution:**
1. Check browser console for errors
2. Verify localStorage in DevTools Application tab
3. Clear storage and try again:
```javascript
// In browser console
localStorage.clear()
location.reload()
```

4. Check api.js has correct base URL

---

### Issue: Page is blank or white screen

**Cause:** JavaScript error or failed bundle load

**Solution:**
1. Check browser console for errors (F12)
2. Verify all dependencies installed:
```bash
npm install
```

3. Clear cache and reload:
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

4. Check Vite build:
```bash
npm run build
```

---

### Issue: Styles not loading or Tailwind not working

**Cause:** Tailwind not configured or CSS not imported

**Solution:**
1. Check tailwind.config.js exists
2. Verify index.css has Tailwind directives:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

3. Reinstall Tailwind:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

### Issue: Forms don't submit or buttons don't work

**Cause:** Event handler not attached or validation failing

**Solution:**
1. Check browser console for errors
2. Verify form has onSubmit handler
3. Check for required fields:
```jsx
<input required />
```

4. Test with console.log in handler:
```jsx
const handleSubmit = (e) => {
  e.preventDefault();
  console.log('Form submitted');  // Check if this appears
  // ... rest of code
}
```

---

## 🟡 Authentication Issues

### Issue: Can't sign up - "Email already registered"

**Cause:** Email exists in database

**Solution:**
1. Use different email
2. Or delete existing user from database:
```bash
# Using SQLite CLI
sqlite3 backend/reimbursement.db
DELETE FROM users WHERE email='your@email.com';
.quit
```

---

### Issue: Password reset doesn't work

**Cause:** Admin feature only or user not found

**Solution:**
1. Ensure you're logged in as admin
2. Go to Users page
3. Click "Reset Password" button next to user
4. Enter new password in prompt

---

### Issue: Can't access admin pages

**Cause:** User doesn't have admin role

**Solution:**
1. Check user role in database or after login
2. Only the signup creator is admin by default
3. Admin can promote other users in User Management

---

## 🟢 Expense Issues

### Issue: Expense submission fails

**Cause:** Missing required fields or file too large

**Solution:**
1. Fill all required fields (amount, category, description, date)
2. Check file size < 16MB
3. Supported formats: PDF, PNG, JPG, JPEG
4. Check browser console for validation errors

---

### Issue: Receipt upload doesn't work

**Cause:** File too large or wrong format

**Solution:**
1. Max file size: 16MB
2. Allowed formats: .pdf, .png, .jpg, .jpeg
3. Check network tab in DevTools for upload errors
4. Verify backend UPLOAD_FOLDER exists

---

### Issue: Can't edit or delete expense

**Cause:** Only owner can edit/delete pending expenses

**Solution:**
1. Wait for expense to be in "pending" status
2. Must be the expense owner
3. Once approved/rejected, can't be edited (only deleted by admin)

---

### Issue: Currency conversion shows N/A

**Cause:** Conversion rate not available or expense in company currency

**Solution:**
1. If expense currency = company currency, no conversion needed
2. Check EXCHANGE_RATE_API_KEY is set
3. System uses mock rates if API unavailable

---

## 🟣 Approval Workflow Issues

### Issue: Approvals not showing for manager

**Cause:** No subordinates or approval chain not set

**Solution:**
1. Ensure employees have manager_id set to this manager's ID
2. Check approval rules are configured
3. Verify expense was submitted by subordinate
4. Admin needs to set manager relationships in User Management

---

### Issue: Expense stuck in pending status

**Cause:** Approval chain incomplete or no approvers

**Solution:**
1. Check approval rules configuration
2. Verify all approvers in chain are active users
3. Admin can override stuck approvals
4. Check backend logs for workflow errors

---

### Issue: Rejection doesn't require comment

**Cause:** Validation not enforced

**Solution:**
Frontend enforces this, but backend should too:
```python
# In approval_routes.py
if not data.get('comment') and status == 'rejected':
    return jsonify({'error': 'Comment required for rejection'}), 400
```

---

## 🔧 General Debugging Tips

### Backend Debugging

1. **Check terminal output** for error messages
2. **Enable debug mode** in app.py:
```python
app.run(debug=True)
```

3. **Add print statements:**
```python
print(f"Debug: {variable}")
```

4. **Test endpoints directly:**
```bash
curl http://localhost:5000/
```

5. **Check database:**
```bash
sqlite3 backend/reimbursement.db
.tables
SELECT * FROM users;
.quit
```

---

### Frontend Debugging

1. **Open DevTools** (F12)
2. **Check Console** for errors
3. **Check Network tab** for failed requests
4. **Check Application tab** for localStorage
5. **Use React DevTools** extension

6. **Add console.log:**
```jsx
console.log('State:', formData);
```

7. **Test API directly:**
```javascript
// In browser console
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email: 'test@test.com', password: 'password'})
}).then(r => r.json()).then(console.log)
```

---

## 🛠️ Reset Everything (Nuclear Option)

If all else fails:

### Backend Reset
```bash
cd backend
del reimbursement.db  #或删除数据库
python app.py  # Will recreate database
```

### Frontend Reset
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Complete Fresh Start
```bash
# Delete everything and re-clone or re-download project
# Then follow installation steps from README
```

---

## 📞 Still Having Issues?

1. **Check documentation:**
   - README.md (comprehensive guide)
   - QUICKSTART.md (getting started)
   - API_TESTING.md (API testing)
   - PROJECT_SUMMARY.md (architecture details)

2. **Common commands:**
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py

# Frontend
cd frontend
npm install
npm run dev
```

3. **Verify versions:**
```bash
python --version  # Should be 3.8+
npm --version     # Should be 8+
node --version    # Should be 16+
```

---

## 🎯 Prevention Tips

1. **Always use .env files** - Don't hardcode secrets
2. **Activate virtual environment** before running backend
3. **Install dependencies** before starting
4. **Check both terminals** when debugging
5. **Clear browser cache** regularly
6. **Use browser DevTools** Network tab
7. **Read error messages** carefully - they usually tell you what's wrong
8. **Google error messages** - someone else has had the same issue

---

**Remember:** 90% of issues are solved by:
1. Restarting the servers
2. Clearing cache/storage
3. Checking if dependencies are installed
4. Reading the error message carefully

**Happy debugging! 🔧**
