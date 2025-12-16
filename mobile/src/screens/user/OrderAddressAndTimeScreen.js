import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, FlatList, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addressApi } from '../../api/addressApi';
import { AuthContext } from '../../context/AuthContext';

const OrderAddressAndTimeScreen = ({ navigation, route }) => {
  const { selectedService, selectedProducts, originalTotalPrice, isRepeatOrder } = route.params || {};

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const [pickupDate, setPickupDate] = useState(new Date());
  const [pickupTime, setPickupTime] = useState(new Date());
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));
  const [deliveryTime, setDeliveryTime] = useState(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));

  const [openPicker, setOpenPicker] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [notes, setNotes] = useState('');

  const { user } = useContext(AuthContext);

  useEffect(() => { if (user?.id) fetchAddresses(); }, [user?.id]);

  const fetchAddresses = async () => {
    try {
      const response = await addressApi.getAddresses(user.id);
      const addrs = response.data.addresses || [];
      setAddresses(addrs);
      const def = addrs.find(a => a.isDefault);
      if (def) setSelectedAddress(def._id);
      else if (addrs.length > 0) setSelectedAddress(addrs[0]._id);
    } catch (err) {
      console.log('Adresler yüklenemedi:', err);
      Alert.alert('Hata', 'Adresler yüklenemedi');
    }
  };

  const validateTimes = () => {
    try {
      const pickupDateTime = new Date(pickupDate);
      pickupDateTime.setHours(pickupTime.getHours(), pickupTime.getMinutes(), 0, 0);
      const deliveryDateTime = new Date(deliveryDate);
      deliveryDateTime.setHours(deliveryTime.getHours(), deliveryTime.getMinutes(), 0, 0);
      const now = new Date();

      if (pickupDateTime < now) { setValidationError('Geçmiş bir tarih veya saat seçemezsiniz.'); return false; }
      const pickupHour = pickupTime.getHours();
      if (pickupHour < 8 || pickupHour >= 19) { setValidationError('Alış saati 08:00–19:00 arasında olmalıdır.'); return false; }
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      if (pickupDateTime < oneHourLater) { setValidationError('En erken bir saat sonrasına randevu oluşturabilirsiniz.'); return false; }
      const threeHoursAfterPickup = new Date(pickupDateTime.getTime() + 3 * 60 * 60 * 1000);
      if (deliveryDateTime < threeHoursAfterPickup) { setValidationError('Teslimat saati, alış saatinden en az üç saat sonra olmalıdır.'); return false; }
      const deliveryHour = deliveryTime.getHours();
      const deliveryMinute = deliveryTime.getMinutes();
      if (deliveryHour < 8 || deliveryHour > 19 || (deliveryHour === 19 && deliveryMinute > 0)) { setValidationError('Teslimat saati 08:00–19:00 arasında olmalıdır.'); return false; }
      setValidationError(null); return true;
    } catch (err) { console.log(err); setValidationError('Tarih ve saat doğrulaması yapılamadı.'); return false; }
  };

  const handlePickupDateChange = (event, selectedDate) => { if (selectedDate) setPickupDate(selectedDate); setOpenPicker(null); };
  const handlePickupTimeChange = (event, selectedTime) => { if (selectedTime) setPickupTime(selectedTime); setOpenPicker(null); };
  const handleDeliveryDateChange = (event, selectedDate) => { if (selectedDate) setDeliveryDate(selectedDate); setOpenPicker(null); };
  const handleDeliveryTimeChange = (event, selectedTime) => { if (selectedTime) setDeliveryTime(selectedTime); setOpenPicker(null); };

  const handleContinue = () => {
    if (!validateTimes()) { Alert.alert('Tarih Hatası', validationError || 'Geçersiz tarih/saat'); return; }
    if (!selectedAddress) { Alert.alert('Hata', 'Lütfen teslimat adresi seçin'); return; }
    navigation.navigate('OrderSummary', { selectedService, selectedProducts, address: selectedAddress, pickupDate: pickupDate.toISOString().split('T')[0], pickupTime: pickupTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), deliveryDate: deliveryDate.toISOString().split('T')[0], deliveryTime: deliveryTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), notes, originalTotalPrice, isRepeatOrder });
  };

  const minDate = new Date(); minDate.setHours(0,0,0,0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 140 }}>
      <View style={styles.section}><Text style={styles.sectionTitle}>📍 Teslimat Adresi</Text>
        {addresses.length === 0 ? (
          <TouchableOpacity style={styles.addAddressBtn} onPress={() => navigation.navigate('AddressesTab')}><Text style={styles.addAddressText}>Adres Eklemek İçin Tıklayın</Text></TouchableOpacity>
        ) : (
          <FlatList data={addresses} keyExtractor={a => a._id} scrollEnabled={false} renderItem={({ item }) => (
            <TouchableOpacity style={[styles.addressOption, selectedAddress === item._id && styles.selectedAddress]} onPress={() => setSelectedAddress(item._id)}>
              <View style={styles.radioBtn}>{selectedAddress === item._id && <View style={styles.radioBtnInner} />}</View>
              <View style={{ flex: 1 }}><Text style={styles.addressName}>{item.title}</Text><Text style={styles.addressDetail}>{item.street}</Text></View>
            </TouchableOpacity>
          )} />
        )}
      </View>

      <View style={styles.section}><Text style={styles.sectionTitle}>📅 Tarih & Saat</Text>
        {validationError && <View style={styles.errorBanner}><Text style={styles.errorBannerText}>⚠️ {validationError}</Text></View>}

        <View style={styles.card}><Text style={styles.cardTitle}>Alış Tarihi & Saati</Text>
          <Text style={styles.fieldLabel}>Alış Tarihi</Text>
          <TouchableOpacity style={styles.inputBtn} onPress={() => setOpenPicker(openPicker === 'pickupDate' ? null : 'pickupDate')}><Text style={styles.inputBtnText}>{pickupDate.toLocaleDateString('tr-TR')}</Text></TouchableOpacity>
          <Text style={styles.fieldLabel}>Alış Saati</Text>
          <TouchableOpacity style={styles.inputBtn} onPress={() => setOpenPicker(openPicker === 'pickupTime' ? null : 'pickupTime')}><Text style={styles.inputBtnText}>{pickupTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Text></TouchableOpacity>
          {openPicker === 'pickupDate' && <DateTimePicker value={pickupDate} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={handlePickupDateChange} minimumDate={minDate} />}
          {openPicker === 'pickupTime' && <DateTimePicker value={pickupTime} mode="time" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={handlePickupTimeChange} />}
        </View>

        <View style={styles.card}><Text style={styles.cardTitle}>Teslim Tarihi & Saati</Text>
          <Text style={styles.fieldLabel}>Teslim Tarihi</Text>
          <TouchableOpacity style={styles.inputBtn} onPress={() => setOpenPicker(openPicker === 'deliveryDate' ? null : 'deliveryDate')}><Text style={styles.inputBtnText}>{deliveryDate.toLocaleDateString('tr-TR')}</Text></TouchableOpacity>
          <Text style={styles.fieldLabel}>Teslim Saati</Text>
          <TouchableOpacity style={styles.inputBtn} onPress={() => setOpenPicker(openPicker === 'deliveryTime' ? null : 'deliveryTime')}><Text style={styles.inputBtnText}>{deliveryTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Text></TouchableOpacity>
          {openPicker === 'deliveryDate' && <DateTimePicker value={deliveryDate} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={handleDeliveryDateChange} minimumDate={minDate} />}
          {openPicker === 'deliveryTime' && <DateTimePicker value={deliveryTime} mode="time" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={handleDeliveryTimeChange} />}
        </View>
      </View>

      <View style={styles.section}><Text style={styles.sectionTitle}>✏️ Notlar</Text>
        <TextInput style={styles.notesInput} placeholder="Özel istekler varsa yazın..." multiline numberOfLines={3} value={notes} onChangeText={setNotes} placeholderTextColor="#999" />
      </View>

      <TouchableOpacity style={[styles.continueBtn, validationError && styles.continueBtnDisabled]} onPress={handleContinue} disabled={!!validationError}><Text style={styles.continueBtnText}>Devam</Text></TouchableOpacity>

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
  card: { backgroundColor: '#FBFDFF', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#EEF2FF' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  fieldLabel: { fontSize: 13, color: '#475569', fontWeight: '700', marginTop: 10, marginBottom: 6 },
  inputBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E6E9EE', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10 },
  inputBtnText: { fontSize: 15, color: '#0F172A', fontWeight: '700' },
  errorBanner: { backgroundColor: '#FEE2E2', borderLeftWidth: 4, borderLeftColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginBottom: 12 },
  errorBannerText: { fontSize: 13, color: '#DC2626', fontWeight: '600' },
  notesInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E6E9EE', borderRadius: 10, padding: 12, minHeight: 80, fontSize: 13, color: '#0F172A', textAlignVertical: 'top' },
  continueBtn: { backgroundColor: '#007AFF', marginHorizontal: 16, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 16 },
  continueBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  continueBtnDisabled: { backgroundColor: '#9BB7FF' },
});

export default OrderAddressAndTimeScreen;
