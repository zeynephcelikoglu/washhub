import React, { useState, useEffect, useContext } from 'react';
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
import { AuthContext } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CourierOrderDetailScreen = ({ route, navigation }) => {
  const { order } = route.params;
  const { user } = useContext(AuthContext);
  const [orderState, setOrderState] = useState(order);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Intentionally do not auto-assign on open. Courier must tap Accept explicitly.
  }, []);

  const handleMarkDelivered = async () => {
    Alert.alert('Teslimat Onayla', 'Bu siparişi teslim edildi olarak işaretlemek istediğinize emin misiniz?', [
      { text: 'İptal', onPress: () => {} },
      { text: 'Evet', onPress: async () => {
        setLoading(true);
        try {
          const res = await orderApi.markDelivered(orderState._id);
          const updated = res?.data?.order || null;
          Alert.alert('Başarılı', 'Sipariş teslim edildi olarak işaretlendi', [
            { text: 'Tamam', onPress: () => navigation.navigate('CourierOrdersList', { updatedOrder: updated }) }
          ]);
        } catch (error) {
          Alert.alert('Hata', error.message || 'İşlem başarısız');
        }
        setLoading(false);
      }}
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.orderId}>Sipariş #{orderState._id?.slice(-6)}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{orderState.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Müşteri Bilgileri</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Ad:</Text>
            <Text style={styles.value}>{orderState.userId?.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Telefon:</Text>
          <Text style={styles.value}>{orderState.userId?.phone}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Teslimat Adresi</Text>
        <View style={styles.addressBox}>
          <Text style={styles.addressTitle}>{orderState.addressId?.title}</Text>
          <Text style={styles.addressText}>{orderState.addressId?.street}</Text>
          <Text style={styles.addressText}>{orderState.addressId?.city} {orderState.addressId?.zipCode}</Text>
          <Text style={styles.addressPhone}>{orderState.addressId?.phone}</Text>
        </View>
      </View>

      <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hizmetler</Text>
            {/* Courier should not see item details; only total price */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Toplam Tutar:</Text>
              <Text style={styles.totalPrice}>{orderState.totalPrice} ₺</Text>
            </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tarihler</Text>
        <View style={styles.dateRow}>
          <View>
            <Text style={styles.dateLabel}>Alış:</Text>
            <Text style={styles.dateValue}>
              {new Date(orderState.pickupDate).toLocaleDateString('tr-TR')} {orderState.pickupTime}
            </Text>
          </View>
          <View>
            <Text style={styles.dateLabel}>Teslim:</Text>
            <Text style={styles.dateValue}>
              {new Date(orderState.deliveryDate).toLocaleDateString('tr-TR')} {orderState.deliveryTime}
            </Text>
          </View>
        </View>
      </View>

      {orderState.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notlar</Text>
          <Text style={styles.notesText}>{orderState.notes}</Text>
        </View>
      )}

      {/* Action buttons: Accept / Reject (for active incoming orders) */}
      {(() => {
        const pastStatuses = ['delivered', 'cancelled', 'completed'];
        const activeAcceptStatuses = ['pending_courier', 'courier_assigned', 'courier_assigned_waiting'];

        // If past status -> read-only
        if (pastStatuses.includes(orderState.status)) return null;

        // If order is active and awaiting courier decision, show Accept/Reject
        if (activeAcceptStatuses.includes(orderState.status) && (!orderState.courierId || orderState.courierId._id === user.id)) {
          return (
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.rejectButton, loading && styles.disabledButton]}
                onPress={() => {
                  Alert.alert('Siparişi Reddet', 'Bu siparişi reddetmek istiyor musunuz?', [
                    { text: 'Vazgeç', style: 'cancel' },
                    { text: 'Reddet', style: 'destructive', onPress: async () => {
                      setLoading(true);
                      try {
                        const res = await orderApi.rejectCourier(orderState._id);
                        const updated = res?.data?.order || null;
                        // persist rejected id so this courier never sees it again
                        try {
                          const key = `rejectedOrders_${user.id}`;
                          const raw = await AsyncStorage.getItem(key);
                          const arr = raw ? JSON.parse(raw) : [];
                          if (!arr.includes(orderState._id)) {
                            arr.push(orderState._id);
                            await AsyncStorage.setItem(key, JSON.stringify(arr));
                          }
                        } catch (e) {
                          console.error('Failed to persist rejected order locally', e);
                        }
                        // Remove from courier list / navigate back
                        Alert.alert('Başarılı', 'Sipariş reddedildi', [
                          { text: 'Tamam', onPress: () => navigation.navigate('CourierOrdersList', { updatedOrder: updated }) }
                        ]);
                      } catch (error) {
                        Alert.alert('Hata', error?.response?.data?.message || error.message || 'İşlem başarısız');
                      }
                      setLoading(false);
                    }}
                  ]);
                }}
                disabled={loading}
              >
                <Text style={styles.rejectButtonText}>✕ Reddet</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.acceptButton, loading && styles.disabledButton]}
                onPress={async () => {
                  setLoading(true);
                  try {
                    const res = await orderApi.acceptCourier(orderState._id);
                    const updated = res?.data?.order || null;
                    Alert.alert('Başarılı', 'Sipariş kabul edildi', [
                      { text: 'Tamam', onPress: () => navigation.navigate('CourierOrdersList', { updatedOrder: updated }) }
                    ]);
                  } catch (error) {
                    Alert.alert('Hata', error?.response?.data?.message || error.message || 'İşlem başarısız');
                  }
                  setLoading(false);
                }}
                disabled={loading}
              >
                <Text style={styles.acceptButtonText}>✓ Kabul Et</Text>
              </TouchableOpacity>
            </View>
          );
        }

        // If courier is assigned and status is courier_accepted, show deliver button (only for assigned courier)
        if (orderState.status === 'courier_accepted' && orderState.courierId && orderState.courierId._id === user.id) {
          return (
            <TouchableOpacity
              style={[styles.deliverButton, loading && styles.disabledButton]}
              onPress={handleMarkDelivered}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.deliverButtonText}>✓ Teslim Edildi</Text>
              )}
            </TouchableOpacity>
          );
        }

        return null;
      })()}

      {/* If current user is not the assigned courier, show hint */}
      {orderState?.courierId && orderState?.courierId._id && orderState.courierId._id !== user.id && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 30 }}>
          <Text style={{ color: '#999', fontSize: 13 }}>Bu sipariş başka bir kurye tarafından alındı.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusBadge: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
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
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
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
    color: '#34C759',
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
    color: '#34C759',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
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
  deliverButton: {
    backgroundColor: '#34C759',
    marginHorizontal: 15,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  deliverButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  rejectButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default CourierOrderDetailScreen;
