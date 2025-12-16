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
            <View style={styles.overlay}>
                <Text style={styles.overlayText}>Scan School QR Code</Text>
                <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
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
    overlay: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    overlayText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    cancelButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 15,
        borderRadius: 30,
        paddingHorizontal: 40,
    },
    cancelText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
