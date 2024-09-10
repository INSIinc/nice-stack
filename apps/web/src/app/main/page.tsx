import { useAuth } from "@web/src/providers/auth-provider"

export default function MainPage() {
    const { user } = useAuth()
    return <>hello,{user?.username}</>
}
