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

const ServiceProductSelectionScreen = ({ navigation, route }) => {
  const { preSelectedService } = route?.params || {};
  const [selectedService, setSelectedService] = useState(preSelectedService || 'washing');
  const [products, setProducts] = useState([]);
  const [productsCache, setProductsCache] = useState({});
  const [quantities, setQuantities] = useState({});
  const [selectedProductsMap, setSelectedProductsMap] = useState({});
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

  // Auto-scroll to preSelectedService tab if it's passed
  useEffect(() => {
    if (preSelectedService && preSelectedService !== selectedService) {
      setSelectedService(preSelectedService);
    }
  }, [preSelectedService]);

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

  // Map frontend service types to backend enum values
  const mapServiceTypeToEnum = (serviceType) => {
    const mapping = {
      washing: 'standard',
      ironing: 'express',
      drying: 'express',
      dry_cleaning: 'dry_clean',
      dry_clean: 'dry_clean',
      standard: 'standard',
      express: 'express'
    };
    return mapping[serviceType] || 'standard';
  };

  const inc = (id) => {
    // Ensure we capture a full snapshot at selection time
    setSelectedProductsMap(prev => {
      const existing = prev[id];
      if (existing) {
        return { ...prev, [id]: { ...existing, quantity: existing.quantity + 1 } };
      }
      const p = productsCache[id] || products.find(x => x._id === id) || {};
      console.log('ORIGINAL PRODUCT serviceType:', p.serviceType);
      if (!p || (!p.name && !p.title) || (p.price === undefined || p.price === null)) {
        console.error('FATAL: Product missing snapshot at selection', p);
        Alert.alert('Hata', 'Ürün verisi eksik olduğu için seçilemedi');
        return prev;
      }
      const snapshot = {
        productId: id,
        name: p.name || p.title,
        price: Number(p.price || p.basePrice || 0),
        quantity: 1,
        serviceType: mapServiceTypeToEnum(p.serviceType || selectedService || 'standard'),
        originalServiceType: p.serviceType || selectedService || null,
      };
      console.log('PRODUCT SELECTED WITH SNAPSHOT:', JSON.stringify(snapshot, null, 2));
      return { ...prev, [id]: snapshot };
    });
    // Also keep quantities for backward compatibility where needed
    setQuantities(q => ({ ...q, [id]: (q[id] || 0) + 1 }));
  };

  const dec = (id) => {
    setSelectedProductsMap(prev => {
      const existing = prev[id];
      if (!existing) return prev;
      const nextQty = Math.max(0, (existing.quantity || 0) - 1);
      if (nextQty === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: { ...existing, quantity: nextQty } };
    });
    setQuantities(q => ({ ...q, [id]: Math.max(0, (q[id] || 0) - 1) }));
  };

  const selectedCount = Object.values(selectedProductsMap).reduce((s, item) => s + (item.quantity || 0), 0);

  const handleContinue = () => {
    if (!selectedService) {
      Alert.alert('Hata', 'Lütfen bir hizmet seçin');
      return;
    }
    // Build selectedProducts array from snapshots captured at selection time
    console.log('CHECK selectedProductsMap:', JSON.stringify(selectedProductsMap, null, 2));
    const selectedProducts = Object.values(selectedProductsMap).map(p => ({
      productId: p.productId,
      name: p.name,
      price: p.price,
      quantity: p.quantity,
      serviceType: p.serviceType,
      originalServiceType: p.originalServiceType
    }));
    if (selectedProducts.length === 0) {
      Alert.alert('Hata', 'En az bir ürün seçin');
      return;
    }
    console.log('═══════════════════════════════════════');
    console.log('🔵 SELECTION SCREEN - handleContinue()');
    console.log('Selected Products:', JSON.stringify(selectedProducts, null, 2));
    console.log('═══════════════════════════════════════');
    // Validate snapshots integrity before navigating
    const incomplete = selectedProducts.filter(p => !p.name || p.price === undefined || p.price === null || !p.quantity || !p.originalServiceType);
    if (incomplete.length > 0) {
      console.error('FATAL: Incomplete products detected before navigation', JSON.stringify(incomplete, null, 2));
      Alert.alert('Hata', 'Bazı ürünlerin bilgisi eksik. Lütfen tekrar deneyin.');
      return;
    }
    console.log('NAVIGATING WITH COMPLETE SNAPSHOTS:', JSON.stringify(selectedProducts, null, 2));
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
        <Text style={styles.qtyDisplay}>{selectedProductsMap[item._id]?.quantity || 0}</Text>
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
