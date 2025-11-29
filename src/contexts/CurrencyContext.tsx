import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Pricing } from '../types';

interface Currency {
  symbol: string;
}

interface Currencies {
  [key: string]: Currency;
}

const currencies: Currencies = {
  GBP: { symbol: '£' },
  USD: { symbol: '$' },
  EUR: { symbol: '€' },
  JPY: { symbol: '¥' },
};

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  formatPrice: (price: number, currencyCode: string) => string;
  getDisplayPrice: (pricing: Pricing) => string;
  currencies: Currencies;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<string>('GBP');

  const formatPrice = (price: number, currencyCode: string) => {
    // FIX: Handle null/undefined price values
    if (price == null || isNaN(price)) {
      price = 0;
    }
    const selectedCurrency = currencies[currencyCode];
    if (!selectedCurrency) {
        // Fallback for safety
        return `£${price.toFixed(2)}`;
    }
    
    if (currencyCode === 'JPY') {
        return `${selectedCurrency.symbol}${price.toFixed(0)}`;
    }
    return `${selectedCurrency.symbol}${price.toFixed(2)}`;
  };
  
  const getDisplayPrice = (pricing: Pricing): string => {
      const price = pricing[currency] ?? pricing['GBP'] ?? 0; // Fallback logic to GBP
      return formatPrice(price, currency);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, getDisplayPrice, currencies }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
