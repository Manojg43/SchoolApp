"""
Management command to assign default workflow to existing enquiries.
Run with: python manage.py assign_workflows
"""

from django.core.management.base import BaseCommand
from admissions.models import Enquiry, WorkflowTemplate, EnquiryStageProgress


class Command(BaseCommand):
    help = 'Assigns default workflows to existing enquiries that have no workflow'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        # Find all enquiries without a workflow
        enquiries_without_workflow = Enquiry.objects.filter(workflow__isnull=True)
        total_count = enquiries_without_workflow.count()
        
        if total_count == 0:
            self.stdout.write(self.style.SUCCESS('All enquiries already have workflows assigned!'))
            return
        
        self.stdout.write(f'Found {total_count} enquiries without workflow')
        
        # Group by school for efficiency
        schools_processed = set()
        updated_count = 0
        skipped_count = 0
        
        for enquiry in enquiries_without_workflow.select_related('school'):
            school = enquiry.school
            
            # Get default workflow for this school
            default_workflow = WorkflowTemplate.objects.filter(
                school=school,
                workflow_type='ADMISSION',
                is_default=True,
                is_active=True
            ).first()
            
            if not default_workflow:
                if school.id not in schools_processed:
                    self.stdout.write(
                        self.style.WARNING(f'  No default ADMISSION workflow for school: {school.name}')
                    )
                    schools_processed.add(school.id)
                skipped_count += 1
                continue
            
            # Get first stage
            first_stage = default_workflow.stages.order_by('order').first()
            
            if not dry_run:
                # Assign workflow and stage
                enquiry.workflow = default_workflow
                if first_stage:
                    enquiry.current_stage = first_stage
                enquiry.save()
                
                # Create stage progress if first stage exists
                if first_stage:
                    EnquiryStageProgress.objects.get_or_create(
                        enquiry=enquiry,
                        stage=first_stage,
                        defaults={'status': 'PENDING'}
                    )
            
            updated_count += 1
            self.stdout.write(f'  Updated: {enquiry.enquiry_id} -> {default_workflow.name}')
        
        # Summary
        self.stdout.write('')
        if dry_run:
            self.stdout.write(self.style.WARNING(f'DRY RUN: Would update {updated_count} enquiries'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Successfully updated {updated_count} enquiries'))
        
        if skipped_count > 0:
            self.stdout.write(
                self.style.WARNING(f'Skipped {skipped_count} enquiries (no default workflow for their school)')
            )
