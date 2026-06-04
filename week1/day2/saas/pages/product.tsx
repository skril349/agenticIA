"use client"

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { useAuth, PricingTable, UserButton } from '@clerk/nextjs';
import { fetchEventSource } from '@microsoft/fetch-event-source';

function IdeaGenerator() {
    const { getToken } = useAuth();
    const [idea, setIdea] = useState<string>('…loading');

    useEffect(() => {
        const controller = new AbortController();
        let buffer = '';
        (async () => {
            const jwt = await getToken();
            if (!jwt) {
                setIdea('Authentication required');
                return;
            }

            await fetchEventSource('/api', {
                headers: { Authorization: `Bearer ${jwt}` },
                signal: controller.signal,
                onmessage(ev) {
                    buffer += ev.data;
                    setIdea(buffer);
                },
                onerror(err) {
                    console.error('SSE error:', err);
                    throw err;
                }
            });
        })();
        return () => controller.abort();
    }, [getToken]);

    return (
        <div className="container mx-auto px-4 py-12">
            <header className="text-center mb-12">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                    Business Idea Generator
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                    AI-powered innovation at your fingertips
                </p>
            </header>

            <div className="max-w-3xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 backdrop-blur-lg bg-opacity-95">
                    {idea === '…loading' ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-pulse text-gray-400">
                                Generating your business idea...
                            </div>
                        </div>
                    ) : (
                        <div className="markdown-content text-gray-700 dark:text-gray-300">
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                {idea}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Product() {
    const { isLoaded, has } = useAuth();

    if (!isLoaded) return null;

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <div className="absolute top-4 right-4">
                <UserButton />
            </div>

            {has({ plan: 'premium_subscription' }) ? (
                <IdeaGenerator />
            ) : (
                <div className="container mx-auto px-4 py-12">
                    <header className="text-center mb-12">
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                            Choose Your Plan
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
                            Unlock unlimited AI-powered business ideas
                        </p>
                    </header>
                    <div className="max-w-4xl mx-auto">
                        <PricingTable />
                    </div>
                </div>
            )}
        </main>
    );
}
