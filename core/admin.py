from django.contrib import admin
from .models import Speaker, Conference


@admin.register(Speaker)
class SpeakerAdmin(admin.ModelAdmin):
    list_display = ("full_name", "topic", "time_limit")
    search_fields = ("full_name", "topic")


@admin.register(Conference)
class ConferenceAdmin(admin.ModelAdmin):
    list_display = ("speaker", "start_time", "is_running", "get_remaining_time")
    list_editable = ("is_running",)
    readonly_fields = ("get_remaining_time",)

    def get_remaining_time(self, obj):
        remaining = obj.calculate_remaining_time()
        return f"{remaining} sec" if remaining is not None else "-"

    get_remaining_time.short_description = "Оставшееся время"

    def has_add_permission(self, request):
        # Разрешаем добавить только одну конференцию
        if Conference.objects.exists():
            return False
        return super().has_add_permission(request)
