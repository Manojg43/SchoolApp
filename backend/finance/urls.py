from django.urls import path
from .views import CalculateSalaryView, DownloadInvoiceView
from .pdf_views import GeneratePayslipPDF, GenerateReceiptPDF
from .views_payroll import SalaryStructureView, GeneratePayrollView, PayrollDashboardView, MarkPaidView

urlpatterns = [
    path('salary/calculate/', GeneratePayrollView.as_view(), name='calculate-salary'), # Replaced with new logic
    path('salary/payslip/<str:salary_id>/', GeneratePayslipPDF.as_view(), name='payslip-pdf'),
    path('receipt/<str:receipt_no>/', GenerateReceiptPDF.as_view(), name='receipt-pdf'),
    path('invoice/<int:invoice_id>/pdf/', DownloadInvoiceView.as_view(), name='invoice-pdf'),
    
    # New Payroll Endpoints
    path('payroll/structure/<int:staff_id>/', SalaryStructureView.as_view(), name='payroll-structure'),
    path('payroll/dashboard/', PayrollDashboardView.as_view(), name='payroll-dashboard'),
    path('payroll/mark-paid/<int:salary_id>/', MarkPaidView.as_view(), name='payroll-mark-paid'),
]

from rest_framework.routers import DefaultRouter
from .views import FeeCategoryViewSet, FeeStructureViewSet

router = DefaultRouter()
router.register(r'categories', FeeCategoryViewSet)
router.register(r'structure', FeeStructureViewSet)

urlpatterns += router.urls
