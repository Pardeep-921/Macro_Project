export const SAVED_MARKETPLACE_ITEMS_KEY = 'maco_marketplace_items';

export const staticProducts = [
    { id: 'p1', name: 'Industrial Spare Part 1', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.35 PM.jpeg', specifications: 'High durability, precision engineered' },
    { id: 'p2', name: 'Industrial Spare Part 2', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.36 PM (1).jpeg', specifications: 'Corrosion resistant material' },
    { id: 'p3', name: 'Industrial Spare Part 3', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.36 PM (2).jpeg', specifications: 'Heavy duty construction' },
    { id: 'p4', name: 'Industrial Spare Part 4', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.36 PM.jpeg', specifications: 'Standard sizing for universal fit' },
    { id: 'p5', name: 'Industrial Spare Part 5', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.37 PM (1).jpeg', specifications: 'Premium quality finish' },
    { id: 'p6', name: 'Industrial Spare Part 6', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.37 PM (2).jpeg', specifications: 'Tested for extreme conditions' },
    { id: 'p7', name: 'Industrial Spare Part 7', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.37 PM.jpeg', specifications: 'Easy to install' },
    { id: 'p8', name: 'Industrial Spare Part 8', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.38 PM (1).jpeg', specifications: 'Lightweight but strong' },
    { id: 'p9', name: 'Industrial Spare Part 9', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.38 PM (2).jpeg', specifications: 'ISO certified manufacturing' },
    { id: 'p10', name: 'Industrial Spare Part 10', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.39 PM (1).jpeg', specifications: 'Long life cycle' },
    { id: 'p11', name: 'Industrial Spare Part 11', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.39 PM.jpeg', specifications: 'Cost-effective replacement' }
];

export const getSavedMarketplaceItems = () => {
    try {
        return JSON.parse(localStorage.getItem(SAVED_MARKETPLACE_ITEMS_KEY)) || [];
    } catch {
        return [];
    }
};
