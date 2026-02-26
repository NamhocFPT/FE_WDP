// src/component/pages/auth/ForgotPassword.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, CardContent, Input } from "component/ui";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [done, setDone] = useState(false);

    const onSubmit = (e) => {
        e.preventDefault();
        setDone(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 grid place-items-center p-4">
            <Card className="w-full max-w-md rounded-2xl">
                <CardContent>
                    <div className="text-xl font-bold text-slate-900">Forgot password</div>
                    <p className="mt-1 text-sm text-slate-600">We’ll send a reset link (demo screen).</p>

                    {!done ? (
                        <form onSubmit={onSubmit} className="mt-4 space-y-3">
                            <div>
                                <div className="mb-1 text-xs font-semibold text-slate-600">Email</div>
                                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@smartedu.com" />
                            </div>
                            <Button className="w-full" type="submit">
                                Send reset link
                            </Button>
                            <Link className="block text-center text-sm font-semibold text-slate-700 hover:text-slate-900" to="/login">
                                Back to login
                            </Link>
                        </form>
                    ) : (
                        <div className="mt-4 space-y-3">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                Done! (Demo) Bạn có thể vào trang Reset Password để tiếp tục.
                            </div>
                            <Link className="block text-center text-sm font-semibold text-slate-700 hover:text-slate-900" to="/reset-password">
                                Go to reset password
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}