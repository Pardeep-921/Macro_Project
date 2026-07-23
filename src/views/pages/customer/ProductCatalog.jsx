import React from 'react';
import PageHeader from '../../components/PageHeader';
import Product from '../../components/Product';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';

import { useMasterDataController } from '../../../controllers/MasterDataController';
import { staticProducts } from '../../../data/marketplaceProducts';
import './product-catalog.css';

const hiddenLegacyMarketplaceItems = new Set([
    '101',
    '102',
    '103',
    'Cotton Drill Fabric',
    'Corrugated Packing Sheet',
    'Nitrile Safety Gloves'
]);

const isHiddenLegacyMarketplaceItem = (product) => (
    hiddenLegacyMarketplaceItems.has(String(product.id)) ||
    hiddenLegacyMarketplaceItems.has(product.name) ||
    hiddenLegacyMarketplaceItems.has(product.item_name)
);

export default function ProductCatalog() {
    const { data: primaryGroups, loading: loadingGroups } = useMasterDataController('PrimaryGroups');
    const { user } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'admin';

    const loading = loadingGroups;

    // Deduplicate static products against edited primary groups
    const groupIds = new Set(primaryGroups.map(p => String(p.id)));
    const mergedStatic = staticProducts.filter(p => !groupIds.has(String(p.id)));

    const products = [...primaryGroups, ...mergedStatic].filter(product => !isHiddenLegacyMarketplaceItem(product) && product.name && product.name.trim() !== '');

    const handleViewDetails = (product) => {
        const pathPrefix = window.location.pathname.startsWith('/admin') ? '/admin' : '/customer';
        navigate(`${pathPrefix}/product/${product.id}`);
    };

    return (
        <div className="product-catalog-container">
            <PageHeader title="Industrial Spare Parts Marketplace" />

            {isAdmin && (
                <div className="catalog-admin-actions" aria-label="Admin catalog actions">
                    <button type="button" className="catalog-add-btn" onClick={() => navigate('/admin/manage-primary-item', { state: { openAddModal: true } })}>
                        Add Item
                    </button>
                    <button type="button" className="catalog-add-btn catalog-add-sub-btn" onClick={() => navigate('/admin/manage-primary-item')}>
                        Edit Item
                    </button>
                </div>
            )}

            <div className="product-grid">
                {loading && (
                    <div className="no-products-msg">Loading catalog...</div>
                )}
                {products.map((product, index) => (
                    <Product
                        key={`${product.item_code || product.id}-${index}`}
                        product={product}
                        onViewDetails={handleViewDetails}
                    />
                ))}
                {products.length === 0 && (
                    <div className="no-products-msg">No products found in the marketplace.</div>
                )}
            </div>

        </div>
    );
}
