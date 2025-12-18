from django.urls import path
from .views import CalculateSalaryView, DownloadInvoiceView
from .pdf_views import GeneratePayslipPDF, GenerateReceiptPDF

urlpatterns = [
    path('salary/calculate/', CalculateSalaryView.as_view(), name='calculate-salary'),
    path('salary/payslip/<str:salary_id>/', GeneratePayslipPDF.as_view(), name='payslip-pdf'),
    path('receipt/<str:receipt_no>/', GenerateReceiptPDF.as_view(), name='receipt-pdf'),
    path('invoice/<int:invoice_id>/pdf/', DownloadInvoiceView.as_view(), name='invoice-pdf'),
]
