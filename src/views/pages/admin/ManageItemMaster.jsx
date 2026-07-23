import React, { useMemo, useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { useMasterDataController } from '../../../controllers/MasterDataController';
import { staticProducts } from '../../../data/marketplaceProducts';

const DEFAULT_SIZE_OPTIONS = 'STD., 001, 002, 003, 004, 005';

const normalizeSizeOptions = (options) => String(options || DEFAULT_SIZE_OPTIONS)
    .split(',')
    .map(option => option.trim().replace(/^0\.(\d{3})$/, '$1'))
    .filter(Boolean)
    .join(', ');

export default function ManageItemMaster() {
    const { data: schema, handleSave: saveSchemaItem, handleDelete: deleteSchemaItem, refresh: refreshSchema } = useMasterDataController('ItemMasterSchema');
    const { data: masterItems, handleSave: saveProduct, handleDelete: deleteProduct, refresh: refreshProducts } = useMasterDataController('Products');
    
    const [formData, setFormData] = useState({ primary_group_id: '', sub_group_id: '' });
    const [newItemData, setNewItemData] = useState({});
    const [schemaModalOpen, setSchemaModalOpen] = useState(false);
    
    // Schema Editor State
    const [editingSchema, setEditingSchema] = useState([]);
    const [schemaPrimaryGroupId, setSchemaPrimaryGroupId] = useState('');
    const [schemaSubGroupId, setSchemaSubGroupId] = useState('');
    
    const { data: primaryGroups } = useMasterDataController('PrimaryGroups');
    
    // Combine static products with dynamic primary groups just like ManagePrimaryItem does
    const mergedPrimaryGroups = useMemo(() => {
        const dynamicIds = new Set(primaryGroups.map(item => String(item.id)));
        return [...primaryGroups, ...staticProducts.filter(item => !dynamicIds.has(String(item.id)))];
    }, [primaryGroups]);

    const { data: subGroups } = useMasterDataController('SubGroups');

    const filteredSubGroups = useMemo(() => {
        if (!formData.primary_group_id) return [];
        
        const filtered = subGroups.filter(group => String(group.primary_group_id) === String(formData.primary_group_id));
        
        // Deduplicate companies by name to prevent multiple same entries
        const uniqueMap = new Map();
        filtered.forEach(sg => {
            if (sg.name && !uniqueMap.has(sg.name.trim().toLowerCase())) {
                uniqueMap.set(sg.name.trim().toLowerCase(), sg);
            }
        });
        
        return Array.from(uniqueMap.values());
    }, [formData.primary_group_id, subGroups]);
    
    const filteredSchemaSubGroups = useMemo(() => {
        if (!schemaPrimaryGroupId) return [];
        const filtered = subGroups.filter(group => String(group.primary_group_id) === String(schemaPrimaryGroupId));
        const uniqueMap = new Map();
        filtered.forEach(sg => {
            if (sg.name && !uniqueMap.has(sg.name.trim().toLowerCase())) {
                uniqueMap.set(sg.name.trim().toLowerCase(), sg);
            }
        });
        return Array.from(uniqueMap.values());
    }, [schemaPrimaryGroupId, subGroups]);

    const loadSchemaForGroup = (primaryId, subId) => {
        let targetSchema = [...schema];
        if (subId) {
            targetSchema = targetSchema.filter(s => String(s.sub_group_id) === String(subId));
            if (targetSchema.length === 0) {
                // clone global schema
                targetSchema = [...schema].filter(s => !s.sub_group_id).map(s => ({
                    ...s,
                    id: '', // force new ID
                    sub_group_id: subId,
                    primary_group_id: primaryId,
                    options: s.key === 'size' ? normalizeSizeOptions(s.options) : s.options
                }));
            }
        } else {
            // global schema
            targetSchema = targetSchema.filter(s => !s.sub_group_id).map(s => ({
                ...s,
                options: s.key === 'size' ? normalizeSizeOptions(s.options) : s.options
            }));
        }
        setEditingSchema(targetSchema.sort((a, b) => a.order - b.order));
    };

    useEffect(() => {
        if (schemaModalOpen) {
            setSchemaPrimaryGroupId(formData.primary_group_id || '');
            setSchemaSubGroupId(formData.sub_group_id || '');
            loadSchemaForGroup(formData.primary_group_id, formData.sub_group_id);
        } else {
            setEditingSchema([]);
        }
    }, [schemaModalOpen]); // Intentionally omitting schema to prevent jumping on edit
    const setField = (key, value) => {
        setFormData(prev => ({
            ...prev,
            [key]: value
        }));
    };
    
    const setNewItemField = (key, value) => {
        setNewItemData(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const resetForm = () => setFormData({ primary_group_id: '', sub_group_id: '' });

    const onSaveNewItem = async (e) => {
        e.preventDefault();
        
        if (!formData.sub_group_id) {
            alert('Please select a Company / Brand first.');
            return;
        }

        const dynamicNameKey = schema.find(s => s.label.toLowerCase().includes('part no') || s.label.toLowerCase().includes('item no'))?.key || 'maco_part_no';
        const dynamicName = newItemData[dynamicNameKey] || '';
        
        const res = await saveProduct({ 
            ...newItemData,
            name: dynamicName || 'Dynamic Item',
            sub_group_id: formData.sub_group_id,
            primary_group_id: formData.primary_group_id
        });
        
        if (res.success) {
            setNewItemData({});
            refreshProducts();
        } else {
            alert(res.message);
        }
    };
    
    const handleEditItem = (item) => {
        setNewItemData({ ...item });
    };

    const handleDeleteItem = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        const res = await deleteProduct(id);
        if (res.success) {
            if (newItemData.id === id) setNewItemData({});
            refreshProducts();
        } else {
            alert(res.message);
        }
    };
    
    const displayItems = useMemo(() => {
        if (!formData.sub_group_id || !formData.primary_group_id) return [];
        
        const selectedSubGroup = subGroups.find(g => String(g.id) === String(formData.sub_group_id));
        if (!selectedSubGroup) return [];
        const selectedName = (selectedSubGroup.name || selectedSubGroup.sub_group_name || '').trim().toLowerCase();

        return masterItems.filter(item => {
            // Check primary group first
            const itemSubGroupForPrimary = subGroups.find(g => String(g.id) === String(item.sub_group_id));
            const itemPrimaryGroupId = String(item.primary_group_id || (itemSubGroupForPrimary ? itemSubGroupForPrimary.primary_group_id : ''));
            if (itemPrimaryGroupId !== String(formData.primary_group_id)) return false;

            const itemCompanyId = String(item.sub_group_id);
            if (itemCompanyId === String(formData.sub_group_id)) return true;
            
            if (itemSubGroupForPrimary) {
                const itemName = (itemSubGroupForPrimary.name || itemSubGroupForPrimary.sub_group_name || '').trim().toLowerCase();
                if (itemName === selectedName) return true;
            }
            
            if (item.subGroupName && item.subGroupName.trim().toLowerCase() === selectedName) return true;
            
            return false;
        });
    }, [masterItems, formData.sub_group_id, formData.primary_group_id, subGroups]);

    // Schema Management Actions
    const handleAddSchemaField = () => {
        const newOrder = editingSchema.length > 0 ? Math.max(...editingSchema.map(s => s.order)) + 1 : 1;
        setEditingSchema([...editingSchema, { 
            id: '', 
            key: `field_${Date.now()}`, 
            label: 'NEW FIELD', 
            type: 'text', 
            required: false, 
            order: newOrder 
        }]);
    };

    const handleSchemaChange = (index, field, value) => {
        const newSchema = [...editingSchema];
        newSchema[index] = { ...newSchema[index], [field]: value };
        setEditingSchema(newSchema);
    };

    const handleRemoveSchemaField = (index) => {
        const newSchema = [...editingSchema];
        newSchema.splice(index, 1);
        setEditingSchema(newSchema);
    };

    const moveSchemaField = (index, direction) => {
        const newSchema = [...editingSchema];
        if (direction === 'up' && index > 0) {
            const temp = newSchema[index].order;
            newSchema[index].order = newSchema[index - 1].order;
            newSchema[index - 1].order = temp;
        } else if (direction === 'down' && index < newSchema.length - 1) {
            const temp = newSchema[index].order;
            newSchema[index].order = newSchema[index + 1].order;
            newSchema[index + 1].order = temp;
        }
        newSchema.sort((a, b) => a.order - b.order);
        setEditingSchema(newSchema);
    };

    const saveSchema = async () => {
        try {
            for (let i = 0; i < editingSchema.length; i++) {
                const item = editingSchema[i];
                item.order = i + 1; // force sequential order
                item.sub_group_id = schemaSubGroupId || '';
                item.primary_group_id = schemaPrimaryGroupId || '';
                await saveSchemaItem(item);
            }
            
            const editingIds = new Set(editingSchema.map(s => String(s.id)).filter(id => id));
            for (const s of schema) {
                // Only delete fields that belonged to this specific company schema (or global if none selected)
                if (String(s.sub_group_id || '') === String(schemaSubGroupId || '') && s.id && !editingIds.has(String(s.id))) {
                    await deleteSchemaItem(s.id);
                }
            }
            
            setSchemaModalOpen(false);
            refreshSchema();
        } catch (err) {
            alert('Failed to save schema: ' + err.message);
        }
    };

    const activeSchema = useMemo(() => {
        let targetSchema = [...schema];
        if (formData.sub_group_id) {
            targetSchema = targetSchema.filter(s => String(s.sub_group_id) === String(formData.sub_group_id));
            if (targetSchema.length === 0) {
                targetSchema = [...schema].filter(s => !s.sub_group_id);
            }
        } else {
            targetSchema = targetSchema.filter(s => !s.sub_group_id);
        }
        // Remove total_qty and total_list_value from this page's table view
        return targetSchema
            .filter(s => s.key !== 'total_qty' && s.key !== 'total_list_value')
            .sort((a, b) => a.order - b.order);
    }, [schema, formData.sub_group_id]);

    return (
        <div className="master-page item-master-page">
            <PageHeader title="Manage Item Master" />
            <div className="master-shell">
                <section className="master-workspace">
                    <div className="item-master-main">
                        <section className="master-form-panel item-master-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2>Item Master Entry</h2>
                                <button type="button" className="btn btn-secondary" onClick={() => setSchemaModalOpen(true)}>
                                    Manage Form Schema
                                </button>
                            </div>
                            
                            <div className="master-form item-master-form">
                                <div className="form-grid master-form-grid" style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                                    <div className="form-group">
                                        <label>Primary Group <span style={{color: 'red'}}>*</span></label>
                                        <select 
                                            className="login-input" 
                                            required 
                                            value={formData.primary_group_id || ''} 
                                            onChange={(e) => {
                                                setField('primary_group_id', e.target.value);
                                                setField('sub_group_id', '');
                                            }}
                                        >
                                            <option value="">-- Select Primary Group --</option>
                                            {mergedPrimaryGroups.map(pg => (
                                                <option key={pg.id} value={pg.id}>{pg.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Company / Brand <span style={{color: 'red'}}>*</span></label>
                                        <select 
                                            className="login-input" 
                                            required 
                                            value={formData.sub_group_id || ''} 
                                            onChange={(e) => setField('sub_group_id', e.target.value)}
                                            disabled={!formData.primary_group_id}
                                        >
                                            <option value="">-- Select Company / Brand --</option>
                                            {filteredSubGroups.map(sg => (
                                                <option key={sg.id} value={sg.id}>{sg.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                {formData.sub_group_id && (
                                    <div className="table-responsive">
                                        <table className="master-table">
                                            <thead>
                                                <tr>
                                                    {activeSchema.map(field => (
                                                        <th key={field.id} style={{ textAlign: 'center' }}>{field.label}</th>
                                                    ))}
                                                    <th style={{ width: '80px', textAlign: 'center' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {displayItems.map(item => (
                                                    <tr key={item.id}>
                                                        {activeSchema.map(field => (
                                                            <td key={field.id} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                                {item.itemCode && field.key === 'maco_part_no' ? item.itemCode : ''}
                                                                {item.name && field.key === 'item_description' ? item.name : ''}
                                                                {item.listPrice && field.key === 'list_price' ? item.listPrice : ''}
                                                                {field.key === 'size' ? normalizeSizeOptions(field.options) : (item[field.key] || '')}
                                                            </td>
                                                        ))}
                                                        <td style={{ textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                                <button 
                                                                    type="button" 
                                                                    className="btn btn-secondary" 
                                                                    onClick={() => handleEditItem(item)}
                                                                    style={{ padding: '4px 8px', fontSize: '12px' }}
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    className="btn btn-danger" 
                                                                    onClick={() => handleDeleteItem(item.id)}
                                                                    style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                
                                                {/* Inline Entry Row */}
                                                <tr style={{ backgroundColor: '#f0f9ff' }}>
                                                    {activeSchema.map(field => (
                                                        <td key={field.id} style={{ padding: '4px' }}>
                                                            {field.key === 'size' ? (
                                                                <span style={{ fontSize: '12px', color: '#666', padding: '6px', display: 'block', textAlign: 'center' }}>
                                                                    {normalizeSizeOptions(field.options)}
                                                                </span>
                                                            ) : (
                                                                <input 
                                                                    type={field.type === 'number' ? 'number' : 'text'}
                                                                    className="login-input"
                                                                    required={field.required}
                                                                    value={newItemData[field.key] || ''}
                                                                    onChange={(e) => setNewItemField(field.key, e.target.value)}
                                                                    placeholder={field.label}
                                                                    style={{ padding: '6px', fontSize: '13px', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
                                                                />
                                                            )}
                                                        </td>
                                                    ))}
                                                    <td style={{ textAlign: 'center', padding: '4px' }}>
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-primary" 
                                                            onClick={onSaveNewItem}
                                                            style={{ padding: '6px 12px', fontSize: '13px' }}
                                                        >
                                                            {newItemData.id ? 'Update' : 'Add'}
                                                        </button>
                                                        {newItemData.id && (
                                                            <button 
                                                                type="button" 
                                                                className="btn btn-secondary" 
                                                                onClick={() => setNewItemData({})}
                                                                style={{ padding: '6px 12px', fontSize: '13px', marginLeft: '5px' }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </section>
            </div>

            {/* Schema Management Modal */}
            {schemaModalOpen && (
                <div className="modal-overlay" style={modalStyles.overlay}>
                    <div className="modal-content" style={modalStyles.content}>
                        <h3>Manage Form Fields (Schema)</h3>
                        <p style={{marginBottom: '10px', color: '#666'}}>
                            Select a company to customize its specific fields, or leave blank to edit the global default schema.
                        </p>
                        
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '6px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Primary Group</label>
                                <select 
                                    style={modalStyles.input}
                                    value={schemaPrimaryGroupId}
                                    onChange={(e) => {
                                        setSchemaPrimaryGroupId(e.target.value);
                                        setSchemaSubGroupId('');
                                        loadSchemaForGroup(e.target.value, '');
                                    }}
                                >
                                    <option value="">-- Global / All --</option>
                                    {mergedPrimaryGroups.map(pg => (
                                        <option key={pg.id} value={pg.id}>{pg.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Company / Brand</label>
                                <select 
                                    style={modalStyles.input}
                                    value={schemaSubGroupId}
                                    onChange={(e) => {
                                        setSchemaSubGroupId(e.target.value);
                                        loadSchemaForGroup(schemaPrimaryGroupId, e.target.value);
                                    }}
                                    disabled={!schemaPrimaryGroupId}
                                >
                                    <option value="">-- Global / All --</option>
                                    {filteredSchemaSubGroups.map(sg => (
                                        <option key={sg.id} value={sg.id}>{sg.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        <div style={modalStyles.fieldList}>
                            {editingSchema.map((field, index) => (
                                <div key={index} style={modalStyles.fieldRow}>
                                    <div style={modalStyles.controls}>
                                        <button type="button" onClick={() => moveSchemaField(index, 'up')} disabled={index === 0}>↑</button>
                                        <button type="button" onClick={() => moveSchemaField(index, 'down')} disabled={index === editingSchema.length - 1}>↓</button>
                                    </div>
                                    <div style={{ display: 'flex', flex: 1, gap: '10px' }}>
                                        <input 
                                            type="text" 
                                            value={field.label} 
                                            onChange={(e) => handleSchemaChange(index, 'label', e.target.value)}
                                            placeholder="Field Label (e.g. SIZE)"
                                            style={{ ...modalStyles.input, flex: '1' }}
                                        />
                                        {field.key === 'size' && (
                                            <input 
                                                type="text" 
                                                value={field.options || ''} 
                                                onChange={(e) => handleSchemaChange(index, 'options', normalizeSizeOptions(e.target.value))}
                                                placeholder="Options (e.g. STD., 001, 002)"
                                                style={{ ...modalStyles.input, flex: '2' }}
                                                title="Comma separated list of options (used for generating sizes)"
                                            />
                                        )}
                                    </div>
                                    <button type="button" onClick={() => handleRemoveSchemaField(index)} style={modalStyles.removeBtn}>✕</button>
                                </div>
                            ))}
                        </div>

                        <div style={modalStyles.modalActions}>
                            <button type="button" className="btn btn-secondary" onClick={handleAddSchemaField}>
                                + Add New Field
                            </button>
                            <div>
                                <button type="button" className="btn btn-secondary" onClick={() => setSchemaModalOpen(false)} style={{marginRight: '10px'}}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-primary" onClick={saveSchema}>
                                    Save Schema
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const modalStyles = {
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    content: {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '8px',
        width: '800px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflowY: 'auto'
    },
    fieldList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '20px'
    },
    fieldRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #ddd',
        borderRadius: '4px'
    },
    controls: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    },
    input: {
        flex: 1,
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px'
    },
    select: {
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        width: '100px'
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '14px'
    },
    removeBtn: {
        background: '#ff4d4f',
        color: 'white',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid #eee'
    }
};
