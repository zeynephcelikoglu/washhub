import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ServiceCard = ({ title, description, icon, onPress, backgroundColor }) => {
  return (
    <TouchableOpacity activeOpacity={0.9} style={[styles.card, { backgroundColor }]} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: { fontSize: 26 },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  desc: { fontSize: 12, color: '#64748B', marginTop: 4 },
});

export default ServiceCard;
