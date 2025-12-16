import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ClothingCard = ({ item, qty, onInc, onDec, selected, onToggle }) => {
  return (
    <TouchableOpacity activeOpacity={0.95} style={[styles.card, selected && styles.selected]} onPress={onToggle}>
      <View style={styles.left}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>
      <View style={styles.mid}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.desc}>{item.desc}</Text>
      </View>
      <View style={styles.right}>
        <View style={styles.qtyRow}>
          <TouchableOpacity onPress={onDec} style={styles.qtyBtn}><Text style={styles.qtyText}>−</Text></TouchableOpacity>
          <Text style={styles.qtyValue}>{qty || 0}</Text>
          <TouchableOpacity onPress={onInc} style={styles.qtyBtn}><Text style={styles.qtyText}>+</Text></TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#fff', marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  selected: { borderColor: '#007AFF', backgroundColor: '#F0F7FF' },
  left: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  icon: { fontSize: 24 },
  mid: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  desc: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  right: { width: 110, alignItems: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 6, borderWidth: 1, borderColor: '#E6E9EE' },
  qtyBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  qtyText: { fontSize: 18, color: '#007AFF', fontWeight: '700' },
  qtyValue: { width: 30, textAlign: 'center', fontWeight: '700', color: '#0F172A' },
});

export default ClothingCard;
