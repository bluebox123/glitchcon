# Blog Platform Client

This is the frontend React application for the blog platform. It provides a modern, responsive interface for users to read, create, and interact with blog posts.

## Features

- User authentication (login/register)
- Create and edit blog posts
- View post details with comments
- Like posts
- User profiles
- Responsive design with Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Backend server running on `http://localhost:5000`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── context/       # React context providers
  ├── pages/         # Page components
  ├── App.js         # Main application component
  ├── index.js       # Application entry point
  └── index.css      # Global styles
```

## Available Scripts

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects from Create React App

## Technologies Used

- React
- React Router
- Axios
- Tailwind CSS
- Create React App

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 