import React, { useState, FormEvent, useMemo } from 'react';
// FIX: The IntegrationConfig type is defined in the integrations data file, not the main types file.
import { IntegrationCredentials, IntegrationName } from '../../types';
import { IntegrationConfig } from '../../data/integrations';

interface IntegrationCardProps {
  integrationConfig: IntegrationConfig;
  credentials: IntegrationCredentials;
  onSave: (integrationId: IntegrationName, credentials: IntegrationCredentials) => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({ integrationConfig, credentials, onSave }) => {
  // FIX: Provide default empty object if credentials is undefined
  const [formData, setFormData] = useState<IntegrationCredentials>(credentials || {});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(integrationConfig.id, formData);
  };
  
  // An integration is considered "active" if its primary key/ID field is filled in.
  const isActive = useMemo(() => {
    const primaryFieldKey = integrationConfig.fields[0]?.key;
    return !!(primaryFieldKey && formData[primaryFieldKey]);
  }, [formData, integrationConfig.fields]);

  return (
    <div className="bg-[--bg-secondary] p-6 rounded-lg shadow-lg border border-[--border-color]">
      <div className="flex justify-between items-start mb-4">
        <div>
            <h2 className="text-xl font-bold font-cinzel text-[--accent]">{integrationConfig.name}</h2>
            <p className="text-sm text-[--text-muted] mt-1">{integrationConfig.description}</p>
        </div>
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <span className="text-sm font-semibold">{isActive ? 'Active' : 'Inactive'}</span>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {integrationConfig.fields.map(field => (
          <div key={field.key}>
            <label htmlFor={field.key} className="block text-sm font-medium text-[--text-muted]">{field.label}</label>
            <input
              type={field.type}
              id={field.key}
              name={field.key}
              value={formData[field.key] || ''}
              onChange={handleChange}
              placeholder={field.placeholder}
              className="mt-1 block w-full bg-[--bg-primary] border border-[--border-color] rounded-md shadow-sm py-2 px-3 text-[--text-primary] focus:outline-none focus:ring-[--accent] focus:border-[--accent]"
            />
            <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
          </div>
        ))}
        <div className="text-right pt-2">
            <button 
                type="submit" 
                className="px-6 py-2 bg-[--accent] text-[--accent-foreground] font-bold rounded-full hover:bg-[--accent-hover] transition duration-300"
            >
                Save
            </button>
        </div>
      </form>
    </div>
  );
};
