import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const AppAlert = ({ visible, title, message, onClose }) => {
    return (
        <Modal
            animationType="fade"
            transparent
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>{title || 'Alert'}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>Ok</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default AppAlert;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    container: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        elevation: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#1e1e1e',
    },
    message: {
        fontSize: 16,
        color: '#444',
        textAlign: 'center',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#1e90ff',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
