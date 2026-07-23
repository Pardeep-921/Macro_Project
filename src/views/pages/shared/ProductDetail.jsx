import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProductController } from '../../../controllers/ProductController';
import { useMasterDataController } from '../../../controllers/MasterDataController';
import { getSavedMarketplaceItems, staticProducts } from '../../../data/marketplaceProducts';
import './product-detail.css';

const getProductName = (product) => product?.name || product?.item_name || 'Product';

const DEFAULT_SIZE_OPTIONS = ['STD.', '001', '002', '003', '004', '005'];

const normalizeSizeLabel = (value) => String(value || '').trim().replace(/^0\.(\d{3})$/, '$1');



export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { products, loading, addMultipleToCart } = useProductController();
    const [product, setProduct] = useState(null);
    const [expandedCompanies, setExpandedCompanies] = useState({});
    const [quantities, setQuantities] = useState({});
    const [selectedRows, setSelectedRows] = useState({});

    const { data: subGroups, loading: subGroupsLoading } = useMasterDataController('SubGroups');
    const { data: masterItems, loading: itemsLoading } = useMasterDataController('Products');
    const { data: schema } = useMasterDataController('ItemMasterSchema');

    const getCompanySchemaAndSizes = (companyId) => {
        let compSchema = schema.filter(s => String(s.sub_group_id) === String(companyId));
        if (compSchema.length === 0) compSchema = schema.filter(s => !s.sub_group_id);
        
        const sorted = [...compSchema].sort((a, b) => a.order - b.order);
        
        const priceIndex = sorted.findIndex(f => f.key === 'list_price');
        const insertIdx = priceIndex >= 0 ? priceIndex : sorted.length;
        
        if (!sorted.some(f => f.key === 'total_qty')) {
            sorted.splice(insertIdx, 0, { id: 'v-qty', key: 'total_qty', label: 'TOTAL QTY.', type: 'number' });
        }
        if (!sorted.some(f => f.key === 'total_list_value')) {
            sorted.push({ id: 'v-val', key: 'total_list_value', label: 'TOTAL LIST VALUE', type: 'number' });
        }

        const sizeField = sorted.find(f => f.key === 'size');
        const sizes = sizeField?.options 
            ? sizeField.options.split(',').map(normalizeSizeLabel).filter(Boolean)
            : DEFAULT_SIZE_OPTIONS;

        return { schema: sorted, sizes };
    };

    const displayGroups = useMemo(() => {
        let baseGroups = [];

        const relatedSubGroups = subGroups.filter(sg => String(sg.primary_group_id) === String(id));

        relatedSubGroups.forEach(sg => {
            const items = masterItems.filter(item => String(item.sub_group_id) === String(sg.id)).map(item => ({
                ...item,
                id: item.id,
                macoNo: item.itemCode || item.item_code || item.maco_part_no || '',
                suitableFor: item.name || item.item_name || item.item_description || '',
                listPrice: parseFloat(item.rate || item.list_price || 0)
            }));

            const existingIndex = baseGroups.findIndex(bg => bg.name.toLowerCase() === sg.name.toLowerCase());
            if (existingIndex >= 0) {
                baseGroups[existingIndex].id = sg.id;
                const newItems = items.filter(newIt => !baseGroups[existingIndex].items.find(oldIt => oldIt.macoNo === newIt.macoNo));
                baseGroups[existingIndex].items = [...baseGroups[existingIndex].items, ...newItems];
            } else {
                baseGroups.push({ id: sg.id, name: sg.name, items: items });
            }
        });

        return baseGroups;

        return baseGroups;
    }, [id, subGroups, masterItems, product]);

    const allItemIds = useMemo(() => {
        return displayGroups.flatMap(company => company.items.map(item => item.id));
    }, [displayGroups]);

    const allGlobalSelected = allItemIds.length > 0 && allItemIds.every(itemId => selectedRows[itemId]);

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

    const getRowTotalQty = (itemId, compSizes) => {
        return compSizes.reduce((total, size) => {
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
        displayGroups.forEach(company => {
            const { sizes: compSizes } = getCompanySchemaAndSizes(company.id);
            
            company.items.forEach(item => {
                if (!selectedRows[item.id]) return; // Skip if row is not selected

                compSizes.forEach(size => {
                    const qty = quantities[`${item.id}-${size}`] || 0;
                    if (qty > 0) {
                        itemsToAdd.push({
                            id: product?.id || 'prod-1',
                            item_id: item.macoNo,
                            name: `${item.suitableFor} (${size})`,
                            category: product?.category || 'Connecting Rod Kits',
                            size: size,
                            size_id: `${item.id}-${size}`,
                            sizeOptions: compSizes,
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

    const hasValidSelection = displayGroups.some(company => {
        const { sizes: compSizes } = getCompanySchemaAndSizes(company.id);
        return company.items.some(item => {
            if (!selectedRows[item.id]) return false;
            return compSizes.some(size => (quantities[`${item.id}-${size}`] || 0) > 0);
        });
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
                    {displayGroups.map((company) => {
                        const isExpanded = expandedCompanies[company.id];
                        const { schema: activeSchema, sizes: compSizes } = getCompanySchemaAndSizes(company.id);
                        
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
                                                    {activeSchema.map(field => {
                                                        if (field.key === 'size') {
                                                            return <th key={field.key} colSpan={compSizes.length || 1} style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{field.label.toUpperCase()}</th>;
                                                        }
                                                        return <th key={field.key} rowSpan={2}>{field.label.toUpperCase()}</th>;
                                                    })}
                                                </tr>
                                                {activeSchema.some(f => f.key === 'size') && compSizes.length > 0 && (
                                                    <tr>
                                                        {compSizes.map(size => (
                                                            <th key={size} style={{ fontSize: '0.85rem', width: '60px' }}>{size}</th>
                                                        ))}
                                                    </tr>
                                                )}
                                            </thead>
                                            <tbody>
                                                {company.items.map(item => {
                                                    const rowQty = getRowTotalQty(item.id, compSizes);
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
                                                            {activeSchema.map(field => {
                                                                if (field.key === 'maco_part_no') {
                                                                    return <td key={field.key} style={{ fontWeight: 'bold', verticalAlign: 'middle' }}>{item.macoNo || item[field.key] || ''}</td>;
                                                                }
                                                                if (field.key === 'item_description') {
                                                                    return <td key={field.key} className="suitable-cell">{item.suitableFor || item[field.key] || ''}</td>;
                                                                }
                                                                if (field.key === 'size') {
                                                                    return compSizes.map(size => (
                                                                        <td key={size} className="qty-cell" style={{ padding: '4px' }}>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                value={quantities[`${item.id}-${size}`] || ''}
                                                                                onChange={(e) => handleQuantityChange(item.id, size, e.target.value)}
                                                                                className="qty-input"
                                                                                placeholder="-"
                                                                                disabled={!selectedRows[item.id]}
                                                                                style={{ 
                                                                                    width: '100%', 
                                                                                    padding: '4px', 
                                                                                    textAlign: 'center', 
                                                                                    margin: 0,
                                                                                    backgroundColor: !selectedRows[item.id] ? '#f8fafc' : '#fff',
                                                                                    cursor: !selectedRows[item.id] ? 'not-allowed' : 'text',
                                                                                    border: '1px solid #e2e8f0'
                                                                                }}
                                                                            />
                                                                        </td>
                                                                    ));
                                                                }
                                                                if (field.key === 'total_qty') {
                                                                    return <td key={field.key} style={{ fontWeight: 'bold', textAlign: 'center' }}>{rowQty > 0 ? rowQty : '-'}</td>;
                                                                }
                                                                if (field.key === 'list_price') {
                                                                    return <td key={field.key} style={{ textAlign: 'right' }}>{(item.listPrice || 0).toFixed(2)}</td>;
                                                                }
                                                                if (field.key === 'total_list_value') {
                                                                    return <td key={field.key} style={{ textAlign: 'right', fontWeight: 'bold' }}>{rowValue > 0 ? rowValue.toFixed(2) : '-'}</td>;
                                                                }
                                                                
                                                                // Fallback for new custom fields
                                                                return <td key={field.key} style={{ verticalAlign: 'middle' }}>{item[field.key] || '-'}</td>;
                                                            })}
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

