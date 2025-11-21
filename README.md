# 🍿 ChewTube

ChewTube is a Next.js web application that uses face detection to control video playback based on chewing detection. Video only plays while the app detects you're eating!

## Features

- **Real-time Face Detection**: Uses MediaPipe Face Mesh for accurate mouth movement tracking
- **YouTube Video Support**: 
  - Direct YouTube URL input
  - Pre-selected safe YouTube videos for quick access
- **Adjustable Settings**:
  - Mouth sensitivity control
  - Playback duration per bite
  - Pause speed settings
- **Visual Feedback**: Live camera feed with optional face mesh overlay
- **Modern UI**: Built with Next.js, React, TypeScript, and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Face Detection**: MediaPipe Face Mesh
- **Icons**: Lucide React
- **Video Player**: YouTube IFrame API

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A webcam
- Modern web browser (Chrome, Firefox, Edge, Safari)

## Installation

1. Clone or download this repository

2. Install dependencies:

```bash
npm install
# or
yarn install
```

## Running the Application

### Development Mode (recommended)

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## Usage

1. **Grant Camera Permissions**: When prompted, allow the browser to access your webcam
2. **Paste a YouTube URL**: Enter any YouTube video URL in the input field
3. **Click "Start"** to begin monitoring
4. **Start Eating!** Take a bite to fill the fuel tank and play the video
5. **Adjust Settings**: Fine-tune sensitivity and playback duration in the Parent Settings panel
6. **Quick Picks**: Choose from pre-selected safe videos if you need something fast

## How It Works

1. The app uses MediaPipe Face Mesh to detect facial landmarks in real-time
2. It monitors the distance between upper and lower lips
3. When mouth opening is detected (chewing), it adds "fuel" to the tank
4. Video plays while there's fuel in the tank
5. Fuel depletes over time, pausing the video when empty

## Configuration

The app includes adjustable parameters:

- **Mouth Sensitivity** (1-10): How sensitive the app is to mouth movements
- **Playback Duration** (10-100): How much fuel each bite adds
- **Pause Speed** (0.5x-5x): How quickly fuel depletes

## Project Structure

```
chewtube/
├── app/
│   ├── page.tsx          # Main ChewTube component
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── types/
│   └── mediapipe.d.ts    # TypeScript definitions for MediaPipe
├── next.config.js        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## Development

The app uses Next.js 14 with the App Router. Key features:

- **Client-side rendering** for camera and face detection
- **Next.js Script component** for optimal external script loading
- **TypeScript** for type safety
- **Tailwind CSS** for styling

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari (may have limitations with some YouTube videos)

## Troubleshooting

**Camera not working?**
- Make sure you've granted camera permissions
- Check if another application is using the camera
- Try refreshing the page

**YouTube video won't play?**
- Some videos have embedding restrictions
- Try a different video or use one of the pre-selected Quick Picks
- Check the browser console for specific error messages

**Face detection not working?**
- Ensure good lighting
- Position your face clearly in front of the camera
- Adjust the "Mouth Sensitivity" setting

**Scripts not loading?**
- Check your internet connection (MediaPipe libraries load from CDN)
- Try clearing your browser cache
- Check browser console for errors

## Deployment

### Vercel (Recommended)

The easiest way to deploy is using [Vercel](https://vercel.com):

```bash
npm install -g vercel
vercel
```

### Other Platforms

You can deploy to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render
- Self-hosted with Docker

## License

MIT

## Credits

Built with ❤️ for encouraging mindful eating habits!
# chewtube
