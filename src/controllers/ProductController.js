import { useState, useEffect } from 'react';
import { MasterModel } from '../models/MasterModel';

export const useProductController = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('maco_po_cart');
        return saved ? JSON.parse(saved) : [];
    });

    const fetchProducts = async () => {
        try {
            const [pData, cData] = await Promise.all([
                MasterModel.Products.get(),
                MasterModel.Categories.get()
            ]);

            const productsWithImages = pData.map(p => ({
                ...p,
                imageUrl: p.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'
            }));

            setProducts(productsWithImages);
            setCategories(cData);
        } catch (err) {
            console.error('Failed to load demo product data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        localStorage.setItem('maco_po_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product, selections) => {
        const newItems = selections
            .filter(sh => sh.qty > 0)
            .map(sh => ({
                id: product.id,
                item_id: product.item_id || product.id,
                name: product.name,
                category: product.category,
                size: sh.size,
                size_id: sh.size_id || product.item_size_id,
                item_size_id: product.item_size_id,
                qty: parseInt(sh.qty),
                price: Number(product.rate || product.list_price || 0),
                uom: product.uom,
                total: parseInt(sh.qty) * Number(product.rate || product.list_price || 0),
                cartId: `${product.id}-${sh.size}-${Date.now()}`
            }));

        setCart(prev => [...prev, ...newItems]);
    };

    const removeFromCart = (cartId) => {
        setCart(prev => prev.filter(item => item.cartId !== cartId));
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('maco_po_cart');
    };

    return {
        products,
        categories,
        loading,
        cart,
        addToCart,
        removeFromCart,
        clearCart
    };
};
