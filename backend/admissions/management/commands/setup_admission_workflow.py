"""
Setup default admission workflow for a school.
Run: python manage.py setup_admission_workflow --school_id=<school_id>
"""

from django.core.management.base import BaseCommand, CommandError
from admissions.models import WorkflowTemplate, WorkflowStage, AssessmentTemplate
from schools.models import School


class Command(BaseCommand):
    help = 'Create default admission workflow with stages for a school'

    def add_arguments(self, parser):
        parser.add_argument(
            '--school_id',
            type=str,
            help='School ID to create workflow for (e.g., SCH-XXXXXX)'
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Create workflow for all schools'
        )

    def handle(self, *args, **options):
        school_id = options.get('school_id')
        all_schools = options.get('all')

        if not school_id and not all_schools:
            raise CommandError('Please provide --school_id or use --all flag')

        if all_schools:
            schools = School.objects.all()
        else:
            try:
                schools = [School.objects.get(school_id=school_id)]
            except School.DoesNotExist:
                raise CommandError(f'School with ID {school_id} not found')

        for school in schools:
            self.create_workflow(school)
        
        self.stdout.write(self.style.SUCCESS(f'✅ Workflow created for {len(schools)} school(s)'))

    def create_workflow(self, school):
        """Create Standard Admission workflow with 4 stages"""
        
        # Check if workflow already exists
        if WorkflowTemplate.objects.filter(school=school, workflow_type='ADMISSION', is_default=True).exists():
            self.stdout.write(self.style.WARNING(f'⚠️ Default workflow already exists for {school.name}'))
            return
        
        # Create main workflow template
        workflow = WorkflowTemplate.objects.create(
            school=school,
            name='Standard Admission',
            workflow_type='ADMISSION',
            description='Default admission workflow with document verification, entrance test, fee payment, and final approval.',
            is_active=True,
            is_default=True
        )
        self.stdout.write(f'  📋 Created workflow: {workflow.name}')

        # Stage 1: Document Verification
        stage1 = WorkflowStage.objects.create(
            template=workflow,
            name='Document Verification',
            order=1,
            is_required=True,
            requires_documents=True,
            requires_payment=False,
            requires_assessment=True,
            required_approver_role='OFFICE_STAFF',
            auto_notify_parent=False
        )
        
        # Assessments for Stage 1
        AssessmentTemplate.objects.create(
            stage=stage1,
            name='Birth Certificate Verified',
            assessment_type='DOCUMENT',
            max_marks=0,
            passing_marks=0,
            is_mandatory=True,
            instructions='Verify birth certificate is valid and matches student details.'
        )
        AssessmentTemplate.objects.create(
            stage=stage1,
            name='Previous Marksheet Verified',
            assessment_type='DOCUMENT',
            max_marks=0,
            passing_marks=0,
            is_mandatory=False,
            instructions='Check previous school marksheet if applicable.'
        )
        self.stdout.write(f'    ✓ Stage 1: Document Verification (2 assessments)')

        # Stage 2: Entrance Test
        stage2 = WorkflowStage.objects.create(
            template=workflow,
            name='Entrance Test',
            order=2,
            is_required=True,
            requires_documents=False,
            requires_payment=False,
            requires_assessment=True,
            required_approver_role='TEACHER',
            auto_notify_parent=True,
            notification_message='Dear Parent, your child {name} has been scheduled for entrance test. Please report on the assigned date.'
        )
        
        # Assessments for Stage 2
        AssessmentTemplate.objects.create(
            stage=stage2,
            name='English Test',
            assessment_type='WRITTEN',
            max_marks=50,
            passing_marks=20,
            is_mandatory=True,
            instructions='Written test covering basic English skills.'
        )
        AssessmentTemplate.objects.create(
            stage=stage2,
            name='Mathematics Test',
            assessment_type='WRITTEN',
            max_marks=50,
            passing_marks=20,
            is_mandatory=True,
            instructions='Written test covering basic Math skills for the applied class.'
        )
        AssessmentTemplate.objects.create(
            stage=stage2,
            name='Interview',
            assessment_type='ORAL',
            max_marks=0,
            passing_marks=0,
            is_mandatory=False,
            instructions='Brief interaction with student and parent.'
        )
        self.stdout.write(f'    ✓ Stage 2: Entrance Test (3 assessments)')

        # Stage 3: Fee Payment
        stage3 = WorkflowStage.objects.create(
            template=workflow,
            name='Admission Fee Payment',
            order=3,
            is_required=True,
            requires_documents=False,
            requires_payment=True,
            requires_assessment=False,
            required_approver_role='ACCOUNTANT',
            auto_notify_parent=True,
            notification_message='Congratulations! Your child has cleared the entrance test. Please visit the office to complete fee payment.'
        )
        
        # Payment assessment
        AssessmentTemplate.objects.create(
            stage=stage3,
            name='Admission Fee Paid',
            assessment_type='PAYMENT',
            max_marks=0,
            passing_marks=0,
            is_mandatory=True,
            instructions='Verify admission fee has been received and receipt issued.'
        )
        self.stdout.write(f'    ✓ Stage 3: Fee Payment (1 assessment)')

        # Stage 4: Final Approval
        stage4 = WorkflowStage.objects.create(
            template=workflow,
            name='Final Approval',
            order=4,
            is_required=True,
            requires_documents=False,
            requires_payment=False,
            requires_assessment=False,
            required_approver_role='PRINCIPAL',
            auto_notify_parent=True,
            notification_message='Welcome to {school}! Your child has been admitted. Please collect the welcome kit from the office.'
        )
        
        # Final approval assessment
        AssessmentTemplate.objects.create(
            stage=stage4,
            name='Principal Approval',
            assessment_type='APPROVAL',
            max_marks=0,
            passing_marks=0,
            is_mandatory=True,
            instructions='Final approval by Principal. Review all documents and test results before approving.'
        )
        self.stdout.write(f'    ✓ Stage 4: Final Approval (1 assessment)')
        
        self.stdout.write(self.style.SUCCESS(f'  ✅ Created workflow for: {school.name}'))
