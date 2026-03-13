import './App.css';
import AllRouter from './component/AllRouter';
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <AllRouter></AllRouter>
    </>
  );
}

export default App;
