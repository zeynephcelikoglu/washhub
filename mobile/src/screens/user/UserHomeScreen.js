import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';

const UserHomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 12 }}>Hoş geldiniz</Text>
      <TouchableOpacity
        style={{ backgroundColor: '#007AFF', paddingVertical: 18, paddingHorizontal: 36, borderRadius: 14 }}
        onPress={() => navigation.navigate('ServiceProductSelection')}
      >
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Sipariş Ver</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FA' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  greeting: { fontSize: 14, color: '#6B7280' },
  userName: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginTop: 4 },
  createOrderButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  createOrderText: { color: '#fff', fontWeight: '700' },
  section: { marginTop: 8, paddingVertical: 8, backgroundColor: 'transparent' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginHorizontal: 16, marginBottom: 12 },
  categoryCard: {
    width: 140,
    height: 110,
    borderRadius: 14,
    marginRight: 12,
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  categoryIcon: { fontSize: 28 },
  categoryTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 6 },
  shortcutsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  shortcutCard: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 6,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  shortcutIcon: { fontSize: 20, marginBottom: 8 },
  shortcutText: { fontSize: 13, color: '#334155', fontWeight: '600' },
  footerNote: { padding: 16, marginTop: 12 },
  footerText: { color: '#6B7280', fontSize: 13 },
});

export default UserHomeScreen;
