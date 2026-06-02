"use client"

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

const loadingText = 'Generando tu idea de negocio...';

export default function Home() {
    const [idea, setIdea] = useState<string>('');
    const [isStreaming, setIsStreaming] = useState(true);

    useEffect(() => {
        const evt = new EventSource('/api');

        evt.onmessage = (e) => {
            setIdea((current) => current + JSON.parse(e.data));
        };

        evt.onerror = () => {
            setIsStreaming(false);
            evt.close();
        };

        return () => {
            evt.close();
        };
    }, []);

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
                <header className="mb-8 text-center">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                        AI Business Lab
                    </p>
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                        Generador de Ideas de Negocio
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
                        Una propuesta estructurada, generada en directo y lista para convertirla en producto.
                    </p>
                </header>

                <section className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-cyan-950/40">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                        <div>
                            <h2 className="font-semibold text-slate-950">Resultado</h2>
                            <p className="text-sm text-slate-500">
                                {isStreaming ? 'Escribiendo en streaming...' : 'Generacion finalizada'}
                            </p>
                        </div>
                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                            {isStreaming ? 'LIVE' : 'DONE'}
                        </span>
                    </div>

                    <article className="min-h-[420px] px-6 py-8 sm:px-10">
                        {!idea ? (
                            <div className="flex min-h-[300px] items-center justify-center text-slate-500">
                                <div className="text-center">
                                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />
                                    <p className="font-medium">{loadingText}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="prose prose-slate max-w-none prose-headings:scroll-mt-20 prose-headings:font-bold prose-h1:text-3xl prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2 prose-h2:text-2xl prose-p:leading-7 prose-li:my-1 prose-strong:text-slate-950">
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                    {idea}
                                </ReactMarkdown>
                            </div>
                        )}
                    </article>
                </section>
            </div>
        </main>
    );
}
