# Konva Panel Designer

A simple Next.js application for designing electronic panels using Konva.js for 2D visualization.

## Features

- **Component Library**: Browse and select from a variety of electronic components (switches, fuses, relays, terminals, breakers, meters)
- **Click-to-Add**: Select a component from the library and click on the panel to place it
- **Panel Properties**: Edit panel dimensions (width, height, depth) and name
- **Component Management**: Select, view, and delete components on the panel
- **Save/Load**: Save your designs to localStorage and load them later
- **Export/Import**: Export designs as JSON files and import them back

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Set Panel Dimensions**: Use the right sidebar to set your panel width, height, and depth
2. **Select Component**: Click on a component in the left sidebar to select it
3. **Place Component**: Click anywhere on the panel canvas to place the selected component
4. **Select Component**: Click on a placed component to select it and view its properties
5. **Delete Component**: Select a component and press Delete/Backspace, or use the delete button in the properties panel
6. **Save Design**: Enter a name and click "Save" to save your design to localStorage
7. **Load Design**: Click "Load" next to a saved design to restore it
8. **Export/Import**: Use the Export button to download your design as JSON, or Import to load a JSON file

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page
│   └── globals.css         # Global styles
├── components/
│   ├── PanelCanvas.tsx     # Konva.js canvas component
│   ├── ComponentLibrary.tsx # Component sidebar
│   ├── PanelProperties.tsx # Properties sidebar
│   └── ComponentCard.tsx   # Component card in library
├── lib/
│   ├── store.ts            # Zustand state management
│   └── storage.ts          # localStorage save/load
├── types/
│   └── index.ts            # TypeScript type definitions
└── data/
    └── components.ts        # Default component library
```

## Technology Stack

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **Konva.js** - 2D canvas library
- **react-konva** - React bindings for Konva
- **Zustand** - State management
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## Component Categories

- **Switches**: Various amperage ratings (16A, 32A, 63A)
- **Protection**: Fuses and circuit breakers (MCB, MCCB, ACB)
- **Control**: Relays for control circuits
- **Connection**: Terminal blocks
- **Monitoring**: Voltage/current meters and LED indicators

## Building for Production

```bash
npm run build
npm start
```

## License

MIT

