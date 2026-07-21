import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { useMasterDataController } from '../../../controllers/MasterDataController';
import { staticProducts } from '../../../data/marketplaceProducts';
import '../customer/product-catalog.css';
import './ManagePrimaryItem.css';

const initialFormData = { id: '', name: '', desc: '', imageUrl: '' };

export default function ManagePrimaryItem() {
    const { data: dynamicItems, loading, handleSave, handleDelete } = useMasterDataController('PrimaryGroups');
    const [formData, setFormData] = useState(initialFormData);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const location = useLocation();

    // Combine static products with dynamic primary groups, giving priority to dynamic edits
    const dynamicIds = new Set(dynamicItems.map(item => String(item.id)));
    const items = [...dynamicItems, ...staticProducts.filter(item => !dynamicIds.has(String(item.id)))];

    useEffect(() => {
        if (location.state?.openAddModal) {
            openModal();
            // Clear the state so it doesn't reopen if the user refreshes
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, imageUrl: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const openModal = (item = null) => {
        if (item) {
            setFormData({ 
                id: item.id, 
                name: item.name, 
                desc: item.desc || item.specifications || '', 
                imageUrl: item.imageUrl || '' 
            });
        } else {
            setFormData(initialFormData);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData(initialFormData);
    };

    const onSave = async (e) => {
        e.preventDefault();
        const res = await handleSave(formData);
        if (res.success) {
            closeModal();
        } else {
            alert(res.message);
        }
    };

    return (
        <div className="product-catalog-container">
            <PageHeader title="Manage Primary Group Master" />

            <div className="catalog-admin-actions" aria-label="Admin catalog actions" style={{ marginBottom: '20px' }}>
                <button type="button" className="catalog-add-btn" onClick={() => openModal()}>
                    Add Primary Group
                </button>
            </div>
            
            <div className="product-grid">
                {loading && (
                    <div className="no-products-msg" style={{ gridColumn: '1 / -1' }}>Loading primary groups...</div>
                )}
                
                {items.map((item, index) => (
                    <article key={item.id || index} className="product-card">
                        <div className="product-card-image-section">
                            <img 
                                src={item.imageUrl || 'https://via.placeholder.com/300x200?text=Primary+Group'} 
                                alt={item.name} 
                                className="product-card-img"
                            />
                        </div>
                        
                        <div className="product-card-content" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                            <h3 className="product-title" style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{item.name}</h3>
                            {(item.desc || item.specifications) && (
                                <p className="product-card-description" style={{ flexGrow: 1, color: '#475569', fontSize: '0.9rem' }}>
                                    {item.desc || item.specifications}
                                </p>
                            )}
                            
                            <div className="product-card-footer" style={{ marginTop: 'auto', display: 'flex', gap: '8px', paddingTop: '16px' }}>
                                <button 
                                    className="btn-action-secondary" 
                                    onClick={() => openModal(item)}
                                    style={{ flex: 1, padding: '8px', cursor: 'pointer', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: 500 }}
                                >
                                    Edit
                                </button>
                                <button 
                                    className="btn-action-secondary" 
                                    onClick={() => handleDelete(item.id)} 
                                    style={{ flex: 1, padding: '8px', cursor: 'pointer', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '4px', fontWeight: 500 }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
                
                {!loading && items.length === 0 && (
                    <div className="no-products-msg" style={{ gridColumn: '1 / -1' }}>No primary groups found. Click "Add Primary Group" to create one.</div>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{formData.id ? 'Edit Primary Group' : 'Add Primary Group'}</h2>
                        <form onSubmit={onSave}>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label className="required-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                                    Primary Group Name <span className="required" style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className="login-input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Engine Components"
                                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                    required
                                />
                            </div>
                            <div className="form-group full-width" style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Description</label>
                                <textarea
                                    className="login-input"
                                    value={formData.desc}
                                    onChange={e => setFormData({ ...formData, desc: e.target.value })}
                                    placeholder="Description of the group..."
                                    rows="3"
                                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontFamily: 'inherit' }}
                                />
                            </div>
                            <div className="form-group full-width" style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Upload Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="login-input"
                                    onChange={handleImageChange}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff' }}
                                />
                                {formData.imageUrl && (
                                    <div style={{ marginTop: '10px', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px', width: 'fit-content', background: '#f8fafc' }}>
                                        <img src={formData.imageUrl} alt="Preview" style={{ height: '80px', objectFit: 'contain' }} />
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn-save">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
