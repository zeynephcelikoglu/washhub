import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { orderApi } from '../../api/orderApi';
import { addressApi } from '../../api/addressApi';

const OrderReviewScreen = ({ route, navigation }) => {
  const { user } = useContext(AuthContext);
  const { orderData } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [addressDetails, setAddressDetails] = useState(null);

  const getServiceTypeLabel = (originalServiceType, fallbackEnum) => {
    const labels = {
      washing: 'Yıkama',
      ironing: 'Ütü',
      drying: 'Kurutma',
      dry_cleaning: 'Kuru Temizleme',
      dry_clean: 'Kuru Temizleme',
      standard: 'Standart',
      express: 'Ekspres',
    };
    const key = originalServiceType || fallbackEnum;
    return labels[key] || key || '—';
  };

  React.useEffect(() => {
    if (orderData?.addressId && user?.id) {
      const fetchAddressDetails = async () => {
        try {
          const response = await addressApi.getAddresses(user.id);
          const addrs = response.data.addresses || [];
          const found = addrs.find(a => a._id === orderData.addressId);
          setAddressDetails(found);
        } catch (error) {
          console.log('Adres detayı yüklenemedi:', error);
        }
      };
      fetchAddressDetails();
    }
  }, [orderData?.addressId, user?.id]);

  if (!orderData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Görüntülenecek sipariş bilgisi yok</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Geri</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        items: orderData.items,
        totalPrice: orderData.totalPrice,
        pickupDate: orderData.pickupDate,
        pickupTime: orderData.pickupTime,
        deliveryDate: orderData.deliveryDate,
        deliveryTime: orderData.deliveryTime,
        addressId: orderData.addressId,
        notes: orderData.notes || '',
      };

      const response = await orderApi.createOrder(payload);
      if (response?.data?.success) {
        Alert.alert('Başarılı', 'Siparişiniz oluşturuldu!', [
          {
            text: 'Tamam',
            onPress: () => {
              navigation.getParent()?.navigate('OrdersTab');
            }
          }
        ]);
      }
    } catch (error) {
      console.log('Sipariş oluşturma hatası:', error);
      const errorMsg = error.response?.data?.message || 'Sipariş oluşturulamadı';
      Alert.alert('Hata', errorMsg);
    }
    setLoading(false);
  };

  const renderItemRow = ({ item }) => (
    <View style={styles.itemRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemQty}>Hizmet: {getServiceTypeLabel(item.originalServiceType, item.serviceType)}</Text>
        <Text style={styles.itemQty}>Adet: {item.quantity}</Text>
      </View>
      <Text style={styles.itemPrice}>{(item.price * item.quantity).toFixed(2)} ₺</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sipariş Özeti</Text>
      </View>

      {/* Adres Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Teslimat Adresi</Text>
        {addressDetails ? (
          <View style={styles.addressBox}>
            <Text style={styles.addressName}>{addressDetails.title}</Text>
            <Text style={styles.addressText}>{addressDetails.street}</Text>
            <Text style={styles.addressText}>{addressDetails.city} {addressDetails.zipCode}</Text>
            <Text style={styles.addressText}>{addressDetails.phone}</Text>
          </View>
        ) : (
          <Text style={styles.loadingText}>Adres yükleniyor...</Text>
        )}
      </View>

      {/* Ürünler Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📦 Seçilen Ürünler</Text>
        <FlatList
          data={orderData.items}
          keyExtractor={(item) => item.productId}
          scrollEnabled={false}
          renderItem={renderItemRow}
        />
      </View>

      {/* Tarih & Saat Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📅 Tarih & Saat</Text>
        <View style={styles.dateRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dateLabel}>Alış Tarihi</Text>
            <Text style={styles.dateValue}>{orderData.pickupDate}</Text>
            <Text style={[styles.dateLabel, { marginTop: 8 }]}>Alış Saati</Text>
            <Text style={styles.dateValue}>{orderData.pickupTime}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dateLabel}>Teslim Tarihi</Text>
            <Text style={styles.dateValue}>{orderData.deliveryDate}</Text>
            <Text style={[styles.dateLabel, { marginTop: 8 }]}>Teslim Saati</Text>
            <Text style={styles.dateValue}>{orderData.deliveryTime}</Text>
          </View>
        </View>
      </View>

      {/* Notlar Card */}
      {orderData.notes && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✏️ Notlar</Text>
          <Text style={styles.noteText}>{orderData.notes}</Text>
        </View>
      )}

      {/* Fiyat Özeti Card */}
      <View style={[styles.card, styles.priceCard]}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Ara Toplam:</Text>
          <Text style={styles.priceValue}>{orderData.totalPrice} ₺</Text>
        </View>
        <View style={styles.priceDivider} />
        <View style={styles.priceRow}>
          <Text style={styles.totalLabel}>Toplam Tutar:</Text>
          <Text style={styles.totalPrice}>{orderData.totalPrice} ₺</Text>
        </View>
      </View>

      {/* Buttons */}
      <TouchableOpacity
        style={[styles.confirmBtn, loading && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="large" />
        ) : (
          <Text style={styles.confirmBtnText}>Siparişi Onayla</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>Geri</Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FA' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F8FA' },
  errorText: { fontSize: 14, color: '#94A3B8', marginBottom: 20 },

  header: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#007AFF' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },

  card: { backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 10, borderRadius: 14, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 12 },

  addressBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: '#007AFF' },
  addressName: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  addressText: { fontSize: 13, color: '#64748B', marginBottom: 3 },

  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  itemName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  itemQty: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  itemPrice: { fontSize: 14, fontWeight: '800', color: '#007AFF' },

  dateRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dateLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  dateValue: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 4 },

  noteText: { fontSize: 13, color: '#475569', fontStyle: 'italic' },

  priceCard: { borderTopWidth: 2, borderTopColor: '#FF9500' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  priceLabel: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  priceValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  priceDivider: { height: 1, backgroundColor: '#E6E9EE', marginVertical: 10 },
  totalLabel: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  totalPrice: { fontSize: 20, fontWeight: '900', color: '#FF9500' },

  confirmBtn: { backgroundColor: '#007AFF', marginHorizontal: 16, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  backBtn: { backgroundColor: '#F3F4F6', marginHorizontal: 16, paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  backBtnText: { color: '#334155', fontWeight: '700', fontSize: 15 },

  loadingText: { color: '#94A3B8', fontStyle: 'italic' },
});

export default OrderReviewScreen;
