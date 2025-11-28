import React, { useState, useMemo } from 'react';
import { Product, ProductWithTotalStock, Seller } from '../../types';
import { ProductForm } from './ProductForm';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { findPotentialDuplicates, DuplicateCheckResult } from '../../services/productService';

interface DuplicateConfirmationModalProps {
    result: DuplicateCheckResult;
    sellers: Seller[];
    onConfirm: () => void;
    onCancel: () => void;
}

const DuplicateConfirmationModal: React.FC<DuplicateConfirmationModalProps> = ({ result, sellers, onConfirm, onCancel }) => {
    if (!result.isDuplicate || !result.matchingProduct) return null;
    
    const { getDisplayPrice } = useCurrency();
    const seller = sellers.find(s => s.id === result.matchingProduct!.sellerId);

    const getReasonText = () => {
        switch(result.reason) {
            case 'barcode': return `An existing product was found with the same barcode: ${result.matchingProduct?.barcode}`;
            case 'sku': return `An existing product was found with the same SKU: ${result.matchingProduct?.sku}`;
            case 'name': return `An existing product in the same category has a very similar name (similarity: ${((result.similarityScore || 0) * 100).toFixed(0)}%).`;
            default: return 'A similar product was found.';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
            <div className="bg-[--bg-secondary] rounded-lg shadow-2xl p-8 w-full max-w-2xl">
                <h2 className="text-2xl font-bold font-cinzel text-yellow-400 mb-4">⚠️ Potential Duplicate Found</h2>
                <p className="text-[--text-muted] mb-6">{getReasonText()}</p>
                
                <div className="bg-[--bg-primary] p-4 rounded-lg border border-[--border-color] space-y-2">
                    <h3 className="font-semibold text-[--text-primary]">{result.matchingProduct.name.en}</h3>
                    <p className="text-sm"><span className="text-[--text-muted]">SKU:</span> {result.matchingProduct.sku}</p>
                    <p className="text-sm"><span className="text-[--text-muted]">Sold by:</span> {seller?.name || 'Unknown Seller'}</p>
                    <p className="text-sm"><span className="text-[--text-muted]">Price:</span> {getDisplayPrice(result.matchingProduct.pricing)}</p>
                </div>

                <p className="text-sm text-center text-[--text-muted] my-6">
                    House of Spells policy allows only one seller per unique product to maintain a clean catalog. Are you sure you want to create a new, separate listing for this item?
                </p>

                <div className="flex justify-end gap-4">
                    <button onClick={onCancel} className="px-6 py-2 bg-[--bg-tertiary] text-[--text-secondary] font-semibold rounded-full hover:bg-[--border-color]">Cancel</button>
                    <button onClick={onConfirm} className="px-8 py-2 bg-yellow-600 text-white font-bold rounded-full hover:bg-yellow-700">Yes, Create Duplicate</button>
                </div>
            </div>
        </div>
    );
};

interface AdminProductsPageProps {
  products: ProductWithTotalStock[];
  sellers: Seller[];
  onAddProduct: (product: Omit<Product, 'id' | 'sellerId'> & { sellerId?: number }) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
}

export const AdminProductsPage: React.FC<AdminProductsPageProps> = ({ products, sellers, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithTotalStock | undefined>(undefined);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<DuplicateCheckResult | null>(null);
  const [productToCreate, setProductToCreate] = useState<Omit<Product, 'id' | 'sellerId'> & { sellerId?: number } | null>(null);
  
  const { getDisplayPrice } = useCurrency();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [fandomFilter, setFandomFilter] = useState('all');

  const baseProducts = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    if (user?.role === 'seller') {
      return safeProducts.filter(p => p?.sellerId === user.id);
    }
    return safeProducts;
  }, [products, user]);

  const availableFandoms = useMemo(() => {
      const safeBaseProducts = Array.isArray(baseProducts) ? baseProducts : [];
      return [...new Set(safeBaseProducts.map(p => p?.taxonomy?.fandom).filter(Boolean))];
  }, [baseProducts]);

  const filteredProducts = useMemo(() => {
    const safeBaseProducts = Array.isArray(baseProducts) ? baseProducts : [];
    let filtered = safeBaseProducts;

    if (searchQuery.trim()) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(p => {
            if (!p) return false;
            const nameStr = typeof p.name === 'object' && p.name?.en ? p.name.en.toLowerCase() : (typeof p.name === 'string' ? p.name.toLowerCase() : '');
            const skuStr = (p.sku || '').toLowerCase();
            const barcodeStr = (p.barcode || '').toLowerCase();
            return nameStr.includes(lowercasedQuery) ||
                skuStr.includes(lowercasedQuery) ||
                barcodeStr.includes(lowercasedQuery) ||
                (Array.isArray(p.variations) && p.variations.some(v => (v?.sku || '').toLowerCase().includes(lowercasedQuery)));
        });
    }

    if (stockFilter !== 'all') {
        filtered = filtered.filter(p => {
            if (!p) return false;
            const stock = p.stock ?? 0;
            if (stockFilter === 'in_stock') return stock > 10;
            if (stockFilter === 'low_stock') return stock > 0 && stock <= 10;
            if (stockFilter === 'out_of_stock') return stock === 0;
            return true;
        });
    }
    
    if (fandomFilter !== 'all') {
        filtered = filtered.filter(p => p?.taxonomy?.fandom === fandomFilter);
    }

    return filtered;
  }, [baseProducts, searchQuery, stockFilter, fandomFilter]);


  const handleOpenModalForAdd = () => {
    setEditingProduct(undefined);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (product: ProductWithTotalStock) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(undefined);
  };
  
  const handleAddProductWithCheck = (productData: Omit<Product, 'id' | 'sellerId'> & { sellerId?: number }) => {
    const duplicateResult = findPotentialDuplicates(productData, products);
    if (duplicateResult.isDuplicate) {
        setDuplicateCheckResult(duplicateResult);
        setProductToCreate(productData);
    } else {
        onAddProduct(productData);
        handleCloseModal();
    }
  };

  const confirmDuplicateCreation = () => {
    if (productToCreate) {
      onAddProduct(productToCreate);
    }
    setDuplicateCheckResult(null);
    setProductToCreate(null);
    handleCloseModal();
  };

  const cancelDuplicateCreation = () => {
    setDuplicateCheckResult(null);
    setProductToCreate(null);
  };


  const handleDelete = (productId: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
        onDeleteProduct(productId);
    }
  };
  
  const handleClearFilters = () => {
    setSearchQuery('');
    setStockFilter('all');
    setFandomFilter('all');
  };

  const handleExportCSV = () => {
    const escapeCSV = (str: string | undefined) => `"${(str || '').replace(/"/g, '""')}"`;

    let headers: string[];
    if (user?.role === 'admin') {
        headers = ['id', 'name_en', 'name_es', 'description_en', 'description_es', 'price_gbp', 'price_usd', 'price_eur', 'price_jpy', 'primary_image_url', 'fandom', 'subCategory', 'sku', 'barcode', 'inventory_main_stock', 'inventory_london_stock', 'sellerId'];
    } else {
        headers = ['id', 'name_en', 'name_es', 'description_en', 'description_es', 'price_gbp', 'price_usd', 'price_eur', 'price_jpy', 'primary_image_url', 'fandom', 'subCategory', 'sku', 'barcode', 'inventory_main_stock', 'inventory_london_stock'];
    }

    const csvRows = [headers.join(',')];

    for (const product of filteredProducts) {
        const safeInventory = Array.isArray(product?.inventory) ? product.inventory : [];
        const mainStock = safeInventory.find(inv => inv?.centreId === 'main')?.stock || 0;
        const londonStock = safeInventory.find(inv => inv?.centreId === 'london')?.stock || 0;

        const row = [
            product.id,
            escapeCSV(product.name.en),
            escapeCSV(product.name.es),
            escapeCSV(product.description.en),
            escapeCSV(product.description.es),
            product.pricing.GBP || 0,
            product.pricing.USD || 0,
            product.pricing.EUR || 0,
            product.pricing.JPY || 0,
            product.media[0]?.url || '',
            product.taxonomy.fandom,
            product.taxonomy.subCategory,
            product.sku,
            product.barcode || '',
            mainStock,
            londonStock,
        ];

        if (user?.role === 'admin') {
            row.push(product.sellerId);
        }

        csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const noProductsMessage = (
    <div className="text-center p-8 text-[--text-muted] bg-[--bg-secondary] rounded-lg">
      {baseProducts.length === 0 ? 'You have not added any products yet.' : 'No products match the current filters.'}
    </div>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold font-cinzel text-[--text-primary]">
          Manage Products
          <span className="text-lg ml-3 font-normal text-[--text-muted] tracking-normal">
            ({filteredProducts.length})
          </span>
        </h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button onClick={handleExportCSV} className="w-full text-center px-6 py-2 bg-[--bg-tertiary] text-[--text-secondary] font-bold rounded-full hover:bg-[--border-color] transition duration-300">
                Export CSV
            </button>
            <Link to="/admin/bulk-upload" className="w-full text-center px-6 py-2 bg-[--bg-tertiary] text-[--text-secondary] font-bold rounded-full hover:bg-[--border-color] transition duration-300">
                Bulk Import
            </Link>
            <button
            onClick={handleOpenModalForAdd}
            className="w-full px-6 py-2 bg-[--accent] text-[--accent-foreground] font-bold rounded-full hover:bg-[--accent-hover] transition duration-300 transform hover:scale-105"
            >
            Add New Product
            </button>
        </div>
      </div>

       {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-6 bg-[--bg-secondary] p-4 rounded-lg border border-[--border-color]">
        <div className="w-full md:flex-grow">
            <input
            type="search"
            placeholder="Search by name, SKU, or barcode..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[--bg-primary] border border-[--border-color] rounded-md py-2 px-3 text-[--text-primary] focus:ring-[--accent] focus:border-[--accent]"
            />
        </div>
        <div className="w-full md:w-auto">
            <select value={fandomFilter} onChange={e => setFandomFilter(e.target.value)} className="w-full bg-[--bg-primary] border border-[--border-color] rounded-md py-2 px-3 text-[--text-primary] focus:ring-[--accent] focus:border-[--accent]">
            <option value="all">All Fandoms</option>
            {availableFandoms.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
        </div>
        <div className="w-full md:w-auto">
            <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="w-full bg-[--bg-primary] border border-[--border-color] rounded-md py-2 px-3 text-[--text-primary] focus:ring-[--accent] focus:border-[--accent]">
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock ({'>'}10)</option>
            <option value="low_stock">Low Stock (1-10)</option>
            <option value="out_of_stock">Out of Stock</option>
            </select>
        </div>
        <button onClick={handleClearFilters} className="text-sm font-semibold text-[--text-muted] hover:text-[--accent] transition-colors whitespace-nowrap">
            Clear Filters
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-[--bg-secondary] rounded-lg shadow-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[--bg-tertiary]">
            <tr>
              <th className="p-4 font-semibold text-[--text-secondary]">Image</th>
              <th className="p-4 font-semibold text-[--text-secondary]">Name (EN)</th>
              <th className="p-4 font-semibold text-[--text-secondary]">SKU</th>
              <th className="p-4 font-semibold text-[--text-secondary]">Barcode</th>
              <th className="p-4 font-semibold text-[--text-secondary]">Category</th>
              <th className="p-4 font-semibold text-[--text-secondary]">Price</th>
              <th className="p-4 font-semibold text-[--text-secondary]">Total Stock</th>
              <th className="p-4 font-semibold text-[--text-secondary]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? filteredProducts.map(product => {
              if (!product) return null;
              const productName = typeof product.name === 'object' && product.name?.en ? product.name.en : (typeof product.name === 'string' ? product.name : 'Product');
              const mediaUrl = Array.isArray(product.media) && product.media.length > 0 ? product.media[0]?.url : '';
              return (
              <tr key={product.id} className="border-b border-[--border-color] hover:bg-[--bg-tertiary]">
                <td className="p-4">
                  {mediaUrl && <img src={mediaUrl} alt={productName} className="w-16 h-16 object-cover rounded-md" />}
                </td>
                <td className="p-4 font-bold text-[--text-primary]">
                    {productName}
                    {product.hasVariations && <span className="ml-2 text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">Variations</span>}
                </td>
                <td className="p-4 text-[--text-muted]">{product.sku || 'N/A'}</td>
                <td className="p-4 text-[--text-muted]">{product.barcode || 'N/A'}</td>
                <td className="p-4 text-[--text-muted]">{product.taxonomy?.fandom || 'N/A'} / {product.taxonomy?.subCategory || 'N/A'}</td>
                <td className="p-4 text-[--text-primary]">{getDisplayPrice(product.pricing || {})}</td>
                <td className={`p-4 font-bold ${(product.stock || 0) > 10 ? 'text-green-600' : ((product.stock || 0) > 0 ? 'text-orange-500' : 'text-red-600')}`}>{product.stock || 0}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenModalForEdit(product)} className="text-[--accent] hover:text-[--accent-hover]">Edit</button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-500">Delete</button>
                  </div>
                </td>
              </tr>
              );
            }) : (
              <tr><td colSpan={8} className="text-center p-8 text-[--text-muted]">{baseProducts.length === 0 ? 'You have not added any products yet.' : 'No products match the current filters.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {filteredProducts.length > 0 ? filteredProducts.map(product => {
          if (!product) return null;
          const productName = typeof product.name === 'object' && product.name?.en ? product.name.en : (typeof product.name === 'string' ? product.name : 'Product');
          const mediaUrl = Array.isArray(product.media) && product.media.length > 0 ? product.media[0]?.url : '';
          return (
          <div key={product.id} className="bg-[--bg-secondary] rounded-lg shadow-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-grow">
                {mediaUrl && <img src={mediaUrl} alt={productName} className="w-20 h-20 object-cover rounded-md" />}
                <div className="flex-grow">
                  <h3 className="font-bold text-[--text-primary] text-lg">
                      {productName}
                      {product.hasVariations && <span className="ml-2 text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">Variations</span>}
                  </h3>
                  <p className="text-sm text-[--text-muted]">SKU: {product.sku || 'N/A'}</p>
                  <p className="text-sm text-[--text-muted]">Barcode: {product.barcode || 'N/A'}</p>
                </div>
              </div>
              <div className="flex gap-3 text-sm flex-shrink-0">
                <button onClick={() => handleOpenModalForEdit(product)} className="text-[--accent] hover:text-[--accent-hover] font-semibold">Edit</button>
                <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-600 font-semibold">Delete</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm border-t border-b border-[--border-color] py-2">
              <div>
                <p className="text-xs text-[--text-muted]">Category</p>
                <p className="font-semibold text-[--text-secondary] truncate">{product.taxonomy?.subCategory || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-[--text-muted]">Price</p>
                <p className="font-semibold text-[--text-primary]">{getDisplayPrice(product.pricing || {})}</p>
              </div>
              <div>
                <p className="text-xs text-[--text-muted]">Stock</p>
                <p className={`font-bold ${(product.stock || 0) > 10 ? 'text-green-600' : ((product.stock || 0) > 0 ? 'text-orange-500' : 'text-red-600')}`}>{product.stock || 0}</p>
              </div>
            </div>
          </div>
          );
        }) : noProductsMessage}
      </div>
      
      {isModalOpen && (
        <ProductForm 
          product={editingProduct} 
          sellers={sellers}
          onClose={handleCloseModal} 
          onAddProduct={handleAddProductWithCheck}
          onUpdateProduct={onUpdateProduct}
        />
      )}

      {duplicateCheckResult && duplicateCheckResult.isDuplicate && (
        <DuplicateConfirmationModal 
            result={duplicateCheckResult}
            sellers={sellers}
            onConfirm={confirmDuplicateCreation}
            onCancel={cancelDuplicateCreation}
        />
      )}
    </div>
  );
};