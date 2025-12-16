from django.template.loader import get_template
from django.http import HttpResponse
from xhtml2pdf import pisa
from django.utils import translation
from io import BytesIO

def generate_pdf_response(template_name, context, language_code='en'):
    # Activate the requested language
    cur_language = translation.get_language()
    try:
        translation.activate(language_code)
        template = get_template(template_name)
        html = template.render(context)
        
        # Create PDF
        result = BytesIO()
        pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
        
        if not pdf.err:
            response = HttpResponse(result.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = 'filename="certificate.pdf"'
            return response
        return HttpResponse("Error Generating PDF", status=400)
    finally:
        translation.activate(cur_language)
