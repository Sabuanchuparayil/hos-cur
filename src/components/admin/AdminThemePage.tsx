import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Seller, SellerTheme, Theme, ThemeConfiguration } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';

const CUSTOMIZABLE_VARS = [
  { id: '--bg-primary', label: 'Primary Background' },
  { id: '--bg-secondary', label: 'Secondary Background' },
  { id: '--text-primary', label: 'Primary Text' },
  { id: '--accent', label: 'Accent Color' },
];

// Utility to check for a valid 7-character hex color string
const isValidHex = (color: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(color);
}

interface AdminThemePageProps {
  sellers: Seller[];
  onUpdateSellerTheme: (sellerId: number, theme: SellerTheme) => void;
  onPreviewThemeChange: (theme: Theme | null) => void; 
  platformThemes: ThemeConfiguration[];
  onUnlockTheme: (sellerId: number, theme: ThemeConfiguration) => void;
}

export const AdminThemePage: React.FC<AdminThemePageProps> = ({ sellers, onUpdateSellerTheme, onPreviewThemeChange, platformThemes, onUnlockTheme }) => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  
  const currentSeller = useMemo(() => {
    if (!user) return undefined;
    return sellers.find((s: Seller) => s.id === user.id);
  }, [sellers, user]);

  const savedTheme = currentSeller?.theme || { name: 'dark' as Theme, customizations: {} };

  const [selectedThemeName, setSelectedThemeName] = useState<Theme>(savedTheme.name || 'dark');
  const [customizedVariables, setCustomizedVariables] = useState<Record<string, string>>(
    savedTheme.customizations || {}
  );
  
  const [saveFeedback, setSaveFeedback] = useState('');
  
  useEffect(() => {
    if (currentSeller?.theme?.name) {
      setSelectedThemeName(currentSeller.theme.name);
      setCustomizedVariables(currentSeller.theme.customizations || {});
    }
  }, [currentSeller]);

  useEffect(() => {
    onPreviewThemeChange(selectedThemeName);
    
    const styleId = 'admin-theme-preview-overrides';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    const styles = Object.entries(customizedVariables)
      .map(([key, value]) => `${key}: ${value} !important;`)
      .join(' ');
      
    styleElement.innerHTML = `
      .theme-${selectedThemeName} {
        ${styles}
      }
    `;

    return () => {
        onPreviewThemeChange(null);
        if(document.getElementById(styleId)) {
          document.getElementById(styleId)!.remove();
        }
    };
  }, [selectedThemeName, customizedVariables, onPreviewThemeChange]);

  const handleThemeSelect = (themeName: Theme) => {
    setSelectedThemeName(themeName);
    // When selecting a theme, apply saved customizations if they exist, otherwise clear customizations
    if (currentSeller?.theme?.name === themeName) {
        setCustomizedVariables(currentSeller.theme.customizations || {});
    } else {
        setCustomizedVariables({});
    }
  };
  
  const handleResetToDefault = () => {
    setCustomizedVariables({});
  };
  
  const handleVariableChange = (varName: string, value: string) => {
    setCustomizedVariables(prev => ({...prev, [varName]: value }));
  };

  const handleSaveChanges = () => {
    if (currentSeller) {
      onUpdateSellerTheme(currentSeller.id, { name: selectedThemeName, customizations: customizedVariables });
      setSaveFeedback("Theme saved successfully!");
      setTimeout(() => setSaveFeedback(''), 3000);
    }
  };

  const isThemeUnsaved = useMemo(() => {
      if (!currentSeller || !currentSeller.theme) return false;
      const savedSellerTheme = currentSeller.theme;

      if (savedSellerTheme.name !== selectedThemeName) return true;
      
      const currentCustoms = customizedVariables || {};
      const savedCustoms = savedSellerTheme.customizations || {};
      
      return JSON.stringify(currentCustoms) !== JSON.stringify(savedCustoms);
  }, [currentSeller, selectedThemeName, customizedVariables]);

  if (!currentSeller) {
      return <div>Loading seller information...</div>
  }

  const activeThemeFullConfig = platformThemes.find((t: ThemeConfiguration) => t.id === selectedThemeName) || platformThemes[0];
  const isCurrentThemeUnlocked = (currentSeller.unlockedThemes || []).includes(selectedThemeName);

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold font-cinzel text-[--text-primary]">My Store Theme</h1>
          <p className="text-[--text-muted] mt-1">
              This theme appears when customers visit your product pages. Browse, unlock, and customize themes below.
          </p>
        </div>
         <div className="flex items-center gap-4">
            {saveFeedback && <p className="text-sm text-green-500">{saveFeedback}</p>}
            <button 
              onClick={handleSaveChanges}
              disabled={!isThemeUnsaved}
              className="px-8 py-2 bg-[--accent] text-[--accent-foreground] font-bold rounded-full hover:bg-[--accent-hover] transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save My Theme
            </button>
         </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* THEME STORE */}
        <div className="lg:col-span-1">
            <h2 className="text-xl font-bold font-cinzel text-[--accent] mb-4">Theme Store</h2>
             <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                {platformThemes.filter((t: ThemeConfiguration) => t.isAvailable).map((theme: ThemeConfiguration) => {
                    const isUnlocked = (currentSeller.unlockedThemes || []).includes(theme.id);
                    const isSelected = selectedThemeName === theme.id;
                    return (
                        <div key={theme.id} className={`p-4 rounded-lg border-2 transition-all ${isSelected ? 'bg-[--bg-tertiary] border-[--accent]' : 'bg-[--bg-secondary] border-transparent'}`}>
                             <div 
                                className="h-32 bg-cover bg-center rounded-md mb-3"
                                style={{ backgroundImage: `url('${theme.hero?.image || ''}')` }}
                            ></div>
                            <h3 className="font-bold font-cinzel text-lg text-[--text-primary]">{theme.name}</h3>
                            <div className="flex justify-between items-center mt-2">
                                <span className="font-bold text-green-500">{(theme.price ?? 0) > 0 ? formatPrice(theme.price ?? 0, 'GBP') : 'Free'}</span>
                                {isUnlocked ? (
                                     <button
                                        onClick={() => handleThemeSelect(theme.id)}
                                        disabled={isSelected}
                                        className="px-4 py-1 text-sm font-semibold rounded-full bg-[--accent] text-[--accent-foreground] disabled:bg-gray-500 disabled:opacity-70"
                                    >
                                        {isSelected ? 'Selected' : 'Select'}
                                    </button>
                                ) : (
                                    <button onClick={() => onUnlockTheme(currentSeller.id, theme)} className="px-4 py-1 text-sm font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-700">
                                        Unlock
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
          </div>
        </div>
        
        {/* CUSTOMIZATION PANEL */}
        <div className="lg:col-span-2">
           <h2 className="text-xl font-bold font-cinzel text-[--accent] mb-4">Customize & Preview</h2>
           
           {/* Show warning if theme not unlocked */}
           {!isCurrentThemeUnlocked && (
             <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
               <p className="font-semibold">🔒 Preview Mode</p>
               <p className="text-sm">Unlock this theme to save and apply customizations.</p>
             </div>
           )}
           
           <div className="space-y-6">
             {/* LIVE PREVIEW - Always visible */}
             <div className={`theme-${selectedThemeName}`}>
               <div className="p-4 bg-[--bg-primary] rounded-md border border-[--border-color]">
                 <div className="bg-[--bg-secondary] rounded-lg overflow-hidden shadow-lg max-w-xs mx-auto">
                   <div 
                     className="relative h-40" 
                     style={{
                       backgroundImage: `url('${activeThemeFullConfig?.hero?.image || ''}')`, 
                       backgroundSize: 'cover', 
                       backgroundPosition: 'center'
                     }}
                   ></div>
                   <div className="p-4">
                     <h3 className="text-lg font-bold font-cinzel text-[--accent] truncate">Preview Product</h3>
                     <p className="text-[--text-muted] text-sm mt-1 h-10">This is how your products will look to customers.</p>
                     <div className="mt-4 flex items-center justify-between">
                       <p className="text-xl font-bold text-[--text-primary]">$42.00</p>
                       <button className="px-4 py-2 bg-[--accent] text-[--accent-foreground] text-sm font-bold rounded-full hover:bg-[--accent-hover] transition-all duration-300">
                         Buy Now
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
             </div>

             {/* COLOR PICKERS - Only show if unlocked */}
             {isCurrentThemeUnlocked ? (
               <div className="bg-[--bg-secondary] p-6 rounded-lg shadow-lg">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                   {CUSTOMIZABLE_VARS.map(({id, label}) => (
                     <div key={id}>
                       <label htmlFor={`${id}-text`} className="block text-sm font-medium text-[--text-muted] mb-1">{label}</label>
                       <div className="flex items-center border border-[--border-color] rounded-md focus-within:ring-2 focus-within:ring-[--accent] bg-[--bg-primary] transition-shadow">
                         <input
                           id={id}
                           type="color"
                           value={isValidHex(customizedVariables[id] || '') ? customizedVariables[id] : '#000000'}
                           onChange={e => handleVariableChange(id, e.target.value)}
                           className="bg-transparent border-none w-12 h-10 p-1 cursor-pointer"
                           aria-label={`Select color for ${label}`}
                         />
                         <input
                           id={`${id}-text`}
                           type="text"
                           value={customizedVariables[id] || ''}
                           onChange={e => handleVariableChange(id, e.target.value)}
                           className="w-full bg-transparent text-[--text-primary] border-none focus:outline-none p-2"
                           placeholder="e.g., #FBBF24"
                         />
                       </div>
                     </div>
                   ))}
                 </div>
                 <div className="pt-6">
                   <button onClick={handleResetToDefault} className="px-4 py-2 bg-[--bg-tertiary] text-[--text-secondary] font-semibold rounded-full hover:bg-[--border-color] transition-colors">
                     Reset to Theme Defaults
                   </button>
                 </div>
               </div>
             ) : (
               <div className="bg-[--bg-secondary] p-6 rounded-lg text-center">
                 <h3 className="text-lg font-cinzel text-[--text-primary] mb-2">Unlock to Customize</h3>
                 <p className="text-[--text-muted] text-sm">Click "Unlock" on this theme in the Theme Store to customize colors and save changes.</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};