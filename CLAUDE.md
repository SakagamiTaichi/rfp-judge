# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `rfp-judge`, a React + TypeScript application built with Vite that integrates with Dify AI workflows. The application provides a file upload interface for documents (images and PDFs) and executes AI-powered RFP (Request for Proposal) evaluation workflows through the Dify platform.

## Development Commands

- `npm run dev` - Start development server with hot module replacement
- `npm run build` - Build for production (runs TypeScript compilation then Vite build)
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview production build locally

## Architecture

### Tech Stack
- **Frontend**: React 19 with TypeScript
- **UI Framework**: Material-UI (MUI) v7 with Emotion styling
- **Build Tool**: Vite with SWC plugin for fast compilation
- **Linting**: ESLint with TypeScript, React Hooks, and React Refresh plugins

### Application Flow
1. Users configure two API keys: one for Dify file upload, one for workflow execution
2. Files are uploaded to Dify's file storage via `/v1/files/upload` endpoint
3. Uploaded files can trigger workflow execution via `/v1/workflows/run` endpoint
4. Results display detailed RFP compliance assessments with ratings (○/△/×)

### Key Components
- `DifyFileUploadDemo.tsx` - Main demo container with API key configuration and file management
- `DifyFileUpload.tsx` - Drag-and-drop file upload component with validation
- `DifyResultDisplay.tsx` - Rich display component for workflow execution results
- Supports file formats: PNG, JPG, JPEG, WebP, GIF, PDF

### Project Structure
- `src/components/` - React components for Dify integration
- `src/App.tsx` - Main application with MUI theme setup
- `src/main.tsx` - Application entry point with React StrictMode

### Key Configuration
- Uses Vite with React SWC plugin for fast compilation
- ESLint configured with TypeScript, React Hooks, and React Refresh rules
- TypeScript strict mode with project references for better build performance
- MUI theme customization with Japanese font support