from datetime import timedelta
from django.contrib.auth import views as auth_views
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.urls import reverse
from django.views.decorators.http import require_POST
from .forms import CustomAuthenticationForm
from .models import Speaker, Conference
from .utils import broadcast_conference_update, is_client, is_operator


@login_required
@user_passes_test(is_operator)
def dashboard(request):
    speakers = Speaker.objects.all()
    conference = Conference.objects.first()
    current_speaker = conference.speaker if conference and conference.speaker else None

    return render(
        request,
        "core/dashboard.html",
        {
            "speakers": speakers,
            "current_speaker": current_speaker,
        },
    )


@login_required
@user_passes_test(is_operator)
@require_POST
def add_speaker(request):
    name = request.POST.get("full_name")
    topic = request.POST.get("topic")
    seconds = int(request.POST.get("time_limit_seconds", 0))

    if not name or not topic:
        return JsonResponse({"error": "Все поля обязательны"}, status=400)

    speaker = Speaker.objects.create(
        full_name=name,
        topic=topic,
        time_limit=timedelta(seconds=seconds),
    )

    return JsonResponse(
        {
            "id": speaker.id,
            "full_name": speaker.full_name,
            "topic": speaker.topic,
            "time_limit_seconds": int(speaker.time_limit.total_seconds()),
        }
    )


@login_required
@user_passes_test(is_operator)
@require_POST
def delete_speaker(request, speaker_id):
    speaker = get_object_or_404(Speaker, id=speaker_id)
    speaker.delete()

    broadcast_conference_update()

    return JsonResponse({}, status=204)


@login_required
@user_passes_test(is_operator)
@require_POST
def set_speaker(request, speaker_id=None):
    """
    Оператор: установить текущего спикера и разослать обновление клиентам.
    Если speaker_id пустой - снять текущего спикера.
    """
    conference, _ = Conference.objects.get_or_create()

    if not speaker_id:
        conference.speaker = None
        conference.is_running = False
        conference.save()
        broadcast_conference_update()

        return JsonResponse(
            {
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
            "speaker": speaker.full_name,
            "topic": getattr(speaker, "topic", ""),
            "time_limit": int(
                getattr(speaker, "time_limit", timedelta()).total_seconds()
            ),
        }
    )


@login_required
@user_passes_test(is_operator)
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


@login_required
@user_passes_test(is_client)
def client_screen(request):
    conference = Conference.objects.first()
    current_speaker = conference.speaker if conference and conference.speaker else None

    return render(
        request,
        "core/client.html",
        {
            "current_speaker": current_speaker,
            "conference_is_running": conference.is_running if conference else False,
        },
    )


class CustomLoginView(auth_views.LoginView):
    template_name = "core/login.html"
    form_class = CustomAuthenticationForm

    def get_success_url(self):
        """Редирект в зависимости от роли"""
        user = self.request.user

        if is_operator(user):
            return reverse("dashboard")
        elif is_client(user):
            return reverse("client_screen")
        else:
            return reverse("access_denied")


def access_denied(request):
    return render(request, "core/access-denied.html", status=403)
