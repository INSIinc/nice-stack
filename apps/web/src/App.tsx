import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-alpine.css'; // Optional theme CSS
import "./App.css";
import { RouterProvider } from "react-router-dom";
import QueryProvider from "./providers/query-provider";
import { router } from "./routes";
import ThemeProvider from "./providers/theme-provider";
import { App as AntdApp, ConfigProvider, theme } from "antd";
import locale from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { AuthProvider } from './providers/auth-provider';

dayjs.locale("zh-cn");
function App() {

  return (
    <AuthProvider>
      <QueryProvider>
        <ConfigProvider
          locale={locale}
          theme={{
            algorithm: theme.defaultAlgorithm,
            token: {
              colorPrimary: "#2e75b6",
            },
            components: {},
          }}>
          <ThemeProvider>
            <AntdApp>
              <RouterProvider router={router}></RouterProvider>
            </AntdApp>
          </ThemeProvider>
        </ConfigProvider>
      </QueryProvider>
    </AuthProvider>
  );
}

export default App;
