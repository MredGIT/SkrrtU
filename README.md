# SkrrtU - College Social Network

A modern, interactive social web app for college students to connect, chat, and hang out.

## Features
- 🎴 Tinder-style swipe matching
- 💬 Real-time messaging
- 🗺️ Live campus map
- 🤫 Anonymous confessions
- 🎉 Campus events/hangouts

## Tech Stack
- React + Vite
- TailwindCSS + Framer Motion
- Appwrite (Backend)
- Leaflet (Maps)

## Local Development

1. Clone the repo
```bash
git clone <your-repo-url>
cd SKRRTANU
```

2. Install dependencies
```bash
npm install
```

3. Create `.env` file with your Appwrite credentials

4. Run dev server
```bash
npm run dev
```

5. Open http://localhost:3000

## Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Netlify
```bash
netlify deploy --prod
```

## Environment Variables

Required:
- `VITE_APPWRITE_ENDPOINT`
- `VITE_APPWRITE_PROJECT_ID`
- `VITE_APPWRITE_DATABASE_ID`
- All collection IDs
- `VITE_APPWRITE_STORAGE_BUCKET_ID`

## Contributing

This is a student project. Feel free to fork and customize!

## License

MIT
