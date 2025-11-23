from django.shortcuts import redirect
from django.urls import reverse
from django.contrib.auth.models import User


class SetupMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        setup_url = reverse("setup")
        users_exist = User.objects.exclude(is_superuser=True).exists()

        if not users_exist and request.path != setup_url:
            return redirect(setup_url)

        return self.get_response(request)
