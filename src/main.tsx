import React from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';

import '@/lib/axios/config';
import '@/lib/dayjs/config';
import theme from '@/theme';

import App from './App.tsx';
import { Viewport } from './components/Viewport/index.tsx';
import './index.css';
import "froala-editor/js/froala_editor.pkgd.min.js"; // Load Froala scripts
import "froala-editor/css/froala_editor.pkgd.min.css"; // Core Froala styles
import "froala-editor/css/froala_style.min.css"; // Froala content styling
import "froala-editor/css/plugins/code_view.min.css"; // Code view plugin
import "froala-editor/css/plugins/image.min.css"; // Image plugin
import 'react-phone-number-input/style.css';

import { AuthProvider } from './services/auth/AuthContext.tsx';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChakraProvider theme={{ ...theme }}>
          <Viewport>
            <App />
          </Viewport>
        </ChakraProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
