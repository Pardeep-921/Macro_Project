import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProductController } from '../../../controllers/ProductController';
import { getSavedMarketplaceItems, staticProducts } from '../../../data/marketplaceProducts';
import './product-detail.css';

const productFamilyWords = [
    'clutch',
    'brake',
    'piston',
    'engine',
    'motorcycle',
    'transmission',
    'connecting',
    'valve',
    'shoe',
    'plate'
];

const asText = (value) => String(value || '').trim().toLowerCase();
const getProductName = (product) => product?.name || product?.item_name || 'Product';
const getProductCode = (product) => product?.itemCode || product?.item_code || product?.id || '-';
const getProductUom = (product) => product?.uom || product?.unit || 'Each';
const getProductRate = (product) => Number(product?.rate || product?.list_price || 0);
const getProductMrp = (product) => Number(product?.mrp || getProductRate(product) * 1.8 || 0);
const getProductGroup = (product) => (
    product?.primaryGroupName ||
    product?.primary_group_name ||
    product?.subGroupName ||
    product?.sub_group_name ||
    product?.category ||
    product?.categoryName ||
    'RELATED ITEMS'
);

const getProductDescription = (product) => (
    product?.description ||
    product?.specifications ||
    product?.subGroupName ||
    product?.sub_group_name ||
    getProductName(product)
);

const getProductFamily = (product) => {
    const haystack = `${getProductName(product)} ${product?.category || ''} ${getProductDescription(product)}`.toLowerCase();
    return productFamilyWords.find(word => haystack.includes(word)) || '';
};

const isSameProduct = (left, right) => String(left?.id) === String(right?.id);

const isRelatedProduct = (selected, candidate) => {
    if (!selected || !candidate || isSameProduct(selected, candidate)) return false;

    const selectedSubGroupId = selected.sub_group_id || selected.subGroupId || selected.categoryId;
    const candidateSubGroupId = candidate.sub_group_id || candidate.subGroupId || candidate.categoryId;
    if (selectedSubGroupId && candidateSubGroupId && String(selectedSubGroupId) === String(candidateSubGroupId)) {
        return true;
    }

    const selectedCategory = asText(selected.category || selected.categoryName || selected.subGroupName || selected.sub_group_name);
    const candidateCategory = asText(candidate.category || candidate.categoryName || candidate.subGroupName || candidate.sub_group_name);
    if (selectedCategory && candidateCategory && selectedCategory === candidateCategory) {
        return true;
    }

    const selectedPrimaryGroupId = selected.primary_group_id || selected.primaryGroupId;
    const candidatePrimaryGroupId = candidate.primary_group_id || candidate.primaryGroupId;
    if (selectedPrimaryGroupId && candidatePrimaryGroupId && String(selectedPrimaryGroupId) === String(candidatePrimaryGroupId)) {
        return true;
    }

    const selectedFamily = getProductFamily(selected);
    return selectedFamily && selectedFamily === getProductFamily(candidate);
};

const groupProducts = (items) => items.reduce((groups, item) => {
    const groupName = getProductGroup(item).toUpperCase();
    return {
        ...groups,
        [groupName]: [...(groups[groupName] || []), item]
    };
}, {});

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { products, loading } = useProductController();
    const [product, setProduct] = useState(null);

    const marketplaceProducts = useMemo(() => (
        [...products, ...getSavedMarketplaceItems(), ...staticProducts]
    ), [products]);

    const sheetProducts = useMemo(() => {
        if (!product) return [];

        const related = marketplaceProducts.filter(candidate => isRelatedProduct(product, candidate));
        const fallback = marketplaceProducts.filter(candidate => !isSameProduct(product, candidate));
        return [product, ...(related.length ? related : fallback)].slice(0, 30);
    }, [marketplaceProducts, product]);

    const groupedProducts = useMemo(() => groupProducts(sheetProducts), [sheetProducts]);

    useEffect(() => {
        const found = marketplaceProducts.find(p => String(p.id) === String(id));
        setProduct(found || null);
    }, [marketplaceProducts, id]);

    if (loading && !product) return <div className="text-center mt-20">Loading Product Details...</div>;
    if (!product && !loading) return <div className="text-center mt-20">Product not found.</div>;

    let serialNo = 1;

    return (
        <div className="product-sheet-page">
            <div className="sheet-actions">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    Back to Catalog
                </button>
            </div>

            <section className="excel-sheet" aria-label="Related sub products">
                <div className="sheet-title">
                    <h1>{getProductName(product).toUpperCase()}</h1>
                    <p>{product.hsnCode || product.hsn_code || '(HSN CODE 84099114 - GST RATE @ 28%)'}</p>
                </div>

                <table className="sub-product-table">
                    <thead>
                        <tr>
                            <th className="col-serial">S. No.</th>
                            <th className="col-code">Maco No.</th>
                            <th>Suitable for</th>
                            <th className="col-uom">PCS<br />Per<br />Set</th>
                            <th className="col-price">List<br />Price<br />(Rs.)</th>
                            <th className="col-price">M.R.P.<br />Inclusive<br />All Taxes<br />(Rs.)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(groupedProducts).map(([groupName, groupItems]) => (
                            <React.Fragment key={groupName}>
                                <tr className="group-heading-row">
                                    <td colSpan="6">{groupName}</td>
                                </tr>
                                <tr className="group-subheading-row">
                                    <td colSpan="6">{product.vehicleType || product.vehicle_type || 'MOTOR CYCLES (4 Stroke)'}</td>
                                </tr>
                                {groupItems.map(item => {
                                    const rate = getProductRate(item);
                                    const mrp = getProductMrp(item);

                                    return (
                                        <tr key={item.id} className={isSameProduct(product, item) ? 'selected-sheet-row' : ''}>
                                            <td>{serialNo++}</td>
                                            <td>{getProductCode(item)}</td>
                                            <td className="suitable-cell">{getProductName(item)}</td>
                                            <td>{getProductUom(item)}</td>
                                            <td>{rate ? rate.toFixed(2) : '-'}</td>
                                            <td>{mrp ? mrp.toFixed(2) : '-'}</td>
                                        </tr>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
}
