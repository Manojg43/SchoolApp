from decimal import Decimal
from django.db import transaction, models
from .models import Receipt, PaymentAllocation, StudentFeeBreakup, Invoice, FeeStructure
from core.utils import generate_business_id
from datetime import date

class FeeService:
    @staticmethod
    def process_payment(invoice, amount, mode, created_by, transaction_id='', payment_data=None, custom_allocations=None, user=None):
        """
        Creates a receipt and distributes the amount.
        If custom_allocations is provided {head_id: amount}, uses strict distribution.
        Else, distributes equally across unpaid fee heads.
        """
        created_by = user if user else created_by
        
        with transaction.atomic():
            # 1. Create Receipt
            receipt = Receipt.objects.create(
                school=invoice.school,
                invoice=invoice,
                amount=amount,
                mode=mode,
                created_by=created_by,
                transaction_id=transaction_id
            )

            # 2. Get Unpaid Breakups
            breakups = list(invoice.breakups.filter(paid_amount__lt=models.F('amount')))
            
            if not breakups:
                # Surplus payment? Just update invoice for now.
                invoice.paid_amount += amount
                invoice.save()
                return receipt

            # 3. Distribution Logic
            remaining_payment = Decimal(amount)
            
            # --- CUSTOM ALLOCATION PATH ---
            if custom_allocations:
                # custom_allocations = [{'head_id': 1, 'amount': 200}, ...] or {1: 200}
                # Let's assume frontend sends {head_id: amount} dict or list of objects
                 
                # Normalize input to check balance
                allocation_map = {} # head_id -> amount
                if isinstance(custom_allocations, list):
                     for item in custom_allocations:
                         allocation_map[int(item['head_id'])] = Decimal(str(item['amount']))
                elif isinstance(custom_allocations, dict):
                     for k, v in custom_allocations.items():
                         allocation_map[int(k)] = Decimal(str(v))
                
                # Check Total Matches
                alloc_total = sum(allocation_map.values())
                if abs(alloc_total - remaining_payment) > Decimal('0.05'): # allow small float variance
                     # Force match if close? Or error?
                     # Let's error to be safe
                     raise ValueError(f"allocation sum {alloc_total} does not match payment amount {remaining_payment}")

                for breakup in breakups:
                    alloc_amount = allocation_map.get(breakup.head.id, Decimal('0'))
                    
                    if alloc_amount > 0:
                        # Validate Cap
                        balance = breakup.amount - breakup.paid_amount
                        if alloc_amount > balance + Decimal('0.05'): # tolerance
                            raise ValueError(f"Allocation {alloc_amount} exceeds balance {balance} for {breakup.head.name}")
                        
                        # Apply
                        to_pay = min(alloc_amount, balance) # Clamp to be safe
                        breakup.paid_amount += to_pay
                        breakup.save()

                        PaymentAllocation.objects.create(
                            receipt=receipt,
                            fee_breakup=breakup,
                            amount=to_pay
                        )
                        remaining_payment -= to_pay
                        
            # --- AUTO DISTRIBUTION PATH ---
            else:
                # Loop until payment is exhausted or all heads paid
                while remaining_payment > 0 and breakups:
                    count = len(breakups)
                    share = remaining_payment / count
                    
                    # Check for small decimal issues, round down to 2 places
                    share = round(share, 2)
                    
                    # If share is 0 (due to very small remaining), dump all into first
                    if share == 0:
                        share = remaining_payment

                    # Track which ones are fully paid in this iteration
                    fully_paid_indices = []

                    for i, breakup in enumerate(breakups):
                        if remaining_payment <= 0:
                            break

                        balance = breakup.amount - breakup.paid_amount
                        
                        # Determine exact allocation for this head
                        to_pay = min(balance, share)
                        
                        # Cap by remaining payment (crucial regarding rounding)
                        to_pay = min(to_pay, remaining_payment)

                        # Update Breakup
                        breakup.paid_amount += to_pay
                        breakup.save()

                        # Create Allocation Record
                        PaymentAllocation.objects.create(
                            receipt=receipt,
                            fee_breakup=breakup,
                            amount=to_pay
                        )

                        remaining_payment -= to_pay
                        
                        if breakup.amount - breakup.paid_amount <= 0:
                            fully_paid_indices.append(i)

                    # Remove fully paid from list for next iteration/redistribution
                    for index in sorted(fully_paid_indices, reverse=True):
                        breakups.pop(index)

            # 4. Update Invoice Total Paid
            # Re-sum from allocations to be 100% accurate
            total_paid = sum(b.paid_amount for b in invoice.breakups.all())
            invoice.paid_amount = total_paid
            invoice.save()
            
            # Update Invoice Status
            if invoice.balance_due <= 0:
                 invoice.status = 'PAID'
            elif invoice.paid_amount > 0:
                 invoice.status = 'PARTIAL'
            invoice.save()

            return receipt

    @staticmethod
    def generate_annual_fees(academic_year, school, options=None):
        """
        Generates Invoices and Breakups for all active students in the academic year.
        Compatible with new schema: Looks up FeeStructure (Class+Section first, then Class only).
        """
        from students.models import Student
        
        options = options or {}
        students = Student.objects.filter(school=school, is_active=True)
        
        generated_count = 0
        errors = []

        for student in students:
            try:
                # Check if invoice already exists for this year
                if Invoice.objects.filter(student=student, academic_year=academic_year).exists():
                    continue

                with transaction.atomic():
                    # Fetch Structures for Class + Section
                    structures = FeeStructure.objects.filter(
                        school=school,
                        academic_year=academic_year,
                        class_assigned=student.current_class,
                        section=student.section
                    )
                    
                    # Also fetch Class-wide structures (where section is NULL)
                    class_structures = FeeStructure.objects.filter(
                        school=school,
                        academic_year=academic_year,
                        class_assigned=student.current_class,
                        section__isnull=True
                    )
                    
                    # Combine (careful not to duplicate categories if overrides exist)
                    # Priority: Section Specific > Class General
                    final_structures = {}
                    
                    # Load generic first
                    for s in class_structures:
                        final_structures[s.category_id] = s
                        
                    # Overwrite with specific
                    for s in structures:
                        final_structures[s.category_id] = s
                    
                    if not final_structures:
                        continue # No fees defined for this student type

                    # Calculate Totals & GST
                    gross_total = Decimal('0.00')
                    breakup_data = []

                    for struct in final_structures.values():
                        rate = struct.category.gst_rate
                        inclusive = struct.category.is_tax_inclusive
                        amount = struct.amount # This is the structure amount

                        if inclusive:
                            # Formula: Base = Amount / (1 + Rate/100)
                            base = amount / (1 + (rate / Decimal('100.00')))
                            tax = amount - base
                            total_head = amount
                        else:
                            # Formula: Tax = Amount * (Rate/100)
                            base = amount
                            tax = base * (rate / Decimal('100.00'))
                            total_head = base + tax
                        
                        # Round to 2 decimal places for storage
                        base = base.quantize(Decimal('0.01'))
                        tax = tax.quantize(Decimal('0.01'))
                        total_head = total_head.quantize(Decimal('0.01'))

                        gross_total += total_head
                        
                        breakup_data.append({
                            'head': struct.category,
                            'amount': total_head,
                            'base_amount': base,
                            'tax_amount': tax
                        })

                    # Total Round Off Logic (Round to nearest Integer)
                    from decimal import ROUND_HALF_UP
                    final_total = gross_total.quantize(Decimal('1.'), rounding=ROUND_HALF_UP)
                    round_off_amount = final_total - gross_total

                    invoice = Invoice.objects.create(
                        school=school,
                        student=student,
                        academic_year=academic_year,
                        total_amount=final_total,
                        round_off_amount=round_off_amount,
                        due_date=date(academic_year.start_date.year, 6, 15) # Default to June, improve logic later
                    )
                    
                    # Create Breakups (The Snapshot)
                    breakups = []
                    for data in breakup_data:
                        breakups.append(StudentFeeBreakup(
                            invoice=invoice,
                            head=data['head'],
                            amount=data['amount'],
                            base_amount=data['base_amount'],
                            tax_amount=data['tax_amount'],
                            paid_amount=0
                        ))
                    StudentFeeBreakup.objects.bulk_create(breakups)
                    
                    generated_count += 1
                    
            except Exception as e:
                errors.append(f"Student {student.enrollment_number}: {str(e)}")
        
        return {
            'success': True,
            'generated': generated_count,
            'errors': errors
        }

    @staticmethod
    def settle_year(academic_year, school):
        return {'success': True, 'message': 'Not implemented yet'}

    @staticmethod
    def get_settlement_summary(academic_year, school):
        return {'success': True, 'message': 'Not implemented yet'}

    @staticmethod
    def handle_class_promotion(student, new_class, new_year):
        return {'success': True, 'message': 'Not implemented yet'}
