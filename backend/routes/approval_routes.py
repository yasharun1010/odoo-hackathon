from flask import Blueprint, request, jsonify
from models import db, Expense, Approval, ApprovalRule, User
from decorators import jwt_required, manager_required, admin_required, get_current_user_obj
from services.approval_workflow_service import ApprovalWorkflowService

approval_bp = Blueprint('approvals', __name__)


@approval_bp.route('/pending', methods=['GET'])
@jwt_required()
def get_pending_approvals():
    """Get pending approvals for current user"""
    current_user = get_current_user_obj()
    
    pending = Approval.query.filter_by(
        approver_id=current_user.id,
        status='pending'
    ).all()
    
    return jsonify({
        'approvals': [approval.to_dict() for approval in pending]
    }), 200


@approval_bp.route('/my', methods=['GET'])
@jwt_required()
def get_my_approvals():
    """Get all approvals (current and past) for current user"""
    current_user = get_current_user_obj()
    
    approvals = Approval.query.filter_by(approver_id=current_user.id).order_by(Approval.created_at.desc()).all()
    
    return jsonify({
        'approvals': [approval.to_dict() for approval in approvals]
    }), 200


@approval_bp.route('/<int:expense_id>/approve', methods=['POST'])
@jwt_required()
def approve_expense(expense_id):
    """
    Approve an expense
    
    Request body:
    {
        "comment": "Approved - looks good"  // Optional
    }
    """
    current_user = get_current_user_obj()
    data = request.get_json() or {}
    comment = data.get('comment')
    
    workflow_service = ApprovalWorkflowService()
    result = workflow_service.process_approval(
        expense_id=expense_id,
        approver_id=current_user.id,
        status='approved',
        comment=comment
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400


@approval_bp.route('/<int:expense_id>/reject', methods=['POST'])
@jwt_required()
def reject_expense(expense_id):
    """
    Reject an expense
    
    Request body:
    {
        "comment": "Reason for rejection"  // Required
    }
    """
    current_user = get_current_user_obj()
    data = request.get_json()
    
    if not data or not data.get('comment'):
        return jsonify({'error': 'Rejection comment is required'}), 400
    
    workflow_service = ApprovalWorkflowService()
    result = workflow_service.process_approval(
        expense_id=expense_id,
        approver_id=current_user.id,
        status='rejected',
        comment=data['comment']
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400


@approval_bp.route('/rules', methods=['GET'])
@admin_required()
def get_approval_rules():
    """Get all approval rules for the company"""
    current_user = get_current_user_obj()
    
    rules = ApprovalRule.query.filter_by(
        company_id=current_user.company_id
    ).all()
    
    return jsonify({
        'rules': [rule.to_dict() for rule in rules]
    }), 200


@approval_bp.route('/rules', methods=['POST'])
@admin_required()
def create_approval_rule():
    """
    Create a new approval rule
    
    Request body:
    {
        "rule_type": "percentage",  // percentage, specific_approver, hybrid
        "category": "travel",  // Optional: expense category
        "percentage": 60.0,  // For percentage rule
        "specific_approver_id": 5,  // For specific_approver rule
        "min_approvers_required": 2,  // Minimum number of approvers
        "is_sequential": true,  // Sequential vs parallel approval
        "description": "Travel expenses require 60% approval",
        "approvers": [1, 2, 3]  // List of approver user IDs
    }
    """
    current_user = get_current_user_obj()
    data = request.get_json()
    
    # Validate required fields
    if not data.get('rule_type'):
        return jsonify({'error': 'rule_type is required'}), 400
    
    if data['rule_type'] not in ['percentage', 'specific_approver', 'hybrid']:
        return jsonify({'error': 'Invalid rule_type'}), 400
    
    try:
        rule = ApprovalRule(
            company_id=current_user.company_id,
            rule_type=data['rule_type'],
            category=data.get('category'),
            percentage=data.get('percentage'),
            specific_approver_id=data.get('specific_approver_id'),
            min_approvers_required=data.get('min_approvers_required'),
            is_sequential=data.get('is_sequential', True),
            description=data.get('description'),
            is_active=True
        )
        
        db.session.add(rule)
        db.session.flush()
        
        # Add approvers if provided
        if data.get('approvers'):
            approvers = User.query.filter(
                User.id.in_(data['approvers']),
                User.company_id == current_user.company_id
            ).all()
            rule.approvers = approvers
        
        db.session.commit()
        
        return jsonify({
            'message': 'Approval rule created successfully',
            'rule': rule.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@approval_bp.route('/rules/<int:rule_id>', methods=['PUT'])
@admin_required()
def update_approval_rule(rule_id):
    """
    Update an approval rule
    
    Request body: Same fields as create
    """
    current_user = get_current_user_obj()
    data = request.get_json()
    
    rule = ApprovalRule.query.filter_by(
        id=rule_id,
        company_id=current_user.company_id
    ).first()
    
    if not rule:
        return jsonify({'error': 'Rule not found'}), 404
    
    # Update fields
    if data.get('rule_type'):
        rule.rule_type = data['rule_type']
    
    if data.get('category'):
        rule.category = data['category']
    
    if data.get('percentage') is not None:
        rule.percentage = data['percentage']
    
    if data.get('specific_approver_id'):
        rule.specific_approver_id = data['specific_approver_id']
    
    if data.get('min_approvers_required'):
        rule.min_approvers_required = data['min_approvers_required']
    
    if data.get('is_sequential') is not None:
        rule.is_sequential = data['is_sequential']
    
    if data.get('description'):
        rule.description = data['description']
    
    if data.get('is_active') is not None:
        rule.is_active = data['is_active']
    
    # Update approvers
    if data.get('approvers'):
        approvers = User.query.filter(
            User.id.in_(data['approvers']),
            User.company_id == current_user.company_id
        ).all()
        rule.approvers = approvers
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Approval rule updated successfully',
            'rule': rule.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@approval_bp.route('/rules/<int:rule_id>', methods=['DELETE'])
@admin_required()
def delete_approval_rule(rule_id):
    """Delete an approval rule (soft delete by setting is_active=False)"""
    current_user = get_current_user_obj()
    
    rule = ApprovalRule.query.filter_by(
        id=rule_id,
        company_id=current_user.company_id
    ).first()
    
    if not rule:
        return jsonify({'error': 'Rule not found'}), 404
    
    rule.is_active = False
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Approval rule deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@approval_bp.route('/<int:expense_id>/override', methods=['POST'])
@admin_required()
def override_approval(expense_id):
    """
    Admin override for expense approval/rejection
    
    Request body:
    {
        "status": "approved",  // or "rejected"
        "comment": "Admin override"
    }
    """
    current_user = get_current_user_obj()
    data = request.get_json()
    
    if not data or not data.get('status'):
        return jsonify({'error': 'Status is required'}), 400
    
    if data['status'] not in ['approved', 'rejected']:
        return jsonify({'error': 'Invalid status'}), 400
    
    expense = Expense.query.filter_by(id=expense_id).first()
    if not expense:
        return jsonify({'error': 'Expense not found'}), 404
    
    expense.status = data['status']
    
    # Create/update approval record
    approval = Approval.query.filter_by(expense_id=expense_id).first()
    if not approval:
        approval = Approval(
            expense_id=expense_id,
            approver_id=current_user.id,
            step=0,
            status=data['status'],
            comment=data.get('comment', 'Admin override')
        )
        db.session.add(approval)
    else:
        approval.status = data['status']
        approval.comment = data.get('comment', 'Admin override')
    
    try:
        db.session.commit()
        return jsonify({
            'message': f'Expense {data["status"]} via admin override',
            'expense': expense.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
