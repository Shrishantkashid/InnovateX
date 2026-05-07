"""
SafeGuard AI Engine — DBSCAN Heatmap Clustering
Clusters SOS incident locations into risk zones for the authority dashboard.
"""

import numpy as np
from pydantic import BaseModel, Field
from sklearn.cluster import DBSCAN

from config import DBSCAN_EPS, DBSCAN_MIN_SAMPLES, HEATMAP_DAYS_LOOKBACK


class IncidentPoint(BaseModel):
    """A single SOS incident location."""
    lat: float
    lng: float
    threat_score: int = 0
    created_at: str = ""


class RiskCluster(BaseModel):
    """A clustered risk zone."""
    centroid_lat: float
    centroid_lng: float
    radius_m: float
    incident_count: int
    avg_threat_score: float
    risk_level: str  # "low" | "moderate" | "high" | "critical"


class HeatmapResult(BaseModel):
    """Output of DBSCAN clustering."""
    clusters: list[RiskCluster] = []
    noise_points: int = 0
    total_incidents: int = 0


def _haversine_distance_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in meters between two lat/lng points."""
    R = 6371000  # Earth radius in meters
    phi1 = np.radians(lat1)
    phi2 = np.radians(lat2)
    delta_phi = np.radians(lat2 - lat1)
    delta_lambda = np.radians(lng2 - lng1)

    a = np.sin(delta_phi / 2) ** 2 + np.cos(phi1) * np.cos(phi2) * np.sin(delta_lambda / 2) ** 2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))

    return R * c


def _classify_risk_level(incident_count: int, avg_score: float) -> str:
    """Classify cluster risk level based on incident density and severity."""
    if incident_count >= 10 and avg_score >= 70:
        return "critical"
    elif incident_count >= 5 or avg_score >= 60:
        return "high"
    elif incident_count >= 3 or avg_score >= 40:
        return "moderate"
    return "low"


def cluster_incidents(incidents: list[IncidentPoint]) -> HeatmapResult:
    """
    Run DBSCAN clustering on SOS incident locations.

    Parameters (from config):
        eps = 0.005 (~500m at Indian latitudes)
        min_samples = 3

    Returns cluster centroids, radii, and risk levels for authority map rendering.
    """
    if not incidents or len(incidents) < DBSCAN_MIN_SAMPLES:
        return HeatmapResult(
            clusters=[],
            noise_points=len(incidents),
            total_incidents=len(incidents),
        )

    # Prepare coordinate matrix
    coords = np.array([[p.lat, p.lng] for p in incidents])
    scores = np.array([p.threat_score for p in incidents])

    # Run DBSCAN
    db = DBSCAN(eps=DBSCAN_EPS, min_samples=DBSCAN_MIN_SAMPLES, metric="euclidean")
    labels = db.fit_predict(coords)

    # Process clusters
    clusters: list[RiskCluster] = []
    unique_labels = set(labels)
    noise_count = int(np.sum(labels == -1))

    for label in unique_labels:
        if label == -1:
            continue  # Skip noise points

        mask = labels == label
        cluster_coords = coords[mask]
        cluster_scores = scores[mask]

        # Centroid
        centroid_lat = float(np.mean(cluster_coords[:, 0]))
        centroid_lng = float(np.mean(cluster_coords[:, 1]))

        # Radius: max distance from centroid to any point in cluster
        max_radius = 0.0
        for point in cluster_coords:
            dist = _haversine_distance_m(centroid_lat, centroid_lng, point[0], point[1])
            max_radius = max(max_radius, dist)

        # Ensure minimum radius for visualization
        max_radius = max(max_radius, 100.0)  # At least 100m

        avg_score = float(np.mean(cluster_scores))
        incident_count = int(np.sum(mask))

        risk_level = _classify_risk_level(incident_count, avg_score)

        clusters.append(RiskCluster(
            centroid_lat=round(centroid_lat, 6),
            centroid_lng=round(centroid_lng, 6),
            radius_m=round(max_radius, 1),
            incident_count=incident_count,
            avg_threat_score=round(avg_score, 1),
            risk_level=risk_level,
        ))

    # Sort by risk level (critical first)
    risk_order = {"critical": 0, "high": 1, "moderate": 2, "low": 3}
    clusters.sort(key=lambda c: risk_order.get(c.risk_level, 4))

    return HeatmapResult(
        clusters=clusters,
        noise_points=noise_count,
        total_incidents=len(incidents),
    )
