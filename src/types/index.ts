// MBTI Persona Types
export type MBTIType =
    | 'ISTJ' | 'ISFJ' | 'INFJ' | 'INTJ'
    | 'ISTP' | 'ISFP' | 'INFP' | 'INTP'
    | 'ESTP' | 'ESFP' | 'ENFP' | 'ENTP'
    | 'ESTJ' | 'ESFJ' | 'ENFJ' | 'ENTJ';

export type MBTIGroup = 'SJ' | 'SP' | 'NF' | 'NT';

// Persona Interface
export interface MBTIPersona {
    id: string;
    mbtiType: MBTIType;
    group: MBTIGroup;
    name: string;
    role: string;
    description: string;
    systemPrompt: string;
    voiceId: string;
    difficulty: 1 | 2 | 3 | 4 | 5;
    keywords: string[];
    avatarUrl?: string;
}

// Resume Interfaces
export interface ParsedResume {
    id: string;
    userId: string;
    summary: string;
    techStacks: string[];
    experience: Experience[];
    projects: Project[];
    createdAt: string;
}

export interface Experience {
    company: string;
    role: string;
    period: string;
    achievements: string[];
}

export interface Project {
    title: string;
    description: string;
    keyTech: string[];
    contribution: string;
}

// Interview Session Interfaces
export interface InterviewSession {
    id: string;
    userId: string;
    personaId: string;
    resumeId: string;
    status: 'ongoing' | 'completed';
    messages: InterviewMessage[];
    startedAt: string;
    completedAt?: string;
}

export interface InterviewMessage {
    id: string;
    role: 'interviewer' | 'candidate';
    content: string;
    audioUrl?: string;
    timestamp: string;
}

// Feedback Report Interfaces
export interface FeedbackReport {
    id: string;
    sessionId: string;
    overallScore: number;
    competencyScores: CompetencyScores;
    mbtiComment: string;
    refinedAnswers: RefinedAnswer[];
    recommendations: string[];
    createdAt: string;
}

export interface CompetencyScores {
    jobFit: number;        // 직무 적합성
    logic: number;         // 논리력
    confidence: number;    // 자신감
    attitude: number;      // 태도
    problemSolving: number; // 문제 해결 능력
}

export interface RefinedAnswer {
    questionId: string;
    originalAnswer: string;
    refinedAnswer: string;
    feedbackTags: string[];
    improvements: string[];
}
