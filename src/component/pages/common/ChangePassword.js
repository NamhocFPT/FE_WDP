// src/component/pages/common/ChangePassword.js
import React, { useState } from "react";
import { api } from "service/api";
import { PageHeader, Card, CardContent, Input, Button } from "component/ui";

export default function ChangePassword() {
    const [oldP, setOldP] = useState("");
    const [newP, setNewP] = useState("");
    const [cfm, setCfm] = useState("");
    const [msg, setMsg] = useState("");

    const onSubmit = async (e) => {
        e.preventDefault();
        setMsg("");
        if (!oldP) return setMsg("Old password is required.");
        if (!newP || newP.length < 6) return setMsg("New password must be at least 6 characters.");
        if (newP !== cfm) return setMsg("Confirm password does not match.");

        try {
            const { ok, data } = await api.changePassword(oldP, newP);
            if (!ok || !data.success) {
                return setMsg(data.error?.validationErrors?.[0]?.message || data.message || "Failed to change password.");
            }
            setMsg("Password updated successfully.");
            setOldP("");
            setNewP("");
            setCfm("");
        } catch {
            setMsg("Network error.");
        }
    };

    return (
        <div>
            <PageHeader title="Change Password" subtitle="Update your password to keep your account secure." />

            <Card>
                <CardContent>
                    <form onSubmit={onSubmit} className="grid gap-3 sm:max-w-md">
                        <div>
                            <div className="mb-1 text-xs font-semibold text-slate-600">Old password</div>
                            <Input type="password" value={oldP} onChange={(e) => setOldP(e.target.value)} />
                        </div>
                        <div>
                            <div className="mb-1 text-xs font-semibold text-slate-600">New password</div>
                            <Input type="password" value={newP} onChange={(e) => setNewP(e.target.value)} />
                        </div>
                        <div>
                            <div className="mb-1 text-xs font-semibold text-slate-600">Confirm password</div>
                            <Input type="password" value={cfm} onChange={(e) => setCfm(e.target.value)} />
                        </div>

                        {msg ? <div className="text-sm font-semibold text-slate-700">{msg}</div> : null}

                        <Button type="submit">Update</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}