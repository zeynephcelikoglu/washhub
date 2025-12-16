import React, { useMemo, useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { orderApi } from '../../api/orderApi';
import { addressApi } from '../../api/addressApi';
import { AuthContext } from '../../context/AuthContext';

const OrderSummaryScreen = ({ navigation, route }) => {
  const { user } = useContext(AuthContext);
  const { selectedService, selectedProducts = [], address, pickupDate, pickupTime, deliveryDate, deliveryTime, notes } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [addressObj, setAddressObj] = useState(null);
  const [fetchingAddress, setFetchingAddress] = useState(false);
  // Service labels for UI only
  const SERVICE_LABELS = {
    washing: 'Yıkama',
    ironing: 'Ütüleme',
    drying: 'Kurutma',
    dry_cleaning: 'Kuru Temizleme',
  };
  const getServiceLabel = (serviceType) => {
    if (!serviceType) return 'Diğer';
    return SERVICE_LABELS[serviceType] || 'Diğer';
  };

  // Normalize selectedProducts to a flat shape used by UI and payload
  const normalizeSelectedProducts = (raw = []) => {
    return raw.map(item => {
      // shape: { product: {...}, quantity }
      if (item && item.product && typeof item.product === 'object') {
        const prod = item.product;
        const pid = prod._id || prod.id || item.productId || item._id || item.id;
        return {
          id: pid ? String(pid) : undefined,
          productId: pid ? String(pid) : undefined,
          name: prod.name || prod.title || item.name || '',
          price: Number(prod.price || prod.basePrice || 0),
          quantity: Number(item.quantity || item.qty || 0),
          serviceType: prod.serviceType || prod.type || item.serviceType || null,
        };
      }

      // shape: { productId, name, price, quantity, serviceType }
      const pid = item.productId || item._id || item.id;
      return {
        id: pid ? String(pid) : undefined,
        productId: pid ? String(pid) : undefined,
        name: item.name || item.title || '',
        price: Number(item.price || item.basePrice || 0),
        quantity: Number(item.quantity || item.qty || 0),
        serviceType: item.serviceType || item.type || null,
      };
    });
  };

  const normalizedProducts = useMemo(() => normalizeSelectedProducts(selectedProducts || []), [selectedProducts]);

  const total = useMemo(() => normalizedProducts.reduce((s, p) => s + (p.price || 0) * (p.quantity || 0), 0), [normalizedProducts]);

  useEffect(() => {
    const loadAddress = async () => {
      if (!address) return;
      if (typeof address === 'object' && address !== null) {
        setAddressObj(address);
        return;
      }
      if (!user?.id) return;
      setFetchingAddress(true);
      try {
        const res = await addressApi.getAddresses(user.id);
        const addrs = res.data.addresses || [];
        const found = addrs.find(a => a._id === address);
        if (found) setAddressObj(found);
      } catch (err) {
        console.log('Failed to fetch address', err);
      }
      setFetchingAddress(false);
    };
    loadAddress();
  }, [address, user]);

  const buildDateTimeISO = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    try {
      const time = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
      const dt = new Date(`${dateStr}T${time}`);
      if (isNaN(dt.getTime())) return new Date().toISOString();
      return dt.toISOString();
    } catch (err) {
      return new Date().toISOString();
    }
  };

  const pickupDateTimeISO = buildDateTimeISO(pickupDate, pickupTime);
  const deliveryDateTimeISO = buildDateTimeISO(deliveryDate, deliveryTime);

  const handleConfirm = async () => {
    // Build and validate payload exactly as backend expects
    const svc = (typeof selectedService === 'string') ? selectedService : (selectedService?.serviceType || selectedService?.type || selectedService?.value || selectedService?.name);

    // Ensure items include only product and quantity, filter out zero quantities
    const items = (normalizedProducts || [])
      .filter(p => p && Number(p.quantity) > 0)
      .map(p => ({ product: String(p.productId), quantity: Number(p.quantity) }));

    const addrId = (typeof address === 'string') ? address : (addressObj?._id || address?.id || address?._id);

    // Build payload matching backend controller expectations
    // NOTE: backend in repo expects `addressId: ObjectId`.
    // Some deployments may expect `address` instead; include both to be robust.
    const payload = {
      serviceType: svc,
      items,
      addressId: addrId,
      // include `address` too: if we have full address object, send it; otherwise send id string
      address: addressObj ? addressObj : addrId,
      pickupDate: pickupDate,
      pickupTime: pickupTime,
      deliveryDate: deliveryDate,
      deliveryTime: deliveryTime,
      notes: notes || '',
      totalPrice: Number(total.toFixed(2)),
    };

    // Debug payload prior to sending
    console.log('PAYLOAD', payload);
    console.log('FINAL PAYLOAD', payload);

    // Basic validation to avoid 400 from backend
    if (!payload.serviceType || typeof payload.serviceType !== 'string') {
      Alert.alert('Hata', 'Servis tipi seçimi geçersiz. Lütfen tekrar deneyin.');
      return;
    }
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      Alert.alert('Hata', 'En az bir ürün seçmelisiniz.');
      return;
    }
    if (!payload.items.every(i => i.product && (typeof i.quantity === 'number') && i.quantity > 0)) {
      Alert.alert('Hata', 'Ürün verileri geçersiz.');
      return;
    }
    if (!payload.addressId && !payload.address) {
      Alert.alert('Hata', 'Adres bilgisi eksik.');
      return;
    }
    if (!payload.pickupDate || !payload.pickupTime || !payload.deliveryDate || !payload.deliveryTime) {
      Alert.alert('Hata', 'Alış veya teslim zamanı geçersiz.');
      return;
    }

    setLoading(true);
    try {
      await orderApi.createOrder(payload);
      setLoading(false);
      // Navigate to the user's orders list (works with tab + nested stack)
      Alert.alert('Başarılı', 'Siparişiniz oluşturuldu', [{ text: 'Tamam', onPress: () => navigation.navigate('OrdersTab', { screen: 'UserOrders' }) }]);
    } catch (err) {
      setLoading(false);
      console.log('ORDER CREATE ERROR', err?.response?.data || err.message);
      const msg = err?.response?.data?.message || err?.message || 'Sipariş oluşturulamadı';
      Alert.alert('Hata', msg);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ürünler</Text>
          {normalizedProducts.length === 0 ? (
            <Text style={styles.muted}>Seçilen ürün yok</Text>
          ) : (
            (() => {
              const grouped = (function groupProductsByService(products) {
                const groups = {};
                products.forEach((p) => {
                  const key = p.serviceType || 'other';
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(p);
                });
                return groups;
              })(normalizedProducts);

              return Object.entries(grouped).map(([serviceType, items]) => (
                <View key={serviceType} style={styles.serviceGroup}>
                  <Text style={styles.serviceGroupTitle}>{getServiceLabel(serviceType)}</Text>
                  {items.map(item => (
                    <View key={item.productId || item.id} style={styles.productRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.productName}>{item.name || 'Ürün'}</Text>
                        <Text style={styles.productQty}>Adet: {item.quantity}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.productPrice}>{item.price.toFixed(2)}₺</Text>
                        <Text style={styles.productSubtotal}>{(item.price * item.quantity).toFixed(2)}₺</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ));
            })()
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Toplam</Text>
            <Text style={[styles.totalValue, { fontWeight: '900' }]}>{total.toFixed(2)}₺</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Adres</Text>
          {fetchingAddress ? (
            <ActivityIndicator />
          ) : addressObj ? (
            <View>
              <Text style={styles.addressTitle}>{addressObj.title}</Text>
              <Text style={styles.addressLine}>{addressObj.street || addressObj.fullAddress || ''}</Text>
              {addressObj.adresTarifi ? <Text style={styles.addressDetail}>{addressObj.adresTarifi}</Text> : null}
            </View>
          ) : (
            <Text style={styles.muted}>Adres bilgisi bulunamadı</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Zamanlar</Text>
          <View style={styles.timeRow}><Text style={styles.timeLabel}>Alış</Text><Text style={styles.timeValue}>{pickupDate} {pickupTime}</Text></View>
          <View style={styles.timeRow}><Text style={styles.timeLabel}>Teslim</Text><Text style={styles.timeValue}>{deliveryDate} {deliveryTime}</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notlar</Text>
          <Text style={styles.muted}>{notes || '—'}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.confirmBtn, loading && styles.disabledBtn]} onPress={handleConfirm} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Siparişi Onayla</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F8FA' },
  container: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  cardValue: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  muted: { color: '#64748B' },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  productName: { fontWeight: '700', color: '#0F172A' },
  productQty: { color: '#64748B', marginTop: 4 },
  productPrice: { fontWeight: '700', color: '#0F172A' },
  productSubtotal: { color: '#0F172A', marginTop: 4, fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  totalLabel: { fontWeight: '800', color: '#0F172A' },
  totalValue: { fontWeight: '800', color: '#0F172A' },
  serviceGroup: { marginBottom: 12 },
  serviceGroupTitle: { fontWeight: '600', marginBottom: 6, fontSize: 14, color: '#0F172A' },
  addressTitle: { fontWeight: '700', fontSize: 15, color: '#0F172A' },
  addressLine: { color: '#475569', marginTop: 6 },
  addressDetail: { color: '#64748B', marginTop: 6 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  timeLabel: { color: '#475569', fontWeight: '700' },
  timeValue: { color: '#0F172A', fontWeight: '700' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: 'transparent' },
  confirmBtn: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '800' },
  disabledBtn: { backgroundColor: '#9BB7FF' },
});

export default OrderSummaryScreen;
