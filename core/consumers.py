from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from datetime import timedelta
import json
from .models import Conference


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
        """Полное обновление (при смене докладчика)"""
        await self.send_current_state()

    async def timer_tick(self, event):
        """Обновление только таймера"""
        data = await sync_to_async(self._get_timer_state, thread_sensitive=True)()
        print("WS -> timer_tick:", data)
        await self.send(text_data=json.dumps(data))

    async def send_current_state(self):
        data = await sync_to_async(self._get_current_state, thread_sensitive=True)()
        print("WS -> send_current_state:", data)
        await self.send(text_data=json.dumps(data))

    def _get_timer_state(self):
        """Возвращает только данные таймера"""
        conference = Conference.objects.select_related("speaker").first()
        if conference and conference.speaker:
            speaker = conference.speaker
            time_limit = getattr(speaker, "time_limit", timedelta(0))

            return {
                "type": "timer_update",
                "time_limit": int(time_limit.total_seconds()),
                "is_running": conference.is_running,
            }
        return {
            "type": "timer_update",
            "time_limit": 0,
            "is_running": False,
        }

    def _get_current_state(self):
        """Возвращает полное состояние"""
        conference = Conference.objects.select_related("speaker").first()
        if conference and conference.speaker:
            speaker = conference.speaker
            time_limit = getattr(speaker, "time_limit", timedelta(0))

            return {
                "type": "full_update",
                "current_speaker": speaker.formatted_name,
                "topic": getattr(speaker, "topic", ""),
                "time_limit": int(time_limit.total_seconds()),
                "is_running": conference.is_running,
                "show_name": conference.show_name,
                "show_topic": conference.show_topic,
            }
        return {
            "type": "full_update",
            "current_speaker": None,
            "topic": None,
            "time_limit": 0,
            "is_running": False,
            "show_name": True,
            "show_topic": True,
        }
