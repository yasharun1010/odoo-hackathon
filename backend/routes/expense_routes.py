from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
from datetime import datetime
from models import db, Expense, Approval
from decorators import jwt_required, get_current_user_obj
from services.currency_service import CurrencyService
from services.ocr_service import OCRService
from services.approval_workflow_service import ApprovalWorkflowService

expense_bp = Blueprint('expenses', __name__)

def parse_expense_date(date_value):
    """Parse expense date from supported input formats."""
    if not date_value:
        return None

    date_value = str(date_value).strip()
    for fmt in ('%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y'):
        try:
            return datetime.strptime(date_value, fmt).date()
        except ValueError:
            continue
    return None


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']


@expense_bp.route('/', methods=['POST'])
@jwt_required()
def create_expense():
    """
    Submit a new expense
    
    Form data:
    - amount: float
    - currency: str (e.g., 'USD')
    - category: str
    - description: str
    - expense_date: str (YYYY-MM-DD)
    - receipt: file (optional)
    """
    current_user = get_current_user_obj()
    
    # Get form data
    amount = request.form.get('amount', type=float)
    currency = str(request.form.get('currency', 'USD')).strip().upper()
    category = str(request.form.get('category', '')).strip()
    description = str(request.form.get('description', '')).strip()
    expense_date_str = str(request.form.get('expense_date', '')).strip()
    
    # Validate required fields
    if not all([amount, currency, category, description, expense_date_str]):
        return jsonify({
            'error': 'Missing required fields: amount, currency, category, description, expense_date'
        }), 400
    
    expense_date = parse_expense_date(expense_date_str)
    if not expense_date:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD or DD-MM-YYYY'}), 400
    
    # Convert amount to company currency
    company_currency = current_user.company.currency
    conversion = CurrencyService().convert_amount(amount, currency, company_currency)
    
    # Process receipt file if provided
    receipt_path = None
    ocr_data = None
    
    if 'receipt' in request.files:
        file = request.files['receipt']
        if file and file.filename != '' and allowed_file(file.filename):
            # Save file
            filename = secure_filename(f"{datetime.now().timestamp()}_{file.filename}")
            upload_folder = current_app.config['UPLOAD_FOLDER']
            os.makedirs(upload_folder, exist_ok=True)
            receipt_path = os.path.join(upload_folder, filename)
            file.save(receipt_path)
            
            # Extract data using OCR
            ocr_service = OCRService()
            ocr_data = ocr_service.extract_data_from_receipt(receipt_path)
            
            # If OCR extracted an amount and user didn't provide one, use OCR amount
            if ocr_data.get('amount') and not amount:
                amount = ocr_data['amount']
                conversion = CurrencyService().convert_amount(amount, currency, company_currency)
    
    try:
        expense = Expense(
            user_id=current_user.id,
            company_id=current_user.company_id,
            amount=amount,
            currency=currency,
            converted_amount=conversion['converted_amount'] if conversion else None,
            category=category,
            description=description,
            expense_date=expense_date,
            receipt_path=receipt_path,
            status='pending',
            ocr_data=ocr_data
        )
        db.session.add(expense)
        db.session.flush()  # Get expense ID
        
        # Create approval workflow
        workflow_service = ApprovalWorkflowService()
        workflow_service.create_approvals_for_expense(expense)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Expense submitted successfully',
            'expense': expense.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@expense_bp.route('/my', methods=['GET'])
@jwt_required()
def get_my_expenses():
    """Get current user's expenses"""
    current_user = get_current_user_obj()
    
    # Get query parameters for filtering
    status = request.args.get('status')
    category = request.args.get('category')
    
    # Build query
    query = Expense.query.filter_by(user_id=current_user.id)
    
    if status:
        query = query.filter_by(status=status)
    
    if category:
        query = query.filter_by(category=category)
    
    # Order by created_at descending
    expenses = query.order_by(Expense.created_at.desc()).all()
    
    return jsonify({
        'expenses': [expense.to_dict() for expense in expenses]
    }), 200


@expense_bp.route('/<int:expense_id>', methods=['GET'])
@jwt_required()
def get_expense(expense_id):
    """Get specific expense details"""
    current_user = get_current_user_obj()
    
    expense = Expense.query.filter_by(id=expense_id).first()
    if not expense:
        return jsonify({'error': 'Expense not found'}), 404
    
    # Check permission: owner, manager, or admin
    if (expense.user_id != current_user.id and 
        current_user.role not in ['admin', 'manager']):
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify({
        'expense': expense.to_dict()
    }), 200


@expense_bp.route('/<int:expense_id>', methods=['PUT'])
@jwt_required()
def update_expense(expense_id):
    """Update expense (only if pending and owner)"""
    current_user = get_current_user_obj()
    
    expense = Expense.query.filter_by(id=expense_id).first()
    if not expense:
        return jsonify({'error': 'Expense not found'}), 404
    
    # Only owner can update, and only if pending
    if expense.user_id != current_user.id:
        return jsonify({'error': 'Only expense owner can update'}), 403
    
    if expense.status != 'pending':
        return jsonify({'error': 'Cannot update expense that is already approved/rejected'}), 400
    
    data = request.get_json()
    
    # Update fields
    if data.get('amount'):
        expense.amount = data['amount']
        # Recalculate conversion
        conversion = CurrencyService().convert_amount(
            data['amount'], 
            expense.currency, 
            current_user.company.currency
        )
        expense.converted_amount = conversion['converted_amount']
    
    if data.get('description'):
        expense.description = data['description']
    
    if data.get('category'):
        expense.category = data['category']
    
    if data.get('expense_date'):
        try:
            expense.expense_date = datetime.strptime(data['expense_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Expense updated successfully',
            'expense': expense.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@expense_bp.route('/<int:expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    """Delete expense (only if pending and owner)"""
    current_user = get_current_user_obj()
    
    expense = Expense.query.filter_by(id=expense_id).first()
    if not expense:
        return jsonify({'error': 'Expense not found'}), 404
    
    # Only owner can delete, and only if pending
    if expense.user_id != current_user.id:
        return jsonify({'error': 'Only expense owner can delete'}), 403
    
    if expense.status != 'pending':
        return jsonify({'error': 'Cannot delete expense that is already approved/rejected'}), 400
    
    try:
        # Delete receipt file if exists
        if expense.receipt_path and os.path.exists(expense.receipt_path):
            os.remove(expense.receipt_path)
        
        db.session.delete(expense)
        db.session.commit()
        
        return jsonify({
            'message': 'Expense deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@expense_bp.route('/company', methods=['GET'])
@jwt_required()
def get_company_expenses():
    """Get all expenses for the company (Admin/Manager only)"""
    current_user = get_current_user_obj()
    
    if current_user.role not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get query parameters
    status = request.args.get('status')
    category = request.args.get('category')
    user_id = request.args.get('user_id', type=int)
    
    # Build query
    query = Expense.query.filter_by(company_id=current_user.company_id)
    
    if status:
        query = query.filter_by(status=status)
    
    if category:
        query = query.filter_by(category=category)
    
    if user_id:
        query = query.filter_by(user_id=user_id)
    
    # Order by created_at descending
    expenses = query.order_by(Expense.created_at.desc()).all()
    
    return jsonify({
        'expenses': [expense.to_dict() for expense in expenses]
    }), 200
