# Business Chat Widget

A customizable chat widget that can be easily integrated into any website. The widget provides auto-reply, advanced reply, AI-powered responses, and live chat capabilities.

## Features

- **Widget Settings**: Customize the widget appearance, business name, and welcome message
- **Auto Reply**: Set up automatic responses based on keywords
- **Advanced Reply**: Create responses with HTML formatting or URLs
- **AI Mode**: Use AI to generate responses based on your business context
- **Live Chat**: Chat with visitors in real-time

## Installation

1. Add the following script to your HTML page, just before the closing `</body>` tag:

```html
<script src="https://widget-chat-app.netlify.app/chat.js"></script>
<script>
  new BusinessChatPlugin({
    uid: 'YOUR_USER_ID'
  });
</script>
```

Replace `YOUR_USER_ID` with your user ID from the dashboard.

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and add your Supabase credentials
4. Run the development server:
   ```
   npm run dev
   ```

### Building for Production

```
npm run build
```

## Database Schema

The application uses Supabase with the following tables:

- `widget_settings`: Stores widget configuration
- `auto_replies`: Stores auto reply configurations
- `advanced_replies`: Stores advanced reply configurations
- `ai_settings`: Stores AI mode settings
- `chat_sessions`: Stores chat sessions between users and visitors
- `chat_messages`: Stores messages within chat sessions

## License

MIT