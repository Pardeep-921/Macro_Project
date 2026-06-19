import React from 'react';

export default function FormButtons({ onSave, onUpdate, onReset, showUpdate = true, saveType = 'button' }) {
    return (
        <div className="btn-group">
            <button type={saveType} className="btn btn-primary" onClick={onSave}>Save</button>
            {showUpdate && <button type="button" className="btn btn-primary" onClick={onUpdate}>Update</button>}
            <button type="button" className="btn btn-secondary" onClick={onReset}>Reset</button>
        </div>
    );
}
