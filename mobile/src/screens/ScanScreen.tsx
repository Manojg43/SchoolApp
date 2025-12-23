import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import { mobileApi } from '../lib/api';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';

// Haversine Algo
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export default function ScanScreen() {
    const navigation = useNavigation();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);

    // Manual GPS State
    const [canManual, setCanManual] = useState(false);
    const [schoolGPS, setSchoolGPS] = useState<{ lat: number, long: number } | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [loadingManual, setLoadingManual] = useState(false);

    useEffect(() => {
        const init = async () => {
            // 1. Permissions - ONLY Camera for QR Scan
            const cameraStatus = await Camera.requestCameraPermissionsAsync();
            setHasPermission(cameraStatus.status === 'granted');

            // 2. Fetch Profile for Rules (Background)
            try {
                const profile = await mobileApi.getMyProfile();
                if (profile?.user?.can_mark_manual_attendance) {
                    setCanManual(true);
                    setSchoolGPS(profile.user.school_gps);
                }
            } catch (e) {
                console.log("Failed to load profile settings", e);
            }
        };
        init();
    }, []);

    // Monitor Location for Manual Button - Only if we have permissions and manual is enabled
    useEffect(() => {
        let subscriber: any;
        const startWatching = async () => {
            // Check if we have location permission before watching
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') return;

            subscriber = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
                (loc) => {
                    if (schoolGPS) {
                        const dist = calculateDistance(
                            loc.coords.latitude, loc.coords.longitude,
                            schoolGPS.lat, schoolGPS.long
                        );
                        setDistance(dist);
                    }
                }
            );
        };

        if (canManual && schoolGPS) {
            startWatching();
        }

        return () => {
            if (subscriber) subscriber.remove();
        };
    }, [canManual, schoolGPS]);

    const handleBarCodeScanned = async ({ type, data }: any) => {
        if (scanned) return;
        setScanned(true);
        try {
            // Request location permission first
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    "Location Required",
                    "Location access is needed to verify attendance at school.",
                    [{ text: "Try Again", onPress: () => setScanned(false) }]
                );
                return;
            }

            // Get current location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });

            await mobileApi.scanQR(data, location.coords.latitude, location.coords.longitude);
            Alert.alert("Success", "Attendance Marked Successfully!", [{ text: "OK", onPress: () => navigation.goBack() }]);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Attendance Failed", [{ text: "Try Again", onPress: () => setScanned(false) }]);
        }
    };

    const handleManualCheckIn = async () => {
        setLoadingManual(true);
        try {
            // Ensure we have location permission for Manual GPS
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Required", "Location access is needed to verify your presence at school.");
                setLoadingManual(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            // Send NULL as token, true as isManual
            await mobileApi.scanQR(null, location.coords.latitude, location.coords.longitude, true);
            Alert.alert("Success", "Manual GPS Attendance Marked!", [{ text: "OK", onPress: () => navigation.goBack() }]);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Manual Attendance Failed");
        } finally {
            setLoadingManual(false);
        }
    };

    if (hasPermission === null) return <Text style={styles.msg}>Requesting camera permission...</Text>;
    if (hasPermission === false) return <Text style={styles.msg}>No access to camera</Text>;

    const isInRange = distance !== null && distance <= 55; // 50m tolerance + 5m buffer

    return (
        <View style={styles.container}>
            <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Visual Overlay */}
            <View style={styles.overlayLayer}>
                <View style={styles.maskFlex} />
                <View style={styles.maskCenterRow}>
                    <View style={styles.maskFlex} />
                    <View style={styles.scannerBox}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                    </View>
                    <View style={styles.maskFlex} />
                </View>
                <View style={styles.maskFlex} />
            </View>

            <View style={styles.controls}>
                <Text style={styles.overlayText}>Scan School QR Code</Text>

                {/* Standard Buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.cancelText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
                        <Text style={styles.rescanText}>Scan Again</Text>
                    </TouchableOpacity>
                </View>

                {/* Manual GPS Button */}
                {canManual && (
                    <View style={{ marginTop: 20 }}>
                        <TouchableOpacity
                            style={[
                                styles.manualButton,
                                (!isInRange || loadingManual) && styles.disabledButton
                            ]}
                            onPress={handleManualCheckIn}
                            disabled={!isInRange || loadingManual}
                        >
                            <Text style={styles.manualButtonText}>
                                {loadingManual ? "Marking..." :
                                    isInRange ? "📍 Mark Attendance (GPS)" :
                                        `Too Far (${distance?.toFixed(0)}m > 50m)`}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    msg: { flex: 1, backgroundColor: theme.colors.background, textAlign: 'center', paddingTop: 50 },
    overlayLayer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', zIndex: 1 },
    maskFlex: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
    maskCenterRow: { flexDirection: 'row', height: 280 },
    scannerBox: { width: 280, height: 280, backgroundColor: 'transparent', position: 'relative' },
    corner: { position: 'absolute', width: 40, height: 40, borderColor: theme.colors.success, borderWidth: 5, borderRadius: theme.borderRadius.s },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
    controls: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', zIndex: 2, gap: 10 },
    overlayText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 10, textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
    buttonRow: { flexDirection: 'row', gap: 20 },
    cancelButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    rescanButton: { backgroundColor: theme.colors.success, paddingVertical: 12, paddingHorizontal: 25, borderRadius: 30, borderWidth: 1, borderColor: '#22c55e' },
    cancelText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    rescanText: { color: '#064e3b', fontWeight: 'bold', fontSize: 16 },
    manualButton: { backgroundColor: theme.colors.primary, paddingVertical: 12, paddingHorizontal: 40, borderRadius: 30, elevation: 5 },
    disabledButton: { backgroundColor: theme.colors.text.muted, opacity: 0.8 },
    manualButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
