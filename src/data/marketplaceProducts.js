export const SAVED_MARKETPLACE_ITEMS_KEY = 'maco_marketplace_items';

export const staticProducts = [
    { id: 'p1', category: 'Industrial Spare Part 1', name: 'Clutch Assembly / Clutch Pressure Plate', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.35 PM.jpeg', specifications: 'Transfers engine power to the transmission.' },
    { id: 'p2', category: 'Industrial Spare Part 2', name: 'Engine Valves (Intake & Exhaust Valves)', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.36 PM (1).jpeg', specifications: 'Controls air/fuel intake and exhaust gases.' },
    { id: 'p3', category: 'Industrial Spare Part 3', name: 'Motorcycle Clutch Friction Plates', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.36 PM (2).jpeg', specifications: 'Provides friction for clutch engagement.' },
    { id: 'p4', category: 'Industrial Spare Part 4', name: 'Automatic Transmission Steel Clutch Plates', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.36 PM.jpeg', specifications: 'Used inside automatic transmission clutch packs.' },
    { id: 'p5', category: 'Industrial Spare Part 5', name: 'Motorcycle Crankshaft Assembly', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.37 PM (1).jpeg', specifications: 'Converts piston motion into rotational motion.' },
    { id: 'p6', category: 'Industrial Spare Part 6', name: 'Piston Pins (Gudgeon Pins / Wrist Pins)', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.37 PM (2).jpeg', specifications: 'Connects the piston to the connecting rod.' },
    { id: 'p7', category: 'Industrial Spare Part 7', name: 'Piston Pins (Various Sizes)', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.37 PM.jpeg', specifications: 'Engine piston connection component.' },
    { id: 'p8', category: 'Industrial Spare Part 8', name: 'Connecting Rods', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.38 PM (1).jpeg', specifications: 'Connects pistons to the crankshaft.' },
    { id: 'p9', category: 'Industrial Spare Part 9', name: 'Disc Brake Pads', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.38 PM (2).jpeg', specifications: 'Provides braking friction against the disc rotor.' },
    { id: 'p10', category: 'Industrial Spare Part 10', name: 'Brake Shoes', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.39 PM (1).jpeg', specifications: 'Used in drum brake systems.' },
    { id: 'p11', category: 'Industrial Spare Part 11', name: 'Brake Shoe Linings / Drum Brake Shoes', imageUrl: '/product-images/WhatsApp Image 2026-04-08 at 1.45.39 PM.jpeg', specifications: 'Replacement brake shoes for drum brakes.' }
];

export const getSavedMarketplaceItems = () => {
    try {
        return JSON.parse(localStorage.getItem(SAVED_MARKETPLACE_ITEMS_KEY)) || [];
    } catch {
        return [];
    }
};
