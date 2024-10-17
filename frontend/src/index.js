/** Entry point of the application */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles'; // Import MUI's ThemeProvider and createTheme for applying a theme
import CssBaseline from '@mui/material/CssBaseline'; // CssBaseline for consistent baseline styles across browsers
import App from './App';
import theme from './styles/theme';
import reportWebVitals from './reportWebVitals';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(
	<React.StrictMode>
		{/* Wrap the app in ThemeProvider and pass the theme for consistent styling */}
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<App />
		</ThemeProvider>
	</React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
