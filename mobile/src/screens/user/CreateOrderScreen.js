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
import ClothingCard from '../../components/ClothingCard';

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
  // Controls which picker is open inline: 'pickupDate' | 'pickupTime' | 'deliveryDate' | 'deliveryTime' | null
  const [openPicker, setOpenPicker] = useState(null);

  // Validation error state
  const [validationError, setValidationError] = useState(null);

  const [notes, setNotes] = useState('');
  const [productsLoading, setProductsLoading] = useState(true);
  // New: service and clothing selection inside the order flow
  const [selectedService, setSelectedService] = useState(null); // 'washing'|'ironing'|'drying'|'dry_cleaning'
  const [selectedItems, setSelectedItems] = useState({}); // { itemId: qty }

  useEffect(() => {
    if (user?.id) {
      fetchAddresses();
      fetchProducts();
    }
  }, [user?.id]);

  // Live validation on date/time changes
  useEffect(() => {
    validateTimes();
  }, [pickupDate, pickupTime, deliveryDate, deliveryTime]);

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

  // Compute total for selectedItems if needed (placeholder: no prices for clothing types)
  const computeSelectedTotal = () => {
    return 0; // clothing selection currently doesn't have pricing - backend may calculate later
  };

  /**
   * LIVE VALIDATION - Runs immediately on date/time changes
   * Validates according to business rules:
   * 1. Working hours limit (08:00–19:00) for both pickup and delivery
   * 2. Earliest pickup must be at least 1 hour from current time
   * 3. Delivery time must be at least 3 hours after pickup (same day allowed)
   * 4. Cannot select past date or time
   * 
   * Returns: true if all valid, false otherwise
   * Sets error message in state for UI display
   */
  const validateTimes = () => {
    try {
      // Create proper Date objects from date and time states
      const pickupDateTime = new Date(pickupDate);
      pickupDateTime.setHours(pickupTime.getHours(), pickupTime.getMinutes(), 0, 0);

      const deliveryDateTime = new Date(deliveryDate);
      deliveryDateTime.setHours(deliveryTime.getHours(), deliveryTime.getMinutes(), 0, 0);

      const now = new Date();
      const pickupHour = pickupTime.getHours();
      const pickupMinute = pickupTime.getMinutes();
      const deliveryHour = deliveryTime.getHours();
      const deliveryMinute = deliveryTime.getMinutes();

      // Rule 4: Cannot select past date or time
      if (pickupDateTime < now) {
        setValidationError('Geçmiş bir tarih veya saat seçemezsiniz.');
        return false;
      }

      // Rule 1: Check pickup working hours (08:00–19:00)
      if (pickupHour < 8 || pickupHour >= 19) {
        setValidationError('Alış saati 08:00–19:00 arasında olmalıdır.');
        return false;
      }

      // Rule 2: Earliest pickup must be at least 1 hour from current time
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      if (pickupDateTime < oneHourLater) {
        setValidationError('En erken bir saat sonrasına randevu oluşturabilirsiniz.');
        return false;
      }

      // Rule 3: Delivery time must be at least 3 hours after pickup (SAME DAY ALLOWED)
      const threeHoursAfterPickup = new Date(pickupDateTime.getTime() + 3 * 60 * 60 * 1000);
      if (deliveryDateTime < threeHoursAfterPickup) {
        setValidationError('Teslimat saati, alış saatinden en az üç saat sonra olmalıdır.');
        return false;
      }

      // Rule 1: Check delivery working hours (08:00–19:00)
      if (deliveryHour < 8 || deliveryHour > 19 || (deliveryHour === 19 && deliveryMinute > 0)) {
        setValidationError('Teslimat saati 08:00–19:00 arasında olmalıdır.');
        return false;
      }

      // All validations passed
      setValidationError(null);
      return true;
    } catch (error) {
      console.log('Validation error:', error);
      setValidationError('Tarih ve saat doğrulaması yapılamadı.');
      return false;
    }
  };

  const handlePickupDateChange = (event, selectedDate) => {
    if (selectedDate) setPickupDate(selectedDate);
    // Auto-close inline picker after selection
    setOpenPicker(null);
  };

  const handlePickupTimeChange = (event, selectedTime) => {
    if (selectedTime) setPickupTime(selectedTime);
    setOpenPicker(null);
  };

  const handleDeliveryDateChange = (event, selectedDate) => {
    if (selectedDate) setDeliveryDate(selectedDate);
    setOpenPicker(null);
  };

  const handleDeliveryTimeChange = (event, selectedTime) => {
    if (selectedTime) setDeliveryTime(selectedTime);
    setOpenPicker(null);
  };

  const handleContinue = () => {
    // Check if there are validation errors
    if (validationError) {
      Alert.alert('Geçersiz Tarih/Saat', validationError);
      return;
    }

    // Build items: prefer selectedItems (from service/product selector) if present,
    // otherwise fall back to existing product selection (backend product list)
    const selectedKeys = Object.keys(selectedItems).filter(k => (selectedItems[k] || 0) > 0);
    let items = [];
    if (selectedKeys.length > 0) {
      // Use selectedItems created in the UI (no productId from backend)
      items = selectedKeys.map((id) => {
        // Try to find a friendly title from local mapping below
        const info = SERVICE_CLOTHES.flatMap(s => s.items).find(it => it.id === id) || { title: id };
        return {
          productId: null,
          name: info.title || id,
          price: 0,
          quantity: selectedItems[id] || 0,
        };
      });
    } else {
      items = products
        .filter(p => (quantities[p._id] || 0) > 0)
        .map(p => ({
          productId: p._id,
          name: p.name,
          price: p.price || p.basePrice || 0,
          quantity: quantities[p._id] || 0,
        }));
    }

    // Service must be selected when using the new flow
    if (!selectedService && selectedKeys.length > 0) {
      Alert.alert('Hata', 'Lütfen bir hizmet seçin');
      return;
    }

    if (!selectedAddress) {
      Alert.alert('Hata', 'Lütfen teslimat adresi seçin');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Hata', 'En az bir ürün seçin');
      return;
    }

    const totalPrice = computeTotal();
    // If user used the new clothing selection (selectedItems), pricing may be handled server-side;
    // skip totalPrice zero check when using selectedItems.
    if (Object.keys(selectedItems).filter(k => (selectedItems[k] || 0) > 0).length === 0) {
      if (totalPrice <= 0) {
        Alert.alert('Hata', 'Toplam fiyat 0 olamaz');
        return;
      }
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

  // SERVICE & CLOTHING data for in-screen flow
  const SERVICES = [
    { key: 'washing', title: 'Yıkama', color: '#E8F4FF', icon: '🧺' },
    { key: 'ironing', title: 'Ütü', color: '#FFF7EA', icon: '🧼' },
    { key: 'drying', title: 'Kurutma', color: '#F2F7F2', icon: '🌀' },
    { key: 'dry_cleaning', title: 'Kuru Temizleme', color: '#FFF1F0', icon: '🧥' },
  ];

  const SERVICE_CLOTHES = [
    { service: 'washing', items: [
      { id: 'tshirt', title: 'Tişört', desc: 'Günlük tişört', icon: '👕' },
      { id: 'pants', title: 'Pantolon', desc: 'Kot / kumaş pantolon', icon: '👖' },
      { id: 'sweater', title: 'Kazak', desc: 'Triko / kazak', icon: '🧶' },
    ]},
    { service: 'ironing', items: [
      { id: 'shirt', title: 'Gömlek', desc: 'Günlük / iş gömleği', icon: '👔' },
      { id: 'dress', title: 'Elbise', desc: 'Elbise / etek', icon: '👗' },
    ]},
    { service: 'drying', items: [
      { id: 'towel', title: 'Havlu', desc: 'Banyo havlusu', icon: '🧻' },
      { id: 'bedsheet', title: 'Çarşaf', desc: 'Yatak çarşafı', icon: '🛏️' },
    ]},
    { service: 'dry_cleaning', items: [
      { id: 'coat', title: 'Mont / Ceket', desc: 'Dış giyim', icon: '🧥' },
      { id: 'suit', title: 'Takım', desc: 'Takım elbise', icon: '🕴️' },
    ]},
  ];

  const onToggleItem = (id) => {
    setSelectedItems(s => ({ ...s, [id]: (s[id] || 0) > 0 ? 0 : 1 }));
  };
  const onIncItem = (id) => setSelectedItems(s => ({ ...s, [id]: (s[id] || 0) + 1 }));
  const onDecItem = (id) => setSelectedItems(s => ({ ...s, [id]: Math.max(0, (s[id] || 0) - 1) }));

  const formatServiceLabel = (s) => {
    switch (s) {
      case 'washing': return 'Yıkama';
      case 'ironing': return 'Ütü';
      case 'drying': return 'Kurutma';
      case 'dry_cleaning': return 'Kuru Temizleme';
      default: return s;
    }
  };

  // Helper functions to determine which field to mark invalid
  const isPickupFieldInvalid = (err) => {
    if (!err) return false;
    return /Alış|alış|En erken|Geçmiş/i.test(err);
  };

  const isDeliveryFieldInvalid = (err) => {
    if (!err) return false;
    return /Teslimat|teslimat|üç saat|3 saat/i.test(err);
  };

  const mapPickupError = (err) => {
    if (!err) return null;
    if (/En erken/i.test(err)) return 'En erken bir saat sonrası için randevu oluşturabilirsiniz.';
    if (/Alış saati/i.test(err)) return 'Alış saati 08:00–19:00 arasında olmalıdır.';
    if (/Geçmiş/i.test(err)) return 'Geçmiş bir tarih veya saat seçemezsiniz.';
    return err;
  };

  const mapDeliveryError = (err) => {
    if (!err) return null;
    if (/üç saat|3 saat/i.test(err)) return 'Teslimat saati, alış saatinden en az üç saat sonra olmalıdır.';
    if (/Teslimat saati/i.test(err)) return 'Teslimat saati 08:00–19:00 arasında olmalıdır.';
    if (/Geçmiş/i.test(err)) return 'Geçmiş bir tarih veya saat seçemezsiniz.';
    return err;
  };

  // Read incoming params for service and selected clothes (from SelectClothingScreen)
  const serviceTypeParam = route?.params?.serviceType;
  const selectedClothesParam = route?.params?.selectedClothes || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 140 }}>
      
      {/* SERVICE SELECTOR (in-screen) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hizmet Seçimi</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {SERVICES.map(s => (
            <TouchableOpacity key={s.key} onPress={() => setSelectedService(s.key)} style={[styles.serviceCard, selectedService === s.key && styles.serviceCardActive, { backgroundColor: s.color }]}> 
              <Text style={{ fontSize: 22 }}>{s.icon}</Text>
              <Text style={{ fontSize: 12, fontWeight: '800', marginTop: 6 }}>{s.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* PRODUCT / CLOTHING SELECTION (dynamic) */}
      {selectedService && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ürünler</Text>
          <View>
            { (SERVICE_CLOTHES.find(sc => sc.service === selectedService)?.items || []).map(item => (
              <View key={item.id} style={{ marginBottom: 8 }}>
                <ClothingCard
                  item={item}
                  qty={selectedItems[item.id]}
                  onInc={() => onIncItem(item.id)}
                  onDec={() => onDecItem(item.id)}
                  selected={(selectedItems[item.id] || 0) > 0}
                  onToggle={() => onToggleItem(item.id)}
                />
              </View>
            ))}
          </View>
        </View>
      )}

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

        {validationError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️ {validationError}</Text>
          </View>
        )}

        {/* Pickup Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Alış Tarihi & Saati</Text>
          <Text style={styles.cardHelper}>Çalışma saatleri: 08:00 – 19:00</Text>
          <Text style={styles.cardHelper}>En erken 1 saat sonrası için alış yapılabilir.</Text>

          <Text style={styles.fieldLabel}>Alış Tarihi</Text>
          <TouchableOpacity
            style={[styles.inputBtn, isPickupFieldInvalid(validationError) && styles.inputError]}
            onPress={() => setOpenPicker(openPicker === 'pickupDate' ? null : 'pickupDate')}
          >
            <Text style={styles.inputBtnText}>{pickupDate.toLocaleDateString('tr-TR')}</Text>
          </TouchableOpacity>
          {isPickupFieldInvalid(validationError) && (
            <Text style={styles.inlineError}>{mapPickupError(validationError)}</Text>
          )}

          <Text style={styles.fieldLabel}>Alış Saati</Text>
          <TouchableOpacity
            style={[styles.inputBtn, isPickupFieldInvalid(validationError) && styles.inputError]}
            onPress={() => setOpenPicker(openPicker === 'pickupTime' ? null : 'pickupTime')}
          >
            <Text style={styles.inputBtnText}>{pickupTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Text>
          </TouchableOpacity>
          {openPicker === 'pickupDate' && (
            <DateTimePicker
              value={pickupDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handlePickupDateChange}
              minimumDate={minDate}
            />
          )}
          {openPicker === 'pickupTime' && (
            <DateTimePicker
              value={pickupTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handlePickupTimeChange}
            />
          )}
        </View>

        {/* Delivery Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Teslim Tarihi & Saati</Text>
          <Text style={styles.cardHelper}>Çalışma saatleri: 08:00 – 19:00</Text>
          <Text style={styles.cardHelper}>Teslimat, alıştan en az 3 saat sonra olmalıdır.</Text>

          <Text style={styles.fieldLabel}>Teslim Tarihi</Text>
          <TouchableOpacity
            style={[styles.inputBtn, isDeliveryFieldInvalid(validationError) && styles.inputError]}
            onPress={() => setOpenPicker(openPicker === 'deliveryDate' ? null : 'deliveryDate')}
          >
            <Text style={styles.inputBtnText}>{deliveryDate.toLocaleDateString('tr-TR')}</Text>
          </TouchableOpacity>
          {isDeliveryFieldInvalid(validationError) && (
            <Text style={styles.inlineError}>{mapDeliveryError(validationError)}</Text>
          )}

          <Text style={styles.fieldLabel}>Teslim Saati</Text>
          <TouchableOpacity
            style={[styles.inputBtn, isDeliveryFieldInvalid(validationError) && styles.inputError]}
            onPress={() => setOpenPicker(openPicker === 'deliveryTime' ? null : 'deliveryTime')}
          >
            <Text style={styles.inputBtnText}>{deliveryTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Text>
          </TouchableOpacity>

          {openPicker === 'deliveryDate' && (
            <DateTimePicker
              value={deliveryDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handleDeliveryDateChange}
              minimumDate={minDate}
            />
          )}
          {openPicker === 'deliveryTime' && (
            <DateTimePicker
              value={deliveryTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handleDeliveryTimeChange}
            />
          )}
        </View>
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
        style={[styles.continueBtn, validationError && styles.continueBtnDisabled]} 
        onPress={handleContinue}
        disabled={!!validationError}
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
  dateTimeBtnError: { borderColor: '#EF4444', backgroundColor: '#FEE2E2' },
  dateTimeText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },

  /* New card/input styles */
  card: { backgroundColor: '#FBFDFF', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#EEF2FF' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  cardHelper: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  fieldLabel: { fontSize: 13, color: '#475569', fontWeight: '700', marginTop: 10, marginBottom: 6 },
  inputBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E6E9EE', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10 },
  inputBtnText: { fontSize: 15, color: '#0F172A', fontWeight: '700' },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FFF4F4' },
  inlineError: { color: '#DC2626', fontSize: 12, marginTop: 6 },

  errorBanner: { backgroundColor: '#FEE2E2', borderLeftWidth: 4, borderLeftColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginBottom: 12 },
  errorBannerText: { fontSize: 13, color: '#DC2626', fontWeight: '600' },

  notesInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E6E9EE', borderRadius: 10, padding: 12, minHeight: 80, fontSize: 13, color: '#0F172A', textAlignVertical: 'top' },

  summaryBox: { backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 10, borderRadius: 14, padding: 16, borderWidth: 2, borderColor: '#FF9500' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  summaryValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  summaryPrice: { fontSize: 18, fontWeight: '900', color: '#FF9500' },

  continueBtn: { backgroundColor: '#007AFF', marginHorizontal: 16, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 16 },
  continueBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  continueBtnDisabled: { backgroundColor: '#9BB7FF' },
  serviceCard: { flex: 1, marginHorizontal: 4, borderRadius: 12, padding: 10, alignItems: 'center', justifyContent: 'center' },
  serviceCardActive: { borderWidth: 2, borderColor: '#007AFF' },
});

export default CreateOrderScreen;
