import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { normalizeOrderItems } from '../../utils/normalizeOrderItems';
import OrderItemsList from '../../components/OrderItemsList';
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
      const normalized = normalizeOrderItems(order?.items || []);
      // Block repeat if snapshot data missing
      if (!normalized || normalized.length === 0) {
        Alert.alert('Tekrar Sipariş Hatası', 'Bu siparişte ürün bilgisi eksik olduğu için tekrar oluşturulamaz.');
        return;
      }
      if (normalized.length !== (order?.items?.length || 0)) {
        Alert.alert('Tekrar Sipariş Hatası', 'Bazı ürünler eksik bilgi içeriyor; tekrar sipariş oluşturulamıyor.');
        return;
      }

      const serviceType = normalized.length > 0 ? normalized[0].serviceType : 'washing';

      const selectedProducts = normalized.map(i => ({
        productId: i.productId || i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        serviceType: i.serviceType || serviceType,
        originalServiceType: i.originalServiceType || i.serviceType || serviceType,
      }));

      navigation.navigate('HomeTab', {
        screen: 'OrderAddressAndTime',
        params: {
          selectedService: serviceType,
          selectedProducts,
          originalTotalPrice: order.totalPrice,
          isRepeatOrder: true,
        },
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
        <OrderItemsList items={order?.items || []} totalPrice={order?.totalPrice} />
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

      {/* Total shown inside OrderItemsList; duplicate removed */}

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
  // total is displayed by OrderItemsList component
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
