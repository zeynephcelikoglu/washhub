import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { normalizeOrderItems } from '../utils/normalizeOrderItems';

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

const groupProductsByServiceType = (items) => {
  const grouped = {};
  items.forEach(i => {
    // Group strictly by originalServiceType to avoid showing technical enums
    const key = i.originalServiceType || 'other';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(i);
  });
  return grouped;
};

/**
 * OrderItemsList Component - Minimalist Design
 * 
 * Displays order items grouped by service type with clean, modern styling.
 * 
 * Props:
 *   - items: array of order items
 *   - totalPrice: number (optional)
 *   - compact: boolean (optional, if true omits service group headers)
 */
const OrderItemsList = ({ items = [], totalPrice = null, compact = false }) => {
  const normalized = normalizeOrderItems(items || []);
  
  if (normalized.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Ürün bulunamadı</Text>
      </View>
    );
  }

  if (compact) {
    // Compact mode: no grouping, just list items
    return (
      <View>
        {normalized.map((item, idx) => (
          <View key={idx} style={styles.compactItemContainer}>
            {/* Product Name and Price Row */}
            <View style={styles.nameAndPriceRow}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.priceValue}>
                {(item.price * item.quantity).toFixed(2)} ₺
              </Text>
            </View>

            {/* Quantity */}
            <Text style={styles.quantityText}>{item.quantity} adet</Text>
          </View>
        ))}

        {/* Grand Total if provided */}
        {totalPrice !== null && (
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Toplam</Text>
            <Text style={styles.totalValue}>{totalPrice.toFixed(2)} ₺</Text>
          </View>
        )}
      </View>
    );
  }

  // Grouped mode: group by service type
  const grouped = groupProductsByServiceType(normalized);
  const groupEntries = Object.entries(grouped);
  
  return (
    <View>
      {groupEntries.map(([serviceType, groupItems], groupIndex) => (
        <View key={serviceType}>
          {/* Service Header */}
          <Text style={[styles.serviceHeaderText, groupIndex === 0 && styles.firstServiceHeader]}>
            {serviceType === 'other' ? 'Diğer' : getServiceTypeLabel(serviceType, null)}
          </Text>

          {/* Items in this group */}
          {groupItems.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.itemContainer,
                idx < groupItems.length - 1 && styles.itemContainerWithSpace,
              ]}
            >
              {/* Product Name and Price Row */}
              <View style={styles.nameAndPriceRow}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.priceValue}>
                  {(item.price * item.quantity).toFixed(2)} ₺
                </Text>
              </View>

              {/* Quantity */}
              <Text style={styles.quantityText}>{item.quantity} adet</Text>
            </View>
          ))}

          {/* Space between groups */}
          <View style={styles.groupSpacer} />
        </View>
      ))}

      {/* Grand Total if provided */}
      {totalPrice !== null && (
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Toplam</Text>
          <Text style={styles.totalValue}>{totalPrice.toFixed(2)} ₺</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },

  // Grouped layout
  serviceHeaderText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#888',
    marginTop: 8,
    marginBottom: 4,
  },
  firstServiceHeader: {
    marginTop: 0,
  },

  // Item container
  itemContainer: {
    marginBottom: 6,
  },
  itemContainerWithSpace: {
    marginBottom: 6,
  },
  compactItemContainer: {
    marginBottom: 6,
  },

  // Product name and price on same line
  nameAndPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },

  // Quantity text (minimal, no prefix)
  quantityText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '400',
  },

  // Space between groups
  groupSpacer: {
    height: 2,
  },

  // Grand total
  totalContainer: {
    marginTop: 12,
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});

export default OrderItemsList;

