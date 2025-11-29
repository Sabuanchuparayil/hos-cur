import React, { useState, FormEvent, useMemo, DragEvent } from 'react';
import { HomePageContent, LocalizedString, HomePageCollection, ProductWithTotalStock } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { TAXONOMY_DATA } from '../../data/taxonomy';

interface AdminContentHomePageProps {
  content: HomePageContent;
  onUpdateContent: (newContent: HomePageContent) => void;
  // This is a prop drill, but acceptable for this level of complexity.
  // In a larger app, a product context or global state would be better.
  allProducts: ProductWithTotalStock[];
}

const ProductPickerModal: React.FC<{
    allProducts: ProductWithTotalStock[],
    initialSelectedIds: number[],
    onClose: () => void,
    onSave: (selectedIds: number[]) => void
}> = ({ allProducts, initialSelectedIds, onClose, onSave }) => {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(initialSelectedIds));
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProducts = useMemo(() => {
        return allProducts.filter(p => p.name.en.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [allProducts, searchQuery]);

    const handleToggle = (productId: number) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(productId)) {
            newSet.delete(productId);
        } else {
            newSet.add(productId);
        }
        setSelectedIds(newSet);
    }
    
    const handleSave = () => {
        onSave(Array.from(selectedIds));
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
            <div className="bg-[--bg-secondary] rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
                <h3 className="text-xl font-bold font-cinzel text-[--accent] mb-4">Select Products</h3>
                <input 
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full bg-[--bg-primary] border border-[--border-color] rounded-md py-2 px-3 mb-4"
                />
                <div className="flex-grow overflow-y-auto space-y-2 pr-2 -mr-2">
                    {filteredProducts.map(product => (
                        <label key={product.id} htmlFor={`product-${product.id}`} className="flex items-center gap-4 p-2 bg-[--bg-tertiary] rounded-md cursor-pointer hover:bg-[--border-color]">
                            <input
                                type="checkbox"
                                id={`product-${product.id}`}
                                checked={selectedIds.has(product.id)}
                                onChange={() => handleToggle(product.id)}
                                className="h-5 w-5 rounded border-gray-500 text-[--accent] focus:ring-[--accent]"
                            />
                            <img src={product?.media?.[0]?.url || ''} alt={product?.name?.en || ''} className="w-10 h-10 object-cover rounded"/>
                            <span className="font-semibold text-sm">{product.name.en}</span>
                        </label>
                    ))}
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t border-[--border-color] mt-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-[--bg-primary] text-[--text-secondary] font-semibold rounded-full">Cancel</button>
                    <button type="button" onClick={handleSave} className="px-8 py-2 bg-[--accent] text-[--accent-foreground] font-bold rounded-full">Save Selection</button>
                </div>
            </div>
        </div>
    );
};


export const AdminContentHomePage: React.FC<AdminContentHomePageProps> = ({ content, onUpdateContent, allProducts }) => {
  const [formData, setFormData] = useState<HomePageContent>(content);
  const [activeLangTab, setActiveLangTab] = useState('en');
  const { languages } = useLanguage();
  const [feedback, setFeedback] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);

  const allPhantoms = Object.keys(TAXONOMY_DATA);

  const processFile = (file: File) => {
      if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (readEvent) => {
              setFormData(prev => ({ ...prev, hero: {...prev.hero, image: readEvent.target?.result as string }}));
          };
          reader.readAsDataURL(file);
      } else {
          alert('Please upload a valid image file (PNG, JPG, etc.).');
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); }
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); }
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
  }
  
  const handleHeroLocaleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: 'title' | 'subtitle') => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        [field]: {
          ...(prev.hero[field] as LocalizedString),
          [activeLangTab]: value
        }
      }
    }));
  };

  const handlePhantomToggle = (phantomName: string) => {
    setFormData(prev => {
      const featured = prev.featuredPhantoms;
      const newFeatured = featured.includes(phantomName)
        ? featured.filter(p => p !== phantomName)
        : [...featured, phantomName];
      return { ...prev, featuredPhantoms: newFeatured };
    });
  };
  
  const updateCollection = (id: string, updates: Partial<HomePageCollection>) => {
      setFormData(prev => ({
          ...prev,
          collections: prev.collections.map(c => c.id === id ? { ...c, ...updates } : c)
      }));
  }
  
  const addCollection = () => {
      const newCollection: HomePageCollection = {
          id: `col-${Date.now()}`,
          title: { en: 'New Collection', es: 'Nueva Colección' },
          type: 'manual',
          productIds: [],
          order: formData.collections.length + 1,
      };
      setFormData(prev => ({...prev, collections: [...prev.collections, newCollection]}));
  };
  
  const removeCollection = (id: string) => {
      setFormData(prev => ({
          ...prev,
          collections: prev.collections.filter(c => c.id !== id)
      }));
  };
  
  const handleSaveProducts = (selectedIds: number[]) => {
      if (editingCollectionId) {
          updateCollection(editingCollectionId, { productIds: selectedIds });
      }
      setIsProductPickerOpen(false);
      setEditingCollectionId(null);
  };


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onUpdateContent(formData);
    setFeedback('Homepage content saved successfully!');
    setTimeout(() => setFeedback(''), 3000);
  };
  
  const handleReset = () => {
      setFormData(content);
      setFeedback('Changes have been reset.');
      setTimeout(() => setFeedback(''), 3000);
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-cinzel text-[--text-primary]">Homepage Content</h1>
          <p className="text-[--text-muted] mt-1">Manage the content displayed on your main storefront page.</p>
        </div>
        {feedback && <p className="text-sm font-semibold text-green-500 bg-green-500/10 p-2 rounded-md">{feedback}</p>}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Hero Section */}
        <div className="bg-[--bg-secondary] p-6 rounded-lg shadow-lg border border-[--border-color]">
          <h2 className="text-xl font-bold font-cinzel text-[--accent] mb-4">Hero Section</h2>
          
           <label className="block text-sm font-medium text-[--text-muted]">Hero Image</label>
           <p className="text-xs text-gray-500 mt-1">Recommended size: 1600x900 pixels (16:9 aspect ratio). This image will span the top of the homepage.</p>
           <div 
                className={`mt-1 h-48 w-full border-2 border-dashed rounded-md flex justify-center items-center transition-colors ${isDragging ? 'border-[--accent] bg-[--accent]/10' : 'border-[--border-color] hover:border-gray-500'}`}
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            >
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="hero-image-upload"/>
                {formData.hero.image ? (
                    <div className="p-2 relative group h-full">
                        <img src={formData.hero.image} alt="Hero Preview" className="max-h-full rounded-md object-contain"/>
                    </div>
                ) : (
                    <div className="text-center p-12">
                        <p className="text-[--text-muted]">Drag & drop an image here</p>
                        <p className="text-xs text-gray-500">or</p>
                        <button type="button" onClick={() => document.getElementById('hero-image-upload')?.click()} className="mt-2 text-sm font-semibold text-[--accent] hover:underline">
                            Click to upload
                        </button>
                    </div>
                )}
            </div>

          <div className="mt-4">
            <div className="mb-2 border-b border-[--border-color]">
              <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                {Object.keys(languages).map(lang => (
                  <button key={lang} type="button" onClick={() => setActiveLangTab(lang)} className={`${activeLangTab === lang ? 'border-[--accent] text-[--accent]' : 'border-transparent text-[--text-muted] hover:text-[--text-secondary] hover:border-gray-500'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                    {languages[lang]}
                  </button>
                ))}
              </nav>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="hero-title" className="block text-sm font-medium text-[--text-muted]">Title ({languages[activeLangTab]})</label>
                <input type="text" id="hero-title" name="title" value={formData.hero.title[activeLangTab] || ''} onChange={(e) => handleHeroLocaleChange(e, 'title')} className="mt-1 block w-full bg-[--bg-primary] border border-[--border-color] rounded-md shadow-sm py-2 px-3 text-[--text-primary]"/>
              </div>
              <div>
                <label htmlFor="hero-subtitle" className="block text-sm font-medium text-[--text-muted]">Subtitle ({languages[activeLangTab]})</label>
                <textarea id="hero-subtitle" name="subtitle" rows={2} value={formData.hero.subtitle[activeLangTab] || ''} onChange={(e) => handleHeroLocaleChange(e, 'subtitle')} className="mt-1 block w-full bg-[--bg-primary] border border-[--border-color] rounded-md shadow-sm py-2 px-3 text-[--text-primary]"/>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Phantoms Section */}
        <div className="bg-[--bg-secondary] p-6 rounded-lg shadow-lg border border-[--border-color]">
          <h2 className="text-xl font-bold font-cinzel text-[--accent] mb-4">Featured Phantoms</h2>
          <p className="text-sm text-[--text-muted] mb-4">Select which fandoms to display in the 'Grand Hall of Fandoms' section on the homepage.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {allPhantoms.map(phantom => (
              <label key={phantom} htmlFor={`phantom-${phantom}`} className="flex items-center p-3 bg-[--bg-primary] rounded-md hover:bg-[--tertiary] cursor-pointer">
                <input type="checkbox" id={`phantom-${phantom}`} checked={formData.featuredPhantoms.includes(phantom)} onChange={() => handlePhantomToggle(phantom)} className="h-5 w-5 rounded border-gray-500 text-[--accent] focus:ring-[--accent] bg-transparent"/>
                <span className="ml-3 font-medium text-[--text-secondary]">{phantom}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Collections Section */}
        <div className="bg-[--bg-secondary] p-6 rounded-lg shadow-lg border border-[--border-color]">
           <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-cinzel text-[--accent]">Homepage Carousels</h2>
                <button type="button" onClick={addCollection} className="px-4 py-1 bg-indigo-600 text-white font-semibold rounded-full text-sm hover:bg-indigo-700">+ Add Carousel</button>
           </div>
           
            <div className="mb-2 border-b border-[--border-color]">
              <nav className="-mb-px flex space-x-4"><button type="button" disabled className="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm border-transparent text-[--text-muted]">Editing in {languages[activeLangTab]}</button></nav>
            </div>
            
            <div className="space-y-4">
                {formData.collections.sort((a,b) => a.order - b.order).map(collection => (
                    <div key={collection.id} className="bg-[--bg-tertiary]/50 p-4 rounded-md border border-[--border-color]">
                         <div className="flex justify-end mb-2">
                             <button type="button" onClick={() => removeCollection(collection.id)} className="text-xs text-red-500 hover:text-red-400 font-semibold">Remove</button>
                         </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-medium text-[--text-muted]">Order</label>
                                <input type="number" value={collection.order} onChange={(e) => updateCollection(collection.id, { order: parseInt(e.target.value, 10) })} className="mt-1 block w-full bg-[--bg-primary] border border-[--border-color] rounded-md py-2 px-3"/>
                            </div>
                            <div className="md:col-span-4">
                                <label className="block text-xs font-medium text-[--text-muted]">Title</label>
                                <input type="text" value={collection.title[activeLangTab] || ''} onChange={(e) => updateCollection(collection.id, { title: {...collection.title, [activeLangTab]: e.target.value }})} className="mt-1 block w-full bg-[--bg-primary] border border-[--border-color] rounded-md py-2 px-3"/>
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-xs font-medium text-[--text-muted]">Type</label>
                                <select value={collection.type} onChange={(e) => updateCollection(collection.id, { type: e.target.value as any, productIds: [] })} className="mt-1 block w-full bg-[--bg-primary] border border-[--border-color] rounded-md py-2 px-3">
                                    <option value="new-arrivals">New Arrivals</option>
                                    <option value="bestsellers">Bestsellers</option>
                                    <option value="manual">Manual</option>
                                </select>
                            </div>
                            <div className="md:col-span-4 self-end">
                                {collection.type === 'manual' && (
                                    <button
                                        type="button"
                                        onClick={() => { setEditingCollectionId(collection.id); setIsProductPickerOpen(true); }}
                                        className="w-full h-11 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md text-sm hover:bg-blue-700"
                                    >
                                        Select Products ({collection.productIds.length})
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button type="button" onClick={handleReset} className="px-6 py-2 bg-[--bg-tertiary] text-[--text-secondary] font-semibold rounded-full hover:bg-[--border-color] transition-colors">Reset</button>
          <button type="submit" className="px-8 py-2 bg-[--accent] text-[--accent-foreground] font-bold rounded-full hover:bg-[--accent-hover] transition duration-300">Save Changes</button>
        </div>
      </form>
      
      {isProductPickerOpen && editingCollectionId && (
        <ProductPickerModal 
            allProducts={allProducts}
            initialSelectedIds={formData.collections.find(c => c.id === editingCollectionId)?.productIds || []}
            onClose={() => setIsProductPickerOpen(false)}
            onSave={handleSaveProducts}
        />
      )}
    </div>
  );
};
