export const isCourierAssigned = (order) => {
  if (!order) return false;
  const statusAssigned = order.status === 'courier_assigned' || order.status === 'courier_accepted' || order.status === 'in_transit';
  const hasCourier = !!(order.courierId || order.courier);
  return statusAssigned || hasCourier;
};

export default { isCourierAssigned };
