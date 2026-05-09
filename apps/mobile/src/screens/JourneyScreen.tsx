import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import { CONFIG } from "../constants/config";

const API_BASE = `${CONFIG.API_URL}/api/journey`;

export default function JourneyScreen() {
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);
  const [status, setStatus] = useState("Ready to start journey");
  const [loading, setLoading] = useState(false);
  const websocketRef = useRef<WebSocket | null>(null);

  // New states for AI Demo
  const [etaMinutes, setEtaMinutes] = useState(2); // Demo speed (2 mins)
  const [showAnomalyAlert, setShowAnomalyAlert] = useState(false);
  const [lateAlert, setLateAlert] = useState(false);
  const [lastMovementTime, setLastMovementTime] = useState(Date.now());
  const [previousCoords, setPreviousCoords] = useState<any>(null);

  // =====================================================
  // START JOURNEY
  // =====================================================
  const startJourney = async () => {
    try {
      setLoading(true);
      setStatus("Starting journey...");
      
      // Ask location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied");
        return;
      }

      // Create journey in backend
      const response = await fetch(`${API_BASE}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: "demo_user",
          destination_name: "Home",
          destination_lat: 12.9716,
          destination_lng: 77.5946,
          expected_arrival_time: new Date(
            Date.now() + 30 * 60 * 1000
          ).toISOString(),
          shared_with: ["mom", "dad"],
        }),
      });

      const data = await response.json();
      console.log(data);

      if (!data.success) {
        Alert.alert("Failed to start journey");
        return;
      }

      // Save journey ID
      setJourneyId(data.journey_id);

      // Connect websocket
      connectWebSocket(data.journey_id);

      // Start GPS tracking
      startLocationTracking();

      setTracking(true);
      setStatus("Journey in progress");
      Alert.alert("Journey Started");
    } catch (error) {
      console.log(error);
      Alert.alert("Error starting journey");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // WEBSOCKET CONNECTION
  // =====================================================
  const connectWebSocket = (id: string) => {
    const wsUrl = `${CONFIG.API_URL.replace("http", "ws")}/api/journey/ws/location/${id}`;
    console.log("Connecting to WebSocket:", wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };
    ws.onmessage = (event) => {
      console.log("Server:", event.data);
    };
    ws.onerror = (error) => {
      console.log("WebSocket error", error);
    };
    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };
    websocketRef.current = ws;
  };

  // =====================================================
  // LIVE LOCATION TRACKING
  // =====================================================
  const startLocationTracking = async () => {
    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 20,
      },
      async (location) => {
        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: location.coords.speed || 0,
        };
        console.log("Location:", locationData);

        // Movement detection (AI Demo)
        if (previousCoords) {
          const latDiff = Math.abs(previousCoords.latitude - locationData.latitude);
          const lngDiff = Math.abs(previousCoords.longitude - locationData.longitude);
          
          // Very tiny movement
          if (latDiff < 0.00005 && lngDiff < 0.00005) {
            const currentTime = Date.now();
            // No movement for 10 seconds (Demo speed)
            if (currentTime - lastMovementTime > 10000) {
              setShowAnomalyAlert(true);
              setStatus("⚠️ Unusual stop detected");
            }
          } else {
            // User moved
            setLastMovementTime(Date.now());
            setShowAnomalyAlert(false); // Reset alert if they move? (Good for demo)
          }
        }
        setPreviousCoords(locationData);

        // Send to backend via websocket
        if (
          websocketRef.current &&
          websocketRef.current.readyState === WebSocket.OPEN
        ) {
          websocketRef.current.send(
            JSON.stringify(locationData)
          );
        }
      }
    );
  };

  // =====================================================
  // CONFIRM ARRIVAL
  // =====================================================
  const confirmArrival = async () => {
    if (!journeyId) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/confirm-arrival/${journeyId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: "demo_user",
          }),
        }
      );
      const data = await response.json();
      console.log(data);
      setStatus("Safe arrival confirmed");
      setTracking(false);
      Alert.alert("Arrival Confirmed");
      // Close websocket
      websocketRef.current?.close();
    } catch (error) {
      console.log(error);
      Alert.alert("Failed to confirm arrival");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // EMERGENCY BUTTON
  // =====================================================
  const triggerEmergency = () => {
    Alert.alert(
      "Emergency",
      "SOS Triggered!"
    );
    setStatus("Emergency alert triggered");
  };

  // =====================================================
  // EFFECTS (AI Demo)
  // =====================================================
  // ETA Countdown
  useEffect(() => {
    let timer: any;
    if (tracking && etaMinutes > 0) {
      timer = setInterval(() => {
        setEtaMinutes((prev) => prev - 1);
      }, 10000); // Demo speed (10 seconds per minute)
    }
    return () => clearInterval(timer);
  }, [tracking, etaMinutes]);

  // Auto Late Alert
  useEffect(() => {
    if (etaMinutes <= 0 && tracking) {
      setLateAlert(true);
      setStatus("⚠️ Journey delayed");
    }
  }, [etaMinutes, tracking]);

  // =====================================================
  // UI
  // =====================================================
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Safe Journey Home
      </Text>

      {/* Destination Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Destination
        </Text>
        <Text style={styles.destination}>
          Home
        </Text>
        <Text style={styles.subText}>
          ETA Remaining: {etaMinutes} mins
        </Text>
      </View>

      {/* Status */}
      <View style={styles.statusBox}>
        <Text style={styles.statusText}>
          {status}
        </Text>
      </View>

      {/* Anomaly Alert UI */}
      {showAnomalyAlert && (
        <View
          style={{
            backgroundColor: "#FFF3CD",
            padding: 15,
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: "#856404",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            ⚠️ Unusual stop detected
          </Text>
          <Text
            style={{
              marginTop: 5,
              color: "#856404",
            }}
          >
            Are you safe?
          </Text>
        </View>
      )}

      {/* Late Alert UI */}
      {lateAlert && (
        <View
          style={{
            backgroundColor: "#F8D7DA",
            padding: 15,
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: "#721C24",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            ⚠️ You are delayed
          </Text>
          <Text
            style={{
              marginTop: 5,
              color: "#721C24",
            }}
          >
            Trusted contacts are being notified.
          </Text>
        </View>
      )}

      {/* Start Journey */}
      {!tracking && (
        <TouchableOpacity
          style={styles.startButton}
          onPress={startJourney}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              Start Journey
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Confirm Arrival */}
      {tracking && (
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={confirmArrival}
        >
          <Text style={styles.buttonText}>
            Confirm Arrival
          </Text>
        </TouchableOpacity>
      )}

      {/* Emergency */}
      {tracking && (
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={triggerEmergency}
        >
          <Text style={styles.buttonText}>
            Emergency SOS
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    color: "#666",
  },
  destination: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
  },
  subText: {
    marginTop: 10,
    color: "#666",
  },
  statusBox: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 20,
  },
  statusText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  startButton: {
    backgroundColor: "#2196F3",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },
  emergencyButton: {
    backgroundColor: "#F44336",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
