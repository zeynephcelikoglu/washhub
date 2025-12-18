import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, FlatList, Platform, Modal, TouchableWithoutFeedback } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addressApi } from '../../api/addressApi';
import { AuthContext } from '../../context/AuthContext';

const OrderAddressAndTimeScreen = ({ navigation, route }) => {
  const { selectedService, selectedProducts, originalTotalPrice, isRepeatOrder } = route.params || {};

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const [pickupDate, setPickupDate] = useState(new Date());
  const [pickupTime, setPickupTime] = useState(null); // Date object for selected pickup slot
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));
  const [deliveryTime, setDeliveryTime] = useState(null); // Date object for selected delivery slot

  const [openPicker, setOpenPicker] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [notes, setNotes] = useState('');
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);

  // slot-based helpers
  const INTERVAL_MINUTES = 30;
  const WORK_START = 8; // 08:00
  const WORK_END = 19; // 19:00

  const roundUpToInterval = (date, interval) => {
    const ms = 1000 * 60 * interval;
    return new Date(Math.ceil(date.getTime() / ms) * ms);
  };

  const formatTime = (d) => d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const generateSlots = (date, minAllowedDateTime = null) => {
    const slots = [];
    const start = new Date(date);
    start.setHours(WORK_START, 0, 0, 0);
    const end = new Date(date);
    end.setHours(WORK_END, 0, 0, 0);

    for (let t = new Date(start); t <= end; t = new Date(t.getTime() + INTERVAL_MINUTES * 60 * 1000)) {
      slots.push(new Date(t));
    }
    // return all slots; callers will mark disabled based on minAllowedDateTime
    return slots;
  };

  // Centralized time logic
  const getEarliestPickupDateTime = (now) => {
    // If now is within working hours, earliest is now + 1 hour rounded up
    if (now.getHours() >= WORK_START && now.getHours() < WORK_END) {
      const earliest = new Date(now.getTime() + 60 * 60 * 1000);
      return roundUpToInterval(earliest, INTERVAL_MINUTES);
    }
    // outside working hours -> no same-day pickups
    return null;
  };

  const buildPickupSlots = (date, now) => {
    const slots = generateSlots(date, null);
    if (!isSameDay(date, now)) {
      return slots.map(s => ({ slot: s, disabled: false }));
    }

    const earliest = getEarliestPickupDateTime(now);
    if (!earliest) {
      // today is outside working hours -> mark all slots disabled
      return slots.map(s => ({ slot: s, disabled: true }));
    }

    return slots.map(s => ({ slot: s, disabled: s < earliest }));
  };

  const buildDeliverySlots = (date, pickupDateTime) => {
    const slots = generateSlots(date, null);
    if (!pickupDateTime) return slots.map(s => ({ slot: s, disabled: true }));

    const minAllowed = new Date(pickupDateTime.getTime() + 3 * 60 * 60 * 1000);
    return slots.map(s => ({ slot: s, disabled: s < minAllowed }));
  };

  

  const { user } = useContext(AuthContext);

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setValidationError(null);

      if (!pickupTime) { setValidationError('Lütfen alış saati seçin.'); return false; }
      if (!deliveryTime) { setValidationError('Lütfen teslim saati seçin.'); return false; }

      const pickupDateTime = pickupTime;
      const deliveryDateTime = deliveryTime;

      const nowLocal = new Date();

      // Working hours check
      if (pickupDateTime.getHours() < WORK_START || (pickupDateTime.getHours() > WORK_END) || (pickupDateTime.getHours() === WORK_END && pickupDateTime.getMinutes() > 0)) {
        setValidationError('Alış saati 08:00 – 19:00 arasında olmalıdır.'); return false;
      }

      if (deliveryDateTime.getHours() < WORK_START || (deliveryDateTime.getHours() > WORK_END) || (deliveryDateTime.getHours() === WORK_END && deliveryDateTime.getMinutes() > 0)) {
        setValidationError('Teslim saati 08:00 – 19:00 arasında olmalıdır.'); return false;
      }

      // Same-day earliest pickup rule
      if (isSameDay(pickupDateTime, nowLocal)) {
        const earliest = new Date(nowLocal.getTime() + 60 * 60 * 1000);
        if (pickupDateTime < earliest) {
          setValidationError(`Bugün için en erken teslim alma saati ${formatTime(roundUpToInterval(earliest, INTERVAL_MINUTES))} olabilir.`);
          return false;
        }
      }

      // Delivery must be at least 3 hours after pickup
      const minDelivery = new Date(pickupDateTime.getTime() + 3 * 60 * 60 * 1000);
      if (deliveryDateTime < minDelivery) {
        setValidationError('Teslim saati, teslim alma saatinden en az 3 saat sonra olmalıdır.'); return false;
      }

      setValidationError(null);
      return true;
    } catch (err) { console.log(err); setValidationError('Tarih ve saat doğrulaması yapılamadı.'); return false; }
  };

  const handlePickupDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setPickupDate(selectedDate);
      // clear existing selections that may be invalid for new date
      if (pickupTime) setPickupTime(null);
      if (deliveryTime) setDeliveryTime(null);
      // clear delivery date if it's now before the new pickup date
      if (deliveryDate < selectedDate) {
        setDeliveryDate(new Date(selectedDate.getTime() + 2 * 24 * 60 * 60 * 1000));
      }
      setValidationError(null);
    }
    setOpenPicker(null);
  };

  const handleDeliveryDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setDeliveryDate(selectedDate);
      // clear delivery time if it no longer fits
      if (deliveryTime) setDeliveryTime(null);
      setValidationError(null);
    }
    setOpenPicker(null);
  };

  const handleSelectPickupSlot = (slot) => {
    setPickupTime(slot);
    // if delivery exists but now invalid, clear it and show message
    if (deliveryTime) {
      const minDelivery = new Date(slot.getTime() + 3 * 60 * 60 * 1000);
      if (deliveryTime < minDelivery) {
        setDeliveryTime(null);
        setValidationError('Teslim saati, teslim alma saatinden en az 3 saat sonra olmalıdır. Lütfen yeni bir teslim saati seçin.');
      } else {
        setValidationError(null);
      }
    }
    setOpenPicker(null);
  };

  const handleSelectDeliverySlot = (slot) => {
    setDeliveryTime(slot);
    setValidationError(null);
    setOpenPicker(null);
  };

  const handleContinue = () => {
    if (!validateTimes()) return;
    if (!selectedAddress) { setValidationError('Lütfen bir teslimat adresi seçin.'); return; }
    navigation.navigate('OrderSummary', { selectedService, selectedProducts, address: selectedAddress, pickupDate: pickupDate.toISOString().split('T')[0], pickupTime: pickupTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), deliveryDate: deliveryDate.toISOString().split('T')[0], deliveryTime: deliveryTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), notes, originalTotalPrice, isRepeatOrder });
  };

  const minDate = new Date(); minDate.setHours(0,0,0,0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 140 }}>
      <View style={styles.section}><Text style={styles.sectionTitle}>Teslimat Adresi</Text>
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

      <View style={styles.section}><Text style={styles.sectionTitle}>Randevu Zamanı</Text>
        {validationError && <View style={styles.errorBanner}><Text style={styles.errorBannerText}>{validationError}</Text></View>}

        <View style={styles.card}><Text style={styles.cardTitle}>Alış Tarihi & Saati</Text>
          <Text style={styles.fieldLabel}>Alış Tarihi</Text>
          <TouchableOpacity style={styles.inputBtn} onPress={() => setOpenPicker(openPicker === 'pickupDate' ? null : 'pickupDate')}><Text style={styles.inputBtnText}>{pickupDate.toLocaleDateString('tr-TR')}</Text></TouchableOpacity>
          <Text style={styles.fieldLabel}>Alış Saati</Text>
          <TouchableOpacity style={styles.inputBtn} onPress={() => setIsPickupModalOpen(true)}>
            <Text style={styles.inputBtnText}>{pickupTime ? formatTime(pickupTime) : 'Alış saati seçin'}</Text>
          </TouchableOpacity>
          {openPicker === 'pickupDate' && <DateTimePicker value={pickupDate} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={handlePickupDateChange} minimumDate={minDate} />}
        </View>

        <View style={styles.card}><Text style={styles.cardTitle}>Teslim Tarihi & Saati</Text>
          <Text style={styles.fieldLabel}>Teslim Tarihi</Text>
          <TouchableOpacity style={styles.inputBtn} onPress={() => setOpenPicker(openPicker === 'deliveryDate' ? null : 'deliveryDate')}><Text style={styles.inputBtnText}>{deliveryDate.toLocaleDateString('tr-TR')}</Text></TouchableOpacity>
          <Text style={styles.fieldLabel}>Teslim Saati</Text>
          <TouchableOpacity style={styles.inputBtn} onPress={() => setIsDeliveryModalOpen(true)}>
            <Text style={styles.inputBtnText}>{deliveryTime ? formatTime(deliveryTime) : 'Teslim saati seçin'}</Text>
          </TouchableOpacity>
          {openPicker === 'deliveryDate' && <DateTimePicker value={deliveryDate} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={handleDeliveryDateChange} minimumDate={pickupDate} />}
        </View>
      </View>

      {/* Pickup time modal */}
      <Modal visible={isPickupModalOpen} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setIsPickupModalOpen(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Alış Saati Seçin</Text>
          <ScrollView contentContainerStyle={{ padding: 12 }}>
            {(() => {
              const nowLocal = new Date();
              const slots = buildPickupSlots(pickupDate, nowLocal);
              const allDisabled = slots.every(s => s.disabled);
              if (allDisabled) {
                if (isSameDay(pickupDate, nowLocal) && getEarliestPickupDateTime(nowLocal) === null) {
                  return <Text style={styles.smallHint}>Şu an çalışma saatleri dışında. En erken randevu yarın 08:00.</Text>;
                }
                return <Text style={styles.smallHint}>Uygun alış saati bulunamadı. Lütfen başka bir tarih seçin.</Text>;
              }

              return slots.map(sObj => {
                const s = sObj.slot;
                const disabled = sObj.disabled;
                const selected = pickupTime && s.getTime() === pickupTime.getTime();
                return (
                  <TouchableOpacity
                    key={s.toISOString()}
                    style={[styles.slotButton, selected && styles.slotButtonSelected, disabled && styles.slotButtonDisabled]}
                    onPress={() => { if (!disabled) { handleSelectPickupSlot(s); setIsPickupModalOpen(false); } }}
                    disabled={disabled}
                  >
                    <Text style={[styles.slotText, selected && styles.slotTextSelected, disabled && styles.slotTextDisabled]}>{formatTime(s)}</Text>
                  </TouchableOpacity>
                );
              });
            })()}
          </ScrollView>
        </View>
      </Modal>

      {/* Delivery time modal */}
      <Modal visible={isDeliveryModalOpen} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setIsDeliveryModalOpen(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Teslim Saati Seçin</Text>
          <ScrollView contentContainerStyle={{ padding: 12 }}>
            {(() => {
              if (!pickupTime) return <Text style={styles.smallHint}>Önce alış saatini seçin.</Text>;
              const slots = buildDeliverySlots(deliveryDate, pickupTime);
              const allDisabled = slots.every(s => s.disabled);
              if (allDisabled) return <Text style={styles.smallHint}>Seçilen gün için uygun teslim saati yok. Lütfen başka bir gün seçin.</Text>;
              return slots.map(sObj => {
                const s = sObj.slot;
                const disabled = sObj.disabled;
                const selected = deliveryTime && s.getTime() === deliveryTime.getTime();
                return (
                  <TouchableOpacity
                    key={s.toISOString()}
                    style={[styles.slotButton, selected && styles.slotButtonSelected, disabled && styles.slotButtonDisabled]}
                    onPress={() => { if (!disabled) { handleSelectDeliverySlot(s); setIsDeliveryModalOpen(false); } }}
                    disabled={disabled}
                  >
                    <Text style={[styles.slotText, selected && styles.slotTextSelected, disabled && styles.slotTextDisabled]}>{formatTime(s)}</Text>
                  </TouchableOpacity>
                );
              });
            })()}
          </ScrollView>
        </View>
      </Modal>

      <View style={styles.section}><Text style={styles.sectionTitle}>Notlar</Text>
        <TextInput style={styles.notesInput} placeholder="Sipariş notu" multiline numberOfLines={3} value={notes} onChangeText={setNotes} placeholderTextColor="#999" />
      </View>

      <TouchableOpacity
        style={[
          styles.continueBtn,
          (validationError || !selectedAddress || !pickupTime || !deliveryTime) && styles.continueBtnDisabled,
        ]}
        onPress={() => {
          if (!validateTimes()) return;
          if (!selectedAddress) { setValidationError('Lütfen bir teslimat adresi seçin.'); return; }
          handleContinue();
        }}
        disabled={!!validationError || !selectedAddress || !pickupTime || !deliveryTime}
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
  slotsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  slotButton: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E6E9EE', marginRight: 8, marginBottom: 8 },
  slotButtonSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  slotText: { color: '#0F172A', fontWeight: '700' },
  slotTextSelected: { color: '#fff' },
  smallHint: { color: '#475569', fontSize: 13, marginTop: 8 },
  slotButtonDisabled: { backgroundColor: '#F1F5F9', borderColor: '#E6E9EE' },
  slotTextDisabled: { color: '#94A3B8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: '60%' },
  modalTitle: { fontSize: 16, fontWeight: '800', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
});

export default OrderAddressAndTimeScreen;
