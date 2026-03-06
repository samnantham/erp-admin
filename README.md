# React + TypeScript + Vite Project

This project is a minimal setup for a React application using TypeScript and Vite. It includes Hot Module Replacement (HMR) for a seamless development experience and ESLint for code quality.

## Features

- React for building user interfaces
- TypeScript for type-safe code
- Vite for fast development and bundling
- ESLint with custom rules for code quality

## Prerequisites

Before you begin, ensure you have installed:

- [Node.js](https://nodejs.org/) (version 12.x or higher)
- [pnpm](https://pnpm.io/) (Follow the installation guide on the pnpm website)

## Installation

To set up the project locally, follow these steps:

1. Clone the repository:

```bash
git clone https://github.com/NUMERIQUE-360-ORG/aviation-erp.git
```

2. Navigate to the project directory:

```bash
cd aviation-erp
```

3. Install the dependencies:

```bash
pnpm install
```

## Usage

To start the development server, run:

```bash
pnpm run dev
```

This command will start the Vite development server at http://localhost:5173. You can view your application in the browser at this URL.

To build the project for production, run:

```bash
pnpm run build
```

This command will generate a dist folder containing optimized files ready to be deployed to a production server.

ESLint is configured to run automatically when you start the development server or build the project. It will display any linting errors or warnings in the console.
