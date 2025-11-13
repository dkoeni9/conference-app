from django.contrib import admin
from .models import Speaker, Conference


@admin.register(Speaker)
class SpeakerAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "topic", "time_limit")
    search_fields = ("full_name", "topic")


@admin.register(Conference)
class ConferenceAdmin(admin.ModelAdmin):
    list_display = ("speaker", "is_running", "show_name", "show_topic")
    list_editable = ("is_running", "show_name", "show_topic")

    def has_add_permission(self, request):
        if Conference.objects.exists():
            return False
        return super().has_add_permission(request)
