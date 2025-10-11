from django.urls import path
from . import views

urlpatterns = [
    path("", views.speaker_screen, name="speakers_screen"),
    path("update_time/<int:speaker_id>/", views.update_time, name="update_time"),
    path("set_speaker/", views.set_speaker, name="unset_speaker"),
    path("set_speaker/<int:speaker_id>/", views.set_speaker, name="set_speaker"),
    path("client/", views.client_screen, name="client_screen"),
]
