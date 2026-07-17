import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProductController } from '../../../controllers/ProductController';
import PageHeader from '../../components/PageHeader';
import { getSavedMarketplaceItems, staticProducts } from '../../../data/marketplaceProducts';
import './product-detail.css';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { products, addToCart, loading } = useProductController();
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [sendingRequest, setSendingRequest] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const marketplaceProducts = [...products, ...getSavedMarketplaceItems(), ...staticProducts];
        const found = marketplaceProducts.find(p => p.id.toString() === id);
        setProduct(found || null);
    }, [products, id]);

    const handleAddToCart = () => {
        if (!product) return;
        addToCart(product, [{
            size: product.size || product.size_code || 'STD',
            size_id: product.item_size_id,
            qty: quantity
        }]);
        setMessage('Product added to cart successfully!');
        setTimeout(() => setMessage(''), 3000);
    };

    const handleSendRequest = async () => {
        setSendingRequest(true);
        // Simulate sending request to supplier/admin
        setTimeout(() => {
            setSendingRequest(false);
            setMessage('Purchase request sent to supplier successfully!');
            setTimeout(() => setMessage(''), 3000);
        }, 1500);
    };

    if (loading && !product) return <div className="text-center mt-20">Loading Product Details...</div>;
    if (!product && !loading) return <div className="text-center mt-20">Product not found.</div>;

    return (
        <div className="product-detail-container">
            <button className="back-btn" onClick={() => navigate(-1)}>
                ← Back to Catalog
            </button>

            <div className="product-detail-layout">
                <div className="product-image-section">
                    <img 
                        src={product.imageUrl || 'https://via.placeholder.com/600x400?text=Product+Image'} 
                        alt={product.name} 
                        className="main-product-image"
                    />
                </div>

                <div className="product-info-section">
                    <span className="product-category-tag">{product.category || product.categoryName || 'Marketplace Item'}</span>
                    <h1 className="product-name-title">{product.name}</h1>
                    
                    <div className="product-price-box">
                        <span className="price-label">Price:</span>
                        <span className="price-value">₹{product.rate}</span>
                        <span className="price-uom"> / {product.uom}</span>
                    </div>

                    <div className="product-description-content">
                        <h3>Product Description</h3>
                        <p>{product.description || product.specifications || 'No detailed description available for this industrial part.'}</p>
                    </div>

                    <div className="supplier-dashboard-card">
                        <h4>Supplier Information</h4>
                        <div className="supplier-grid">
                            <div className="sup-item">
                                <span className="label">Customer:</span>
                                <span className="val">{product.supplierName || 'Maco Automotive'}</span>
                            </div>
                            <div className="sup-item">
                                <span className="label">Location:</span>
                                <span className="val">{product.location || 'New Delhi'}</span>
                            </div>
                            <div className="sup-item">
                                <span className="label">Experience:</span>
                                <span className="val">{product.experienceYears || '15'}+ Years</span>
                            </div>
                        </div>
                    </div>

                    {message && <div className="action-feedback-msg">{message}</div>}

                    <div className="product-action-controls">
                        <div className="qty-selector">
                            <label>Quantity:</label>
                            <div className="qty-input-group">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                                <input 
                                    type="number" 
                                    value={quantity} 
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                />
                                <button onClick={() => setQuantity(quantity + 1)}>+</button>
                            </div>
                        </div>

                        <div className="action-buttons-group">
                            <button className="btn-add-cart" onClick={handleAddToCart}>
                                Add to Cart
                            </button>
                            <button 
                                className="btn-buy-now" 
                                onClick={handleSendRequest}
                                disabled={sendingRequest}
                            >
                                {sendingRequest ? 'Sending Request...' : 'Buy / Request Quote'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
