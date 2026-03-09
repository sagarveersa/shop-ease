import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def track_event(event_name, properties):
    token = settings.MIXPANEL_PROJECT_TOKEN
    if not token:
        return False

    payload = {
        "event": event_name,
        "properties": {
            "token": token,
            **properties,
        },
    }

    try:
        response = requests.post(
            settings.MIXPANEL_TRACK_URL,
            json=[payload],
            timeout=5,
        )
        response.raise_for_status()
        return True
    except requests.RequestException as exc:
        logger.warning("Mixpanel request failed: %s", exc)
        return False
