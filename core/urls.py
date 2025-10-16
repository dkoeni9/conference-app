from django.urls import path
from . import views

urlpatterns = [
    path("", views.client_screen, name="client_screen"),
    path("operator/", views.operator_screen, name="operator_screen"),
    path("update_time/<int:speaker_id>/", views.update_time, name="update_time"),
    path("add_speaker/", views.add_speaker, name="add_speaker"),
    path(
        "delete_speaker/<int:speaker_id>/", views.delete_speaker, name="delete_speaker"
    ),
    path("set_speaker/", views.set_speaker, name="unset_speaker"),
    path("set_speaker/<int:speaker_id>/", views.set_speaker, name="set_speaker"),
]
