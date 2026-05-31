import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { GlobalStyles } from './styles';
import { App } from './App';

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <GlobalStyles />
    <App />
  </StrictMode>,
);
