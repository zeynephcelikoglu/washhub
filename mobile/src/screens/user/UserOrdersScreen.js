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
        navigation.navigate('OrderDetail', { order: item });
      } catch (err) {
        console.log('Navigate to OrderDetail error', err);
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
