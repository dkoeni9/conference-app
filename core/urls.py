from django.urls import path
from . import views

urlpatterns = [
    path("", views.speakers_screen, name="speakers_screen"),
    path(
        "get_speaker_time/<int:speaker_id>/",
        views.get_speaker_time,
        name="get_speaker_time",
    ),
    path("update_time/<int:speaker_id>/", views.update_time, name="update_time"),
    path("conference/toggle/", views.toggle_conference, name="conference-toggle"),
    path("set_speaker/", views.set_speaker, name="unset_speaker"),
    path("set_speaker/<int:speaker_id>/", views.set_speaker, name="set_speaker"),
    path(
        "add_extra_time/<int:speaker_id>/", views.add_extra_time, name="add_extra_time"
    ),
    path("client/", views.client_screen, name="client_screen"),
]
