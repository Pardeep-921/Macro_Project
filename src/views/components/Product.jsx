import React from 'react';
import { useAuth } from '../../context/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Product({ product, onViewDetails }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'admin';

    const handleEdit = (e) => {
        e.stopPropagation();
        navigate('/admin/manage-item-master');
    };

    const handleContact = (e) => {
        e.stopPropagation();
        if (!isAdmin) {
            onViewDetails(product);
        }
    };

    return (
        <article className="product-card" onClick={() => onViewDetails(product)}>
            <div className="product-card-image-section">
                <img 
                    src={product.imageUrl || 'https://via.placeholder.com/300x200?text=Industrial+Part'} 
                    alt={product.name} 
                    className="product-card-img"
                />
                <div className="product-card-overlay">
                    <span className="view-details-text">View Full Specifications</span>
                </div>
            </div>
            
            <div className="product-card-content">
                <h3 className="product-title">{product.name}</h3>
                {(product.description || product.specifications || product.desc) && (
                    <p className="product-card-description">
                        {product.description || product.specifications || product.desc}
                    </p>
                )}
                {(product.supplierName || product.supplier_name || product.location) && (
                    <div className="product-supplier-compact">
                        <span className="sup-name">{product.supplierName || product.supplier_name || 'Supplier'}</span>
                        {product.location && <span className="sup-meta">{product.location}</span>}
                    </div>
                )}
                
                <div className={`product-card-footer ${isAdmin ? 'is-admin' : ''}`}>
                    {!isAdmin && (
                        <button className="btn-action-primary" onClick={handleContact}>
                            View Product
                        </button>
                    )}
                    {isAdmin && (
                        <button className="btn-action-secondary" onClick={handleEdit}>
                            Edit Item
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}
