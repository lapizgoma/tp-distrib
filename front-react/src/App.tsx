import { AppRouter } from './AppRouter';
import { Toaster } from '@/components/ui/sonner';

export function App() {
  return (
    <>
      <AppRouter />
      <Toaster theme="light" position="top-right" richColors />
    </>
  );
}

export default App;
