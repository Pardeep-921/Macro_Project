import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import Product from '../../components/Product';
import { useNavigate } from 'react-router-dom';
import { useProductController } from '../../../controllers/ProductController';
import { SAVED_MARKETPLACE_ITEMS_KEY, getSavedMarketplaceItems, staticProducts } from '../../../data/marketplaceProducts';
import './product-catalog.css';

const blankItemForm = {
    name: '',
    description: '',
    category: '',
    rate: '',
    uom: 'Piece',
    supplierName: '',
    location: '',
    phone: '',
    imageUrl: ''
};

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
    const [savedItems, setSavedItems] = useState(getSavedMarketplaceItems);
    const [isAddItemOpen, setIsAddItemOpen] = useState(false);
    const [formData, setFormData] = useState(blankItemForm);
    const [imageFileName, setImageFileName] = useState('');
    const { products: apiProducts, loading } = useProductController();
    const navigate = useNavigate();
    const products = [...apiProducts, ...savedItems, ...staticProducts].filter(product => !isHiddenLegacyMarketplaceItem(product));

    const handleViewDetails = (product) => {
        const pathPrefix = window.location.pathname.startsWith('/admin') ? '/admin' : '/customer';
        navigate(`${pathPrefix}/product/${product.id}`);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setFormData(prev => ({ ...prev, imageUrl: reader.result }));
            setImageFileName(file.name);
        };
        reader.readAsDataURL(file);
    };

    const closeAddItemModal = () => {
        setIsAddItemOpen(false);
        setFormData(blankItemForm);
        setImageFileName('');
    };

    const handleSaveItem = (event) => {
        event.preventDefault();

        const newItem = {
            id: `local-${Date.now()}`,
            name: formData.name.trim(),
            description: formData.description.trim(),
            specifications: formData.description.trim(),
            category: formData.category.trim() || 'Marketplace Item',
            rate: Number(formData.rate) || 0,
            uom: formData.uom.trim() || 'Piece',
            supplierName: formData.supplierName.trim() || 'Maco Automotive',
            location: formData.location.trim(),
            phone: formData.phone.trim(),
            imageUrl: formData.imageUrl || 'https://via.placeholder.com/300x200?text=Industrial+Part'
        };

        const nextItems = [newItem, ...savedItems];
        setSavedItems(nextItems);
        localStorage.setItem(SAVED_MARKETPLACE_ITEMS_KEY, JSON.stringify(nextItems));
        closeAddItemModal();
    };

    return (
        <div className="product-catalog-container">
            <PageHeader title="Industrial Spare Parts Marketplace" />

            <div className="catalog-toolbar">
                <div>
                    <p className="catalog-kicker">Product Marketplace</p>
                    <h2>Add and manage spare parts directly from this screen</h2>
                </div>
                <button className="catalog-add-btn" onClick={() => setIsAddItemOpen(true)}>
                    + Add Item
                </button>
            </div>
            
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

            {isAddItemOpen && (
                <div className="catalog-modal-overlay" onClick={closeAddItemModal}>
                    <form className="catalog-add-modal" onSubmit={handleSaveItem} onClick={event => event.stopPropagation()}>
                        <div className="catalog-modal-header">
                            <div>
                                <p className="catalog-kicker">New Marketplace Item</p>
                                <h3>Add Item</h3>
                            </div>
                            <button type="button" className="catalog-modal-close" onClick={closeAddItemModal} aria-label="Close add item form">
                                &times;
                            </button>
                        </div>

                        <div className="catalog-form-grid">
                            <label className="catalog-field">
                                <span>Item Name</span>
                                <input name="name" type="text" value={formData.name} onChange={handleChange} required />
                            </label>

                            <label className="catalog-field">
                                <span>Category</span>
                                <input name="category" type="text" value={formData.category} onChange={handleChange} placeholder="Industrial spare part" />
                            </label>

                            <label className="catalog-field">
                                <span>Rate</span>
                                <input name="rate" type="number" min="0" step="0.01" value={formData.rate} onChange={handleChange} />
                            </label>

                            <label className="catalog-field">
                                <span>Unit</span>
                                <select name="uom" value={formData.uom} onChange={handleChange}>
                                    <option value="Piece">Piece</option>
                                    <option value="Set">Set</option>
                                    <option value="Kg">Kg</option>
                                    <option value="Meter">Meter</option>
                                    <option value="Box">Box</option>
                                </select>
                            </label>

                            <label className="catalog-field catalog-field-wide">
                                <span>Description of Item</span>
                                <textarea name="description" value={formData.description} onChange={handleChange} rows="4" required />
                            </label>

                            <label className="catalog-field">
                                <span>Supplier Name</span>
                                <input name="supplierName" type="text" value={formData.supplierName} onChange={handleChange} />
                            </label>

                            <label className="catalog-field">
                                <span>Location</span>
                                <input name="location" type="text" value={formData.location} onChange={handleChange} />
                            </label>

                            <label className="catalog-field">
                                <span>Phone</span>
                                <input name="phone" type="tel" value={formData.phone} onChange={handleChange} />
                            </label>

                            <label className="catalog-field catalog-upload-field">
                                <span>Item Image</span>
                                <input type="file" accept="image/*" onChange={handleImageUpload} />
                                <small>{imageFileName || 'Upload JPG, PNG, or WebP image'}</small>
                            </label>
                        </div>

                        {formData.imageUrl && (
                            <div className="catalog-image-preview">
                                <img src={formData.imageUrl} alt="Selected item preview" />
                            </div>
                        )}

                        <div className="catalog-modal-actions">
                            <button type="button" className="catalog-cancel-btn" onClick={closeAddItemModal}>
                                Cancel
                            </button>
                            <button type="submit" className="catalog-save-btn">
                                Save Item
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
