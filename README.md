# pinplace - Collaborative Mapping Application

A web application that allows users to create and share collaborative maps where others can add location pins in real-time.

## Features

- **Create Maps**: Users can create multiple maps with custom names
- **Share Links**: Generate shareable links for anonymous pin additions
- **Real-time Updates**: Pins update in real-time using Firebase Firestore
- **Auto-lock**: Set expiration times or manually lock maps
- **Export**: Download pins as CSV or KML files
- **Authentication**: Email/password authentication for map owners

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Maps**: Leaflet + React-Leaflet
- **Backend**: Firebase (Firestore, Auth, Hosting)
- **Routing**: React Router

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- Firebase account
- Git

### 1. Clone and Install

```bash
git clone <repository-url>
cd pinplace
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create a Firestore database
5. Enable Firebase Hosting

### 3. Environment Configuration

1. Copy `env.example` to `.env`:
```bash
cp env.example .env
```

2. Update `.env` with your Firebase configuration:
```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 5. Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 6. Build and Deploy

```bash
npm run build
firebase deploy --only hosting
```

## Project Structure

```
src/
├── components/
│   ├── auth/          # Authentication components
│   ├── map/           # Map-related components
│   ├── ui/            # Reusable UI components
│   └── layout/        # Layout components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── context/            # React context providers
└── types/              # TypeScript type definitions
```

## Usage

1. **Sign Up/Login**: Create an account or sign in
2. **Create Map**: Click "Create New Map" and configure settings
3. **Share**: Generate a share link for others to add pins
4. **Manage**: View, lock/unlock, or delete maps from dashboard
5. **Export**: Download pin data as CSV or KML files

## Data Model

### Maps Collection
- `name`: Map name
- `ownerId`: User ID of map owner
- `createdAt`: Creation timestamp
- `editableUntil`: Expiration timestamp (optional)
- `lockType`: 'manual' | 'duration' | 'datetime'
- `isLocked`: Boolean lock status

### Pins Subcollection
- `lat`: Latitude coordinate
- `lng`: Longitude coordinate
- `name`: Pin name
- `description`: Optional description
- `createdAt`: Creation timestamp

### Share Links Subcollection
- `token`: Unique share token
- `createdAt`: Creation timestamp
- `expiresAt`: Expiration timestamp (optional)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License