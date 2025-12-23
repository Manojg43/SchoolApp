# Generated manually due to local environment limitations
# Migration will be auto-generated on deployment

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('students', '0003_attendance_attendance_school_date_idx_and_more'),
    ]

    operations = [
        # Document Management Fields
        migrations.AddField(
            model_name='student',
            name='birth_certificate',
            field=models.FileField(blank=True, help_text='Upload birth certificate document (PDF/Image)', null=True, upload_to='students/docs/birth_cert/', verbose_name='Birth Certificate'),
        ),
        migrations.AddField(
            model_name='student',
            name='transfer_certificate',
            field=models.FileField(blank=True, help_text='Transfer certificate from previous school', null=True, upload_to='students/docs/tc/', verbose_name='Transfer Certificate'),
        ),
        migrations.AddField(
            model_name='student',
            name='aadhar_card',
            field=models.FileField(blank=True, help_text='Aadhar card document', null=True, upload_to='students/docs/aadhar/', verbose_name='Aadhar Card'),
        ),
        migrations.AddField(
            model_name='student',
            name='photo',
            field=models.ImageField(blank=True, help_text='Student photograph for ID card', null=True, upload_to='students/photos/', verbose_name='Student Photo'),
        ),
        
        # Medical Records Fields
        migrations.AddField(
            model_name='student',
            name='blood_group',
            field=models.CharField(blank=True, choices=[('A+', 'A Positive'), ('A-', 'A Negative'), ('B+', 'B Positive'), ('B-', 'B Negative'), ('O+', 'O Positive'), ('O-', 'O Negative'), ('AB+', 'AB Positive'), ('AB-', 'AB Negative')], help_text="Student's blood group", max_length=5, verbose_name='Blood Group'),
        ),
        migrations.AddField(
            model_name='student',
            name='medical_conditions',
            field=models.TextField(blank=True, help_text='Any existing medical conditions (e.g., diabetes, asthma, epilepsy)', verbose_name='Medical Conditions'),
        ),
        migrations.AddField(
            model_name='student',
            name='allergies',
            field=models.TextField(blank=True, help_text='Food or medicine allergies', verbose_name='Allergies'),
        ),
        migrations.AddField(
            model_name='student',
            name='current_medications',
            field=models.TextField(blank=True, help_text='Medications currently being taken regularly', verbose_name='Current Medications'),
        ),
    ]
