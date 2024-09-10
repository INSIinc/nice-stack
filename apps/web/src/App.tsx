import './App.css'
import {
  RouterProvider,
} from "react-router-dom";
import QueryProvider from './providers/query-provider'
import { router } from './routes';
import { AuthProvider } from './providers/auth-provider';
import ThemeProvider from './providers/theme-provider';
import { App as AntdApp } from 'antd';
function App() {

  return (
    <AuthProvider>
      <QueryProvider>
        <ThemeProvider>
          <AntdApp>
            <RouterProvider router={router}></RouterProvider>
          </AntdApp>
        </ThemeProvider>
      </QueryProvider>
    </AuthProvider>
  )
}

export default App
