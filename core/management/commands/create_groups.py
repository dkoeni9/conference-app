from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from core.models import Speaker, Conference


class Command(BaseCommand):
    help = "Creates operator and client groups"

    def handle(self, *args, **options):
        speaker_ct = ContentType.objects.get_for_model(Speaker)
        conference_ct = ContentType.objects.get_for_model(Conference)

        operator_group, created = Group.objects.get_or_create(name="operator")

        operator_permissions = [
            # Speaker permissions
            Permission.objects.get(codename="add_speaker", content_type=speaker_ct),
            Permission.objects.get(codename="change_speaker", content_type=speaker_ct),
            Permission.objects.get(codename="delete_speaker", content_type=speaker_ct),
            Permission.objects.get(codename="view_speaker", content_type=speaker_ct),
            # Conference permissions
            Permission.objects.get(
                codename="add_conference", content_type=conference_ct
            ),
            Permission.objects.get(
                codename="change_conference", content_type=conference_ct
            ),
            Permission.objects.get(
                codename="delete_conference", content_type=conference_ct
            ),
            Permission.objects.get(
                codename="view_conference", content_type=conference_ct
            ),
        ]

        operator_group.permissions.set(operator_permissions)
        self.stdout.write(
            self.style.SUCCESS(
                f'Группа "operator" {"создана" if created else "обновлена"}'
            )
        )

        client_group, created = Group.objects.get_or_create(name="client")

        client_permissions = [
            # Speaker permissions
            Permission.objects.get(codename="view_speaker", content_type=speaker_ct),
            # Conference permissions
            Permission.objects.get(
                codename="view_conference", content_type=conference_ct
            ),
        ]

        client_group.permissions.set(client_permissions)
        self.stdout.write(
            self.style.SUCCESS(
                f'Группа "client" {"создана" if created else "обновлена"}'
            )
        )

        self.stdout.write(self.style.SUCCESS("✅ Все группы настроены!"))
