import './App.css'
import {
  RouterProvider,
} from "react-router-dom";
import QueryProvider from './providers/query-provider'
import { router } from './routes';
import { AuthProvider } from './providers/auth-provider';
function App() {

  return (
    <AuthProvider>
      <QueryProvider>
        <RouterProvider router={router}></RouterProvider>
      </QueryProvider>
    </AuthProvider>
  )
}

export default App
