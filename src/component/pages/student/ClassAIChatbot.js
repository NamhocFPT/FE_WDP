import React, { useState, useEffect, useRef } from "react";
import { api } from "service/api";
import { cn, Button, Card, CardHeader, CardTitle, CardContent, Input } from "component/ui";
import { Bot, Send, X, Loader2, MessageSquare, CornerDownRight } from "lucide-react";
import { toast } from "sonner";

export default function ClassAIChatbot({ classId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const storageKey = `class_chat_${classId}`;

    // 1. Load History from LocalStorage (Alternative Flow A2)
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse chat history");
            }
        } else {
            // Initial greeting
            setMessages([
                {
                    role: "model",
                    text: "Xin chào! Tôi là Trợ lý AI Hỗ trợ Học tập. Tôi có thể giúp bạn giải đáp các thắc mắc về bài giảng và tài liệu trong lớp học này. Bạn muốn hỏi gì hôm nay?",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        }
    }, [classId]);

    // 2. Save History to LocalStorage
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(messages));
        }
    }, [messages, classId]);

    // 3. Scroll to bottom on new message
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userText = input.trim();
        setInput("");
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const userMessage = { role: "user", text: userText, time: timestamp };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setLoading(true);

        try {
            // Format history for backend API: [{ role: 'user'|'model', text: '...' }]
            const historyForApi = updatedMessages
                .filter(m => m.role === 'user' || m.role === 'model')
                .map(m => ({ role: m.role, text: m.text }))
                .slice(-10); // send last 10 messages for context

            const res = await api.ai.classChat(classId, userText, historyForApi);

            if (res.ok && res.data && res.data.success) {
                setMessages(prev => [...prev, {
                    role: "model",
                    text: res.data.data,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            } else {
                toast.error(res.data?.message || "Không thể kết nối với AI.");
            }
        } catch (error) {
            console.error("Chat error:", error);
            toast.error("Đã có lỗi xảy ra khi trò chuyện với AI.");
        } finally {
            setLoading(false);
        }
    };

    const clearHistory = () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa lịch sử trò chuyện lớp học này?")) {
            localStorage.removeItem(storageKey);
            setMessages([
                {
                    role: "model",
                    text: "Lịch sử đã xóa. Tôi có thể giúp gì thêm cho bạn?",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <Card className="mb-4 w-[380px] sm:w-[420px] h-[500px] flex flex-col shadow-2xl border-slate-200 animate-in slide-in-from-bottom-5 duration-300">
                    <CardHeader className="bg-slate-900 text-white rounded-t-xl py-3 px-4 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-500 rounded-lg">
                                <Bot size={20} className="text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-bold text-white">Trợ lý AI SmartEdu</CardTitle>
                                <div className="text-[11px] text-blue-200 flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Bám sát bài giảng
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800" onClick={clearHistory} title="Xóa lịch sử">
                                <MessageSquare size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800" onClick={() => setIsOpen(false)}>
                                <X size={18} />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 p-0 overflow-hidden flex flex-col bg-slate-50">
                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((m, i) => (
                                <div key={i} className={cn("flex flex-col max-w-[85%]", m.role === "user" ? "ml-auto items-end" : "items-start")}>
                                    <div className={cn(
                                        "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                                        m.role === "user" 
                                            ? "bg-blue-600 text-white rounded-br-none" 
                                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm"
                                    )}>
                                        {m.text.split("\n").map((line, idx) => (
                                            <p key={idx} className={idx > 0 ? "mt-1.5" : ""}>
                                                {line}
                                            </p>
                                        ))}
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1 px-1">{m.time}</span>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex items-start gap-2 max-w-[80%]">
                                    <div className="p-2 bg-white border border-slate-200 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
                                        <Loader2 size={16} className="animate-spin text-blue-600" />
                                        <span className="text-xs text-slate-500">AI đang suy nghĩ...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Form */}
                        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 shrink-0 flex gap-2">
                            <Input
                                placeholder="Hỏi AI về bài học hôm nay..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={loading}
                                className="flex-1 h-9 text-sm pr-10"
                            />
                            <Button type="submit" disabled={loading || !input.trim()} size="sm" className="h-9 w-9 p-0 bg-blue-600 hover:bg-blue-700 text-white fill-none">
                                <Send size={16} />
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95",
                    isOpen ? "bg-slate-800 rotate-90" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 animate-bounce"
                )}
                style={{ animationDuration: '3s', animationIterationCount: 'infinite' }}
            >
                {isOpen ? <X size={24} /> : <Bot size={28} />}
            </button>
        </div>
    );
}
