from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .utils import calculate_monthly_salary
import datetime

class CalculateSalaryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        year = request.data.get('year')
        month = request.data.get('month')
        
        if not year or not month:
            # Default to current month
            today = datetime.date.today()
            year = today.year
            month = today.month
            
        try:
            count = calculate_monthly_salary(request.user.school, int(year), int(month))
            return Response({'message': f'Salary calculated for {count} staff members.'})
        except Exception as e:
            return Response({'error': str(e)}, status=400)
