from django.core.management.base import BaseCommand
from schools.models import School, Class, Section

class Command(BaseCommand):
    help = 'Seed Classes (1-12) and Sections (A, B) for ALL registered schools'

    def handle(self, *args, **kwargs):
        schools = School.objects.all()
        if not schools.exists():
            self.stdout.write(self.style.WARNING("No schools found to seed."))
            return

        for school in schools:
            self.stdout.write(f"Seeding data for school: {school.name} ({school.school_id})")
            
            # Create Classes 1 to 12
            for i in range(1, 13):
                class_name = f"Class {i}"
                cls, created = Class.objects.get_or_create(
                    school=school,
                    name=class_name,
                    defaults={'order': i}
                )
                if created:
                    self.stdout.write(f"  - Created {class_name}")

                # Create Sections A and B
                for sec_name in ['A', 'B']:
                    sec, s_created = Section.objects.get_or_create(
                        school=school,
                        parent_class=cls,
                        name=sec_name
                    )
                    if s_created:
                        self.stdout.write(f"    - Created Section {sec_name}")

        self.stdout.write(self.style.SUCCESS("Successfully seeded classes and sections for all schools."))
