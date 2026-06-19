import React from 'react';

export default function PageHeader({ title }) {
    return (
        <header className="page-header-bar">
            <span className="page-header-accent" aria-hidden="true"></span>
            <h1>{title}</h1>
        </header>
    );
}
