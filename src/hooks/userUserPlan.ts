
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export const useUserPlans = () =>
    useQuery({
        queryKey: ["user-plans"],
        queryFn: async () => {
            const res = await api.get("/subscriptions/user");
            return res.data.subscriptions;
        },
    });
