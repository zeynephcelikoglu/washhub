import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { productApi } from '../../api/productApi';

const OwnerProductsScreen = () => {
  const { user, signOut } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState('washing');
  const [basePrice, setBasePrice] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  React.useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setListLoading(true);
    try {
      // use admin endpoint to get all products (including inactive)
      const res = await productApi.getAllProductsAdmin();
      const prods = res.data?.products || [];
      setProducts(prods);
    } catch (err) {
      Alert.alert('Hata', 'Ürünler yüklenemedi');
    }
    setListLoading(false);
  };

  const handleAddProduct = async () => {
    if (!name || !basePrice || !pricePerKg) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    try {
      await productApi.createProduct({
        name,
        description,
        serviceType,
        basePrice: parseFloat(basePrice),
        pricePerKg: parseFloat(pricePerKg),
        estimatedDays: 3
      });

      Alert.alert('Başarılı', 'Hizmet eklendi');
      setName('');
      setDescription('');
      setBasePrice('');
      setPricePerKg('');
      setServiceType('washing');
      await fetchProducts();
    } catch (error) {
      Alert.alert('Hata', error.message || 'Hizmet eklenemedi');
    }
    setLoading(false);
  };

  const handleUpdatePrice = (prod) => {
    Alert.prompt('Fiyat Güncelle', 'Yeni fiyatı girin (₺)', [
      { text: 'İptal' },
      {
        text: 'Güncelle',
        onPress: async (value) => {
          const newPrice = parseFloat(value);
          if (isNaN(newPrice)) return Alert.alert('Hata', 'Geçersiz fiyat');
          try {
            await productApi.updateProduct(prod._id, { price: newPrice, basePrice: newPrice });
            Alert.alert('Başarılı', 'Fiyat güncellendi');
            fetchProducts();
          } catch (err) {
            Alert.alert('Hata', 'Fiyat güncellenemedi');
          }
        }
      }
    ], 'plain-text', `${prod.price || prod.basePrice || ''}`);
  };

  const handleUpdateServiceType = (prod) => {
    const serviceOptions = [
      { key: 'washing', label: 'Yıkama' },
      { key: 'ironing', label: 'Ütü' },
      { key: 'drying', label: 'Kurutma' },
      { key: 'dry_cleaning', label: 'Kuru Temizleme' },
    ];
    
    Alert.alert(
      'Hizmet Türünü Değiştir',
      'Yeni hizmet türünü seçin:',
      [
        ...serviceOptions.map(opt => ({
          text: opt.label,
          onPress: async () => {
            try {
              await productApi.updateProduct(prod._id, { serviceType: opt.key });
              Alert.alert('Başarılı', 'Hizmet türü güncellendi');
              fetchProducts();
            } catch (err) {
              Alert.alert('Hata', 'Güncelleme başarısız');
            }
          }
        })),
        { text: 'İptal', style: 'cancel' }
      ]
    );
  };

  const handleToggleActive = async (prod) => {
    try {
      await productApi.updateProduct(prod._id, { isActive: !prod.isActive });
      fetchProducts();
    } catch (err) {
      Alert.alert('Hata', 'Durum güncellenemedi');
    }
  };

  const handleDelete = (prod) => {
    Alert.alert('Ürünü Sil', 'Ürünü silmek istediğinize emin misiniz?', [
      { text: 'İptal' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await productApi.deleteProduct(prod._id);
            Alert.alert('Silindi');
            fetchProducts();
          } catch (err) {
            Alert.alert('Hata', 'Silinemedi');
          }
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Yeni Hizmet Ekle</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Ürün Adı</Text>
          <TextInput
            style={styles.input}
            placeholder="örn: Standart Yıkama"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Açıklama</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Hizmet açıklaması"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
            editable={!loading}
          />
        </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Hizmet Türü</Text>
        <View style={styles.typeButtons}>
          {[
            { key: 'washing', label: 'Yıkama' },
            { key: 'ironing', label: 'Ütü' },
            { key: 'drying', label: 'Kurutma' },
            { key: 'dry_cleaning', label: 'Kuru Temizleme' },
          ].map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.typeButton,
                serviceType === type.key && styles.typeButtonActive
              ]}
              onPress={() => setServiceType(type.key)}
            >
              <Text style={[
                styles.typeButtonText,
                serviceType === type.key && styles.typeButtonTextActive
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

        <View style={styles.priceRow}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Taban Fiyat (₺)</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              keyboardType="decimal-pad"
              value={basePrice}
              onChangeText={setBasePrice}
              editable={!loading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Kg Fiyatı (₺) </Text>
            <TextInput
              style={styles.input}
              placeholder="5"
              keyboardType="decimal-pad"
              value={pricePerKg}
              onChangeText={setPricePerKg}
              editable={!loading}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addButton, loading && styles.disabledButton]}
          onPress={handleAddProduct}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>+ Hizmet Ekle</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={[styles.section, { marginTop: 8 }]}> 
        <Text style={styles.sectionTitle}>Mevcut Hizmetler</Text>
        {listLoading ? (
          <ActivityIndicator />
        ) : products.length === 0 ? (
          <Text style={{ color: '#666' }}>Henüz hizmet yok</Text>
        ) : (
          (() => {
            const serviceLabels = { washing: 'Yıkama', ironing: 'Ütü', drying: 'Kurutma', dry_cleaning: 'Kuru Temizleme' };
            const grouped = {};
            products.forEach(p => {
              const service = p.serviceType || 'washing';
              if (!grouped[service]) grouped[service] = [];
              grouped[service].push(p);
            });
            
            return Object.entries(grouped).map(([service, items]) => (
              <View key={service}>
                <Text style={{ fontWeight: '800', color: '#0F172A', marginTop: 12, marginBottom: 8 }}>📋 {serviceLabels[service] || service}</Text>
                {items.map((p) => (
                  <View key={p._id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                    <View>
                      <Text style={{ fontWeight: '800' }}>{p.name}</Text>
                      <Text style={{ color: '#64748B' }}>{p.category || 'Genel'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#1E6CF3', fontWeight: '800' }}>{p.price || p.basePrice || 0} ₺</Text>
                      <View style={{ flexDirection: 'row', marginTop: 8 }}>
                        <TouchableOpacity style={{ marginRight: 8 }} onPress={() => handleUpdatePrice(p)}>
                          <Text style={{ color: '#1E6CF3', fontWeight: '700' }}>Fiyat</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ marginRight: 8 }} onPress={() => handleUpdateServiceType(p)}>
                          <Text style={{ color: '#F59E0B', fontWeight: '700' }}>Tür</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ marginRight: 8 }} onPress={() => handleToggleActive(p)}>
                          <Text style={{ color: p.isActive ? '#10B981' : '#9CA3AF', fontWeight: '700' }}>{p.isActive ? 'Aktif' : 'Pasif'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(p)}>
                          <Text style={{ color: '#EF4444', fontWeight: '700' }}>Sil</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ));
          })()
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 15,
    borderRadius: 12,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#333',
  },
  textarea: {
    textAlignVertical: 'top',
    paddingVertical: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#FF9500',
    backgroundColor: '#FFF5E6',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#FF9500',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoSection: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 15,
    borderRadius: 12,
    padding: 15,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    marginTopColor: '#F0F0F0',
    marginTop: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default OwnerProductsScreen;
