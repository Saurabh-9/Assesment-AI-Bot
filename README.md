# Real-Time Audio-Video Conversation System

A comprehensive real-time conversation system powered by Gemini Live API with support for multiple languages, voice switching, and session management.

## Features

### 🎯 Core Features

- **Real-time Audio Processing**: Stream microphone input to backend via WebSockets
- **Multi-language Support**: English, Hindi, and Hinglish with real-time translation
- **Voice Switching**: Toggle between male and female voices dynamically
- **Session Management**: Create, join, and manage conversation sessions
- **Live Subtitles**: Real-time caption display with language switching
- **Session Recording**: Record conversations with captions and audio
- **Conversation History**: View and search through past interactions

### 🚀 Technical Features

- **Server-to-Server Architecture**: Secure backend communication with Gemini API
- **WebSocket Streaming**: Low-latency real-time communication
- **Redis Caching**: Session persistence and data caching
- **Audio Processing**: Real-time audio transcription and analysis
- **Responsive UI**: Modern, mobile-friendly interface
- **Error Handling**: Comprehensive error handling and reconnection strategies

## Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐    HTTP API    ┌─────────────────┐
│   React Frontend │ ◄─────────────► │  Node.js Server │ ◄─────────────► │  Gemini Live API │
│                 │                 │                 │                 │                 │
│ • Audio Capture │                 │ • Session Mgmt  │                 │ • AI Responses  │
│ • UI Components │                 │ • WebSocket Hub │                 │ • Translation   │
│ • Real-time UI  │                 │ • Audio Process │                 │ • Voice Gen     │
└─────────────────┘                 └─────────────────┘                 └─────────────────┘
                                              │
                                              │ Redis
                                              ▼
                                    ┌─────────────────┐
                                    │   Redis Cache   │
                                    │                 │
                                    │ • Sessions      │
                                    │ • History       │
                                    │ • Translations  │
                                    │ • Voice Cache   │
                                    └─────────────────┘
```

## Prerequisites

- Node.js 18+
- Redis Server
- Gemini API Key
- Modern web browser with microphone access

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd real-time-conversation-system
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

### 3. Environment Setup

#### Backend Environment

Create `server/.env` file:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Gemini Live API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Session Configuration
SESSION_SECRET=your_session_secret_here
SESSION_TIMEOUT=3600000

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Audio Configuration
AUDIO_SAMPLE_RATE=16000
AUDIO_CHANNELS=1
AUDIO_BITRATE=16

# Supported Languages
SUPPORTED_LANGUAGES=en,hi,hinglish
DEFAULT_LANGUAGE=en

# Voice Configuration
DEFAULT_VOICE=male
SUPPORTED_VOICES=male,female
```

#### Frontend Environment

Create `client/.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 4. Start Redis Server

```bash
# macOS (using Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Windows
# Download and install Redis from https://redis.io/download
```

### 5. Start the Application

#### Development Mode

```bash
# Start both backend and frontend
npm run dev

# Or start separately:
# Backend
npm run server

# Frontend
npm run client
```

#### Production Mode

```bash
# Build frontend
npm run build

# Start production server
npm start
```

## Usage

### 1. Access the Application

Open your browser and navigate to `http://localhost:3000`

### 2. Create or Join a Session

- **Create Session**: Start a new conversation with your preferred language and voice settings
- **Join Session**: Enter a session ID to join an existing conversation

### 3. Start Speaking

- Click the microphone button to start recording
- Speak naturally - your voice will be transcribed in real-time
- The AI will respond with text and optional voice output

### 4. Manage Settings

- **Language**: Switch between English, Hindi, and Hinglish
- **Voice**: Toggle between male and female AI voices
- **Subtitles**: Enable/disable real-time captions
- **Voice Responses**: Enable/disable AI voice output

### 5. Session Features

- **Recording**: Start/stop session recording
- **History**: View conversation history with search functionality
- **Export**: Download conversation data as JSON

## API Endpoints

### Sessions

- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `GET /api/sessions/:id/history` - Get session history
- `GET /api/sessions/:id/stats` - Get session statistics

### Recordings

- `POST /api/sessions/:id/recording/start` - Start recording
- `POST /api/sessions/:id/recording/stop` - Stop recording
- `GET /api/recording/:id` - Get recording data

### Conversations

- `GET /api/conversations/:id/history` - Get conversation history
- `GET /api/conversations/:id/analytics` - Get conversation analytics
- `GET /api/conversations/:id/export` - Export conversation
- `GET /api/conversations/:id/search` - Search conversation
- `GET /api/conversations/:id/summary` - Get conversation summary

## WebSocket Events

### Client to Server

- `join-session` - Join a conversation session
- `audio-stream` - Send audio data for processing
- `change-language` - Change conversation language
- `change-voice` - Change AI voice type
- `start-recording` - Start session recording
- `stop-recording` - Stop session recording

### Server to Client

- `session-joined` - Confirmation of session join
- `ai-response` - AI response with text and audio
- `language-changed` - Confirmation of language change
- `voice-changed` - Confirmation of voice change
- `recording-started` - Confirmation of recording start
- `recording-stopped` - Recording data and confirmation
- `error` - Error messages

## Configuration

### Backend Configuration

- **Audio Settings**: Configure sample rate, channels, and bitrate
- **Rate Limiting**: Adjust request limits and time windows
- **Session Timeout**: Set session expiration time
- **Supported Languages**: Add or remove language support

### Frontend Configuration

- **API URL**: Configure backend API endpoint
- **WebSocket URL**: Configure WebSocket connection
- **Audio Settings**: Configure microphone settings

## Development

### Project Structure

```
├── server/                 # Backend server
│   ├── services/          # Business logic services
│   ├── routes/            # API route handlers
│   ├── index.js           # Main server file
│   └── package.json       # Backend dependencies
├── client/                # Frontend application
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   └── package.json      # Frontend dependencies
└── package.json          # Root package.json
```

### Adding New Features

1. **Backend**: Add new services in `server/services/`
2. **API Routes**: Create new routes in `server/routes/`
3. **Frontend**: Add new components in `client/components/`
4. **Hooks**: Create custom hooks in `client/hooks/`

### Testing

```bash
# Backend tests
cd server && npm test

# Frontend tests
cd client && npm test

# E2E tests
npm run test:e2e
```

## Deployment

### Backend Deployment

1. Set environment variables for production
2. Configure Redis connection
3. Set up SSL certificates
4. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment

1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or your preferred platform
3. Configure environment variables

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **Microphone Access Denied**

   - Ensure browser has microphone permissions
   - Check HTTPS requirement for microphone access

2. **WebSocket Connection Failed**

   - Verify backend server is running
   - Check firewall settings
   - Ensure correct WebSocket URL

3. **Redis Connection Error**

   - Verify Redis server is running
   - Check Redis connection settings
   - Ensure Redis port is accessible

4. **Gemini API Errors**
   - Verify API key is valid
   - Check API quota limits
   - Ensure correct API endpoint

### Performance Optimization

1. **Audio Processing**

   - Adjust audio quality settings
   - Optimize WebSocket message size
   - Implement audio compression

2. **Caching Strategy**

   - Configure Redis TTL settings
   - Implement cache warming
   - Monitor cache hit rates

3. **UI Performance**
   - Optimize React component rendering
   - Implement virtual scrolling for history
   - Use React.memo for expensive components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

## Roadmap

- [ ] Video support
- [ ] Group conversations
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Integration with other AI providers
- [ ] Advanced voice customization
- [ ] Real-time collaboration features
