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
import { isCourierAssigned } from '../../utils/orderHelpers';

const OwnerOrdersScreen = ({ navigation, route }) => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  // Handle updated order coming from detail/approve screens to update lists without full refetch
  useEffect(() => {
    const updated = route?.params?.updatedOrder;
    if (updated) {
      setOrders(prev => {
        const idx = prev.findIndex(o => o._id === updated._id);
        if (idx > -1) {
          const copy = [...prev];
          copy[idx] = updated;
          return copy;
        }
        // if not found, prepend
        return [updated, ...prev];
      });
      // clear param to avoid re-processing
      navigation.setParams({ updatedOrder: null });
    }
  }, [route?.params?.updatedOrder]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchOrders();
    });
    return unsubscribe;
  }, [navigation]);

  // Enable LayoutAnimation for Android
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderApi.getOrdersByOwner();
      const all = response.data.orders || [];
      setOrders(all);
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

  const OrderCardContent = ({ item }) => (
    <View>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Sipariş #{item._id?.slice(-6)}</Text>
          <Text style={styles.customerName}>{item.userId?.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}> 
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.itemCount}>{item.items?.length || 0} öğe • {item.totalPrice} ₺</Text>
        <Text style={styles.date}>
          {new Date(item.pickupDate).toLocaleDateString('tr-TR')} - {item.pickupTime}
        </Text>
        <Text style={styles.address}>{item.addressId?.title}</Text>
      </View>

      <View style={styles.actionRow}>
        {!isCourierAssigned(item) && <Text style={styles.tapHint}>Detaylar →</Text>}
      </View>
    </View>
  );

  const renderHistoryItem = ({ item }) => {
    // Only allow swipe-to-delete for completed orders
    const deletableStatuses = ['delivered', 'cancelled'];
    const card = (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('ApproveOrder', { order: item })}
      >
        <OrderCardContent item={item} />
      </TouchableOpacity>
    );

    if (deletableStatuses.includes(item.status)) {
      return (
        <SwipeableOrderCard orderId={item._id} onDelete={handleDeleteOrder}>
          {card}
        </SwipeableOrderCard>
      );
    }

    return card;
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending_owner': 'Beklemede',
      'courier_assigned': 'Kurye Atandı',
      'delivered': 'Teslim Edildi',
      'cancelled': 'İptal Edildi'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending_owner': '#FF9500',
      'accepted': '#34C759',
      'courier_assigned': '#007AFF',
      'in_transit': '#5856D6',
      'delivered': '#00C7BE',
      'cancelled': '#FF3B30'
    };
    return colorMap[status] || '#999';
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('ApproveOrder', { order: item })}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Sipariş #{item._id?.slice(-6)}</Text>
          <Text style={styles.customerName}>{item.userId?.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}> 
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.itemCount}>{item.items?.length || 0} öğe • {item.totalPrice} ₺</Text>
        <Text style={styles.date}>
          {new Date(item.pickupDate).toLocaleDateString('tr-TR')} - {item.pickupTime}
        </Text>
        <Text style={styles.address}>{item.addressId?.title}</Text>
      </View>

      <View style={styles.actionRow}>
        <Text style={styles.tapHint}>Detaylar →</Text>
      </View>
    </TouchableOpacity>
  );

  // split orders into active and history
  const activeStatuses = ['pending_owner', 'courier_assigned'];
  const historyStatuses = ['delivered', 'cancelled'];

  const activeOrders = orders.filter(o => activeStatuses.includes(o.status) && !o.hiddenForOwner);
  const historyOrders = orders.filter(o => historyStatuses.includes(o.status) && !o.hiddenForOwner);
  
  const displayedOrders = activeTab === 'active' ? activeOrders : historyOrders;
  const displayedRenderItem = activeTab === 'active' ? renderOrderItem : renderHistoryItem;

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF9500" />
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
              renderItem={displayedRenderItem}
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
    borderBottomColor: '#FF9500',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  tabTextActive: {
    fontWeight: 'bold',
    color: '#FF9500',
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
    borderLeftColor: '#FF9500',
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
    paddingHorizontal: 12,
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
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
  },
  actionRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  tapHint: {
    fontSize: 11,
    color: '#FF9500',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
  },
});

export default OwnerOrdersScreen;
