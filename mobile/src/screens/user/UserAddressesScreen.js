import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { addressApi } from '../../api/addressApi';

const initialForm = {
  title: '',
  mahalle: '',
  cadde: '',
  binaNo: '',
  daire: '',
  adresTarifi: '',
  phone: '',
  city: 'İstanbul',
  zipCode: '34000',
};

const UserAddressesScreen = () => {
  const { user } = useContext(AuthContext);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchAddresses();
    }
  }, [user?.id]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const response = await addressApi.getAddresses(user.id);
      setAddresses(response.data.addresses || []);
    } catch (error) {
      console.log('Adresler yüklenemedi:', error);
      Alert.alert('Hata', 'Adresler yüklenemedi');
    }
    setLoading(false);
  };

  const handleCreateAddress = async () => {
    // Validation
    if (!form.title) {
      Alert.alert('Eksik bilgi', 'Lütfen adres başlığı girin');
      return;
    }
    if (!form.mahalle) {
      Alert.alert('Eksik bilgi', 'Lütfen mahalle girin');
      return;
    }
    if (!form.cadde) {
      Alert.alert('Eksik bilgi', 'Lütfen cadde girin');
      return;
    }
    if (!form.phone) {
      Alert.alert('Eksik bilgi', 'Lütfen telefon numarası girin');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        mahalle: form.mahalle,
        cadde: form.cadde,
        binaNo: form.binaNo,
        daire: form.daire,
        adresTarifi: form.adresTarifi,
        phone: form.phone,
        city: form.city,
        zipCode: form.zipCode,
      };

      const res = await addressApi.createAddress(payload);
      setModalVisible(false);
      setForm(initialForm);
      // Update local list with new address returned from backend
      const created = res.data?.address;
      if (created) {
        setAddresses(prev => [created, ...prev]);
      } else {
        // fallback: refetch
        await fetchAddresses();
      }
      Alert.alert('Başarılı', 'Adres eklendi');
    } catch (error) {
      console.log('Adres eklenemedi:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Adres eklenemedi');
    }
    setSubmitting(false);
  };

  const openEditModal = (address) => {
    // Prefill form. backend stores `street` as single field; map to mahalle/cadde for form convenience
    setEditingId(address._id);
    setForm({
      title: address.title || '',
      mahalle: address.street || '',
      cadde: '',
      binaNo: '',
      daire: '',
      adresTarifi: address.adresTarifi || '',
      phone: address.phone || '',
      city: address.city || 'İstanbul',
      zipCode: address.zipCode || '34000',
    });
    setModalVisible(true);
  };

  const handleSaveAddress = async () => {
    // Validation
    if (!form.title) { Alert.alert('Eksik bilgi', 'Lütfen adres başlığı girin'); return; }
    if (!form.mahalle) { Alert.alert('Eksik bilgi', 'Lütfen mahalle/cadde girin'); return; }
    if (!form.phone) { Alert.alert('Eksik bilgi', 'Lütfen telefon numarası girin'); return; }

    setSubmitting(true);
    try {
      const street = form.cadde ? `${form.mahalle}, ${form.cadde}` : form.mahalle;
      const payload = {
        title: form.title,
        street,
        city: form.city,
        zipCode: form.zipCode,
        phone: form.phone,
      };

      if (editingId) {
        const res = await addressApi.updateAddress(editingId, payload);
        const updated = res.data?.address;
        if (updated) {
          setAddresses(prev => prev.map(a => (a._id === updated._id ? updated : a)));
        } else {
          await fetchAddresses();
        }
        setEditingId(null);
        setModalVisible(false);
        setForm(initialForm);
        Alert.alert('Başarılı', 'Adres güncellendi');
      } else {
        // create flow
        await handleCreateAddress();
      }
    } catch (error) {
      console.log('Adres kaydedilemedi:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Adres kaydedilemedi');
    }
    setSubmitting(false);
  };

  const handleDeleteAddress = (addressId) => {
    Alert.alert(
      'Adresi Sil',
      'Bu adresi silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            await addressApi.deleteAddress(addressId);
            setAddresses(prev => prev.filter(a => a._id !== addressId));
            Alert.alert('Başarılı', 'Adres silindi');
          } catch (err) {
            console.log('Adres silinirken hata:', err);
            Alert.alert('Hata', err.response?.data?.message || 'Adres silinemedi');
          }
        } }
      ]
    );
  };

  const renderAddressItem = ({ item }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.addressTitle}>{item.title}</Text>
          {item.isDefault && (
            <Text style={styles.defaultBadge}>Varsayılan Adres</Text>
          )}
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => openEditModal(item)}>
            <Ionicons name="pencil" size={18} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteAddress(item._id)}>
            <Ionicons name="trash" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.addressStreet}>{item.street}</Text>
      <Text style={styles.addressCity}>{item.city} {item.zipCode}</Text>
      <Text style={styles.addressPhone}>{item.phone}</Text>
      {item.latitude && item.longitude && (
        <Text style={styles.addressCoords}>📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <>
          <FlatList
            data={addresses}
            keyExtractor={(item) => item._id}
            renderItem={renderAddressItem}
            contentContainerStyle={styles.listContent}
            onRefresh={fetchAddresses}
            refreshing={loading}
            ListEmptyComponent={() => (
              <View style={styles.emptyBlock}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>Henüz adres eklemediniz</Text>
              </View>
            )}
          />

          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.addButtonText}>+ Yeni Adres Ekle</Text>
          </TouchableOpacity>
        </>
      )}

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setModalVisible(false); setEditingId(null); setForm(initialForm); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingId ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}</Text>
              <View style={{ width: 30 }} />
            </View>

            <TextInput 
              style={styles.input} 
              placeholder="Adres Başlığı (Ev, İş, vb.)" 
              value={form.title} 
              onChangeText={(t)=>setForm({...form, title: t})} 
              placeholderTextColor="#999"
            />
            
            <TextInput 
              style={styles.input} 
              placeholder="Mahalle" 
              value={form.mahalle} 
              onChangeText={(t)=>setForm({...form, mahalle: t})} 
              placeholderTextColor="#999"
            />
            
            <TextInput 
              style={styles.input} 
              placeholder="Cadde" 
              value={form.cadde} 
              onChangeText={(t)=>setForm({...form, cadde: t})} 
              placeholderTextColor="#999"
            />

            <View style={styles.rowInputs}>
              <TextInput 
                style={[styles.input, { flex: 1, marginRight: 8 }]} 
                placeholder="Bina No" 
                value={form.binaNo} 
                onChangeText={(t)=>setForm({...form, binaNo: t})} 
                placeholderTextColor="#999"
              />
              <TextInput 
                style={[styles.input, { flex: 1 }]} 
                placeholder="Daire" 
                value={form.daire} 
                onChangeText={(t)=>setForm({...form, daire: t})} 
                placeholderTextColor="#999"
              />
            </View>

            <TextInput 
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
              placeholder="Adres Tarifi (kapı kodu, kat, vb.)" 
              multiline 
              value={form.adresTarifi} 
              onChangeText={(t)=>setForm({...form, adresTarifi: t})} 
              placeholderTextColor="#999"
            />
            
            <TextInput 
              style={styles.input} 
              placeholder="Telefon Numarası" 
              keyboardType="phone-pad" 
              value={form.phone} 
              onChangeText={(t)=>setForm({...form, phone: t})} 
              placeholderTextColor="#999"
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#F3F4F6' }]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: '#111', fontWeight: '700' }}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#007AFF' }]} 
                onPress={handleSaveAddress} 
                disabled={submitting}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {submitting ? 'Kaydediliyor...' : (editingId ? 'Güncelle' : 'Kaydet')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FA' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 80 },
  addressCard: { 
    backgroundColor: '#fff', 
    borderRadius: 14, 
    padding: 16, 
    marginBottom: 12, 
    shadowColor: '#000', 
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  addressTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  defaultBadge: { fontSize: 11, color: '#007AFF', backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 6, fontWeight: '700' },
  editBtn: { padding: 8 },
  editIcon: { fontSize: 18, color: '#007AFF' },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 6, marginLeft: 8, borderRadius: 8, backgroundColor: 'transparent' },
  iconText: { fontSize: 16, color: '#374151' },
  addressStreet: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 },
  addressCity: { fontSize: 12, color: '#94A3B8', marginBottom: 6 },
  addressPhone: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
  addressCoords: { fontSize: 10, color: '#CBD5E1' },
  addButton: { 
    position: 'absolute', 
    right: 16, 
    bottom: 18, 
    marginTop: 16,
    backgroundColor: '#FF9500', 
    paddingHorizontal: 18, 
    paddingVertical: 12, 
    borderRadius: 12,
    shadowColor: '#FF9500',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  addButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  emptyBlock: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#9CA3AF', fontSize: 16, fontWeight: '600' },
  
  modalContent: { padding: 20, paddingTop: 45 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalClose: { fontSize: 24, color: '#64748B', fontWeight: '700' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  
  input: { 
    backgroundColor: '#fff', 
    padding: 14, 
    borderRadius: 10, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#E6E9EE',
    fontSize: 14,
    color: '#0F172A',
  },
  rowInputs: { flexDirection: 'row', marginBottom: 12 },
  
  modalButtonRow: { flexDirection: 'row', marginTop: 20, marginBottom: 40 },
  modalButton: { 
    flex: 1, 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default UserAddressesScreen;
