from rest_framework.pagination import PageNumberPagination


class StandardResultsPagination(PageNumberPagination):
    """
    Standard pagination for most endpoints.
    Returns 20 items per page by default.
    Clients can request up to 100 items per page.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class LargeResultsPagination(PageNumberPagination):
    """
    Pagination for endpoints that typically return larger datasets.
    Returns 50 items per page by default.
    Clients can request up to 200 items per page.
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200
