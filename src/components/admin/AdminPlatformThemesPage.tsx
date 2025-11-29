import React, { useState } from 'react';
import { ThemeConfiguration } from '../../types';
import { ThemeForm } from './ThemeForm';
import { useCurrency } from '../../contexts/CurrencyContext';

interface AdminPlatformThemesPageProps {
  themes: ThemeConfiguration[];
  onAddTheme: (theme: ThemeConfiguration) => void;
  onUpdateTheme: (theme: ThemeConfiguration) => void;
}

export const AdminPlatformThemesPage: React.FC<AdminPlatformThemesPageProps> = ({ themes, onAddTheme, onUpdateTheme }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ThemeConfiguration | undefined>(undefined);
  const { formatPrice } = useCurrency();

  const handleOpenModalForAdd = () => {
    setEditingTheme(undefined);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (theme: ThemeConfiguration) => {
    setEditingTheme(theme);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTheme(undefined);
  };
  
  const handleToggleAvailability = (theme: ThemeConfiguration) => {
      onUpdateTheme({ ...theme, isAvailable: !theme.isAvailable });
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold font-cinzel text-[--text-primary]">
          Platform Themes
        </h1>
        <button
          onClick={handleOpenModalForAdd}
          className="w-full md:w-auto px-6 py-2 bg-[--accent] text-[--accent-foreground] font-bold rounded-full hover:bg-[--accent-hover] transition duration-300 transform hover:scale-105"
        >
          Upload New Theme
        </button>
      </div>
      
      {/* Mobile Card View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:hidden">
        {themes.map(theme => (
            <div key={theme.id} className="bg-[--bg-secondary] rounded-lg shadow-lg">
                <div className="w-full h-32 bg-cover bg-center rounded-t-lg" style={{backgroundImage: `url(${theme?.hero?.image || ''})`}}></div>
                <div className="p-4 space-y-3">
                    <h3 className="font-bold text-[--text-primary] font-cinzel text-lg truncate">{theme.name}</h3>
                    <p className="text-sm text-[--text-muted] font-mono">{theme.id}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-[--border-color] py-2">
                        <div>
                            <p className="text-[--text-muted]">Price</p>
                            <p className="font-semibold text-green-600">{theme.price > 0 ? formatPrice(theme.price, 'GBP') : 'Free'}</p>
                        </div>
                        <div>
                            <p className="text-[--text-muted]">Type</p>
                            <span className={`px-2 py-1 font-semibold rounded-full ${theme.isCustom ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                {theme.isCustom ? 'Custom' : 'Built-in'}
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                         <button onClick={() => handleToggleAvailability(theme)}>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${theme.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {theme.isAvailable ? 'Available' : 'Disabled'}
                            </span>
                        </button>
                        <button onClick={() => handleOpenModalForEdit(theme)} className="text-[--accent] hover:text-[--accent-hover] font-semibold">Edit</button>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-[--bg-secondary] rounded-lg shadow-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[--bg-tertiary]">
            <tr>
              <th className="p-4 font-semibold text-[--text-secondary]">Preview</th>
              <th className="p-4 font-semibold text-[--text-secondary]">Name</th>
              <th className="p-4 font-semibold text-[--text-secondary]">ID</th>
              <th className="p-4 font-semibold text-[--text-secondary]">Price (GBP)</th>
              <th className="p-4 font-semibold text-[--text-secondary]">Type</th>
              <th className="p-4 font-semibold text-[--text-secondary]">Status</th>
              <th className="p-4 font-semibold text-[--text-secondary]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {themes.map(theme => (
              <tr key={theme.id} className="border-b border-[--border-color] hover:bg-[--bg-tertiary]">
                <td className="p-4">
                  <div className="w-24 h-16 bg-cover bg-center rounded" style={{backgroundImage: `url(${theme?.hero?.image || ''})`}}></div>
                </td>
                <td className="p-4 font-bold text-[--text-primary]">{theme.name}</td>
                <td className="p-4 text-[--text-muted] font-mono">{theme.id}</td>
                <td className="p-4 text-green-600 font-semibold">{theme.price > 0 ? formatPrice(theme.price, 'GBP') : 'Free'}</td>
                <td className="p-4">
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${theme.isCustom ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {theme.isCustom ? 'Custom' : 'Built-in'}
                    </span>
                </td>
                <td className="p-4">
                    <button onClick={() => handleToggleAvailability(theme)}>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${theme.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {theme.isAvailable ? 'Available' : 'Disabled'}
                        </span>
                    </button>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenModalForEdit(theme)} className="text-[--accent] hover:text-[--accent-hover]">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {isModalOpen && (
        <ThemeForm 
          theme={editingTheme} 
          onClose={handleCloseModal} 
          onAddTheme={onAddTheme}
          onUpdateTheme={onUpdateTheme}
        />
      )}
    </div>
  );
};