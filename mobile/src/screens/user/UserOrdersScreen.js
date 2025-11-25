import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { orderApi } from '../../api/orderApi';

const UserOrdersScreen = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user?.id]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderApi.getOrdersByUser(user.id);
      setOrders(response.data.orders || []);
    } catch (error) {
      console.log('Siparişler yüklenemedi:', error);
    }
    setLoading(false);
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending_owner': 'Beklemede',
      'accepted': 'Onaylandı',
      'courier_assigned': 'Kurye Atandı',
      'in_transit': 'Yolda',
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
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Sipariş #{item._id?.slice(-6)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.itemCount}>{item.items.length} öğe • {item.totalPrice} ₺</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
  },
  ratingRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  ratingText: {
    fontSize: 13,
    color: '#FF9500',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#BBB',
  },
});

export default UserOrdersScreen;
