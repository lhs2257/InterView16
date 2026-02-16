import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getMBTIGroup(mbtiType: string): 'SJ' | 'SP' | 'NF' | 'NT' {
    const second = mbtiType[1];
    const third = mbtiType[2];

    if (second === 'S' && third === 'J') return 'SJ';
    if (second === 'S' && third === 'P') return 'SP';
    if (second === 'N' && third === 'F') return 'NF';
    if (second === 'N' && third === 'T') return 'NT';

    return 'NT'; // default
}

export function getMBTIGroupColor(group: 'SJ' | 'SP' | 'NF' | 'NT'): string {
    const colors = {
        SJ: '#3B82F6', // 블루
        SP: '#F59E0B', // 옐로우
        NF: '#10B981', // 그린
        NT: '#8B5CF6', // 퍼플
    };
    return colors[group];
}
