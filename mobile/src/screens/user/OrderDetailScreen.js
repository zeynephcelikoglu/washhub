import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const OrderDetailScreen = ({ route }) => {
  const { order } = route.params || {};
  const navigation = useNavigation();

  if (!order) {
    return (
      <View style={styles.container}>
        <Text>Sipariş verisi bulunamadı</Text>
      </View>
    );
  }

  const getStatusText = (status) => {
    const map = {
      pending_owner: 'Beklemede',
      accepted: 'Onaylandı',
      courier_assigned: 'Kurye Atandı',
      in_transit: 'Yolda',
      delivered: 'Teslim Edildi',
      cancelled: 'İptal Edildi',
    };
    return map[status] || status;
  };

  const getStatusColor = (status) => ({
    pending_owner: '#FF9500',
    accepted: '#34C759',
    courier_assigned: '#007AFF',
    in_transit: '#5856D6',
    delivered: '#00C7BE',
    cancelled: '#FF3B30',
  }[status] || '#999');

  const handleRepeatOrder = async () => {
    try {
      const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
      const serviceType = firstItem?.serviceType || 'washing';

      const selectedProducts = (order.items || []).map(i => {
        if (!i) return null;
        if (i.product && typeof i.product === 'object') {
          const prod = i.product;
          return { 
            product: prod, 
            productId: prod._id || prod.id, 
            quantity: i.quantity,
            name: prod.name || prod.title,
            price: prod.price || prod.basePrice || 0,
            serviceType: i.serviceType || serviceType
          };
        }
        if (i.productId) {
          return { 
            productId: i.productId, 
            name: i.name || '', 
            price: i.price || 0, 
            quantity: i.quantity,
            serviceType: i.serviceType || serviceType
          };
        }
        if (i.product && typeof i.product === 'string') {
          return { 
            productId: i.product, 
            name: i.name || '', 
            price: i.price || 0, 
            quantity: i.quantity,
            serviceType: i.serviceType || serviceType
          };
        }
        return null;
      }).filter(p => p !== null);

      navigation.navigate('HomeTab', { 
        screen: 'OrderAddressAndTime', 
        params: { 
          selectedService: serviceType, 
          selectedProducts, 
          originalTotalPrice: order.totalPrice, 
          isRepeatOrder: true 
        } 
      });
    } catch (err) {
      console.log('Repeat order error', err);
      Alert.alert('Hata', 'Tekrar sipariş işlemi sırasında bir hata oluştu');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Order Header */}
      <View style={styles.headerSection}>
        <Text style={styles.orderId}>Sipariş #{order._id?.slice(-6)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>

      {/* Products */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ürünler</Text>
        {order.items && order.items.length > 0 ? (
          order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name || 'Ürün'}</Text>
              <Text style={styles.itemQty}>x{item.quantity}</Text>
              <Text style={styles.itemPrice}>{(item.price * item.quantity).toFixed(2)} ₺</Text>
            </View>
          ))
        ) : (
          <Text>Ürün bulunamadı</Text>
        )}
      </View>

      {/* Address */}
      {order.address && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teslimat Adresi</Text>
          <Text style={styles.addressText}>
            {typeof order.address === 'object' ? order.address.street : order.address}
          </Text>
        </View>
      )}

      {/* Pickup Date & Time */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alış Tarihi & Saati</Text>
        <Text style={styles.detailText}>
          {order.pickupDate ? new Date(order.pickupDate).toLocaleDateString('tr-TR') : 'N/A'} - {order.pickupTime || 'N/A'}
        </Text>
      </View>

      {/* Delivery Date & Time */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Teslim Tarihi & Saati</Text>
        <Text style={styles.detailText}>
          {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('tr-TR') : 'N/A'} - {order.deliveryTime || 'N/A'}
        </Text>
      </View>

      {/* Notes */}
      {order.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notlar</Text>
          <Text style={styles.detailText}>{order.notes}</Text>
        </View>
      )}

      {/* Total Price */}
      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>Toplam</Text>
        <Text style={styles.totalPrice}>{order.totalPrice} ₺</Text>
      </View>

      {/* Rating if delivered */}
      {order.rating && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Değerlendirme</Text>
          <Text style={styles.ratingText}>⭐ {order.rating.toFixed(1)}</Text>
        </View>
      )}

      {/* Repeat Button (if order is completed) */}
      {['delivered', 'cancelled'].includes(order.status) && (
        <TouchableOpacity style={styles.repeatButton} onPress={handleRepeatOrder}>
          <Text style={styles.repeatButtonText}>Siparişi Tekrarla</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FA' },
  headerSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 12,
    marginVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2FF',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { fontSize: 13, color: '#0F172A', flex: 1 },
  itemQty: { fontSize: 13, color: '#666', marginHorizontal: 8 },
  itemPrice: { fontSize: 13, fontWeight: '600', color: '#007AFF' },
  addressText: { fontSize: 13, color: '#0F172A', lineHeight: 20 },
  detailText: { fontSize: 13, color: '#0F172A' },
  totalSection: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEF2FF',
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  totalPrice: { fontSize: 18, fontWeight: '800', color: '#007AFF' },
  ratingText: { fontSize: 14, color: '#FF9500', fontWeight: '600' },
  repeatButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  repeatButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

export default OrderDetailScreen;
