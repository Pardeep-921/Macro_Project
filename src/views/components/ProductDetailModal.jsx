import React, { useState } from 'react';

const SIZES = ['STD.', '001', '002', '003', '004', '005'];

export default function ProductDetailModal({ product, onClose, onAdd }) {
    const [selections, setSelections] = useState(
        SIZES.map(size => ({ size, qty: 0 }))
    );

    const handleQtyChange = (size, value) => {
        setSelections(prev => prev.map(s => 
            s.size === size ? { ...s, qty: Math.max(0, parseInt(value) || 0) } : s
        ));
    };

    const handleAdd = () => {
        const validSelections = selections.filter(s => s.qty > 0);
        if (validSelections.length === 0) {
            alert('Please select quantity for at least one size.');
            return;
        }
        onAdd(product, validSelections);
        onClose();
    };

    if (!product) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content product-detail-modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>&times;</button>
                
                <div className="product-detail-grid">
                    <div className="product-image-large">
                        <img src={product.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'} alt={product.name} />
                    </div>
                    
                    <div className="product-info-section">
                        <span className="category-tag">{product.category}</span>
                        <h2>{product.name}</h2>
                        <p className="product-rate">Rate: ₹{product.rate} / {product.uom}</p>
                        
                        <div className="size-qty-table-wrapper">
                            <table className="size-qty-table">
                                <thead>
                                    <tr>
                                        <th>Size</th>
                                        <th>Quantity ({product.uom})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selections.map((s) => (
                                        <tr key={s.size}>
                                            <td><strong>{s.size}</strong></td>
                                            <td>
                                                <input 
                                                    type="number" 
                                                    min="0" 
                                                    value={s.qty} 
                                                    onChange={(e) => handleQtyChange(s.size, e.target.value)}
                                                    className="qty-input-small"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="modal-actions">
                            <button className="btn btn-primary btn-full" onClick={handleAdd}>
                                Add to Purchase Order
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
