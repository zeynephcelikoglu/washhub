import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthContext } from '../../context/AuthContext';
import { addressApi } from '../../api/addressApi';
import { productApi } from '../../api/productApi';

const CreateOrderScreen = ({ navigation, route }) => {
  const { user } = useContext(AuthContext);

  // State
  const [addresses, setAddresses] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [quantities, setQuantities] = useState({});

  // DateTime states
  const [pickupDate, setPickupDate] = useState(new Date());
  const [pickupTime, setPickupTime] = useState(new Date());
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));
  const [deliveryTime, setDeliveryTime] = useState(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));

  // DateTimePicker visibility
  const [showPickupDate, setShowPickupDate] = useState(false);
  const [showPickupTime, setShowPickupTime] = useState(false);
  const [showDeliveryDate, setShowDeliveryDate] = useState(false);
  const [showDeliveryTime, setShowDeliveryTime] = useState(false);

  const [notes, setNotes] = useState('');
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchAddresses();
      fetchProducts();
    }
  }, [user?.id]);

  const fetchAddresses = async () => {
    try {
      const response = await addressApi.getAddresses(user.id);
      const addrs = response.data.addresses || [];
      setAddresses(addrs);
      const defaultAddr = addrs.find(a => a.isDefault);
      if (defaultAddr) setSelectedAddress(defaultAddr._id);
      else if (addrs.length > 0) setSelectedAddress(addrs[0]._id);
    } catch (error) {
      console.log('Adresler yüklenemedi:', error);
      Alert.alert('Hata', 'Adresler yüklenemedi');
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await productApi.getAllProducts();
      const prods = response.data.products || [];
      setProducts(prods);
      const q = {};
      prods.forEach(p => { q[p._id] = 0; });
      setQuantities(q);
    } catch (error) {
      console.log('Ürünler yüklenemedi:', error);
      Alert.alert('Hata', 'Ürünler yüklenemedi');
    }
    setProductsLoading(false);
  };

  const inc = (id) => setQuantities(q => ({ ...q, [id]: (q[id] || 0) + 1 }));
  const dec = (id) => setQuantities(q => ({ ...q, [id]: Math.max(0, (q[id] || 0) - 1) }));

  const computeTotal = () => {
    return products.reduce((sum, p) => sum + ((p.price || p.basePrice || 0) * (quantities[p._id] || 0)), 0);
  };

  const handlePickupDateChange = (event, selectedDate) => {
    if (Platform.OS !== 'ios') setShowPickupDate(false);
    if (selectedDate) setPickupDate(selectedDate);
  };

  const handlePickupTimeChange = (event, selectedTime) => {
    if (Platform.OS !== 'ios') setShowPickupTime(false);
    if (selectedTime) setPickupTime(selectedTime);
  };

  const handleDeliveryDateChange = (event, selectedDate) => {
    if (Platform.OS !== 'ios') setShowDeliveryDate(false);
    if (selectedDate) setDeliveryDate(selectedDate);
  };

  const handleDeliveryTimeChange = (event, selectedTime) => {
    if (Platform.OS !== 'ios') setShowDeliveryTime(false);
    if (selectedTime) setDeliveryTime(selectedTime);
  };

  const handleContinue = () => {
    const items = products
      .filter(p => (quantities[p._id] || 0) > 0)
      .map(p => ({
        productId: p._id,
        name: p.name,
        price: p.price || p.basePrice || 0,
        quantity: quantities[p._id] || 0,
      }));

    if (!selectedAddress) {
      Alert.alert('Hata', 'Lütfen teslimat adresi seçin');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Hata', 'En az bir ürün seçin');
      return;
    }

    if (pickupDate > deliveryDate) {
      Alert.alert('Hata', 'Teslim tarihi alış tarihinden sonra olmalı');
      return;
    }

    const totalPrice = computeTotal();
    if (totalPrice <= 0) {
      Alert.alert('Hata', 'Toplam fiyat 0 olamaz');
      return;
    }

    // Format times and dates properly
    const pickupTimeStr = pickupTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const deliveryTimeStr = deliveryTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const orderData = {
      userId: user.id,
      items,
      totalPrice,
      pickupDate: pickupDate.toISOString().split('T')[0],
      pickupTime: pickupTimeStr,
      deliveryDate: deliveryDate.toISOString().split('T')[0],
      deliveryTime: deliveryTimeStr,
      addressId: selectedAddress,
      notes,
    };

    navigation.navigate('OrderReview', { orderData });
  };

  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);

  const renderProductItem = ({ item }) => (
    <View style={styles.productRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDesc}>{item.description}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>{item.price || item.basePrice || 0} ₺</Text>
          <Text style={styles.productPerKg}> / {item.pricePerKg} ₺/kg</Text>
        </View>
      </View>

      <View style={styles.qtyControl}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => dec(item._id)}>
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyDisplay}>{quantities[item._id] || 0}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => inc(item._id)}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      
      {/* Adres Seçimi */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Teslimat Adresi</Text>
        {addresses.length === 0 ? (
          <TouchableOpacity 
            style={styles.addAddressBtn}
            onPress={() => navigation.navigate('AddressesTab')}
          >
            <Text style={styles.addAddressText}>Adres Eklemek İçin Tıklayın</Text>
          </TouchableOpacity>
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.addressOption, selectedAddress === item._id && styles.selectedAddress]}
                onPress={() => setSelectedAddress(item._id)}
              >
                <View style={styles.radioBtn}>
                  {selectedAddress === item._id && <View style={styles.radioBtnInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addressName}>{item.title}</Text>
                  <Text style={styles.addressDetail}>{item.street}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Ürünler */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 Ürünler</Text>
        {productsLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#007AFF" size="large" />
            <Text style={styles.loadingText}>Ürünler yükleniyor...</Text>
          </View>
        ) : products.length === 0 ? (
          <Text style={styles.emptyText}>Ürün bulunamadı</Text>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            renderItem={renderProductItem}
          />
        )}
      </View>

      {/* Tarih & Saat */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Tarih & Saat</Text>

        <Text style={styles.subLabel}>Alış</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity 
            style={styles.dateTimeBtn} 
            onPress={() => setShowPickupDate(true)}
          >
            <Text style={styles.dateTimeText}>
              {pickupDate.toLocaleDateString('tr-TR')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.dateTimeBtn} 
            onPress={() => setShowPickupTime(true)}
          >
            <Text style={styles.dateTimeText}>
              {pickupTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>

        {showPickupDate && (
          <DateTimePicker
            value={pickupDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handlePickupDateChange}
            minimumDate={minDate}
          />
        )}
        {showPickupTime && (
          <DateTimePicker
            value={pickupTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handlePickupTimeChange}
          />
        )}

        <Text style={[styles.subLabel, { marginTop: 12 }]}>Teslim</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity 
            style={styles.dateTimeBtn} 
            onPress={() => setShowDeliveryDate(true)}
          >
            <Text style={styles.dateTimeText}>
              {deliveryDate.toLocaleDateString('tr-TR')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.dateTimeBtn} 
            onPress={() => setShowDeliveryTime(true)}
          >
            <Text style={styles.dateTimeText}>
              {deliveryTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>

        {showDeliveryDate && (
          <DateTimePicker
            value={deliveryDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDeliveryDateChange}
            minimumDate={minDate}
          />
        )}
        {showDeliveryTime && (
          <DateTimePicker
            value={deliveryTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDeliveryTimeChange}
          />
        )}
      </View>

      {/* Notlar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✏️ Notlar</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Özel istekler varsa yazın..."
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
          placeholderTextColor="#999"
        />
      </View>

      {/* Toplam */}
      <View style={styles.summaryBox}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Seçilen Ürün:</Text>
          <Text style={styles.summaryValue}>
            {products.filter(p => (quantities[p._id] || 0) > 0).length}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Toplam Tutar:</Text>
          <Text style={styles.summaryPrice}>{computeTotal()} ₺</Text>
        </View>
      </View>

      {/* Buttons */}
      <TouchableOpacity 
        style={styles.continueBtn} 
        onPress={handleContinue}
      >
        <Text style={styles.continueBtnText}>Devam</Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FA' },
  section: { backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 10, borderRadius: 14, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  
  addAddressBtn: { backgroundColor: '#E3F2FD', padding: 16, borderRadius: 10, alignItems: 'center' },
  addAddressText: { color: '#007AFF', fontWeight: '700' },
  
  addressOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  selectedAddress: { backgroundColor: '#F0F7FF' },
  radioBtn: { width: 24, height: 24, borderRadius: 12, borderWidth: 2.5, borderColor: '#007AFF', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  radioBtnInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#007AFF' },
  addressName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  addressDetail: { fontSize: 12, color: '#64748B', marginTop: 4 },

  loadingBox: { alignItems: 'center', paddingVertical: 20 },
  loadingText: { color: '#94A3B8', marginTop: 8, fontWeight: '600' },
  emptyText: { color: '#94A3B8', textAlign: 'center', paddingVertical: 20 },

  productRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  productName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  productDesc: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
  productPrice: { fontSize: 14, fontWeight: '800', color: '#007AFF' },
  productPerKg: { fontSize: 11, color: '#94A3B8' },

  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E6E9EE' },
  qtyBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 18, fontWeight: '700', color: '#007AFF' },
  qtyDisplay: { width: 30, textAlign: 'center', fontWeight: '700', color: '#0F172A' },

  subLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 8 },
  dateTimeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dateTimeBtn: { flex: 1, marginHorizontal: 4, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E6E9EE', alignItems: 'center' },
  dateTimeText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },

  notesInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E6E9EE', borderRadius: 10, padding: 12, minHeight: 80, fontSize: 13, color: '#0F172A', textAlignVertical: 'top' },

  summaryBox: { backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 10, borderRadius: 14, padding: 16, borderWidth: 2, borderColor: '#FF9500' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  summaryValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  summaryPrice: { fontSize: 18, fontWeight: '900', color: '#FF9500' },

  continueBtn: { backgroundColor: '#007AFF', marginHorizontal: 16, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 16 },
  continueBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

export default CreateOrderScreen;
