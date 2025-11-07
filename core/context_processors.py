from .utils import is_operator


def logo_link(request):
    user = request.user

    if not user.is_authenticated:
        return {"logo_url": "/login/"}

    if is_operator(user):
        return {"logo_url": "/dashboard/"}

    return {"logo_url": "/"}
