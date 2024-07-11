import './App.css'
import {
  RouterProvider,
} from "react-router-dom";
import QueryProvider from './providers/query-provider'
import { router } from './routes';
function App() {

  return (
    <QueryProvider>
      <RouterProvider router={router}></RouterProvider>
    </QueryProvider>
  )
}

export default App
