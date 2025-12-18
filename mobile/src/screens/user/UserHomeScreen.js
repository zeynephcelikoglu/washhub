import React, { useState, useContext, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AuthContext } from '../../context/AuthContext';
import { orderApi } from '../../api/orderApi';

const getStatusText = (status) => {
  const statusMap = {
    pending: 'Onay Bekliyor',
    processing: 'Hazırlanıyor',
    confirmed: 'Onaylandı',
    ready: 'Teslime Hazır',
    picked_up: 'Teslim Ediliyor',
    in_transit: 'Yolda',
    delivered: 'Teslim Edildi',
    cancelled: 'İptal Edildi',
  };
  return statusMap[(status || '').toLowerCase()] || status;
};

const getStatusColor = (status) => {
  const colorMap = {
    pending: '#FFA500',
    processing: '#007AFF',
    ready: '#00C853',
    picked_up: '#2196F3',
    in_transit: '#2196F3',
    delivered: '#4CAF50',
    cancelled: '#F44336',
  };
  return colorMap[(status || '').toLowerCase()] || '#666';
};

const UserHomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  const [ordersLoading, setOrdersLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await orderApi.getOrdersByUser();
      const orders = response.data?.orders || response.data || [];

      console.log('Fetched all orders:', orders);

      // RECENT ORDERS: delivered or cancelled - sorted by date (newest first)
      const completedStatuses = ['delivered', 'cancelled'];
      const recent = orders
        .filter(order => completedStatuses.includes((order.status || '').toLowerCase()))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
      console.log('Recent orders:', recent);
      setRecentOrders(recent);

    } catch (error) {
      console.error('Error fetching orders:', error?.response?.data || error?.message || error);
      Alert.alert('Hata', 'Siparişler yüklenirken bir hata oluştu');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleCreateOrder = () => navigation.navigate('ServiceProductSelection');
  const handleOrders = () => navigation.navigate('UserOrders');
  const handleRepeatOrder = () => {
    if (recentOrders.length === 0) {
      return navigation.navigate('ServiceProductSelection');
    }
    const last = recentOrders[0];
    navigation.navigate('OrderDetail', { orderId: last._id });
  };
  
  const handleOpenOrder = (order) => navigation.navigate('OrderDetail', { orderId: order._id });
  const handleProfile = () => navigation.navigate('UserProfile');
  const handleSupport = () => Alert.alert('Destek', 'Destek ekibi ile iletişime geçmek için email: support@washhub.com');
  
  const services = [
    { 
      icon: 'local-laundry-service', 
      title: 'Yıkama', 
      description: 'Kıyafetleriniz özenle yıkanır',
      serviceType: 'washing'
    },
    { 
      icon: 'dry-cleaning', 
      title: 'Kuru Temizleme', 
      description: 'Hassas kumaşlar için özel bakım',
      serviceType: 'dry_cleaning'
    },
    { 
      icon: 'iron', 
      title: 'Ütü', 
      description: 'Çizgisiz, pürüzsüz giyim',
      serviceType: 'ironing'
    },
    { 
      icon: 'local-laundry-service', 
      title: 'Kurutma', 
      description: 'Hızlı ve güvenli kurutma',
      serviceType: 'drying'
    },
  ];

  const handleServicePress = (serviceType) => {
    navigation.navigate('ServiceProductSelection', { preSelectedService: serviceType });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hoş geldin,</Text>
            <Text style={styles.userName}>{(user && (user.name || user.email)) || 'Kullanıcı'}</Text>
            {user?.address && (
              <View style={styles.locationRow}>
                <MaterialIcons name="location-on" size={14} color="#666" />
                <Text style={styles.location}>{user.address.city || user.address.line1 || 'Konum'}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.profileButton} onPress={handleProfile}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <MaterialIcons name="account-circle" size={40} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={handleCreateOrder}>
            <MaterialIcons name="add-shopping-cart" size={32} color="#007AFF" />
            <Text style={styles.actionLabel}>Sipariş Ver</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleOrders}>
            <MaterialIcons name="local-shipping" size={32} color="#007AFF" />
            <Text style={styles.actionLabel}>Sipariş Takibi</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleRepeatOrder}>
            <MaterialIcons name="refresh" size={32} color="#007AFF" />
            <Text style={styles.actionLabel}>Tekrar Sipariş</Text>
          </TouchableOpacity>
        </View>

        {/* Services */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Hizmetlerimiz</Text>
          {services.map((service, idx) => (
            <TouchableOpacity 
              key={idx}
              style={styles.serviceCard}
              onPress={() => handleServicePress(service.serviceType)}
            >
              <View style={styles.serviceIconContainer}>
                <MaterialIcons name={service.icon} size={24} color="#007AFF" />
              </View>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDescription}>{service.description}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Orders */}
        {ordersLoading ? (
          <View style={styles.sectionCard}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : recentOrders.length > 0 ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="history" size={20} color="#666" />
              <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0 }]}>Son Siparişleriniz</Text>
            </View>
            {recentOrders.slice(0, 3).map((order) => (
              <TouchableOpacity 
                key={order._id}
                style={styles.recentOrderItem}
                onPress={() => handleOpenOrder(order)}
              >
                <View style={styles.orderInfo}>
                  <Text style={styles.orderItems} numberOfLines={1}>
                    {order.items && order.items.length ? order.items.map(i => i.name).join(', ') : 'Sipariş'}
                  </Text>
                  <Text style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderPrice}>{(order.totalPrice || 0).toFixed(2)} ₺</Text>
                  <MaterialIcons name="chevron-right" size={20} color="#ccc" />
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('OrdersTab')}
            >
              <Text style={styles.viewAllText}>Tümünü Gör</Text>
              <MaterialIcons name="chevron-right" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyRecent}>
            <MaterialIcons name="inbox" size={48} color="#ddd" />
            <Text style={styles.emptyRecentText}>Henüz tamamlanmış siparişiniz yok</Text>
          </View>
        )}

        {/* Support Card */}
        <TouchableOpacity style={styles.supportCard} onPress={handleSupport}>
          <MaterialIcons name="help-outline" size={24} color="#007AFF" />
          <Text style={styles.supportText}>Yardıma mı ihtiyacınız var?</Text>
          <MaterialIcons name="chevron-right" size={20} color="#007AFF" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { padding: 16, paddingBottom: 40 },

  /* Header */
  header: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 14, color: '#888', fontWeight: '500' },
  userName: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  location: { fontSize: 12, color: '#666', marginLeft: 4 },
  profileButton: { padding: 4 },
  avatarImage: { width: 40, height: 40, borderRadius: 20 },

  /* Quick Actions */
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionLabel: { fontSize: 12, color: '#0F172A', fontWeight: '700', marginTop: 8, textAlign: 'center' },

  /* Sections */
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },

  /* Services */
  servicesSection: { marginVertical: 8 },
  serviceCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  serviceIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F8FF', justifyContent: 'center', alignItems: 'center' },
  serviceContent: { flex: 1, marginLeft: 12 },
  serviceTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  serviceDescription: { fontSize: 12, color: '#666', marginTop: 4 },

  /* Recent Orders */
  recentOrderItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  orderInfo: { flex: 1 },
  orderItems: { fontWeight: '700', color: '#0F172A', fontSize: 13 },
  orderDate: { color: '#888', fontSize: 11, marginTop: 4 },
  orderRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  orderPrice: { fontWeight: '700', color: '#007AFF', marginRight: 8, fontSize: 13 },
  viewAllButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  viewAllText: { color: '#007AFF', fontWeight: '700', fontSize: 13 },
  emptyRecent: { backgroundColor: '#fff', borderRadius: 12, padding: 32, alignItems: 'center', marginVertical: 12 },
  emptyRecentText: { fontSize: 14, color: '#999', marginTop: 12, fontWeight: '600' },

  /* Support */
  supportCard: { backgroundColor: '#F0F8FF', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  supportText: { flex: 1, marginLeft: 12, fontWeight: '700', color: '#0F172A', fontSize: 13 },

  /* Common */
  emptyText: { color: '#888', fontSize: 13, textAlign: 'center', paddingVertical: 12 },
});

export default UserHomeScreen;
