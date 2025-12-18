import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

const RoleSelectionScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>WashHub</Text>
        <Text style={styles.subtitle}>Çamaşır Yıkama Hizmetleri</Text>
      </View>

      <View style={styles.panelWrapper}>
        <View style={styles.rolesContainer}>
        <TouchableOpacity
          style={[styles.roleButton, styles.userButton]}
          onPress={() => navigation.navigate('Login', { role: 'user' })}
        >
          <Text style={styles.roleTitle}>Müşteri</Text>
          <Text style={styles.roleDescription}>Çamaşırlarımı yıkatmak istiyorum</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, styles.ownerButton]}
          onPress={() => navigation.navigate('Login', { role: 'owner' })}
        >
          <Text style={styles.roleTitle}>İşletme Sahibi</Text>
          <Text style={styles.roleDescription}>Çamaşırhanemi yönetmek istiyorum</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, styles.courierButton]}
          onPress={() => navigation.navigate('Login', { role: 'courier' })}
        >
          <Text style={styles.roleTitle}>Kurye</Text>
          <Text style={styles.roleDescription}>Teslimat yapmak istiyorum</Text>
        </TouchableOpacity>
        </View>
      </View>

      {/* Registration moved to panel-specific Login screens; no action here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
    justifyContent: 'flex-start',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  rolesContainer: {
    marginVertical: 20,
    gap: 15,
  },
  panelWrapper: {
    flex: 1,
    justifyContent: 'center',
    transform: [{ translateY: -40 }],
  },
  roleButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  userButton: {
    backgroundColor: '#007AFF',
  },
  ownerButton: {
    backgroundColor: '#FF9500',
  },
  courierButton: {
    backgroundColor: '#34C759',
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  roleDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  registerLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default RoleSelectionScreen;
