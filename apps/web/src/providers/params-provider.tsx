import { useEffect, useState, createContext, useContext } from "react";
import { z } from "zod"; // 引入Zod Schema库

// 定义Zod Schema
const ParamsSchema = z.object({
  test: z.string()
  // ...其他验证规则
});
type ParamsType = z.infer<typeof ParamsSchema>;
// 创建Context
const ParamsContext = createContext<ParamsType | undefined>(undefined);
// Provider组件
export function ParamsProvider({ children }: { children: React.ReactNode }) {
  const [params, setParams] = useState<ParamsType | undefined>(undefined);

  useEffect(() => {
    const loadParams = async () => {
      const response = await fetch(`/params.json`);
      const data = await response.text();
      const parsedData = JSON.parse(data);
      const validData = ParamsSchema.parse(parsedData); // 使用Zod验证数据
      setParams(validData);
    };
    loadParams();
  }, []);

  if (!params) {
    return (
      <>数据加载中</>
    );
  }

  return (
    <ParamsContext.Provider value={params}>{children}</ParamsContext.Provider>
  );
}

// useParams自定义钩子，用于获取Context值
export const useAppParams = () => {
  const params = useContext(ParamsContext);
  if (!params) {
    throw new Error("useParams must be used within a ParamsProvider");
  }
  return params;
};
