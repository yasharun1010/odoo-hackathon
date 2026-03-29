from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models import ApprovalRule, Expense, ExpenseApproval, User

approvals_bp = Blueprint("approvals", __name__, url_prefix="/api/approvals")


def _serialize_pending(approval: ExpenseApproval) -> dict:
    expense = approval.expense
    return {
        "expense_id": expense.id,
        "employee_id": expense.employee_id,
        "amount": float(expense.amount),
        "currency": expense.currency,
        "category": expense.category,
        "description": expense.description,
        "expense_date": expense.expense_date.isoformat(),
        "status": expense.status,
        "step_order": approval.step_order,
    }


def _advance_expense(expense: Expense, rule: ApprovalRule | None) -> None:
    pending = (
        ExpenseApproval.query.filter_by(expense_id=expense.id, status="pending")
        .order_by(ExpenseApproval.step_order.asc())
        .all()
    )
    if not pending:
        expense.status = "approved"
        expense.current_step = None
        return

    current_step = pending[0].step_order
    expense.current_step = current_step

    if rule and rule.rule_type in {"percentage", "hybrid"}:
        step_approvals = [
            approval
            for approval in ExpenseApproval.query.filter_by(
                expense_id=expense.id, step_order=current_step
            ).all()
        ]
        total = len(step_approvals)
        approved = len([a for a in step_approvals if a.status == "approved"])
        if total > 0 and rule.threshold_percentage:
            ratio = (approved / total) * 100
            if ratio >= rule.threshold_percentage:
                for approval in step_approvals:
                    if approval.status == "pending":
                        approval.status = "skipped"
                pending = [
                    a
                    for a in pending
                    if a.step_order != current_step and a.status == "pending"
                ]
                if not pending:
                    expense.status = "approved"
                    expense.current_step = None
                else:
                    expense.current_step = pending[0].step_order


@approvals_bp.get("/pending")
@jwt_required()
def pending_approvals():
    user_id = get_jwt_identity()
    approvals = (
        ExpenseApproval.query.filter_by(approver_id=user_id, status="pending")
        .order_by(ExpenseApproval.decided_at.asc(), ExpenseApproval.step_order.asc())
        .all()
    )
    return jsonify([_serialize_pending(a) for a in approvals])


@approvals_bp.post("/<int:expense_id>/decision")
@jwt_required()
def decide(expense_id: int):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json(silent=True) or {}
    decision = (data.get("decision") or "").strip().lower()
    comment = (data.get("comment") or "").strip()

    if decision not in {"approve", "reject"}:
        return jsonify({"error": "Invalid decision"}), 400

    approval = ExpenseApproval.query.filter_by(
        expense_id=expense_id, approver_id=user_id, status="pending"
    ).first()
    if not approval:
        return jsonify({"error": "Approval not found"}), 404

    expense = Expense.query.get(expense_id)
    if not expense or expense.status != "pending":
        return jsonify({"error": "Expense not pending"}), 400

    if expense.current_step != approval.step_order:
        return jsonify({"error": "Not current step"}), 400

    approval.status = "approved" if decision == "approve" else "rejected"
    approval.comment = comment
    approval.decided_at = datetime.utcnow()

    if decision == "reject":
        expense.status = "rejected"
        expense.current_step = None
        pending = ExpenseApproval.query.filter_by(
            expense_id=expense.id, status="pending"
        ).all()
        for item in pending:
            item.status = "skipped"
        db.session.commit()
        return jsonify({"status": expense.status})

    rule = ApprovalRule.query.filter_by(company_id=user.company_id).first()
    if (
        rule
        and rule.rule_type in {"specific", "hybrid"}
        and rule.specific_approver_id == user_id
    ):
        expense.status = "approved"
        expense.current_step = None
        pending = ExpenseApproval.query.filter_by(
            expense_id=expense.id, status="pending"
        ).all()
        for item in pending:
            item.status = "skipped"
        db.session.commit()
        return jsonify({"status": expense.status})

    _advance_expense(expense, rule)
    db.session.commit()
    return jsonify({"status": expense.status, "current_step": expense.current_step})
