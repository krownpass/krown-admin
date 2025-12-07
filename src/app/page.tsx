"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { IMAGES } from "../../public/assets";
import { getToken } from "@/lib/auth";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        const token = getToken();

        if (!token) {
            router.replace("/admin/login");
        } else {
            router.replace("/admin/dashboard/");
        }
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col justify-center items-center">
            <Image src={IMAGES.krown} width={100} height={100} alt="krown" />
            <h1 className="font-bebas text-5xl">Krown Admin</h1>

            <p className="mt-4 text-gray-500 font-bebas text-lg">
                Redirecting…
            </p>
        </div>
    );
}
