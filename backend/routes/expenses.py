from datetime import datetime, date
from decimal import Decimal, InvalidOperation

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models import ApprovalStep, Expense, ExpenseApproval, User
from ..utils.currency import normalize_currency

expenses_bp = Blueprint("expenses", __name__, url_prefix="/api/expenses")


def build_approvals(expense: Expense, employee: User) -> list[ExpenseApproval]:
    steps: list[ExpenseApproval] = []
    step_order = 1

    if employee.manager_id and employee.manager and employee.manager.is_manager_approver:
        steps.append(
            ExpenseApproval(
                expense_id=expense.id,
                step_order=step_order,
                approver_id=employee.manager_id,
            )
        )
        step_order += 1

    company_steps = (
        ApprovalStep.query.filter_by(company_id=employee.company_id)
        .order_by(ApprovalStep.step_order.asc())
        .all()
    )
    for step in company_steps:
        approvers = User.query.filter_by(
            company_id=employee.company_id, role=step.role
        ).all()
        if not approvers:
            continue
        for approver in approvers:
            steps.append(
                ExpenseApproval(
                    expense_id=expense.id,
                    step_order=step_order,
                    approver_id=approver.id,
                )
            )
        step_order += 1

    return steps


def serialize_expense(expense: Expense) -> dict:
    return {
        "id": expense.id,
        "employee_id": expense.employee_id,
        "amount": float(expense.amount),
        "currency": expense.currency,
        "category": expense.category,
        "description": expense.description,
        "expense_date": expense.expense_date.isoformat(),
        "status": expense.status,
        "current_step": expense.current_step,
        "created_at": expense.created_at.isoformat(),
    }


@expenses_bp.get("")
@jwt_required()
def list_expenses():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    scope = request.args.get("scope", "mine")

    query = Expense.query.filter_by(company_id=user.company_id)

    if user.role == "admin" and scope == "all":
        expenses = query.order_by(Expense.created_at.desc()).all()
    elif user.role == "manager" and scope == "team":
        team_ids = [u.id for u in User.query.filter_by(manager_id=user.id).all()]
        expenses = (
            query.filter(Expense.employee_id.in_(team_ids))
            .order_by(Expense.created_at.desc())
            .all()
        )
    else:
        expenses = (
            query.filter_by(employee_id=user.id)
            .order_by(Expense.created_at.desc())
            .all()
        )

    return jsonify([serialize_expense(expense) for expense in expenses])


@expenses_bp.post("")
@jwt_required()
def create_expense():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    data = request.get_json(silent=True) or {}
    try:
        amount = Decimal(str(data.get("amount", "")))
    except (InvalidOperation, TypeError):
        return jsonify({"error": "Invalid amount"}), 400

    currency = normalize_currency(data.get("currency") or user.company.currency)
    category = (data.get("category") or "").strip()
    description = (data.get("description") or "").strip()
    expense_date_raw = data.get("expense_date")

    if amount <= 0 or not currency or not category:
        return jsonify({"error": "Missing or invalid fields"}), 400

    if expense_date_raw:
        try:
            expense_date = datetime.fromisoformat(expense_date_raw).date()
        except ValueError:
            return jsonify({"error": "Invalid date format"}), 400
    else:
        expense_date = date.today()

    expense = Expense(
        company_id=user.company_id,
        employee_id=user.id,
        amount=amount,
        currency=currency,
        category=category,
        description=description,
        expense_date=expense_date,
    )
    db.session.add(expense)
    db.session.flush()

    approvals = build_approvals(expense, user)
    if approvals:
        db.session.add_all(approvals)
        expense.current_step = 1
    else:
        expense.status = "approved"
        expense.current_step = None

    db.session.commit()
    return jsonify(serialize_expense(expense)), 201
