# Photo Collage Maker

A modern web application for creating beautiful photo collages with customizable layouts and settings. Built with Next.js, TypeScript, and TailwindCSS.

## Features

- **Drag & Drop Upload**: Support for JPEG, PNG, GIF, BMP, TIFF, and WebP images
- **File Validation**: Automatic validation of file types, sizes, and counts
- **Customizable Layouts**: Choose from masonry, grid, random, and spiral layouts
- **Flexible Configuration**: Adjust dimensions, DPI, spacing, background color, and more
- **Real-time Progress**: Live status updates during collage processing
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS with shadcn/ui components
- **State Management**: React Query for API state
- **Forms**: React Hook Form with Zod validation
- **Color Picker**: react-colorful
- **Icons**: Lucide React
- **Backend Integration**: REST API with automatic error handling

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm package manager
- Backend API server running on `http://localhost:8000`

### Installation

1. Clone the repository:

```bash
git clone https://github.com/kLaz3r/college-maker-frontend.git
cd college-maker-frontend
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## API Integration

The frontend communicates with a FastAPI backend that handles image processing. The API endpoints include:

- `POST /api/collage/create` - Create a new collage job
- `GET /api/collage/status/{job_id}` - Get job status and progress
- `GET /api/collage/download/{job_id}` - Download completed collage
- `GET /api/collage/jobs` - List all jobs
- `DELETE /api/collage/cleanup/{job_id}` - Clean up job files

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── collage-maker.tsx # Main application component
│   ├── file-upload.tsx   # File upload with drag & drop
│   ├── configuration-panel.tsx # Collage settings form
│   └── job-status.tsx    # Job progress and download
├── lib/                  # Utility functions and configurations
│   ├── api.ts           # API client
│   ├── query-client.ts  # React Query configuration
│   └── types.ts         # TypeScript type definitions
└── styles/
    └── globals.css      # Global styles
```

## Usage

1. **Upload Images**: Drag and drop or click to select 2-100 images
2. **Configure Settings**: Adjust layout, dimensions, DPI, spacing, and colors
3. **Create Collage**: Submit the job and monitor progress
4. **Download**: Save your completed collage when processing is finished

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking

### Code Quality

The project includes:

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Husky for git hooks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
