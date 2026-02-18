'use client'

import { ExpiredItemsManager } from '@/components/expired-items-manager'

export default function ExpiredItemsPage() {
  // Mock expired items for demo
  const mockExpiredItems = [
    {
      id: '101',
      sushiId: '2',
      sushiName: 'Cucumber Roll',
      plateColor: 'white' as const,
      productionTime: new Date(Date.now() - 140 * 60 * 1000), // 140 min ago
      shelfLifeMinutes: 120,
      status: 'sold' as const,
      notes: 'Customer picked up late',
      expiredAt: new Date(Date.now() - 20 * 60 * 1000),
    },
    {
      id: '102',
      sushiId: '4',
      sushiName: 'Tuna Nigiri',
      plateColor: 'blue' as const,
      productionTime: new Date(Date.now() - 95 * 60 * 1000), // 95 min ago
      shelfLifeMinutes: 90,
      status: 'waste' as const,
      notes: 'Temperature concern',
      expiredAt: new Date(Date.now() - 5 * 60 * 1000),
    },
  ]

  const handleRemoveItem = (itemId: string) => {
    // In production, this would update the database
    console.log(`Removing item: ${itemId}`)
  }

  return <ExpiredItemsManager expiredItems={mockExpiredItems} onRemove={handleRemoveItem} />
}
