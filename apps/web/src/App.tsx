import './App.css'
import {
  RouterProvider,
} from "react-router-dom";
import QueryProvider from './providers/query-provider'
import { router } from './routes';
import { AuthProvider } from './providers/auth-provider';
import ThemeProvider from './providers/theme-provider';
function App() {

  return (
    <AuthProvider>
      <QueryProvider>
        <ThemeProvider>
          <RouterProvider router={router}></RouterProvider>
        </ThemeProvider>
      </QueryProvider>
    </AuthProvider>
  )
}

export default App
