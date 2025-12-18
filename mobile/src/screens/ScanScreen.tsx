import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Camera, CameraView } from 'expo-camera'; // Modern usage might differ, checking generic
import * as Location from 'expo-location';
import { mobileApi } from '../lib/api';
import { useNavigation } from '@react-navigation/native';

export default function ScanScreen() {
    const navigation = useNavigation();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        const getPermissions = async () => {
            const cameraStatus = await Camera.requestCameraPermissionsAsync();
            const locationStatus = await Location.requestForegroundPermissionsAsync();
            setHasPermission(cameraStatus.status === 'granted' && locationStatus.status === 'granted');
        };
        getPermissions();
    }, []);

    const handleBarCodeScanned = async ({ type, data }: any) => {
        if (scanned) return;
        setScanned(true);

        try {
            // Get Location
            const location = await Location.getCurrentPositionAsync({});

            // Send to Backend
            const result = await mobileApi.scanQR(data, location.coords.latitude, location.coords.longitude);

            Alert.alert("Success", "Attendance Marked Successfully!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Attendance Failed", [
                { text: "Try Again", onPress: () => setScanned(false) }
            ]);
        }
    };

    if (hasPermission === null) return <Text style={styles.msg}>Requesting permissions...</Text>;
    if (hasPermission === false) return <Text style={styles.msg}>No access to camera or location</Text>;

    return (
        <View style={styles.container}>
            <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
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
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.cancelText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
                        <Text style={styles.rescanText}>Scan Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    msg: {
        flex: 1,
        backgroundColor: 'white',
        textAlign: 'center',
        paddingTop: 50,
    },
    overlayLayer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        zIndex: 1,
    },
    maskFlex: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    maskCenterRow: {
        flexDirection: 'row',
        height: 280,
    },
    scannerBox: {
        width: 280,
        height: 280,
        backgroundColor: 'transparent',
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#4ADE80', // Green-400
        borderWidth: 5,
        borderRadius: 4,
    },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

    controls: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 2,
        gap: 15, // Gap between buttons
    },
    overlayText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 20,
    },
    cancelButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    rescanButton: {
        backgroundColor: '#4ADE80', // Green-400
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#22c55e',
    },
    cancelText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    rescanText: {
        color: '#064e3b', // Dark Green
        fontWeight: 'bold',
        fontSize: 16,
    },
});
