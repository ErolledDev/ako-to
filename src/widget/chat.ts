import { createRoot } from 'react-dom/client';
import React from 'react';
import ChatWidget from './ChatWidget';
import { v4 as uuidv4 } from 'uuid';

interface BusinessChatPluginOptions {
  uid: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

class BusinessChatPlugin {
  private options: BusinessChatPluginOptions;
  private container: HTMLElement | null = null;
  private visitorId: string;

  constructor(options: BusinessChatPluginOptions) {
    this.options = {
      position: 'bottom-right',
      ...options
    };
    
    // Generate or retrieve visitor ID
    this.visitorId = this.getOrCreateVisitorId();
    
    // Initialize the widget
    this.init();
  }

  private getOrCreateVisitorId(): string {
    const storageKey = 'business_chat_visitor_id';
    let visitorId = localStorage.getItem(storageKey);
    
    if (!visitorId) {
      visitorId = uuidv4();
      localStorage.setItem(storageKey, visitorId);
    }
    
    return visitorId;
  }

  private init(): void {
    // Create container element
    this.container = document.createElement('div');
    this.container.id = 'business-chat-widget-container';
    document.body.appendChild(this.container);
    
    // Render the widget
    const root = createRoot(this.container);
    root.render(
      React.createElement(ChatWidget, {
        userId: this.options.uid,
        visitorId: this.visitorId,
        position: this.options.position
      })
    );
  }
}

// Make it available globally
(window as any).BusinessChatPlugin = BusinessChatPlugin;

export default BusinessChatPlugin;