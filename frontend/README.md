# Mapper Module Frontend

This is the frontend application for the Mapper Module. It provides a user interface for managing data mappings, including template downloads, file uploads, and data saving functionality.

## Features

1. Modern and responsive user interface built with Next.js
2. Material UI and Ant Design components for a polished look
3. Dark mode support
4. CSV file upload and download functionality
5. Draft saving capability
6. Form validation and error handling

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory with the following content:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Running the Application

1. Start the development server:
```bash
npm run dev
```

The application will start on `http://localhost:3000` by default.

## Project Structure

- `src/app/mapper_module/` - Mapper module components and logic
- `src/components/` - Reusable components
- `src/context/` - Context providers (e.g., ThemeContext)
- `src/styles/` - Global styles and CSS modules

## Usage

1. **Download Template**
   - Click the "Download Template" button to get a CSV template
   - Fill in the template with your mapping data

2. **Upload File**
   - Click "Upload File" to import your filled template
   - The form will be populated with the imported data

3. **Save/Save Draft**
   - Click "Save" to save your mapping with a generated Mapper ID
   - Click "Save Draft" to save a work in progress

4. **Add Rows**
   - Click the "+" button to add new mapping rows
   - Fill in the required fields

## Error Handling

The application includes comprehensive error handling:
- File upload validation
- Form field validation
- API error handling with user-friendly messages
- Network error handling
