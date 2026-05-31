import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { GlobalStyles } from './styles';

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <GlobalStyles />
    <App />
  </StrictMode>,
);
