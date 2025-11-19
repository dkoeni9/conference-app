from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def broadcast_conference_update():
    channel_layer = get_channel_layer()
    if channel_layer is None:
        print("broadcast_conference_update: no channel_layer")
        return
    print(
        "broadcast_conference_update: sending 'conference.update' to group 'conference'"
    )
    async_to_sync(channel_layer.group_send)(
        "conference",
        {"type": "conference.update"},
    )


def broadcast_timer_tick():
    """Только обновление таймера"""
    channel_layer = get_channel_layer()
    if channel_layer is None:
        print("broadcast_timer_tick: no channel_layer")
        return
    print("broadcast_timer_tick: sending 'timer.tick' to group 'conference'")
    async_to_sync(channel_layer.group_send)(
        "conference",
        {"type": "timer.tick"},
    )


def is_client(user):
    return user.groups.filter(name="client").exists()


def is_operator(user):
    return user.groups.filter(name="operator").exists() or user.is_superuser
