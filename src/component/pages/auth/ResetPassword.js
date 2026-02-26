// src/component/pages/auth/ResetPassword.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button, Card, CardContent, Input } from "component/ui";

export default function ResetPassword() {
    const nav = useNavigate();
    const [p1, setP1] = useState("");
    const [p2, setP2] = useState("");
    const [err, setErr] = useState("");

    const onSubmit = (e) => {
        e.preventDefault();
        setErr("");
        if (!p1 || p1.length < 6) return setErr("Password must be at least 6 characters.");
        if (p1 !== p2) return setErr("Passwords do not match.");
        nav("/login", { replace: true });
    };

    return (
        <div className="min-h-screen bg-slate-50 grid place-items-center p-4">
            <Card className="w-full max-w-md rounded-2xl">
                <CardContent>
                    <div className="text-xl font-bold text-slate-900">Reset password</div>
                    <p className="mt-1 text-sm text-slate-600">Set your new password (demo screen).</p>

                    <form onSubmit={onSubmit} className="mt-4 space-y-3">
                        <div>
                            <div className="mb-1 text-xs font-semibold text-slate-600">New password</div>
                            <Input type="password" value={p1} onChange={(e) => setP1(e.target.value)} />
                        </div>
                        <div>
                            <div className="mb-1 text-xs font-semibold text-slate-600">Confirm password</div>
                            <Input type="password" value={p2} onChange={(e) => setP2(e.target.value)} />
                        </div>

                        {err ? <div className="text-sm font-semibold text-red-600">{err}</div> : null}

                        <Button className="w-full" type="submit">
                            Update password
                        </Button>

                        <Link className="block text-center text-sm font-semibold text-slate-700 hover:text-slate-900" to="/login">
                            Back to login
                        </Link>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}