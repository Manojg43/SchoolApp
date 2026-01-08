from django.urls import path
from .views import CalculateSalaryView, DownloadInvoiceView
from .pdf_views import GenerateReceiptPDF
from .views_payroll import SalaryStructureViewSet, PayrollViewSet, GeneratePayrollView
from .views_pdf import DownloadPayslipView, GetPayslipLinkView

urlpatterns = [
    # path('salary/payslip/<str:salary_id>/', GeneratePayslipPDF.as_view(), name='payslip-pdf'), # Deprecated
    path('receipt/<str:receipt_no>/', GenerateReceiptPDF.as_view(), name='receipt-pdf'),
    path('invoice/<int:invoice_id>/pdf/', DownloadInvoiceView.as_view(), name='invoice-pdf'),
    
    # Payroll Logic
    path('payroll/generate/', GeneratePayrollView.as_view(), name='payroll-generate'),
    path('salary/<int:pk>/download/', DownloadPayslipView.as_view(), name='download-payslip-pdf'),
    path('salary/<int:pk>/link/', GetPayslipLinkView.as_view(), name='get-payslip-link'),
]

from rest_framework.routers import DefaultRouter
from .views import (
    FeeCategoryViewSet, FeeStructureViewSet,
    # Fee Settlement ViewSets
    FeeInstallmentViewSet, FeeDiscountViewSet, CertificateFeeViewSet,
    # Receipt ViewSet
    ReceiptViewSet, InvoiceViewSet, # Added InvoiceViewSet
    # Views
    BulkFeeGenerationView, YearSettlementView, SettlementSummaryView,
    StudentPromotionView, CertificateFeeCheckView,
    PendingReceivablesView, PaymentHistoryView,
    # Student Fee Views
    StudentFeeView, SettleInvoiceView, StudentFeeSummaryView
)

router = DefaultRouter()
router.register(r'categories', FeeCategoryViewSet)
router.register(r'structure', FeeStructureViewSet)
router.register(r'installments', FeeInstallmentViewSet)
router.register(r'discounts', FeeDiscountViewSet)
router.register(r'certificate-fees', CertificateFeeViewSet)
router.register(r'receipts', ReceiptViewSet)  # Payment receipts
router.register(r'invoices', InvoiceViewSet)  # Centralized Invoices
router.register(r'payroll/structure', SalaryStructureViewSet, basename='salary-structure')
router.register(r'payroll/list', PayrollViewSet, basename='salary')

urlpatterns += [
    # Bulk operations
    path('settlement/generate/', BulkFeeGenerationView.as_view(), name='bulk-fee-generation'),
    path('settlement/<int:year_id>/settle/', YearSettlementView.as_view(), name='year-settlement'),
    path('settlement/<int:year_id>/summary/', SettlementSummaryView.as_view(), name='settlement-summary'),
    
    # Student promotion
    path('students/<int:student_id>/promote/', StudentPromotionView.as_view(), name='student-promotion'),
    
    # Certificate fee check
    path('certificate-fee/<str:cert_type>/', CertificateFeeCheckView.as_view(), name='certificate-fee-check'),
    
    # Payment tracking
    path('receivables/', PendingReceivablesView.as_view(), name='pending-receivables'),
    path('payment-history/', PaymentHistoryView.as_view(), name='payment-history'),
    
    # Student-specific fee management
    path('students/<int:student_id>/fees/', StudentFeeView.as_view(), name='student-fee-view'),
    path('students-pending/', StudentFeeSummaryView.as_view(), name='students-with-pending'),
    
    # Invoice settlement (waive/write-off)
    path('invoices/<int:invoice_id>/settle/', SettleInvoiceView.as_view(), name='settle-invoice'),
]

urlpatterns += router.urls
