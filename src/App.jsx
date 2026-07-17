import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './views/components/Layout';
import Login from './views/pages/Login';
import Register from './views/pages/Register';
import ProtectedRoute from './views/components/ProtectedRoute';

// Admin Pages
import AdminDashboard from './views/pages/admin/Dashboard';
import ManageCustomer from './views/pages/admin/ManageCustomer';
import ManagePrimaryItem from './views/pages/admin/ManagePrimaryItem';
import ManageSubGroupItem from './views/pages/admin/ManageSubGroupItem';
import ManageItemMaster from './views/pages/admin/ManageItemMaster';
import ManageItemUnit from './views/pages/admin/ManageItemUnit';
import ManageShippingType from './views/pages/admin/ManageShippingType';
import ManageItemSize from './views/pages/admin/ManageItemSize';
import ManageOrder from './views/pages/admin/ManageOrder';
import UploadChallanDetails from './views/pages/admin/UploadChallanDetails';
import TrackSupplyDetails from './views/pages/admin/TrackSupplyDetails';
import PendingUsers from './views/pages/admin/PendingUsers'; // NEW

// Customer Pages
import ProductCatalog from './views/pages/customer/ProductCatalog';
import CustomerDashboard from './views/pages/customer/Dashboard';
import AddItemCart from './views/pages/customer/AddItemCart';
import CustomerManageOrder from './views/pages/customer/ManageOrder';
import CustomerTrackSupply from './views/pages/customer/TrackSupplyDetails';
import ProductDetail from './views/pages/shared/ProductDetail';
import Settings from './views/pages/shared/Settings';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route path="/admin" element={<Layout userType="admin" />}>
            <Route index element={<Navigate to="/admin/catalog" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="manage-customer" element={<ManageCustomer />} />
            <Route path="manage-company" element={<Navigate to="/admin/manage-customer" replace />} />
            <Route path="manage-primary-item" element={<ManagePrimaryItem />} />
            <Route path="manage-sub-item" element={<ManageSubGroupItem />} />
            <Route path="manage-item-master" element={<ManageItemMaster />} />
            <Route path="manage-item-unit" element={<ManageItemUnit />} />
            <Route path="manage-shipping" element={<ManageShippingType />} />
            <Route path="manage-item-size" element={<ManageItemSize />} />
            <Route path="manage-order" element={<ManageOrder />} />
            <Route path="upload-challan" element={<UploadChallanDetails />} />
            <Route path="track-supply" element={<TrackSupplyDetails />} />
            <Route path="user-approvals" element={<PendingUsers />} /> {/* NEW */}
            <Route path="catalog" element={<ProductCatalog />} />
            <Route path="settings" element={<Settings />} />
            <Route path="product/:id" element={<ProductDetail />} />
          </Route>
        </Route>

        {/* Customer Routes */}
        <Route element={<ProtectedRoute allowedRole="customer" />}>
          <Route path="/customer" element={<Layout userType="customer" />}>
            <Route index element={<Navigate to="/customer/catalog" replace />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="catalog" element={<ProductCatalog />} />
            <Route path="add-item-cart" element={<AddItemCart />} />
            <Route path="manage-order" element={<CustomerManageOrder />} />
            <Route path="track-supply" element={<CustomerTrackSupply />} />
            <Route path="settings" element={<Settings />} />
            <Route path="product/:id" element={<ProductDetail />} />

          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
