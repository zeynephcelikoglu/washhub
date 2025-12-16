import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import ClothingCard from '../../components/ClothingCard';

const CLOTHING_TYPES = [
  { id: 'shirt', title: 'Gömlek', desc: 'Günlük gömlek', icon: '👕' },
  { id: 'pants', title: 'Pantolon', desc: 'Kot / Kumaş pantolon', icon: '👖' },
  { id: 'dress', title: 'Elbise', desc: 'Elbise / etek', icon: '👗' },
  { id: 'coat', title: 'Mont / Ceket', desc: 'Dış giyim', icon: '🧥' },
  { id: 'towel', title: 'Havlu', desc: 'Banyo havluları', icon: '🧻' },
  { id: 'bedsheet', title: 'Çarşaf', desc: 'Yatak çarşafı', icon: '🛏️' },
  { id: 'delicate', title: 'Hassas', desc: 'İpek / özel kumaş', icon: '🪡' },
];

const SelectClothingScreen = ({ navigation, route }) => {
  const serviceType = route?.params?.serviceType || 'washing';

  // quantities keyed by clothing id
  const [quantities, setQuantities] = useState(() => CLOTHING_TYPES.reduce((acc, c) => ({ ...acc, [c.id]: 0 }), {}));

  const toggleSelect = (id) => {
    setQuantities(q => ({ ...q, [id]: (q[id] || 0) === 0 ? 1 : 0 }));
  };

  const inc = (id) => setQuantities(q => ({ ...q, [id]: (q[id] || 0) + 1 }));
  const dec = (id) => setQuantities(q => ({ ...q, [id]: Math.max(0, (q[id] || 0) - 1) }));

  const selectedClothes = useMemo(() => {
    return Object.keys(quantities).filter(k => quantities[k] > 0).map(k => ({ id: k, qty: quantities[k], title: CLOTHING_TYPES.find(c => c.id === k)?.title }));
  }, [quantities]);

  const handleContinue = () => {
    // Navigate to existing CreateOrder stack screen and pass params
    navigation.navigate('CreateOrder', { serviceType, selectedClothes });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hizmet: {formatService(serviceType)}</Text>

      <FlatList
        data={CLOTHING_TYPES}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <ClothingCard
            item={item}
            qty={quantities[item.id]}
            onInc={() => inc(item.id)}
            onDec={() => dec(item.id)}
            selected={(quantities[item.id] || 0) > 0}
            onToggle={() => toggleSelect(item.id)}
          />
        )}
      />

      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>Seçilen: {selectedClothes.length} tür</Text>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueBtnText}>Devam</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const formatService = (s) => {
  switch (s) {
    case 'washing': return 'Yıkama';
    case 'ironing': return 'Ütü';
    case 'drying': return 'Kurutma';
    case 'dry_cleaning': return 'Kuru Temizleme';
    default: return s;
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FA' },
  header: { padding: 16, fontSize: 16, fontWeight: '800', color: '#0F172A' },
  summaryBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', padding: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryText: { fontSize: 14, color: '#475569', fontWeight: '700' },
  continueBtn: { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
  continueBtnText: { color: '#fff', fontWeight: '800' },
});

export default SelectClothingScreen;
