import { useRef } from 'react';

import {
  RouterProvider,
  RouterProviderProps,
  createBrowserRouter,
} from 'react-router-dom';

import { LoaderFull } from './components/LoaderFull';
import { routes } from './routes';
import { PDFPreviewProvider } from "@/context/PDFPreviewContext";

function App() {
  const routerRef = useRef<RouterProviderProps['router']>();

  if (!routerRef.current) {
    routerRef.current = createBrowserRouter(routes, {
      basename: '/',
      future: {
        v7_normalizeFormMethod: true,
      },
    });
  }

  if (!routerRef.current) return <LoaderFull />;

  return (
    <>
      <PDFPreviewProvider>
        <RouterProvider router={routerRef.current} />
      </PDFPreviewProvider>
    </>
  );
}

export default App;
