from django.urls import path
from .views import CalculateSalaryView, DownloadInvoiceView
from .pdf_views import GeneratePayslipPDF, GenerateReceiptPDF
from .views_payroll import SalaryStructureView, GeneratePayrollView, PayrollDashboardView, MarkPaidView
from .views_payroll import SalaryStructureView, GeneratePayrollView, PayrollDashboardView, MarkPaidView
from .views_pdf import DownloadPayslipView, GetPayslipLinkView

urlpatterns = [
    path('salary/calculate/', GeneratePayrollView.as_view(), name='calculate-salary'), # Replaced with new logic
    path('salary/payslip/<str:salary_id>/', GeneratePayslipPDF.as_view(), name='payslip-pdf'),
    path('receipt/<str:receipt_no>/', GenerateReceiptPDF.as_view(), name='receipt-pdf'),
    path('invoice/<int:invoice_id>/pdf/', DownloadInvoiceView.as_view(), name='invoice-pdf'),
    
    # New Payroll Endpoints
    path('payroll/structure/<int:staff_id>/', SalaryStructureView.as_view(), name='payroll-structure'),
    path('payroll/dashboard/', PayrollDashboardView.as_view(), name='payroll-dashboard'),
    path('payroll/dashboard/', PayrollDashboardView.as_view(), name='payroll-dashboard'),
    path('payroll/mark-paid/<int:salary_id>/', MarkPaidView.as_view(), name='payroll-mark-paid'),
    path('salary/<int:pk>/download/', DownloadPayslipView.as_view(), name='download-payslip-pdf'),
    path('salary/<int:pk>/link/', GetPayslipLinkView.as_view(), name='get-payslip-link'),
]

from rest_framework.routers import DefaultRouter
from .views import (
    FeeCategoryViewSet, FeeStructureViewSet,
    # Fee Settlement ViewSets (Phase 2)
    FeeInstallmentViewSet, FeeDiscountViewSet, CertificateFeeViewSet,
    # Fee Settlement Views
    BulkFeeGenerationView, YearSettlementView, SettlementSummaryView,
    StudentPromotionView, CertificateFeeCheckView
)

router = DefaultRouter()
router.register(r'categories', FeeCategoryViewSet)
router.register(r'structure', FeeStructureViewSet)
# Fee Settlement ViewSets
router.register(r'installments', FeeInstallmentViewSet)
router.register(r'discounts', FeeDiscountViewSet)
router.register(r'certificate-fees', CertificateFeeViewSet)

# Add settlement endpoints to urlpatterns
urlpatterns += [
    # Bulk operations
    path('settlement/generate/', BulkFeeGenerationView.as_view(), name='bulk-fee-generation'),
    path('settlement/<int:year_id>/settle/', YearSettlementView.as_view(), name='year-settlement'),
    path('settlement/<int:year_id>/summary/', SettlementSummaryView.as_view(), name='settlement-summary'),
    
    # Student promotion
    path('students/<int:student_id>/promote/', StudentPromotionView.as_view(), name='student-promotion'),
    
    # Certificate fee check
    path('certificate-fee/<str:cert_type>/', CertificateFeeCheckView.as_view(), name='certificate-fee-check'),
]

urlpatterns += router.urls
