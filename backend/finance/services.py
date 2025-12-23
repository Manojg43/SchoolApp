from django.db import transaction
from django.db.models import Sum, Q
from datetime import date, timedelta
from decimal import Decimal

from .models import (
    Invoice, FeeStructure, FeeInstallment, FeeDiscount, 
    CertificateFee, FeeCategory
)
from students.models import Student
from schools.models import School, AcademicYear, Class


class FeeSettlementService:
    """Service class for fee settlement operations"""
    
    @staticmethod
    def generate_annual_fees(academic_year, school, options=None):
        """
        Generate fees for all students for a new academic year
        Based on FeeStructure for each class
        
        Args:
            academic_year: AcademicYear instance
            school: School instance
            options: dict with keys:
                - auto_apply_discounts: bool (default True)
                - skip_pending_fees: bool (default True)
                - term_wise: bool (default False)
                - send_notifications: bool (default False)
        
        Returns:
            dict with statistics about fee generation
        """
        options = options or {}
        auto_apply_discounts = options.get('auto_apply_discounts', True)
        skip_pending_fees = options.get('skip_pending_fees', True)
        
        students = Student.objects.filter(
            school=school,
            academic_year=academic_year,
            is_active=True
        ).select_related('current_class')
        
        invoices_created = []
        students_skipped = []
        total_amount = Decimal('0.00')
        discounts_applied = 0
        
        with transaction.atomic():
            for student in students:
                # Check for pending fees if option is set
                if skip_pending_fees:
                    pending = Invoice.objects.filter(
                        student=student,
                        status__in=['PENDING', 'PARTIAL', 'OVERDUE']
                    ).exclude(academic_year=academic_year).exists()
                    
                    if pending:
                        students_skipped.append({
                            'student_id': student.id,
                            'student_name': student.get_full_name(),
                            'reason': 'Pending fees from previous year'
                        })
                        continue
                
                # Get fee structures for student's class
                if not student.current_class:
                    students_skipped.append({
                        'student_id': student.id,
                        'student_name': student.get_full_name(),
                        'reason': 'No class assigned'
                    })
                    continue
                
                fee_structures = FeeStructure.objects.filter(
                    school=school,
                    academic_year=academic_year,
                    class_assigned=student.current_class
                ).select_related('category')
                
                for structure in fee_structures:
                    amount = structure.amount
                    discount_amt = Decimal('0.00')
                    discount_reason = ''
                    
                    # Apply student discounts
                    if auto_apply_discounts:
                        discount = FeeDiscount.objects.filter(
                            student=student,
                            academic_year=academic_year,
                            is_active=True,
                            valid_from__lte=date.today(),
                            valid_until__gte=date.today()
                        ).filter(
                            Q(category=structure.category) | Q(category__isnull=True)
                        ).first()
                        
                        if discount:
                            discount_amt = discount.get_discount_amount(amount)
                            discount_reason = discount.reason
                            discounts_applied += 1
                    
                    final_amount = amount - discount_amt
                    
                    # Calculate due date (30 days from year start)
                    due_date = academic_year.start_date + timedelta(days=30)
                    
                    # Create invoice
                    invoice = Invoice.objects.create(
                        school=school,
                        student=student,
                        fee_structure=structure,
                        academic_year=academic_year,
                        title=f"{structure.category.name} - {academic_year.name}",
                        total_amount=final_amount,
                        due_date=due_date,
                        fee_term='ANNUAL',
                        discount_amount=discount_amt,
                        discount_reason=discount_reason
                    )
                    
                    invoices_created.append(invoice)
                    total_amount += final_amount
        
        return {
            'success': True,
            'invoices_created': len(invoices_created),
            'students_processed': students.count() - len(students_skipped),
            'students_skipped': len(students_skipped),
            'skipped_details': students_skipped,
            'total_amount': float(total_amount),
            'discounts_applied': discounts_applied,
            'academic_year': academic_year.name,
        }
    
    @staticmethod
    def settle_year(academic_year, school):
        """
        Mark all paid invoices for a year as settled
        
        Args:
            academic_year: AcademicYear instance
            school: School instance
        
        Returns:
            dict with settlement statistics
        """
        # Get all paid invoices for the year
        invoices = Invoice.objects.filter(
            school=school,
            academic_year=academic_year,
            status='PAID',
            is_settled=False
        )
        
        count = invoices.count()
        
        # Mark as settled
        invoices.update(
            is_settled=True,
            settled_date=date.today()
        )
        
        return {
            'success': True,
            'settled_invoices': count,
            'academic_year': academic_year.name,
            'settled_date': date.today().isoformat()
        }
    
    @staticmethod
    def get_settlement_summary(academic_year, school):
        """
        Get comprehensive settlement summary for an academic year
        
        Args:
            academic_year: AcademicYear instance
            school: School instance
        
        Returns:
            dict with detailed statistics
        """
        invoices = Invoice.objects.filter(
            school=school,
            academic_year=academic_year
        )
        
        # Overall statistics
        total_invoices = invoices.count()
        total_amount = invoices.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00')
        total_paid = invoices.aggregate(Sum('paid_amount'))['paid_amount__sum'] or Decimal('0.00')
        total_discount = invoices.aggregate(Sum('discount_amount'))['discount_amount__sum'] or Decimal('0.00')
        
        # Status breakdown
        pending_count = invoices.filter(status='PENDING').count()
        partial_count = invoices.filter(status='PARTIAL').count()
        paid_count = invoices.filter(status='PAID').count()
        overdue_count = invoices.filter(status='OVERDUE').count()
        
        # Settlement status
        settled_count = invoices.filter(is_settled=True).count()
        
        # Class-wise breakdown
        from django.db.models import Count
        classwise = []
        classes = Class.objects.filter(school=school)
        
        for cls in classes:
            cls_invoices = invoices.filter(student__current_class=cls)
            cls_total = cls_invoices.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00')
            cls_paid = cls_invoices.aggregate(Sum('paid_amount'))['paid_amount__sum'] or Decimal('0.00')
            
            percentage = (float(cls_paid) / float(cls_total) * 100) if cls_total > 0 else 0
            
            classwise.append({
                'class': cls.name,
                'total_amount': float(cls_total),
                'paid_amount': float(cls_paid),
                'pending_amount': float(cls_total - cls_paid),
                'percentage_collected': round(percentage, 2),
                'invoice_count': cls_invoices.count()
            })
        
        return {
            'academic_year': academic_year.name,
            'total_invoices': total_invoices,
            'total_amount': float(total_amount),
            'total_paid': float(total_paid),
            'total_pending': float(total_amount - total_paid),
            'total_discount': float(total_discount),
            'collection_percentage': round((float(total_paid) / float(total_amount) * 100) if total_amount > 0 else 0, 2),
            'status_breakdown': {
                'pending': pending_count,
                'partial': partial_count,
                'paid': paid_count,
                'overdue': overdue_count,
            },
            'settlement': {
                'settled_count': settled_count,
                'unsettled_count': total_invoices - settled_count,
            },
            'classwise': classwise
        }
    
    @staticmethod
    def handle_class_promotion(student, new_class, new_academic_year):
        """
        Generate new fees when student is promoted to new class
        Check for pending fees from previous year
        
        Args:
            student: Student instance
            new_class: Class instance
            new_academic_year: AcademicYear instance
        
        Returns:
            dict with promotion status and generated invoices
        """
        # Check for pending fees from previous year
        old_year_invoices = Invoice.objects.filter(
            student=student,
            academic_year=student.academic_year,
            status__in=['PENDING', 'PARTIAL', 'OVERDUE']
        )
        
        if old_year_invoices.exists():
            pending_amount = sum([
                inv.total_amount - inv.paid_amount 
                for inv in old_year_invoices
            ])
            
            return {
                'success': False,
                'promotion_blocked': True,
                'reason': 'Pending fees from previous year',
                'pending_amount': float(pending_amount),
                'pending_invoices': [inv.invoice_id for inv in old_year_invoices]
            }
        
        # Update student class and year
        old_class = student.current_class
        old_year = student.academic_year
        
        student.current_class = new_class
        student.academic_year = new_academic_year
        student.save()
        
        # Generate fees for new class/year
        fee_structures = FeeStructure.objects.filter(
            school=student.school,
            academic_year=new_academic_year,
            class_assigned=new_class
        ).select_related('category')
        
        new_invoices = []
        total_fee_amount = Decimal('0.00')
        
        for structure in fee_structures:
            # Check for discounts
            discount = FeeDiscount.objects.filter(
                student=student,
                academic_year=new_academic_year,
                is_active=True
            ).filter(
                Q(category=structure.category) | Q(category__isnull=True)
            ).first()
            
            amount = structure.amount
            discount_amt = Decimal('0.00')
            discount_reason = ''
            
            if discount:
                discount_amt = discount.get_discount_amount(amount)
                discount_reason = discount.reason
            
            final_amount = amount - discount_amt
            
            # Due date: 30 days from year start
            due_date = new_academic_year.start_date + timedelta(days=30)
            
            invoice = Invoice.objects.create(
                school=student.school,
                student=student,
                fee_structure=structure,
                academic_year=new_academic_year,
                title=f"{structure.category.name} - {new_academic_year.name}",
                total_amount=final_amount,
                due_date=due_date,
                fee_term='ANNUAL',
                discount_amount=discount_amt,
                discount_reason=discount_reason
            )
            
            new_invoices.append(invoice)
            total_fee_amount += final_amount
        
        return {
            'success': True,
            'promotion_blocked': False,
            'promoted_from': old_class.name if old_class else 'N/A',
            'promoted_to': new_class.name,
            'old_year': old_year.name if old_year else 'N/A',
            'new_year': new_academic_year.name,
            'invoices_generated': len(new_invoices),
            'total_fee_amount': float(total_fee_amount),
            'invoice_ids': [inv.invoice_id for inv in new_invoices]
        }
    
    @staticmethod
    def create_installment_plan(invoice, installment_count, start_date=None):
        """
        Create installment plan for an invoice
        
        Args:
            invoice: Invoice instance
            installment_count: int - number of installments
            start_date: date - start date for first installment (default: invoice due_date)
        
        Returns:
            list of created FeeInstallment instances
        """
        if start_date is None:
            start_date = invoice.due_date
        
        amount_per_installment = invoice.total_amount / installment_count
        installments = []
        
        with transaction.atomic():
            for i in range(1, installment_count + 1):
                # Calculate due date (monthly intervals)
                due_date = start_date + timedelta(days=30 * (i - 1))
                
                installment = FeeInstallment.objects.create(
                    school=invoice.school,
                    invoice=invoice,
                    installment_number=i,
                    amount=amount_per_installment,
                    due_date=due_date
                )
                installments.append(installment)
        
        return installments
