import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProductController } from '../../../controllers/ProductController';
import { getSavedMarketplaceItems, staticProducts } from '../../../data/marketplaceProducts';
import './product-detail.css';

const getProductName = (product) => product?.name || product?.item_name || 'Product';

const SIZES = ['STD.', '0.001', '0.002', '0.003', '0.004', '0.005'];

const CONNECTING_ROD_KITS = [
    {
        id: 'bajaj',
        name: 'BAJAJ AUTO',
        items: [
            { id: 1, macoNo: 'BV-805', suitableFor: 'BAJAJ VESPA 150cc', listPrice: 324.00 },
            { id: 2, macoNo: 'BB-815', suitableFor: 'BAJAJ XCD 125cc', listPrice: 375.00 },
            { id: 12, macoNo: 'BD-879', suitableFor: 'BAJAJ DISCOVER 100 T', listPrice: 370.00 },
            { id: 18, macoNo: 'BP-943', suitableFor: 'BAJAJ PULSAR 220 (BS6)', listPrice: 536.00 },
            { id: 19, macoNo: 'BD-855', suitableFor: 'BAJAJ DISCOVER 100cc', listPrice: 370.00 },
            { id: 20, macoNo: 'BC-849', suitableFor: 'BAJAJ CT-100/PLATINA', listPrice: 450.00 },
            { id: 21, macoNo: 'BP-935', suitableFor: 'BAJAJ PULSAR 150 (BS6)', listPrice: 478.00 },
            { id: 22, macoNo: 'BC-925', suitableFor: 'BAJAJ CT-110 (BS 6)', listPrice: 370.00 },
            { id: 10, macoNo: 'BP-847', suitableFor: 'BP DIGITAL METER 150cc', listPrice: 478.00 },
            { id: 24, macoNo: 'BP-847', suitableFor: 'BP DIGITAL METER 150cc (Duplicate)', listPrice: 478.00 }
        ]
    },
    {
        id: 'honda',
        name: 'HONDA',
        items: [
            { id: 3, macoNo: 'HS-816', suitableFor: 'HONDA SHINE 125cc', listPrice: 428.00 },
            { id: 7, macoNo: 'HA-875', suitableFor: 'HONDA ACTIVA HET 110', listPrice: 377.00 },
            { id: 11, macoNo: 'HU-955', suitableFor: 'HONDA UNICORN 150cc', listPrice: 428.00 },
            { id: 15, macoNo: 'HA-928', suitableFor: 'HONDA ACTIVA 110 6G (BS6)', listPrice: 377.00 },
            { id: 16, macoNo: 'HA-845', suitableFor: 'HONDA ACTIVA 102cc', listPrice: 369.00 },
            { id: 25, macoNo: 'HA-859', suitableFor: 'HONDA ACTIVA N/M 110cc', listPrice: 370.00 },
        ]
    },
    {
        id: 'tvs',
        name: 'TVS MOTORS',
        items: [
            { id: 4, macoNo: 'TM-836', suitableFor: 'TVS SUPER XL/HD 70cc', listPrice: 205.00 },
            { id: 8, macoNo: 'TM-885', suitableFor: 'TVS SUPER XL 4S', listPrice: 423.00 },
            { id: 26, macoNo: 'TP-957', suitableFor: 'TVS SCOOTY PEP PLUS 90cc', listPrice: 370.00 },
        ]
    },
    {
        id: 'hero',
        name: 'HERO MOTOCORP',
        items: [
            { id: 5, macoNo: 'HH-956', suitableFor: 'HH SUPER SPLENDOR', listPrice: 373.00 },
            { id: 6, macoNo: 'HH-800', suitableFor: 'HERO HONDA CD-100', listPrice: 359.00 },
            { id: 13, macoNo: 'HH-921', suitableFor: 'HERO HF DLX (BS6)', listPrice: 370.00 },
            { id: 14, macoNo: 'HH-913', suitableFor: 'HH SUPER SPLENDOR NEW', listPrice: 423.00 },
        ]
    },
    {
        id: 'suzuki',
        name: 'SUZUKI',
        items: [
            { id: 9, macoNo: 'TA-899', suitableFor: 'SUZUKI ACCESS 125cc/NEW', listPrice: 395.00 },
            { id: 17, macoNo: 'TA-856', suitableFor: 'SUZUKI ACCESS 125cc', listPrice: 447.00 },
        ]
    },
    {
        id: 'yamaha',
        name: 'YAMAHA',
        items: [
            { id: 23, macoNo: 'EY-936', suitableFor: 'YAMAHA RAY ZR 125 (BS 6)', listPrice: 375.00 },
        ]
    }
];

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { products, loading, addMultipleToCart } = useProductController();
    const [product, setProduct] = useState(null);
    const [expandedCompanies, setExpandedCompanies] = useState({});
    const [quantities, setQuantities] = useState({});
    const [selectedRows, setSelectedRows] = useState({});

    const allItemIds = useMemo(() => {
        return CONNECTING_ROD_KITS.flatMap(company => company.items.map(item => item.id));
    }, []);

    const allGlobalSelected = allItemIds.length > 0 && allItemIds.every(id => selectedRows[id]);

    const handleGlobalSelectAll = (e) => {
        const checked = e.target.checked;
        const next = {};
        if (checked) {
            allItemIds.forEach(id => {
                next[id] = true;
            });
        }
        setSelectedRows(next);
    };

    const handleQuantityChange = (itemId, size, value) => {
        const qtyKey = `${itemId}-${size}`;
        setQuantities(prev => ({
            ...prev,
            [qtyKey]: Math.max(0, parseInt(value) || 0)
        }));
    };

    const getRowTotalQty = (itemId) => {
        return SIZES.reduce((total, size) => {
            return total + (quantities[`${itemId}-${size}`] || 0);
        }, 0);
    };

    const marketplaceProducts = useMemo(() => (
        [...products, ...getSavedMarketplaceItems(), ...staticProducts]
    ), [products]);

    useEffect(() => {
        const found = marketplaceProducts.find(p => String(p.id) === String(id));
        setProduct(found || null);
    }, [marketplaceProducts, id]);

    const toggleCompany = (companyId) => {
        setExpandedCompanies(prev => ({
            ...prev,
            [companyId]: !prev[companyId]
        }));
    };

    const handleAddToCart = () => {
        const itemsToAdd = [];
        CONNECTING_ROD_KITS.forEach(company => {
            company.items.forEach(item => {
                if (!selectedRows[item.id]) return; // Skip if row is not selected

                SIZES.forEach(size => {
                    const qty = quantities[`${item.id}-${size}`] || 0;
                    if (qty > 0) {
                        itemsToAdd.push({
                            id: product?.id || 'prod-1',
                            item_id: item.macoNo,
                            name: `${item.suitableFor} (${size})`,
                            category: product?.category || 'Connecting Rod Kits',
                            size: size,
                            size_id: `${item.id}-${size}`,
                            qty: qty,
                            price: item.listPrice,
                            uom: 'PCS',
                            total: qty * item.listPrice,
                            cartId: `${item.id}-${size}-${Date.now()}`
                        });
                    }
                });
            });
        });

        if (itemsToAdd.length > 0) {
            addMultipleToCart(itemsToAdd);
            window.dispatchEvent(new Event('cartUpdated'));
            alert(`Added ${itemsToAdd.length} items to cart!`);
            setQuantities({});
            setSelectedRows({});
        } else {
            alert('Please enter a quantity greater than 0 for the selected items.');
        }
    };

    if (loading && !product) return <div className="text-center mt-20">Loading Product Details...</div>;
    // if (!product && !loading) return <div className="text-center mt-20">Product not found.</div>;

    let globalSerialNo = 1;

    const hasValidSelection = Object.entries(selectedRows).some(([id, isSelected]) => {
        if (!isSelected) return false;
        return SIZES.some(size => (quantities[`${id}-${size}`] || 0) > 0);
    });

    return (
        <div className="product-sheet-page">
            <div className="sheet-actions sticky-header" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        Back to Catalog
                    </button>
                </div>
                <button
                    className="add-to-cart-btn"
                    onClick={handleAddToCart}
                    disabled={!hasValidSelection}
                    style={{
                        background: hasValidSelection ? '#3b82f6' : '#cbd5e1',
                        cursor: hasValidSelection ? 'pointer' : 'not-allowed'
                    }}
                >
                    Add to Cart All Selected Items
                </button>
            </div>

            <section className="excel-sheet" aria-label="Related sub products">
                <div className="sheet-title">
                    <h1>PRICE LIST FOR {getProductName(product).toUpperCase()}</h1>
                </div>

                <div className="accordion-list">
                    {CONNECTING_ROD_KITS.map((company) => {
                        const isExpanded = expandedCompanies[company.id];
                        return (
                            <div key={company.id} className="accordion-item">
                                <div
                                    className="accordion-header"
                                    onClick={() => toggleCompany(company.id)}
                                >
                                    <span className="accordion-icon">{isExpanded ? '-' : '+'}</span>
                                    <span className="accordion-title">{company.name}</span>
                                </div>

                                {isExpanded && (
                                    <div className="accordion-content" style={{ overflowX: 'auto' }}>
                                        <table className="sub-product-table" style={{ minWidth: '900px' }}>
                                            <thead>
                                                <tr>
                                                    <th className="col-serial" rowSpan={2} style={{ verticalAlign: 'middle', minWidth: '80px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                                                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '14px' }}>SELECT</div>
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'normal', margin: 0, padding: 0 }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={allGlobalSelected}
                                                                    onChange={handleGlobalSelectAll}
                                                                    style={{ width: '14px', height: '14px', cursor: 'pointer', margin: 0 }}
                                                                    title="Select all items across all groups"
                                                                />
                                                                ALL
                                                            </label>
                                                        </div>
                                                    </th>
                                                    <th className="col-code" rowSpan={2}>MACO PART NO.</th>
                                                    <th rowSpan={2}>ITEM DESCRIPTION</th>
                                                    <th colSpan={6} style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>SIZE</th>
                                                    <th className="col-qty" rowSpan={2}>TOTAL QTY.</th>
                                                    <th className="col-price" rowSpan={2}>LIST PRICE</th>
                                                    <th className="col-price" rowSpan={2}>TOTAL LIST VALUE</th>
                                                </tr>
                                                <tr>
                                                    {SIZES.map(size => (
                                                        <th key={size} style={{ fontSize: '0.85rem', width: '60px' }}>{size}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {company.items.map(item => {
                                                    const rowQty = getRowTotalQty(item.id);
                                                    const rowValue = rowQty * item.listPrice;

                                                    return (
                                                        <tr key={item.id} style={{ backgroundColor: selectedRows[item.id] ? '#f0f9ff' : 'transparent' }}>
                                                            <td style={{ verticalAlign: 'middle' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!selectedRows[item.id]}
                                                                        onChange={(e) => {
                                                                            const checked = e.target.checked;
                                                                            setSelectedRows(prev => ({
                                                                                ...prev,
                                                                                [item.id]: checked
                                                                            }));
                                                                        }}
                                                                        style={{ width: '16px', height: '16px', cursor: 'pointer', margin: 0 }}
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td style={{ fontWeight: 'bold', verticalAlign: 'middle' }}>{item.macoNo}</td>
                                                            <td className="suitable-cell">{item.suitableFor}</td>

                                                            {SIZES.map(size => (
                                                                <td key={size} className="qty-cell" style={{ padding: '4px' }}>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={quantities[`${item.id}-${size}`] || ''}
                                                                        onChange={(e) => handleQuantityChange(item.id, size, e.target.value)}
                                                                        className="qty-input"
                                                                        placeholder="-"
                                                                        style={{ width: '100%', padding: '4px', textAlign: 'center', margin: 0 }}
                                                                    />
                                                                </td>
                                                            ))}

                                                            <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{rowQty > 0 ? rowQty : '-'}</td>
                                                            <td style={{ textAlign: 'right' }}>{item.listPrice.toFixed(2)}</td>
                                                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{rowValue > 0 ? rowValue.toFixed(2) : '-'}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}

