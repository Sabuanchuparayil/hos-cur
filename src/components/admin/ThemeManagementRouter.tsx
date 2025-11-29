import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Seller, SellerTheme, Theme, ThemeConfiguration } from '../../types';
import { AdminThemePage } from './AdminThemePage';
import { AdminThemeUsagePage } from './AdminThemeUsagePage';

// This component acts as a router to show the correct theme page
// based on whether the logged-in user is an admin or a seller.

interface ThemeManagementRouterProps {
  sellers: Seller[];
  onUpdateSellerTheme: (sellerId: number, theme: SellerTheme) => void;
  onPreviewThemeChange: (theme: Theme | null) => void; 
  platformThemes: ThemeConfiguration[];
  onUnlockTheme: (sellerId: number, theme: ThemeConfiguration) => void;
}

export const ThemeManagementRouter: React.FC<ThemeManagementRouterProps> = (props) => {
    const { user } = useAuth();

    if (user?.role === 'admin') {
        return <AdminThemeUsagePage sellers={props.sellers} platformThemes={props.platformThemes} />;
    }
    
    if (user?.role === 'seller') {
        return <AdminThemePage {...props} />;
    }

    // Fallback for any unexpected cases
    return (
        <div className="text-center p-8">
            <p className="text-[--text-muted] mb-4">Access denied.</p>
            <p className="text-sm text-[--text-muted]">This page is only available for sellers and administrators.</p>
        </div>
    );
};