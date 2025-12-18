// Utility to normalize various legacy/new order item shapes
export const normalizeOrderItem = (item) => {
  if (!item) return null;

  const productObj = item.product && typeof item.product === 'object' ? item.product : null;

  const id = item.productId || productObj?._id || productObj?.id || item.product || item.id || item._id;

  const name = item.name ?? productObj?.name ?? productObj?.title;
  const priceRaw = item.price ?? productObj?.price ?? productObj?.basePrice;
  const price = priceRaw !== undefined && priceRaw !== null ? Number(priceRaw) : undefined;
  const quantity = Number(item.quantity ?? item.qty ?? 1) || 1;
  const mapServiceTypeToEnum = (serviceTypeValue) => {
    const VALID = ['standard', 'express', 'dry_clean'];
    if (!serviceTypeValue) return 'standard';
    if (VALID.includes(serviceTypeValue)) return serviceTypeValue;
    const mapping = {
        washing: 'standard',
        ironing: 'express',
        drying: 'express',
        dry_cleaning: 'dry_clean',
        dry_clean: 'dry_clean',
        standard: 'standard',
        express: 'express'
      };
      return mapping[serviceTypeValue] || 'standard';
  };

  const originalServiceType = item.originalServiceType ?? item.serviceType ?? productObj?.serviceType ?? productObj?.type ?? null;
  const serviceType = mapServiceTypeToEnum(item.serviceType || productObj?.serviceType || productObj?.type || originalServiceType || 'standard');

  // Enforce snapshot presence: name and price must exist and price > 0
  const hasSnapshot = typeof name === 'string' && name.trim() !== '' && (price !== undefined && price !== null && !isNaN(price) && price > 0);
  if (!hasSnapshot) {
    console.warn('ORDER ITEM MISSING SNAPSHOT:', JSON.stringify(item));
    return null;
  }

  return {
    id: id ? String(id) : undefined,
    productId: id ? String(id) : undefined,
    name: name.trim(),
    price,
    quantity,
    serviceType,
    originalServiceType,
    raw: item,
  };
};

export const normalizeOrderItems = (items = []) => {
  if (!Array.isArray(items)) return [];
  const normalized = items.map(normalizeOrderItem).filter(Boolean);
  if (Array.isArray(items) && normalized.length !== items.length) {
    console.warn(`DATA LOSS: ${items.length - normalized.length} items missing snapshots`);
  }
  return normalized;
};

export default normalizeOrderItems;
