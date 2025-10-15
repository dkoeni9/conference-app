from datetime import timedelta
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from .models import Speaker, Conference
from .utils import broadcast_conference_update


def speaker_screen(request):
    speakers = Speaker.objects.all()
    conference = Conference.objects.first()
    current_speaker = conference.speaker if conference and conference.speaker else None

    return render(
        request,
        "core/operator.html",
        {
            "speakers": speakers,
            "current_speaker": current_speaker,
            "conference_is_running": conference.is_running if conference else False,
        },
    )


@require_POST
def set_speaker(request, speaker_id=None):
    """
    Оператор: установить текущего спикера и разослать обновление клиентам.
    Если speaker_id пустой - снять текущего спикера.
    """
    conference, _ = Conference.objects.get_or_create()

    if not speaker_id:
        conference.speaker = None
        conference.save()
        broadcast_conference_update()
        return JsonResponse(
            {
                "ok": True,
                "speaker": None,
                "topic": "",
                "time_limit": 0,
            }
        )

    speaker = get_object_or_404(Speaker, id=speaker_id)
    conference.speaker = speaker
    conference.save()
    broadcast_conference_update()

    return JsonResponse(
        {
            "ok": True,
            "speaker": speaker.full_name,
            "topic": getattr(speaker, "topic", ""),
            "time_limit": int(
                getattr(speaker, "time_limit", timedelta()).total_seconds()
            ),
        }
    )


@require_POST
def update_time(request, speaker_id):
    """
    AJAX: Обновить time_limit (добавить или уменьшить) и состояние конференции
    """
    speaker = get_object_or_404(Speaker, id=speaker_id)
    conference = Conference.objects.first()
    action = request.POST.get("action")
    extra_time = request.POST.get("extra_time")

    try:
        if extra_time:
            extra = int(extra_time)
            speaker.time_limit += timedelta(seconds=extra)

        elif action == "tick":
            speaker.time_limit -= timedelta(seconds=1)

        elif action == "start":
            conference.is_running = True
        elif action == "stop":
            conference.is_running = False

        speaker.save()
        conference.save()

        broadcast_conference_update()

        return JsonResponse(
            {"time_limit": speaker.time_limit, "is_running": conference.is_running}
        )

    except ValueError:
        return JsonResponse({"error": "Invalid value"}, status=400)


def client_screen(request):
    return render(request, "core/client.html")
