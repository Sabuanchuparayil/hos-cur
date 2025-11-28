import React from 'react';
import { Link } from 'react-router-dom';

interface ActionItem {
    icon: string;
    text: React.ReactNode;
    link: string;
}

interface ActionItemsProps {
    title: string;
    items: ActionItem[];
}

export const ActionItems: React.FC<ActionItemsProps> = ({ title, items }) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
        return null;
    }
    
    return (
        <div className="bg-[--bg-secondary] border border-[--border-color] p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold font-cinzel text-[--accent] mb-4">{title}</h3>
            <ul className="space-y-3">
                {items.map((item, index) => (
                    <li key={index}>
                        <Link to={item.link} className="flex items-center gap-4 p-3 rounded-md hover:bg-[--bg-tertiary] transition-colors">
                            <span className="text-2xl">{item.icon}</span>
                            <span className="text-sm font-semibold text-[--text-secondary]">{item.text}</span>
                            <span className="ml-auto text-[--text-muted]">&rarr;</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};