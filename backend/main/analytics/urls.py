from django.urls import path

from .views import AnalyticsIdentifyView, AnalyticsTrackView

urlpatterns = [
    path("analytics/track/", AnalyticsTrackView.as_view(), name="analytics-track"),
    path(
        "analytics/identify/",
        AnalyticsIdentifyView.as_view(),
        name="analytics-identify",
    ),
]
