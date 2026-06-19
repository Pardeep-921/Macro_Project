import React from 'react';

export default function DataTable({ columns, data, actions, onAction }) {
    return (
        <div className="data-table-wrapper">
            <table className="data-table">
                <thead>
                    <tr>
                        {actions && actions.map((action, i) => (
                            <th key={`action-${i}`} className="action-header">{action} Action</th>
                        ))}
                        {columns.map((col, i) => (
                            <th key={i}>{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {actions && actions.map((action, i) => (
                                <td key={`action-${i}`}>
                                    <button
                                        type="button"
                                        className="action-link" 
                                        onClick={() => onAction && onAction(action, row)}
                                        style={{ cursor: 'pointer', color: action === 'Reject' ? '#cc3333' : 'var(--orange-primary)' }}
                                    >
                                        {action}
                                    </button>
                                </td>
                            ))}
                            {columns.map((col, colIndex) => (
                                <td key={colIndex}>{col.render ? col.render(row) : row[col.key]}</td>
                            ))}
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={(actions ? actions.length : 0) + columns.length} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                No records found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
