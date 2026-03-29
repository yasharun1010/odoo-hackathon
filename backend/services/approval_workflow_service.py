from models import db, Expense, Approval, ApprovalRule, User


class ApprovalWorkflowService:
    """Service for managing expense approval workflows"""
    
    def get_approval_sequence(self, expense):
        """
        Get the sequence of approvers for an expense based on company rules
        
        Args:
            expense: Expense object
            
        Returns:
            list: List of user IDs representing approval sequence
        """
        # Get employee's manager
        employee = User.query.get(expense.user_id)
        if not employee or not employee.manager_id:
            return []
        
        # Build approval chain starting from manager
        approval_chain = []
        current_manager = employee.manager
        
        while current_manager:
            approval_chain.append(current_manager.id)
            if current_manager.manager_id:
                current_manager = current_manager.manager
            else:
                break
        
        return approval_chain
    
    def create_approvals_for_expense(self, expense):
        """
        Create approval records for a newly submitted expense
        
        Args:
            expense: Expense object
        """
        approval_chain = self.get_approval_sequence(expense)
        
        if not approval_chain:
            return
        
        # Check if sequential or parallel approval
        rule = self.get_applicable_rule(expense.company_id, expense.category)
        is_sequential = rule.is_sequential if rule else True
        
        if is_sequential:
            # Create only first approval in sequence
            first_approver_id = approval_chain[0]
            approval = Approval(
                expense_id=expense.id,
                approver_id=first_approver_id,
                step=1,
                status='pending'
            )
            db.session.add(approval)
        else:
            # Create approvals for all approvers (parallel)
            for idx, approver_id in enumerate(approval_chain, 1):
                approval = Approval(
                    expense_id=expense.id,
                    approver_id=approver_id,
                    step=idx,
                    status='pending'
                )
                db.session.add(approval)
        
        db.session.commit()
    
    def process_approval(self, expense_id, approver_id, status, comment=None):
        """
        Process an approval/rejection decision
        
        Args:
            expense_id: ID of the expense
            approver_id: ID of the approver
            status: 'approved' or 'rejected'
            comment: Optional comment
            
        Returns:
            dict: Result with next steps
        """
        expense = Expense.query.get(expense_id)
        if not expense:
            return {'success': False, 'error': 'Expense not found'}
        
        approval = Approval.query.filter_by(
            expense_id=expense_id,
            approver_id=approver_id,
            status='pending'
        ).first()
        
        if not approval:
            return {'success': False, 'error': 'No pending approval found'}
        
        # Update approval status
        approval.status = status
        approval.comment = comment
        db.session.commit()
        
        if status == 'rejected':
            # Reject the expense
            expense.status = 'rejected'
            db.session.commit()
            return {
                'success': True,
                'message': 'Expense rejected',
                'final_status': 'rejected'
            }
        
        # Approver approved - check if more approvals needed
        rule = self.get_applicable_rule(expense.company_id, expense.category)
        
        if self.check_all_approvals_complete(expense_id, rule):
            # All required approvals obtained
            expense.status = 'approved'
            db.session.commit()
            return {
                'success': True,
                'message': 'Expense fully approved',
                'final_status': 'approved'
            }
        else:
            # Need more approvals - create next approval
            self.create_next_approval(expense, approval.step)
            return {
                'success': True,
                'message': 'Approval recorded, waiting for next approver',
                'final_status': 'pending'
            }
    
    def create_next_approval(self, expense, current_step):
        """Create approval for next step in sequence"""
        approval_chain = self.get_approval_sequence(expense)
        next_step = current_step + 1
        
        if next_step <= len(approval_chain):
            next_approver_id = approval_chain[next_step - 1]
            
            # Check if approval already exists
            existing = Approval.query.filter_by(
                expense_id=expense.id,
                approver_id=next_approver_id,
                step=next_step
            ).first()
            
            if not existing:
                approval = Approval(
                    expense_id=expense.id,
                    approver_id=next_approver_id,
                    step=next_step,
                    status='pending'
                )
                db.session.add(approval)
                db.session.commit()
    
    def check_all_approvals_complete(self, expense_id, rule=None):
        """
        Check if all required approvals are complete
        
        Args:
            expense_id: Expense ID
            rule: Applicable approval rule
            
        Returns:
            bool: True if all approvals complete
        """
        approvals = Approval.query.filter_by(expense_id=expense_id).all()
        
        if not rule:
            # Default: all approvals must be approved
            return all(a.status == 'approved' for a in approvals) and len(approvals) > 0
        
        # Check based on rule type
        if rule.rule_type == 'percentage':
            # Check if required percentage of approvers approved
            total_approvers = len(approvals)
            approved_count = sum(1 for a in approvals if a.status == 'approved')
            if total_approvers == 0:
                return False
            approval_percentage = (approved_count / total_approvers) * 100
            return approval_percentage >= rule.percentage
        
        elif rule.rule_type == 'specific_approver':
            # Check if specific approver has approved
            if rule.specific_approver_id:
                specific_approval = Approval.query.filter_by(
                    expense_id=expense_id,
                    approver_id=rule.specific_approver_id,
                    status='approved'
                ).first()
                return specific_approval is not None
        
        elif rule.rule_type == 'hybrid':
            # Either percentage OR specific approver
            percentage_met = self.check_all_approvals_complete(expense_id)
            specific_met = False
            if rule.specific_approver_id:
                specific_approval = Approval.query.filter_by(
                    expense_id=expense_id,
                    approver_id=rule.specific_approver_id,
                    status='approved'
                ).first()
                specific_met = specific_approval is not None
            
            return percentage_met or specific_met
        
        # Default: require minimum number of approvers
        if rule.min_approvers_required:
            approved_count = sum(1 for a in approvals if a.status == 'approved')
            return approved_count >= rule.min_approvers_required
        
        return False
    
    def get_applicable_rule(self, company_id, category):
        """Get the applicable approval rule for an expense category"""
        # First try to find category-specific rule
        rule = ApprovalRule.query.filter_by(
            company_id=company_id,
            category=category,
            is_active=True
        ).first()
        
        # If no category-specific rule, use default rule
        if not rule:
            rule = ApprovalRule.query.filter_by(
                company_id=company_id,
                category=None,
                is_active=True
            ).first()
        
        return rule
    
    def get_pending_approvals(self, approver_id):
        """Get all pending approvals for a specific approver"""
        return Approval.query.filter_by(
            approver_id=approver_id,
            status='pending'
        ).all()
