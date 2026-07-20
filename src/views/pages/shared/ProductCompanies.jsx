import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { useProductController } from '../../../controllers/ProductController';
import { getSavedMarketplaceItems, staticProducts } from '../../../data/marketplaceProducts';
import './ProductCompanies.css';

// Placeholder companies
const COMPANIES = [
    { id: 'hero', name: 'Hero MotoCorp', logo: 'https://via.placeholder.com/150x80?text=HERO' },
    { id: 'honda', name: 'Honda', logo: 'https://via.placeholder.com/150x80?text=HONDA' },
    { id: 'bajaj', name: 'Bajaj Auto', logo: 'https://via.placeholder.com/150x80?text=BAJAJ' },
    { id: 'tvs', name: 'TVS Motor', logo: 'https://via.placeholder.com/150x80?text=TVS' },
    { id: 'yamaha', name: 'Yamaha', logo: 'https://via.placeholder.com/150x80?text=YAMAHA' },
    { id: 'suzuki', name: 'Suzuki', logo: 'https://via.placeholder.com/150x80?text=SUZUKI' },
    { id: 'royal-enfield', name: 'Royal Enfield', logo: 'https://via.placeholder.com/150x80?text=ROYAL+ENFIELD' },
    { id: 'other', name: 'Other Manufacturers', logo: 'https://via.placeholder.com/150x80?text=OTHER' },
];

export default function ProductCompanies() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { products, loading } = useProductController();

    const marketplaceProducts = useMemo(() => (
        [...products, ...getSavedMarketplaceItems(), ...staticProducts]
    ), [products]);

    const product = useMemo(() => {
        return marketplaceProducts.find(p => String(p.id) === String(id)) || null;
    }, [marketplaceProducts, id]);

    const handleSelectCompany = (companyId) => {
        const pathPrefix = window.location.pathname.startsWith('/admin') ? '/admin' : '/customer';
        navigate(`${pathPrefix}/product/${id}/company/${companyId}`);
    };

    if (loading && !product) return <div className="text-center mt-20">Loading...</div>;
    if (!product && !loading) return <div className="text-center mt-20">Product not found.</div>;

    const productName = product?.name || product?.item_name || 'Product';

    return (
        <div className="product-companies-container">
            <PageHeader title={`${productName.toUpperCase()} - Select Manufacturer`} />
            
            <div className="sheet-actions" style={{ marginBottom: '20px' }}>
                <button className="back-btn" onClick={() => navigate(-1)}>
                    Back to Catalog
                </button>
            </div>

            <div className="companies-grid">
                {COMPANIES.map(company => (
                    <div 
                        key={company.id} 
                        className="company-card"
                        onClick={() => handleSelectCompany(company.id)}
                        role="button"
                        tabIndex={0}
                    >
                        <div className="company-logo-wrapper">
                            <img src={company.logo} alt={company.name} className="company-logo" />
                        </div>
                        <h3 className="company-name">{company.name}</h3>
                    </div>
                ))}
            </div>
        </div>
    );
}
