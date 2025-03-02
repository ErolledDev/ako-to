import { createRoot } from 'react-dom/client';
import ChatWidget from './ChatWidget';
import { v4 as uuidv4 } from 'uuid';

interface BusinessChatPluginOptions {
  uid: string;
}

class BusinessChatPlugin {
  private options: BusinessChatPluginOptions;
  private container: HTMLElement | null = null;
  private visitorId: string;

  constructor(options: BusinessChatPluginOptions) {
    this.options = options;
    
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
      ChatWidget({
        userId: this.options.uid,
        visitorId: this.visitorId
      })
    );
  }
}

// Make it available globally
(window as any).BusinessChatPlugin = BusinessChatPlugin;

export default BusinessChatPlugin;