import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Conference
from asgiref.sync import sync_to_async


class ConferenceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.channel_layer.group_add("conference", self.channel_name)
        await self.send_current_state()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("conference", self.channel_name)

    async def receive(self, text_data):
        """Обработка входящих сообщений от клиента"""
        try:
            data = json.loads(text_data)

            if data.get("type") == "ping":
                await self.send(text_data=json.dumps({"type": "pong"}))
                return

        except json.JSONDecodeError:
            pass

    async def conference_update(self, event):
        await self.send_current_state()

    async def send_current_state(self):
        data = await sync_to_async(self._get_current_state, thread_sensitive=True)()
        print("WS -> send_current_state:", data)
        await self.send(text_data=json.dumps(data))

    def _get_current_state(self):
        conference = Conference.objects.select_related("speaker").first()
        if conference and conference.speaker:
            speaker = conference.speaker
            # robust read of time limit (new time_limit in seconds, fallback to legacy duration in minutes)
            time_limit = getattr(speaker, "time_limit", None)
            if time_limit is None:
                duration = getattr(speaker, "duration", None)
                time_limit = int(duration) * 60 if duration is not None else 0
            remaining = conference.calculate_remaining_time()
            return {
                "current_speaker": speaker.full_name,
                "topic": getattr(speaker, "topic", ""),
                "time_limit": int(time_limit),
                "remaining_time": remaining,
                "is_running": conference.is_running,
            }
        return {
            "current_speaker": None,
            "topic": None,
            "time_limit": 0,
            "remaining_time": 0,
            "is_running": False,
        }
