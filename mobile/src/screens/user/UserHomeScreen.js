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

const categories = [
  { id: 'wash', title: 'Çamaşır Yıkama', icon: '🧺', color: '#E8F4FF' },
  { id: 'iron', title: 'Ütü', icon: '🧼', color: '#FFF7EA' },
  { id: 'dry', title: 'Kurutma', icon: '🌀', color: '#F2F7F2' },
  { id: 'dryclean', title: 'Kuru Temizleme', icon: '🧥', color: '#FFF1F0' },
];

const UserHomeScreen = ({ navigation }) => {
  const { user, signOut } = useContext(AuthContext);

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: item.color }]}
      onPress={() => navigation.navigate('CreateOrder', { category: item.id })}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={styles.categoryTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Merhaba,</Text>
          <Text style={styles.userName}>{user?.name || 'Müşteri'}</Text>
        </View>
        <TouchableOpacity
          style={styles.createOrderButton}
          onPress={() => navigation.navigate('CreateOrder')}
        >
          <Text style={styles.createOrderText}>Sipariş Oluştur</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hizmetler</Text>
        <FlatList
          data={categories}
          keyExtractor={(i) => i.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={renderCategory}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kısa Yollar</Text>
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('OrdersTab')}
          >
            <Text style={styles.shortcutIcon}>📦</Text>
            <Text style={styles.shortcutText}>Siparişlerim</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('AddressesTab')}
          >
            <Text style={styles.shortcutIcon}>📍</Text>
            <Text style={styles.shortcutText}>Adresler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            <Text style={styles.shortcutIcon}>👤</Text>
            <Text style={styles.shortcutText}>Profil</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footerNote}>
        <Text style={styles.footerText}>İhtiyacınıza göre kategori seçip hızlıca sipariş oluşturabilirsiniz.</Text>
      </View>
    </ScrollView>
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
