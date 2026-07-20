import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProductController } from '../../../controllers/ProductController';
import { getSavedMarketplaceItems, staticProducts } from '../../../data/marketplaceProducts';
import './product-detail.css';

const getProductName = (product) => product?.name || product?.item_name || 'Product';

// Using exact items from the provided image as an example payload
const DUMMY_COMPANIES = [
    { 
        id: 'hero', 
        name: 'HERO HONDA',
        items: [
            { id: 1, macoNo: 'BSM051', suitableFor: 'Hero Honda CD-100. / Joy / Dawn / Street \nHero Honda Splendor / Passion \nSplendor plus / Passion Plus ( R )', pcs: 2, listPrice: 56.00, exciseDuty: 10.50, mrp: 120.00 },
            { id: 2, macoNo: 'BSM-052', suitableFor: 'Hero Honda Ambition / CBZ (F & R)', pcs: 2, listPrice: 71.00, exciseDuty: 13.13, mrp: 150.00 },
            { id: 3, macoNo: 'BSM-053', suitableFor: 'Hero Honda Splendor / Passion / Splebdor Plus / Passion Plus ( F ) / Honda Active / Dio / Eterno ( F&R) \nHero Honda Super Splendor / Achiever / Pleasure / Glamour / Glamour F1 ( F & R ) Hero Honda Karizma / CBZ Extreme ( R ) / Shine / Activa New', pcs: 2, listPrice: 71.00, exciseDuty: 13.13, mrp: 150.00 }
        ]
    },
    {
        id: 'bajaj',
        name: 'BAJAJ AUTO',
        items: [
            { id: 4, macoNo: 'BSM-054', suitableFor: 'Bajaj Legend / Discover ( F & R )', pcs: 2, listPrice: 71.00, exciseDuty: 13.13, mrp: 150.00 },
            { id: 5, macoNo: 'BSM-055', suitableFor: 'Bajaj CT-100 ( F ) \nBajaj Caliber 115 / Pulsar / Kawasaki 100 ( R ) \nBajaj Caliber / Platina ( F & R ) \nBajaj KB 4S / Boxer AT / CT-100 ( R )', pcs: 2, listPrice: 60.00, exciseDuty: 11.38, mrp: 130.00 }
        ]
    },
    {
        id: 'tvs',
        name: 'TVS MOTORS',
        items: [
            { id: 6, macoNo: 'BSM-056', suitableFor: 'TVS Suzuki / AX-100 /Star /Star Delux / Star City ( F & R ) \nTVS Suzuki Max / Victor/ Victor GL ( R )', pcs: 2, listPrice: 60.00, exciseDuty: 11.38, mrp: 130.00 },
            { id: 7, macoNo: 'BSM-062', suitableFor: 'TVS Victor', pcs: 2, listPrice: 60.00, exciseDuty: 11.38, mrp: 130.00 },
            { id: 8, macoNo: 'BSM-064', suitableFor: 'TVS Apache Rear', pcs: 2, listPrice: 71.00, exciseDuty: 13.13, mrp: 150.00 },
            { id: 9, macoNo: 'BSM-066', suitableFor: 'TVS Super XL/HD', pcs: 2, listPrice: 40.00, exciseDuty: 7.53, mrp: 85.00 }
        ]
    },
    {
        id: 'yamaha',
        name: 'YAMAHA',
        items: [
            { id: 10, macoNo: 'BSM-057', suitableFor: 'Yamaha RX-100 / RX-135 / YBX / CRUX / \nRXG / Libero G5 / Libero / Crux-R / Crus -S / YD-125 ( F & R ) / Yamaha Enticer ( F )', pcs: 2, listPrice: 71.00, exciseDuty: 13.13, mrp: 150.00 },
            { id: 11, macoNo: 'BSM-065', suitableFor: 'Yamaha FZ', pcs: 2, listPrice: 90.00, exciseDuty: 16.98, mrp: 190.00 }
        ]
    },
    {
        id: 'honda',
        name: 'HONDA SCOOTERS',
        items: [
            { id: 12, macoNo: 'BSM-058', suitableFor: 'Honda Activa / Dio / Eterno ( F & R )', pcs: 2, listPrice: 71.00, exciseDuty: 13.13, mrp: 150.00 },
            { id: 13, macoNo: 'BSM-060', suitableFor: 'Honda Activa New / Shine', pcs: 2, listPrice: 76.00, exciseDuty: 14.00, mrp: 160.00 }
        ]
    },
    {
        id: 'suzuki',
        name: 'SUZUKI',
        items: [
            { id: 14, macoNo: 'BSM-059', suitableFor: 'Suzuki Access', pcs: 2, listPrice: 71.00, exciseDuty: 13.13, mrp: 150.00 },
            { id: 15, macoNo: 'BSM-061', suitableFor: 'Suzuki Samurai', pcs: 2, listPrice: 71.00, exciseDuty: 13.13, mrp: 150.00 }
        ]
    },
    {
        id: 'kinetic',
        name: 'KINETIC HONDA',
        items: [
            { id: 16, macoNo: 'BSM-063', suitableFor: 'Kinetic Honda', pcs: 2, listPrice: 59.00, exciseDuty: 11.03, mrp: 125.00 }
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

    const handleQuantityChange = (itemId, value) => {
        setQuantities(prev => ({
            ...prev,
            [itemId]: Math.max(0, parseInt(value) || 0)
        }));
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
        DUMMY_COMPANIES.forEach(company => {
            company.items.forEach(item => {
                const qty = quantities[item.id] || 0;
                if (qty > 0) {
                    itemsToAdd.push({
                        id: product.id,
                        item_id: item.macoNo,
                        name: item.suitableFor,
                        category: product.category || 'Spare Part',
                        size: item.macoNo,
                        size_id: item.id,
                        qty: qty,
                        price: item.listPrice, // Using list price as price
                        uom: 'PCS',
                        total: qty * item.listPrice,
                        cartId: `${item.id}-${Date.now()}`
                    });
                }
            });
        });

        if (itemsToAdd.length > 0) {
            addMultipleToCart(itemsToAdd);
            window.dispatchEvent(new Event('cartUpdated'));
            alert(`Added ${itemsToAdd.length} items to cart!`);
            // Reset quantities after adding
            setQuantities({});
        } else {
            alert('Please select at least one item quantity to add to cart.');
        }
    };

    if (loading && !product) return <div className="text-center mt-20">Loading Product Details...</div>;
    if (!product && !loading) return <div className="text-center mt-20">Product not found.</div>;

    let globalSerialNo = 1;

    const hasSelectedItems = Object.values(quantities).some(q => q > 0);

    return (
        <div className="product-sheet-page">
            <div className="sheet-actions sticky-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    Back to Catalog
                </button>
                <button 
                    className="add-to-cart-btn" 
                    onClick={handleAddToCart}
                    disabled={!hasSelectedItems}
                    style={{
                        background: hasSelectedItems ? '#3b82f6' : '#cbd5e1',
                        cursor: hasSelectedItems ? 'pointer' : 'not-allowed'
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
                    {DUMMY_COMPANIES.map((company) => {
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
                                    <div className="accordion-content">
                                        <table className="sub-product-table">
                                            <thead>
                                                <tr>
                                                    <th className="col-serial">S. NO.</th>
                                                    <th className="col-code">Maco No.</th>
                                                    <th>Suitable For</th>
                                                    <th className="col-uom">PCS<br />Per<br />Set</th>
                                                    <th className="col-price">List<br />Price</th>
                                                    <th className="col-price">Excise Duty<br />12.50% ON<br />Rs. M.R.P. Less 30%<br />ABATEMENT</th>
                                                    <th className="col-price">M.R.P. Inclusive<br />All Taxes Rs.</th>
                                                    <th className="col-qty">Quantity</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {company.items.map(item => (
                                                    <tr key={item.id}>
                                                        <td>{globalSerialNo++}</td>
                                                        <td>{item.macoNo}</td>
                                                        <td className="suitable-cell" style={{ whiteSpace: 'pre-line' }}>{item.suitableFor}</td>
                                                        <td>{item.pcs}</td>
                                                        <td>{item.listPrice.toFixed(2)}</td>
                                                        <td>{item.exciseDuty.toFixed(2)}</td>
                                                        <td>{item.mrp.toFixed(2)}</td>
                                                        <td className="qty-cell">
                                                            <input 
                                                                type="number" 
                                                                min="0"
                                                                value={quantities[item.id] || ''}
                                                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                                className="qty-input"
                                                                placeholder="0"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
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
