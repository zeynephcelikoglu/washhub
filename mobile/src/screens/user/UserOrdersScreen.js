import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { orderApi } from '../../api/orderApi';
import SwipeableOrderCard from '../../components/SwipeableOrderCard';
import { useNavigation } from '@react-navigation/native';

const WORK_START = 8;
const WORK_END = 19;

const UserOrdersScreen = () => {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [repeatLoadingId, setRepeatLoadingId] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user?.id]);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderApi.getOrdersByUser(user.id);
      const all = response.data.orders || [];
      setOrders(all.filter(o => !o.hiddenForUser));
    } catch (error) {
      console.log('Siparişler yüklenemedi:', error);
    }
    setLoading(false);
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await orderApi.deleteOrder(orderId);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      Alert.alert('Başarılı', 'Sipariş silindi');
    } catch (error) {
      Alert.alert('Hata', 'Sipariş silinirken bir hata oluştu');
    }
  };

  const normalizeTime = (date) => {
    const d = new Date(date);
    if (d.getHours() < WORK_START) d.setHours(WORK_START, 0, 0, 0);
    if (d.getHours() >= WORK_END) {
      d.setDate(d.getDate() + 1);
      d.setHours(WORK_START, 0, 0, 0);
    }
    return d;
  };

  const handleRepeatOrder = async (order) => {
    // New behavior: do NOT alert and do NOT create immediately.
    // Instead, rebuild selectedProducts and navigate to OrderAddressAndTime
    try {
      setRepeatLoadingId(order._id);

      // Build selectedProducts in shapes accepted by OrderAddressAndTime / OrderSummary
      const selectedProducts = (order.items || []).map(i => {
        // if i.product is an object, keep it; if it's an id string, provide productId
        if (i && i.product && typeof i.product === 'object') {
          return { product: i.product, quantity: i.quantity };
        }
        return { productId: i.product || i.productId || i._id, name: i.name || i.title || '', price: i.price || i.basePrice || 0, quantity: i.quantity };
      });

      // navigate into the HomeTab stack to reuse the normal create-order flow
      try {
        navigation.navigate('HomeTab', { screen: 'OrderAddressAndTime', params: { selectedService: order.serviceType, selectedProducts, originalTotalPrice: order.totalPrice, isRepeatOrder: true } });
      } catch (navErr) {
        console.log('Navigation error', navErr);
        Alert.alert('Hata', 'Tekrar sipariş işlemi başlatılamadı');
      } finally {
        // clear loading marker after brief delay so UI updates
        setTimeout(() => setRepeatLoadingId(null), 700);
      }
    } catch (err) {
      console.log('Repeat navigation error', err);
      setRepeatLoadingId(null);
      Alert.alert('Hata', 'Tekrar sipariş işlemi sırasında bir hata oluştu');
    }
  };

  // Refresh orders when returning to this screen (e.g., after creating a repeated order)
  useEffect(() => {
    const unsub = navigation.addListener && navigation.addListener('focus', () => {
      fetchOrders();
    });
    return unsub;
  }, [navigation]);

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

  const renderOrderItem = ({ item }) => {
    const isCompleted = ['delivered', 'cancelled'].includes(item.status);

    const card = (
      <View style={styles.orderCard}>
        {isCompleted && (
          <TouchableOpacity
            style={styles.repeatIcon}
            onPress={() => handleRepeatOrder(item)}
            disabled={repeatLoadingId === item._id}
            activeOpacity={0.6}
          >
            {repeatLoadingId === item._id ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="refresh" size={16} color="#007AFF" />
            )}
          </TouchableOpacity>
        )}

        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Sipariş #{item._id?.slice(-6)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <Text style={styles.itemCount}>
            {item.items.length} öğe • {item.totalPrice} ₺
          </Text>
          <Text style={styles.date}>
            {new Date(item.pickupDate).toLocaleDateString('tr-TR')} - {item.pickupTime}
          </Text>
        </View>

        {item.rating && (
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>⭐ {item.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
    );

    const handlePressCard = async () => {
      try {
        // Build selectedProducts in the shape OrderSummary expects
        const selectedProducts = (item.items || []).map(i => {
          if (i && i.product && typeof i.product === 'object') {
            return { product: i.product, quantity: i.quantity };
          }
          // fallback shape
          return { productId: i.product || i.productId || i._id, name: i.name || '', price: i.price || 0, quantity: i.quantity };
        });

        const pickupDate = item.pickupDate ? new Date(item.pickupDate).toISOString().split('T')[0] : undefined;
        const pickupTime = item.pickupTime || '';
        const deliveryDate = item.deliveryDate ? new Date(item.deliveryDate).toISOString().split('T')[0] : undefined;
        const deliveryTime = item.deliveryTime || '';

        // Navigate into HomeTab's stack where OrderSummary is registered
        navigation.navigate('HomeTab', {
          screen: 'OrderSummary',
          params: {
            // Populate the params OrderSummary normally expects so it shows this order
            selectedService: item.serviceType,
            selectedProducts,
            address: item.address || item.addressId,
            pickupDate,
            pickupTime,
            deliveryDate,
            deliveryTime,
            notes: item.notes || '',
            // inform summary this is read-only view
            readOnly: true,
            // also pass full order object for reference if needed
            order: item,
          },
        });
      } catch (err) {
        console.log('Navigate to OrderSummary error', err);
        Alert.alert('Hata', 'Sipariş detayları açılamadı');
      }
    };

    const wrapped = (
      <TouchableOpacity activeOpacity={0.85} onPress={handlePressCard}>
        {card}
      </TouchableOpacity>
    );

    return isCompleted ? (
      <SwipeableOrderCard orderId={item._id} onDelete={handleDeleteOrder}>
        {wrapped}
      </SwipeableOrderCard>
    ) : (
      wrapped
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : orders.length > 0 ? (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          onRefresh={fetchOrders}
          refreshing={loading}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Henüz sipariş verilmemiş</Text>
          <Text style={styles.emptySubtext}>Yeni bir sipariş oluşturmaya başlayın</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 15 },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  repeatIcon: {
  position: 'absolute',
  bottom: 8,
  right: 8,
  zIndex: 2,
  backgroundColor: 'lightgray', 
  padding: 6,
  borderRadius: 16,
},

  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  orderDetails: { marginBottom: 10 },
  itemCount: { fontSize: 13, color: '#666', marginBottom: 4 },
  date: { fontSize: 12, color: '#999' },
  ratingRow: { paddingTop: 8, borderTopWidth: 1, borderTopColor: '#EEE' },
  ratingText: { fontSize: 13, color: '#FF9500', fontWeight: '600' },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#999', marginBottom: 5 },
  emptySubtext: { fontSize: 13, color: '#BBB' },
});

export default UserOrdersScreen;
