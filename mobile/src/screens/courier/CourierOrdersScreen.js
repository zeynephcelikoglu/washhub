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
import { AuthContext } from '../../context/AuthContext';
import { orderApi } from '../../api/orderApi';
import SwipeableOrderCard from '../../components/SwipeableOrderCard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CourierOrdersScreen = ({ navigation, route }) => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectedIds, setRejectedIds] = useState([]);
  const [activeTab, setActiveTab] = useState('active');

  // handle updatedOrder coming back from detail screen
  useEffect(() => {
    const updated = route?.params?.updatedOrder;
    if (updated) {
      setOrders(prev => {
        // If courier rejected (order became pending_courier), remove from our list
        if (updated.status === 'pending_courier') {
          return prev.filter(o => o._id !== updated._id);
        }

        const idx = prev.findIndex(o => o._id === updated._id);
        if (idx > -1) {
          const copy = [...prev];
          copy[idx] = updated;
          return copy;
        }
        return [updated, ...prev];
      });
      navigation.setParams({ updatedOrder: null });
    }
  }, [route?.params?.updatedOrder]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchOrders();
    });
    return unsubscribe;
  }, [navigation]);

  // load locally persisted rejected order ids for this courier
  useEffect(() => {
    const loadRejected = async () => {
      try {
        if (!user || !user.id) return;
        const key = `rejectedOrders_${user.id}`;
        const raw = await AsyncStorage.getItem(key);
        const arr = raw ? JSON.parse(raw) : [];
        setRejectedIds(arr);
      } catch (e) {
        console.error('Failed to load rejected ids', e);
      }
    };
    loadRejected();
  }, [user]);

  // Enable LayoutAnimation for Android
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderApi.getOrdersForCourier();
      const all = response.data.orders || [];
      // filter out orders this courier previously rejected
      const filtered = all.filter(o => !rejectedIds.includes(o._id));
      setOrders(filtered);
    } catch (error) {
      console.log('Siparişler yüklenemedi:', error);
    }
    setLoading(false);
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await orderApi.hideOrder(orderId);

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setOrders((prev) => prev.filter((o) => o._id !== orderId));

      Alert.alert('Başarılı', 'Sipariş silindi');
    } catch (error) {
      console.log('Silinirken hata oluştu', error);
      Alert.alert('Hata', 'Silinirken hata oluştu');
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending_owner': 'Beklemede',
      'courier_assigned': 'Kurye bekleniyor',
      'courier_accepted': 'Kurye kabul etti',
      'pending_courier': 'Kurye bekleniyor',
      'delivered': 'Teslim Edildi',
      'cancelled': 'İptal Edildi'
    };
    return statusMap[status] || status;
  };

  const renderOrderItem = ({ item }) => {
    const card = (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('CourierOrderDetail', { order: item })}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Sipariş #{item._id?.slice(-6)}</Text>
            <Text style={styles.customerName}>{item.userId?.name}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <Text style={styles.itemCount}>Toplam Tutar: {item.totalPrice} ₺</Text>
        </View>

        <View style={styles.actionRow}>
          <Text style={styles.tapHint}>Tap to view details →</Text>
        </View>
      </TouchableOpacity>
    );

    const completedStatuses = ['delivered', 'cancelled', 'completed'];
    if (completedStatuses.includes(item.status)) {
      return (
        <SwipeableOrderCard orderId={item._id} onDelete={handleDeleteOrder}>
          {card}
        </SwipeableOrderCard>
      );
    }

    // Active orders are not swipeable
    return card;
  };

  // Split into active (available/accepted) and history (delivered/cancelled/completed assigned to me)
  const activeStatuses = ['courier_assigned', 'courier_accepted', 'courier_assigned_waiting'];
  const activeOrders = orders.filter(o => activeStatuses.includes(o.status) && !o.hiddenForCourier);
  const historyOrders = orders.filter(o => ['delivered', 'cancelled', 'completed'].includes(o.status) && !o.hiddenForCourier);
  
  const displayedOrders = activeTab === 'active' ? activeOrders : historyOrders;

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#34C759" />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Tab Toggle */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'active' && styles.tabButtonActive]}
              onPress={() => setActiveTab('active')}
            >
              <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
                Aktif Siparişler
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
              onPress={() => setActiveTab('history')}
            >
              <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                Geçmiş Siparişler
              </Text>
            </TouchableOpacity>
          </View>

          {/* Orders List */}
          {displayedOrders.length > 0 ? (
            <FlatList
              data={displayedOrders}
              keyExtractor={(item) => item._id}
              renderItem={renderOrderItem}
              contentContainerStyle={styles.listContent}
              onRefresh={fetchOrders}
              refreshing={loading}
            />
          ) : (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>
                {activeTab === 'active' ? 'Aktif sipariş yok' : 'Geçmiş sipariş yok'}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#34C759',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  tabTextActive: {
    fontWeight: 'bold',
    color: '#34C759',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  customerName: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  orderDetails: {
    marginBottom: 10,
  },
  itemCount: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  address: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
    marginBottom: 2,
  },
  actionRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  tapHint: {
    fontSize: 11,
    color: '#34C759',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
  },
});

export default CourierOrdersScreen;
