'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  MessageCircle, 
  FileText,
  BarChart3,
  PanelLeftOpen,
  PanelLeftClose
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  
  const navigation = [
    {
      name: 'Chat',
      href: '/',
      icon: MessageCircle,
      current: pathname === '/'
    },
    {
      name: 'Files',
      href: '/files',
      icon: FileText,
      current: pathname === '/files'
    },
    // {
    //   name: 'Knowledge Base',
    //   href: '/knowledge-base',
    //   icon: BarChart3,
    //   current: pathname === '/knowledge-base'
    // }
  ];

  return (
    <>
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-40 h-full bg-[#003D5B] text-white transition-all duration-300 ease-in-out border-r border-white/20
        ${isOpen ? 'w-64' : 'w-16'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-center p-4 border-b border-slate-700">
          {isOpen ? (
            <div className="flex items-center justify-between w-full">
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="RAG Assistant Logo" className="h-8" />
              </Link>
              
              {/* Toggle Button when expanded */}
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4 text-slate-300" />
              </button>
            </div>
          ) : (
            /* Toggle Button replaces logo when collapsed */
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-5 h-5 text-slate-300" />
            </button>
          )}
        </div>

        {/* New Chat Button - Hidden for now */}
        {/* <div className="p-4">
          <Link href="/">
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              <span className="text-body font-medium">New Chat</span>
            </button>
          </Link>
        </div> */}

        {/* Navigation */}
        <nav className={`${isOpen ? 'px-4' : 'px-2'} pb-4 transition-all duration-300 pt-6`}>
          <div className="space-y-2">
            {navigation.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center rounded-lg transition-all duration-300 ease-in-out
                    ${isOpen ? 'space-x-3 px-3 py-2.5' : 'justify-center p-2.5'}
                    ${item.current 
                      ? 'bg-slate-800 text-white' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                  title={!isOpen ? item.name : undefined}
                  onClick={() => {
                    // Don't close sidebar on navigation like ChatGPT
                  }}
                  style={{
                    transitionDelay: isOpen ? `${index * 50}ms` : '0ms'
                  }}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span 
                    className={`text-body font-medium transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
                      isOpen 
                        ? 'opacity-100 max-w-full transform translate-x-0' 
                        : 'opacity-0 max-w-0 transform -translate-x-2'
                    }`}
                    style={{
                      transitionDelay: isOpen ? `${150 + index * 50}ms` : '0ms'
                    }}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom section */}
        {isOpen && (
          <div 
            className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 transition-all duration-300 ease-in-out"
            style={{
              transitionDelay: '300ms'
            }}
          >
            <div className="text-caption font-regular text-slate-400 text-center">
              <p className="transition-opacity duration-300 ease-in-out" style={{ transitionDelay: '400ms' }}>
                RAG Assistant
              </p>
              <p className="mt-1 text-caption font-regular transition-opacity duration-300 ease-in-out" style={{ transitionDelay: '450ms' }}>
                AI-powered knowledge base
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}