from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from ..extensions import db
from ..models import ApprovalRule, ApprovalStep, User
from ..utils.auth import role_required

rules_bp = Blueprint("rules", __name__, url_prefix="/api/rules")


@rules_bp.get("/approval-rule")
@role_required("admin")
def get_rule():
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    rule = ApprovalRule.query.filter_by(company_id=admin.company_id).first()
    if not rule:
        return jsonify({"rule_type": "none"}), 200
    return jsonify(
        {
            "rule_type": rule.rule_type,
            "threshold_percentage": rule.threshold_percentage,
            "specific_approver_id": rule.specific_approver_id,
        }
    )


@rules_bp.put("/approval-rule")
@role_required("admin")
def update_rule():
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    data = request.get_json(silent=True) or {}
    rule_type = (data.get("rule_type") or "none").strip().lower()
    threshold = data.get("threshold_percentage")
    specific_id = data.get("specific_approver_id")

    if rule_type not in {"none", "percentage", "specific", "hybrid"}:
        return jsonify({"error": "Invalid rule type"}), 400
    if rule_type in {"percentage", "hybrid"}:
        if threshold is None or not isinstance(threshold, int):
            return jsonify({"error": "Threshold percentage required"}), 400
        if threshold <= 0 or threshold > 100:
            return jsonify({"error": "Threshold must be 1-100"}), 400

    rule = ApprovalRule.query.filter_by(company_id=admin.company_id).first()
    if not rule:
        rule = ApprovalRule(company_id=admin.company_id)
        db.session.add(rule)

    rule.rule_type = rule_type
    rule.threshold_percentage = threshold if rule_type in {"percentage", "hybrid"} else None
    rule.specific_approver_id = (
        specific_id if rule_type in {"specific", "hybrid"} else None
    )
    db.session.commit()
    return jsonify(
        {
            "rule_type": rule.rule_type,
            "threshold_percentage": rule.threshold_percentage,
            "specific_approver_id": rule.specific_approver_id,
        }
    )


@rules_bp.get("/approval-steps")
@role_required("admin")
def get_steps():
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    steps = (
        ApprovalStep.query.filter_by(company_id=admin.company_id)
        .order_by(ApprovalStep.step_order.asc())
        .all()
    )
    return jsonify([{"order": step.step_order, "role": step.role} for step in steps])


@rules_bp.put("/approval-steps")
@role_required("admin")
def update_steps():
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    data = request.get_json(silent=True) or {}
    steps = data.get("steps")

    if not isinstance(steps, list) or not steps:
        return jsonify({"error": "Steps must be a non-empty list"}), 400

    normalized = []
    for role in steps:
        role_name = str(role).strip().lower()
        if role_name not in {"manager", "finance", "director", "admin"}:
            return jsonify({"error": f"Invalid role {role_name}"}), 400
        normalized.append(role_name)

    ApprovalStep.query.filter_by(company_id=admin.company_id).delete()

    for idx, role_name in enumerate(normalized, start=1):
        db.session.add(
            ApprovalStep(company_id=admin.company_id, step_order=idx, role=role_name)
        )

    db.session.commit()
    return jsonify({"steps": normalized})
