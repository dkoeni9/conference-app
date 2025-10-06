from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.utils import timezone
from .models import Speaker, Conference
from .utils import broadcast_conference_update


def speakers_screen(request):
    """
    Главный экран с выбором спикера и таймером
    """
    speakers = Speaker.objects.all()
    first_speaker = speakers.first()
    initial_time = first_speaker.time_limit if first_speaker else 0
    return render(
        request, "core/index.html", {"speakers": speakers, "initial_time": initial_time}
    )


def get_speaker_time(request, speaker_id):
    """
    AJAX: вернуть текущее time_limit спикера
    """
    speaker = get_object_or_404(Speaker, id=speaker_id)
    return JsonResponse({"time_limit": speaker.time_limit})


@require_POST
def toggle_conference(request):
    conference, _ = Conference.objects.get_or_create()
    if not conference.is_running:
        # Start
        conference.is_running = True
        conference.start_time = timezone.now()
        conference.save()
    else:
        # Stop / pause: уменьшить лимит текущего спикера на прошедшее время
        if conference.start_time and conference.speaker:
            elapsed = int((timezone.now() - conference.start_time).total_seconds())
            sp = conference.speaker
            sp.time_limit = max(0, sp.time_limit - elapsed)
            sp.save()
        conference.is_running = False
        conference.start_time = None
        conference.save()

    broadcast_conference_update()
    return JsonResponse(
        {
            "is_running": conference.is_running,
            "start_time": (
                conference.start_time.isoformat() if conference.start_time else None
            ),
            "remaining": conference.calculate_remaining_time(),
        }
    )


@require_POST
def set_speaker(request, speaker_id):
    """
    Оператор: установить текущего спикера и разослать обновление клиентам.
    """
    speaker = get_object_or_404(Speaker, id=speaker_id)
    conference, _ = Conference.objects.get_or_create()
    conference.speaker = speaker
    # не меняем is_running/start_time — клиенту нужен только набор полей (имя/тема/лимит)
    conference.save()
    broadcast_conference_update()
    return JsonResponse(
        {
            "ok": True,
            "speaker": speaker.full_name,
            "topic": getattr(speaker, "topic", ""),
            "time_limit": getattr(speaker, "time_limit", None)
            or getattr(speaker, "duration", None)
            and int(speaker.duration) * 60,
        }
    )


def update_time(request, speaker_id):
    """
    AJAX: вычесть прошедшее время из time_limit
    """
    speaker = get_object_or_404(Speaker, id=speaker_id)
    if request.method == "POST":
        try:
            remaining = int(request.POST.get("remaining_time", speaker.time_limit))
            elapsed = speaker.time_limit - remaining
            speaker.time_limit = max(0, speaker.time_limit - elapsed)
            speaker.save()

            broadcast_conference_update()
        except ValueError:
            pass
        return JsonResponse({"time_limit": speaker.time_limit})


def add_extra_time(request, speaker_id):
    """
    AJAX: прибавить секунды к time_limit
    """
    speaker = get_object_or_404(Speaker, id=speaker_id)
    if request.method == "POST":
        try:
            extra = int(request.POST.get("extra_time", 0))
            speaker.time_limit += extra
            speaker.save()

            broadcast_conference_update()
        except ValueError:
            pass
    return JsonResponse({"time_limit": speaker.time_limit})


# WebSocket


def client_screen(request):
    return render(request, "core/client.html")
