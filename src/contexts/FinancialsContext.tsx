import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { apiService } from '../services/apiService';

// Fallback tax rates if API fails
const INITIAL_TAX_RATES: { [countryCode: string]: number } = {
    'GB': 0.20,
    'US': 0.08,
    'CA': 0.13,
};

export type TaxRates = { [countryCode: string]: number };

interface FinancialsContextType {
  taxRates: TaxRates;
  updateTaxRates: (newRates: TaxRates) => void;
}

const FinancialsContext = createContext<FinancialsContextType | undefined>(undefined);

export const FinancialsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [taxRates, setTaxRates] = useState<TaxRates>(INITIAL_TAX_RATES);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const rates = await apiService.fetchTaxRates();
        if (rates && typeof rates === 'object') {
          setTaxRates(rates);
        }
      } catch (error) {
        console.error("Failed to fetch tax rates, using initial values.", error);
        // Keep using INITIAL_TAX_RATES which are already set in useState
      }
    };
    fetchRates();
  }, []);


  const updateTaxRates = (newRates: TaxRates) => {
    apiService.updateTaxRates(newRates).then(setTaxRates).catch(err => {
        console.error("Failed to update tax rates:", err);
        alert("Error: Could not save tax rates.");
    });
  };

  return (
    <FinancialsContext.Provider value={{ taxRates, updateTaxRates }}>
      {children}
    </FinancialsContext.Provider>
  );
};

export const useFinancials = () => {
  const context = useContext(FinancialsContext);
  if (context === undefined) {
    throw new Error('useFinancials must be used within a FinancialsProvider');
  }
  return context;
};