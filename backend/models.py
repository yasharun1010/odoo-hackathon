from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class Company(db.Model):
    """Company model - represents a company/organization"""
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    currency = db.Column(db.String(3), nullable=False)  # ISO currency code (USD, EUR, etc.)
    country = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    users = db.relationship('User', backref='company', lazy=True, cascade='all, delete-orphan')
    expenses = db.relationship('Expense', backref='company', lazy=True, cascade='all, delete-orphan')
    approval_rules = db.relationship('ApprovalRule', backref='company', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'currency': self.currency,
            'country': self.country,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class User(db.Model):
    """User model - supports Admin, Manager, and Employee roles"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # admin, manager, employee
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    manager_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    subordinates = db.relationship('User', backref=db.backref('manager', remote_side=[id]), lazy=True)
    expenses = db.relationship('Expense', backref='employee', lazy=True, cascade='all, delete-orphan')
    approvals = db.relationship('Approval', backref='approver', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_details=False):
        data = {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'company_id': self.company_id,
            'manager_id': self.manager_id,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_details:
            data['subordinates'] = [s.to_dict() for s in self.subordinates]
        return data


class Expense(db.Model):
    """Expense model - represents an expense reimbursement request"""
    __tablename__ = 'expenses'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), nullable=False)  # Currency of the expense
    converted_amount = db.Column(db.Float, nullable=True)  # Amount in company currency
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    expense_date = db.Column(db.Date, nullable=False)
    receipt_path = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected, draft
    ocr_data = db.Column(db.JSON, nullable=True)  # Store OCR extracted data
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    approvals = db.relationship('Approval', backref='expense', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'employee_name': self.employee.name if self.employee else None,
            'company_id': self.company_id,
            'amount': self.amount,
            'currency': self.currency,
            'converted_amount': self.converted_amount,
            'category': self.category,
            'description': self.description,
            'expense_date': self.expense_date.isoformat() if self.expense_date else None,
            'receipt_path': self.receipt_path,
            'status': self.status,
            'ocr_data': self.ocr_data,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'approvals': [a.to_dict() for a in self.approvals]
        }


class Approval(db.Model):
    """Approval model - tracks approval workflow for expenses"""
    __tablename__ = 'approvals'
    
    id = db.Column(db.Integer, primary_key=True)
    expense_id = db.Column(db.Integer, db.ForeignKey('expenses.id'), nullable=False)
    approver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    step = db.Column(db.Integer, nullable=False)  # Approval step number
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'expense_id': self.expense_id,
            'approver_id': self.approver_id,
            'approver_name': self.approver.name if self.approver else None,
            'step': self.step,
            'status': self.status,
            'comment': self.comment,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class ApprovalRule(db.Model):
    """Approval Rule model - defines conditional approval rules"""
    __tablename__ = 'approval_rules'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    rule_type = db.Column(db.String(50), nullable=False)  # percentage, specific_approver, hybrid
    category = db.Column(db.String(50), nullable=True)  # Expense category this rule applies to
    percentage = db.Column(db.Float, nullable=True)  # Required approval percentage (e.g., 60.0)
    specific_approver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    specific_approver = db.relationship('User', foreign_keys=[specific_approver_id])
    min_approvers_required = db.Column(db.Integer, nullable=True)  # Minimum number of approvers
    is_sequential = db.Column(db.Boolean, default=True)  # True=sequential, False=parallel
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Many-to-many relationship with approvers
    approvers = db.relationship('User', secondary='rule_approvers', backref='rules')
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'rule_type': self.rule_type,
            'category': self.category,
            'percentage': self.percentage,
            'specific_approver_id': self.specific_approver_id,
            'specific_approver_name': self.specific_approver.name if self.specific_approver else None,
            'min_approvers_required': self.min_approvers_required,
            'is_sequential': self.is_sequential,
            'description': self.description,
            'is_active': self.is_active,
            'approvers': [a.to_dict() for a in self.approvers]
        }


# Association table for ApprovalRule and User many-to-many relationship
rule_approvers = db.Table('rule_approvers',
    db.Column('rule_id', db.Integer, db.ForeignKey('approval_rules.id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True)
)
