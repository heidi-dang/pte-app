type DeliveryStatus = 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';

const transitions: Record<DeliveryStatus, DeliveryStatus[]> = {
  queued: ['sent', 'failed'],
  sent: ['delivered', 'bounced', 'failed'],
  delivered: [],
  bounced: ['failed'],
  failed: ['queued'],
};

export function canTransitionDelivery(from: DeliveryStatus, to: DeliveryStatus): boolean {
  return transitions[from]?.includes(to) ?? false;
}
