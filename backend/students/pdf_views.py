"""
Report Card PDF Generation for Students
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone

from students.models import Student, StudentHistory
from schools.models import School


class ReportCardPDFView(APIView):
    """Generate student report card as PDF"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, student_id):
        try:
            student = Student.objects.select_related(
                'school', 'current_class', 'section', 'academic_year'
            ).get(id=student_id, school=request.user.school)
            
            # Get history records
            history = StudentHistory.objects.filter(
                student=student, school=request.user.school
            ).select_related(
                'academic_year', 'class_enrolled', 'section_enrolled'
            ).order_by('-academic_year__start_date')
            
            # Get latest record
            latest = history.first() if history.exists() else None
            
            # Build HTML content
            html_content = self._generate_html(student, latest, history)
            
            # Check if PDF library available, else return HTML
            try:
                from weasyprint import HTML
                pdf = HTML(string=html_content).write_pdf()
                
                response = HttpResponse(pdf, content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="report_card_{student.student_id}.pdf"'
                return response
            except ImportError:
                # Fallback to HTML if weasyprint not installed
                response = HttpResponse(html_content, content_type='text/html')
                return response
                
        except Student.DoesNotExist:
            return HttpResponse("Student not found", status=404)
    
    def _generate_html(self, student, latest, history):
        """Generate report card HTML"""
        school = student.school
        
        # Grade color mapping
        grade_colors = {
            'A+': '#22c55e', 'A': '#4ade80', 'B+': '#3b82f6', 'B': '#60a5fa',
            'C+': '#eab308', 'C': '#facc15', 'D': '#f97316', 'E': '#ef4444', 'F': '#dc2626'
        }
        
        grade_color = grade_colors.get(latest.grade, '#6b7280') if latest else '#6b7280'
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Report Card - {student.first_name} {student.last_name}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 12px; color: #1f2937; padding: 20px; }}
        .header {{ text-align: center; margin-bottom: 30px; border-bottom: 3px solid #4f46e5; padding-bottom: 15px; }}
        .school-name {{ font-size: 24px; font-weight: bold; color: #4f46e5; }}
        .school-address {{ color: #6b7280; font-size: 11px; }}
        .title {{ font-size: 18px; margin-top: 10px; color: #1f2937; }}
        .student-info {{ display: flex; margin-bottom: 25px; background: #f8fafc; padding: 15px; border-radius: 8px; }}
        .info-col {{ flex: 1; }}
        .info-row {{ margin-bottom: 8px; }}
        .info-label {{ color: #6b7280; font-size: 10px; text-transform: uppercase; }}
        .info-value {{ font-weight: 600; font-size: 13px; }}
        .grade-section {{ text-align: center; margin: 20px 0; padding: 20px; background: linear-gradient(135deg, #f8fafc, #e2e8f0); border-radius: 10px; }}
        .grade-badge {{ display: inline-block; width: 80px; height: 80px; border-radius: 50%; background: {grade_color}; color: white; font-size: 32px; font-weight: bold; line-height: 80px; }}
        .percentage {{ font-size: 28px; font-weight: bold; color: #1f2937; margin-top: 10px; }}
        .stats-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }}
        .stat-box {{ text-align: center; padding: 15px; background: #f1f5f9; border-radius: 8px; }}
        .stat-value {{ font-size: 20px; font-weight: bold; color: #4f46e5; }}
        .stat-label {{ font-size: 10px; color: #6b7280; text-transform: uppercase; }}
        .history-table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
        .history-table th {{ background: #4f46e5; color: white; padding: 10px; text-align: left; font-size: 11px; }}
        .history-table td {{ padding: 10px; border-bottom: 1px solid #e2e8f0; }}
        .history-table tr:nth-child(even) {{ background: #f8fafc; }}
        .status-promoted {{ color: #22c55e; font-weight: 600; }}
        .status-detained {{ color: #ef4444; font-weight: 600; }}
        .remarks {{ margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; }}
        .remarks-title {{ font-weight: 600; margin-bottom: 5px; }}
        .footer {{ margin-top: 40px; text-align: center; font-size: 10px; color: #9ca3af; }}
        .signatures {{ display: flex; justify-content: space-between; margin-top: 60px; padding: 0 50px; }}
        .signature {{ text-align: center; }}
        .signature-line {{ width: 150px; border-top: 1px solid #1f2937; margin-top: 40px; padding-top: 5px; }}
    </style>
</head>
<body>
    <div class="header">
        <div class="school-name">{school.name}</div>
        <div class="school-address">{school.address or ''}</div>
        <div class="title">PROGRESS REPORT CARD</div>
    </div>
    
    <div class="student-info">
        <div class="info-col">
            <div class="info-row">
                <div class="info-label">Student Name</div>
                <div class="info-value">{student.first_name} {student.last_name}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Student ID</div>
                <div class="info-value">{student.student_id}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Class</div>
                <div class="info-value">{student.current_class.name if student.current_class else 'N/A'} {student.section.name if student.section else ''}</div>
            </div>
        </div>
        <div class="info-col">
            <div class="info-row">
                <div class="info-label">Academic Year</div>
                <div class="info-value">{student.academic_year.name if student.academic_year else 'Current'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Date of Birth</div>
                <div class="info-value">{student.date_of_birth.strftime('%d %b %Y') if student.date_of_birth else 'N/A'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Gender</div>
                <div class="info-value">{'Male' if student.gender == 'M' else 'Female' if student.gender == 'F' else 'Other'}</div>
            </div>
        </div>
    </div>
    """
        
        if latest:
            html += f"""
    <div class="grade-section">
        <div class="grade-badge">{latest.grade or '-'}</div>
        <div class="percentage">{latest.percentage:.1f}%</div>
        <div>Total Marks: {latest.total_marks or 0}/{latest.max_marks or 0}</div>
    </div>
    
    <div class="stats-grid">
        <div class="stat-box">
            <div class="stat-value">#{latest.class_rank or '-'}</div>
            <div class="stat-label">Class Rank</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">{latest.attendance_percentage:.1f}%</div>
            <div class="stat-label">Attendance</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">{latest.days_present or 0}/{latest.total_working_days or 0}</div>
            <div class="stat-label">Days Present</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">{latest.conduct.replace('_', ' ') if latest.conduct else 'Good'}</div>
            <div class="stat-label">Conduct</div>
        </div>
    </div>
    
    <div class="status-box" style="text-align: center; padding: 15px; background: {'#d1fae5' if latest.promotion_status == 'PROMOTED' else '#fee2e2'}; border-radius: 8px; margin: 20px 0;">
        <strong>Status:</strong> <span class="status-{'promoted' if latest.promotion_status == 'PROMOTED' else 'detained'}">{latest.promotion_status}</span>
        {f' → Promoted to {latest.promoted_to_class.name}' if latest.promoted_to_class else ''}
    </div>
            """
            
            if latest.remarks:
                html += f"""
    <div class="remarks">
        <div class="remarks-title">Teacher's Remarks:</div>
        <div>{latest.remarks}</div>
    </div>
                """
        
        # Academic History
        if history.count() > 1:
            html += """
    <h3 style="margin-top: 30px; color: #4f46e5;">Academic History</h3>
    <table class="history-table">
        <thead>
            <tr>
                <th>Year</th>
                <th>Class</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Rank</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            """
            for h in history:
                status_class = 'promoted' if h.promotion_status == 'PROMOTED' else 'detained'
                html += f"""
            <tr>
                <td>{h.academic_year.name if h.academic_year else '-'}</td>
                <td>{h.class_enrolled.name if h.class_enrolled else '-'}</td>
                <td>{h.percentage:.1f}% ({h.total_marks or 0}/{h.max_marks or 0})</td>
                <td><strong>{h.grade or '-'}</strong></td>
                <td>#{h.class_rank or '-'}</td>
                <td class="status-{status_class}">{h.promotion_status}</td>
            </tr>
                """
            html += """
        </tbody>
    </table>
            """
        
        html += f"""
    <div class="signatures">
        <div class="signature">
            <div class="signature-line">Class Teacher</div>
        </div>
        <div class="signature">
            <div class="signature-line">Principal</div>
        </div>
        <div class="signature">
            <div class="signature-line">Parent/Guardian</div>
        </div>
    </div>
    
    <div class="footer">
        Generated on {timezone.now().strftime('%d %B %Y at %I:%M %p')} | {school.name}
    </div>
</body>
</html>
        """
        
        return html
