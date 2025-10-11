"use client"
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IMAGES } from "../../public/assets";

export default function Home() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex flex-col justify-center items-center">
            <Image src={IMAGES.krown} width={100} height={100} alt="krown" />
            <h1 className="font-bebas text-5xl">Krown Admin</h1>
            <Button
                className="m-2 font-bebas text-lg cursor-pointer"
                onClick={() => router.push("/admin/login")}
            >
                LOGIN
            </Button>
        </div>
    );
}
