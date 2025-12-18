import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { orderApi } from '../../api/orderApi';
import { isCourierAssigned } from '../../utils/orderHelpers';
import { normalizeOrderItems } from '../../utils/normalizeOrderItems';
import OrderItemsList from '../../components/OrderItemsList';

const OwnerApproveOrderScreen = ({ route, navigation }) => {
  const { order } = route.params;
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (isCourierAssigned(order)) return;
    setLoading(true);
    try {
      const res = await orderApi.updateOrderStatus(order._id, 'courier_assigned');
      const updated = res?.data?.order || null;
      Alert.alert('Başarılı', 'Sipariş kurya atama için hazır', [
        { text: 'Tamam', onPress: () => navigation.navigate('OwnerOrdersList', { updatedOrder: updated }) }
      ]);
    } catch (error) {
      Alert.alert('Hata', error.message || 'Onaylama başarısız');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    if (isCourierAssigned(order)) return;
    Alert.alert('İptal Et', 'Bu siparişi iptal etmek istediğinize emin misiniz?', [
      { text: 'Hayır', onPress: () => {} },
      { text: 'Evet', onPress: async () => {
        setLoading(true);
        try {
          const res = await orderApi.updateOrderStatus(order._id, 'cancelled');
          const updated = res?.data?.order || null;
          Alert.alert('Başarılı', 'Sipariş iptal edildi', [
            { text: 'Tamam', onPress: () => navigation.navigate('OwnerOrdersList', { updatedOrder: updated }) }
          ]);
        } catch (error) {
          Alert.alert('Hata', error.message);
        }
        setLoading(false);
      }}
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.orderId}>Sipariş #{order._id?.slice(-6)}</Text>
        <Text style={styles.status}>{order.status}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Müşteri Bilgileri</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Ad:</Text>
          <Text style={styles.value}>{order.userId?.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Telefon:</Text>
          <Text style={styles.value}>{order.userId?.phone}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Teslimat Adresi</Text>
        <View style={styles.addressBox}>
          <Text style={styles.addressTitle}>{order.addressId?.title}</Text>
          <Text style={styles.addressText}>{order.addressId?.street}</Text>
          <Text style={styles.addressText}>{order.addressId?.city} {order.addressId?.zipCode}</Text>
          <Text style={styles.addressPhone}>{order.addressId?.phone}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hizmetler</Text>
        {(() => {
          const normalized = normalizeOrderItems(order?.items || []);
          if (normalized.length === 0 && (order?.items?.length || 0) > 0) {
            return (
              <View style={{ padding: 12 }}>
                <Text style={{ color: '#B91C1C', fontWeight: '700' }}>Ürün verisi eksik: Bu sipariş ürün bilgisi içermiyor.</Text>
                <Text style={{ color: '#475569', marginTop: 6 }}>Toplam: {order.totalPrice} ₺</Text>
              </View>
            );
          }
          return <OrderItemsList items={order?.items || []} totalPrice={order?.totalPrice} />;
        })()}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tarihler</Text>
        <View style={styles.dateRow}>
          <View>
            <Text style={styles.dateLabel}>Alış:</Text>
            <Text style={styles.dateValue}>{new Date(order.pickupDate).toLocaleDateString('tr-TR')} {order.pickupTime}</Text>
          </View>
          <View>
            <Text style={styles.dateLabel}>Teslim:</Text>
            <Text style={styles.dateValue}>{new Date(order.deliveryDate).toLocaleDateString('tr-TR')} {order.deliveryTime}</Text>
          </View>
        </View>
      </View>

      {order.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notlar</Text>
          <Text style={styles.notesText}>{order.notes}</Text>
        </View>
      )}

      {(() => {
        const pastStatuses = ['accepted', 'cancelled', 'completed', 'delivered', 'courier_accepted'];
        if (isCourierAssigned(order)) {
          return null;
        }

        if (pastStatuses.includes(order.status)) {
          return null; // read-only for past orders
        }

        return (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, loading && styles.disabledButton]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>✗ İptal Et</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.approveButton, loading && styles.disabledButton]}
              onPress={handleApprove}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.approveButtonText}>✓ Onayla</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceGroup: { marginBottom: 12 },
  serviceHeader: { borderBottomWidth: 2, borderBottomColor: '#007AFF', paddingBottom: 8, marginBottom: 12 },
  serviceHeaderText: { fontSize: 16, fontWeight: '700', color: '#007AFF', letterSpacing: 1 },
  productItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between' },
  productName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  productDetails: { fontSize: 14, color: '#666' },
  serviceSubtotal: { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E6E9EE', alignItems: 'flex-end' },
  subtotalText: { fontSize: 14, fontWeight: '600', color: '#333' },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  status: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 12,
    padding: 15,
  },
  sectionTitle: {
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
  label: {
    fontSize: 13,
    color: '#666',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  addressBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  addressTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
    marginTop: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemName: {
    fontSize: 13,
    color: '#333',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTopColor: '#F0F0F0',
    marginTop: 8,
    paddingTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  notesText: {
    fontSize: 13,
    color: '#666',
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderRadius: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  actionInfoRow: {
    backgroundColor: 'transparent',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default OwnerApproveOrderScreen;
