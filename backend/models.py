from datetime import datetime, date

from sqlalchemy import UniqueConstraint

from .extensions import db


class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    country = db.Column(db.String(120), nullable=True)
    currency = db.Column(db.String(3), nullable=False, default="USD")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    users = db.relationship("User", backref="company", lazy=True)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("company.id"), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(40), nullable=False, default="employee")
    manager_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    is_manager_approver = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    manager = db.relationship("User", remote_side=[id], uselist=False)


class ApprovalStep(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("company.id"), nullable=False)
    step_order = db.Column(db.Integer, nullable=False)
    role = db.Column(db.String(40), nullable=False)

    __table_args__ = (UniqueConstraint("company_id", "step_order"),)


class ApprovalRule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("company.id"), nullable=False)
    rule_type = db.Column(db.String(40), nullable=False, default="none")
    threshold_percentage = db.Column(db.Integer, nullable=True)
    specific_approver_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)

    specific_approver = db.relationship("User", foreign_keys=[specific_approver_id])


class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("company.id"), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False)
    category = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(500), nullable=True)
    expense_date = db.Column(db.Date, nullable=False, default=date.today)
    status = db.Column(db.String(20), nullable=False, default="pending")
    current_step = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    employee = db.relationship("User", foreign_keys=[employee_id])


class ExpenseApproval(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    expense_id = db.Column(db.Integer, db.ForeignKey("expense.id"), nullable=False)
    step_order = db.Column(db.Integer, nullable=False)
    approver_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending")
    comment = db.Column(db.String(500), nullable=True)
    decided_at = db.Column(db.DateTime, nullable=True)

    approver = db.relationship("User", foreign_keys=[approver_id])
    expense = db.relationship("Expense", foreign_keys=[expense_id])
