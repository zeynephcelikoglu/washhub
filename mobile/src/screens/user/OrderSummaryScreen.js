import React, { useMemo, useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { orderApi } from '../../api/orderApi';
import { addressApi } from '../../api/addressApi';
import { AuthContext } from '../../context/AuthContext';
import OrderItemsList from '../../components/OrderItemsList';

const OrderSummaryScreen = ({ navigation, route }) => {
  const { user } = useContext(AuthContext);
  const { selectedService, selectedProducts = [], address, pickupDate, pickupTime, deliveryDate, deliveryTime, notes, readOnly, isRepeatOrder, originalTotalPrice } = route.params || {};
  React.useEffect(() => {
    console.log('RECEIVED PRODUCTS AT ORDER SUMMARY:', JSON.stringify(selectedProducts, null, 2));
  }, [selectedProducts]);
  const [loading, setLoading] = useState(false);
  const [addressObj, setAddressObj] = useState(null);
  const [fetchingAddress, setFetchingAddress] = useState(false);

  const mapServiceTypeToEnum = (serviceTypeValue) => {
    const mapping = {
      washing: 'standard',
      ironing: 'express',
      drying: 'express',
      dry_cleaning: 'dry_clean',
      dry_clean: 'dry_clean',
      standard: 'standard',
      express: 'express'
    };
    return mapping[serviceTypeValue] || 'standard';
  };

  // Normalize selectedProducts to a flat shape used by UI and payload
  const normalizeSelectedProducts = (raw = []) => {
    return raw.map(item => {
      if (!item) return null;
      
      // shape: { product: {...}, quantity, productId, name, price, serviceType }
      if (item.product && typeof item.product === 'object') {
        const prod = item.product;
        const pid = prod._id || prod.id || item.productId;
        return {
          id: pid ? String(pid) : undefined,
          productId: pid ? String(pid) : undefined,
          name: prod.name || prod.title || item.name || '',
          price: Number(prod.price || prod.basePrice || item.price || 0),
          quantity: Number(item.quantity || item.qty || 0),
          serviceType: item.serviceType || prod.serviceType || prod.type || null,
          originalServiceType: item.originalServiceType || prod.serviceType || null,
        };
      }

      // shape: { productId, name, price, quantity, serviceType } (from repeat orders)
      const pid = item.productId || item._id || item.id;
      return {
        id: pid ? String(pid) : undefined,
        productId: pid ? String(pid) : undefined,
        name: item.name || item.title || '',
        price: Number(item.price || item.basePrice || 0),
        quantity: Number(item.quantity || item.qty || 0),
        serviceType: item.serviceType || item.type || null,
        originalServiceType: item.originalServiceType || item.type || null,
      };
    }).filter(p => p !== null);
  };

  const normalizedProducts = useMemo(() => normalizeSelectedProducts(selectedProducts || []), [selectedProducts]);

  // Final items derived from `selectedProducts` (single source of truth)
  const finalItems = useMemo(() => (
    (normalizedProducts || []).filter(p => p && (Number(p.quantity) || 0) > 0 && (p.productId || p.id))
  ), [normalizedProducts]);

  const calculatedTotal = useMemo(() => finalItems.reduce((s, p) => s + (Number(p.price) || 0) * (Number(p.quantity) || 0), 0), [finalItems]);

  // Always recalculate total from items (keeps repeat and normal flows consistent)
  const total = calculatedTotal;

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

  const validateOrderItems = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) throw new Error('No products selected');
    for (const product of items) {
      if (!product.name || product.name === 'Unknown Product') throw new Error(`Product missing name: ${JSON.stringify(product)}`);
      if (product.price === undefined || product.price === null || Number(product.price) <= 0) throw new Error(`Product missing valid price: ${JSON.stringify(product)}`);
      if (!product.quantity || Number(product.quantity) < 1) throw new Error(`Product missing valid quantity: ${JSON.stringify(product)}`);
    }
    return true;
  };

  const handleConfirm = async () => {
    if (readOnly) return;
    // Build and validate payload exactly as backend expects
    
    // Ensure items include full snapshots (product/productId, name, price, quantity, serviceType)
    const items = (finalItems || []).map(p => {
      const id = String(p.productId || p.id || '');
      return {
        // keep legacy `product` field for backend compatibility and provide explicit `productId`
        product: id,
        productId: id,
        name: p.name || 'Ürün',
        price: Number(p.price || 0),
        quantity: Number(p.quantity || 0),
        serviceType: mapServiceTypeToEnum(p.serviceType || selectedService || 'standard'),
        originalServiceType: p.originalServiceType || p.serviceType || selectedService || null,
      };
    });

    // Filter out invalid entries just in case
    const filteredItems = items.filter(i => (i.product || i.productId) && Number(i.quantity) > 0);

    const addrId = (typeof address === 'string') ? address : (addressObj?._id || address?.id || address?._id);

    // Build payload matching backend controller expectations
    // Backend expects: items[], totalPrice, pickupDate, pickupTime, deliveryDate, deliveryTime, addressId, notes
    const payload = {
      items: filteredItems,
      addressId: addrId,
      pickupDate: pickupDate,
      pickupTime: pickupTime,
      deliveryDate: deliveryDate,
      deliveryTime: deliveryTime,
      notes: notes || '',
      totalPrice: Number(total.toFixed(2)),
    };

    // Debug items and payload prior to sending
    console.log('FINAL ITEMS', filteredItems);
    console.log('ORDER PAYLOAD', payload);
    console.log('═══════════════════════════════════════');
    console.log('🟢 ORDER SUMMARY - Creating Order');
    console.log('Payload items:', JSON.stringify(payload.items, null, 2));
    console.log('Total Price:', payload.totalPrice);
    console.log('═══════════════════════════════════════');

    // Basic validation to avoid 400 from backend
    // For repeat orders: skip service type and products validation (already from original order)
    // For normal orders: validate all fields
    
    // Validate snapshot presence before submitting
    try {
      validateOrderItems(filteredItems);
    } catch (err) {
      console.error('ORDER VALIDATION FAILED:', err.message);
      Alert.alert('Hata', 'Sipariş oluşturulamaz: ' + err.message);
      return;
    }

    if (!payload.addressId) {
      Alert.alert('Hata', 'Adres bilgisi eksik.');
      return;
    }
    if (!payload.pickupDate || !payload.pickupTime || !payload.deliveryDate || !payload.deliveryTime) {
      Alert.alert('Hata', 'Alış veya teslim zamanı geçersiz.');
      return;
    }
    if (!payload.totalPrice || payload.totalPrice <= 0) {
      Alert.alert('Hata', 'Toplam fiyat geçersiz.');
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
          <OrderItemsList items={finalItems} totalPrice={total} />
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

      {!readOnly && (
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.confirmBtn, loading && styles.disabledBtn]} onPress={handleConfirm} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Siparişi Onayla</Text>}
          </TouchableOpacity>
        </View>
      )}
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
