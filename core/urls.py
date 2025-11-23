from django.contrib.auth import views as auth_views
from django.urls import path
from . import views

urlpatterns = [
    path("", views.client_screen, name="client_screen"),
    path("dashboard/", views.dashboard, name="dashboard"),
    #
    path("update-time/<int:speaker_id>/", views.update_time, name="update_time"),
    path("add-speaker/", views.add_speaker, name="add_speaker"),
    path(
        "delete-speaker/<int:speaker_id>/", views.delete_speaker, name="delete_speaker"
    ),
    path("set-speaker/", views.set_speaker, name="unset_speaker"),
    path("set-speaker/<int:speaker_id>/", views.set_speaker, name="set_speaker"),
    path("set-visibility/", views.set_visibility, name="set_visibility"),
    #
    path("login/", views.CustomLoginView.as_view(), name="login"),
    path("logout/", auth_views.LogoutView.as_view(next_page="login"), name="logout"),
    path("access-denied/", views.access_denied, name="access_denied"),
    path("setup/", views.setup, name="setup"),
]
