import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { serviceApi } from '../../api/serviceApi';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const OwnerServicesScreen = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await serviceApi.getAllServices();
      const data = res.data?.services || res.data || [];
      setServices(data);
    } catch (err) {
      console.log('Failed to load services', err);
      Alert.alert('Hata', 'Servisler yüklenemedi');
    }
    setLoading(false);
  };

  const startEdit = (item) => {
    setEditingServiceId(item._id);
    setEditedName(item.name || item.serviceName || '');
  };

  const cancelEdit = () => {
    setEditingServiceId(null);
    setEditedName('');
  };

  const saveEdit = async (id) => {
    if (!editedName || editedName.trim().length === 0) {
      Alert.alert('Hata', 'İsim boş olamaz');
      return;
    }
    setSaving(true);
    try {
      // send updated field as serviceName per requirement
      await serviceApi.updateService(id, { serviceName: editedName.trim() });
      // update local state
      setServices(prev => prev.map(s => (s._id === id ? { ...s, name: editedName.trim(), serviceName: editedName.trim() } : s)));
      cancelEdit();
    } catch (err) {
      console.log('Update failed', err);
      Alert.alert('Hata', 'Güncelleme başarısız');
    }
    setSaving(false);
  };

  const confirmDelete = (id) => {
    Alert.alert('Onay', 'Bu hizmeti silmek istediğinize emin misiniz?', [
      { text: 'Hayır', style: 'cancel' },
      { text: 'Evet', style: 'destructive', onPress: () => handleDelete(id) },
    ]);
  };

  const handleDelete = async (id) => {
    try {
      // animate removal
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      await serviceApi.deleteService(id);
      setServices(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      console.log('Delete failed', err);
      Alert.alert('Hata', 'Silme işlemi başarısız');
    }
  };

  const renderRow = ({ item }) => {
    const isEditing = editingServiceId === item._id;

    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          {!isEditing ? (
            <Text style={styles.name}>{item.name || item.serviceName}</Text>
          ) : (
            <TextInput
              value={editedName}
              onChangeText={setEditedName}
              style={styles.input}
              placeholder="Servis adı"
            />
          )}
        </View>

        <View style={styles.actions}>
          {!isEditing ? (
            <>
              <TouchableOpacity onPress={() => startEdit(item)} style={styles.iconBtn}>
                <Text style={styles.icon}>🖊️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(item._id)} style={styles.iconBtn}>
                <Text style={[styles.icon, { color: '#EF4444' }]}>🗑️</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => saveEdit(item._id)} style={[styles.actionBtn, styles.saveBtn]} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff"/> : <Text style={styles.actionText}>Kaydet</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelEdit} style={[styles.actionBtn, styles.cancelBtn]}>
                <Text style={styles.cancelText}>İptal</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hizmetler</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(i) => i._id}
          renderItem={renderRow}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={{ padding: 12 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FA' },
  header: { fontSize: 18, fontWeight: '800', padding: 16, color: '#0F172A' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12 },
  name: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  actions: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  iconBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  icon: { fontSize: 18 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E6E9EE', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, fontSize: 15, color: '#0F172A' },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginLeft: 8 },
  saveBtn: { backgroundColor: '#007AFF' },
  actionText: { color: '#fff', fontWeight: '800' },
  cancelBtn: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E6E9EE' },
  cancelText: { color: '#374151', fontWeight: '700' },
  sep: { height: 12 },
});

export default OwnerServicesScreen;
