import { useRef } from 'react';

import {
  RouterProvider,
  RouterProviderProps,
  createBrowserRouter,
} from 'react-router-dom';

import { LoaderFull } from './components/LoaderFull';
import { routes } from './routes';

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
      <RouterProvider router={routerRef.current} />
    </>
  );
}

export default App;
