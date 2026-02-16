import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "InterView16 - AI 면접 준비 서비스",
    description: "16가지 MBTI 성향의 AI 면접관과 함께하는 실전 면접 연습",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko" className="dark">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
