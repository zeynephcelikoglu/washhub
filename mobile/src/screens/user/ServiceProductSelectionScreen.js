import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { productApi } from '../../api/productApi';

const SERVICES = [
  { key: 'washing', title: 'Yıkama', icon: 'washing-machine' },
  { key: 'ironing', title: 'Ütü', icon: 'iron' },
  { key: 'drying', title: 'Kurutma', icon: 'tumble-dryer' },
  { key: 'dry_cleaning', title: 'Kuru Temizleme', icon: 'hanger' },
];

const ServiceProductSelectionScreen = ({ navigation }) => {
  const [selectedService, setSelectedService] = useState('washing');
  const [products, setProducts] = useState([]);
  const [productsCache, setProductsCache] = useState({});
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch products whenever selectedService changes
  useEffect(() => {
    if (selectedService) {
      fetchProductsByService(selectedService);
    } else {
      setProducts([]);
      // do NOT clear quantities when switching away — keep selections global
    }
  }, [selectedService]);

  const fetchProductsByService = async (serviceType) => {
    setLoading(true);
    try {
      const res = await productApi.getProductsByService(serviceType);
      const prods = res.data.products || [];
      setProducts(prods);
      // merge into products cache
      setProductsCache(prev => {
        const next = { ...prev };
        prods.forEach(p => { next[p._id] = p; });
        return next;
      });
      // ensure quantities has entries for these products but do not reset existing quantities
      setQuantities(q => {
        const next = { ...q };
        prods.forEach(p => { if (!(p._id in next)) next[p._id] = 0; });
        return next;
      });
    } catch (err) {
      console.log('Ürünler yüklenemedi:', err);
      Alert.alert('Hata', 'Ürünler yüklenemedi');
    }
    setLoading(false);
  };

  const inc = (id) => setQuantities(q => ({ ...q, [id]: (q[id] || 0) + 1 }));
  const dec = (id) => setQuantities(q => ({ ...q, [id]: Math.max(0, (q[id] || 0) - 1) }));

  const selectedCount = Object.values(quantities).reduce((s, v) => s + (v || 0), 0);

  const handleContinue = () => {
    if (!selectedService) {
      Alert.alert('Hata', 'Lütfen bir hizmet seçin');
      return;
    }
    // Collect selected products across all services (persisted in quantities)
    const selectedProducts = Object.keys(quantities)
      .filter(id => (quantities[id] || 0) > 0)
      .map(id => {
        const p = productsCache[id] || products.find(x => x._id === id) || {};
        return {
          productId: id,
          name: p.name || p.title || '',
          price: Number(p.price || p.basePrice || 0),
          quantity: quantities[id] || 0
        };
      });
    if (selectedProducts.length === 0) {
      Alert.alert('Hata', 'En az bir ürün seçin');
      return;
    }
    navigation.navigate('OrderAddressAndTime', { selectedService, selectedProducts });
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDesc}>{item.description}</Text>
        <Text style={styles.productPrice}>{item.price || item.basePrice || 0} ₺</Text>
      </View>
      <View style={styles.qtyControl}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => dec(item._id)}><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
        <Text style={styles.qtyDisplay}>{quantities[item._id] || 0}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => inc(item._id)}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hizmetler</Text>

      <View style={styles.servicesRow}>
        {SERVICES.map(s => {
          const active = selectedService === s.key;
          return (
            <TouchableOpacity
              key={s.key}
              style={[styles.serviceBox, active ? styles.serviceBoxActive : styles.serviceBoxInactive]}
              onPress={() => setSelectedService(s.key)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name={s.icon} size={28} color={'#0F172A'} />
              <Text numberOfLines={1} style={[styles.serviceTitle, active ? styles.serviceTitleActive : null]}>{s.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Ürünler</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList data={products} keyExtractor={p => p._id} renderItem={renderProduct} contentContainerStyle={{ padding: 16 }} />
      )}

      <View style={styles.bottomBar}>
        <Text style={styles.summaryText}>Seçilen adet: {selectedCount}</Text>
        <TouchableOpacity style={[styles.continueBtn, (!selectedService || selectedCount === 0) && { opacity: 0.5 }]} onPress={handleContinue} disabled={!selectedService || selectedCount === 0}>
          <Text style={styles.continueBtnText}>Devam</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FA' },
  header: { padding: 16, fontSize: 18, fontWeight: '800', color: '#0F172A' },
  servicesRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 },
  serviceBox: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 92,
    backgroundColor: '#fff',
    // shadow / elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceBoxActive: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#4A90E2' },
  serviceBoxInactive: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  serviceTitle: { marginTop: 8, fontWeight: '700', fontSize: 13, color: '#0F172A', textAlign: 'center', flexShrink: 1 },
  serviceTitleActive: { color: '#0F172A' },
  sectionTitle: { paddingHorizontal: 16, fontSize: 16, fontWeight: '700', marginTop: 12 },
  productRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginBottom: 10, padding: 12, borderRadius: 10 },
  productName: { fontSize: 14, fontWeight: '700' },
  productDesc: { fontSize: 12, color: '#64748B', marginTop: 4 },
  productPrice: { fontSize: 14, fontWeight: '800', color: '#007AFF', marginTop: 6 },
  qtyControl: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { paddingHorizontal: 10 },
  qtyBtnText: { fontSize: 18, color: '#007AFF', fontWeight: '700' },
  qtyDisplay: { width: 30, textAlign: 'center', fontWeight: '700' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', padding: 12, borderTopWidth: 1, borderTopColor: '#E6E9EE', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryText: { fontSize: 14, fontWeight: '700', color: '#334155' },
  continueBtn: { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
  continueBtnText: { color: '#fff', fontWeight: '800' },
});

export default ServiceProductSelectionScreen;
