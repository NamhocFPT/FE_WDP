// src/component/pages/common/Profile.js
import React, { useState, useEffect } from "react";
import { store } from "service/store";
import { api } from "service/api";
import { PageHeader, Card, CardContent, Input, Button } from "component/ui";

export default function Profile() {
    const u = store.getCurrentUser();
    const [fullName, setFullName] = useState(u?.fullName || "");
    const [email, setEmail] = useState(u?.email || "");
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        api.getProfile().then(({ ok, data }) => {
            if (ok && data.success) {
                const profile = data.data;
                setFullName(profile.full_name || "");
                setEmail(profile.email || "");
                const currentUser = store.getCurrentUser();
                store.setAuth(store.getToken(), { ...currentUser, ...profile });
            }
        }).catch(() => { });
    }, []);

    const onSave = async () => {
        setError("");
        try {
            const { ok, data } = await api.updateProfile({ full_name: fullName });
            if (!ok || !data.success) {
                return setError(data.error?.validationErrors?.[0]?.message || data.message || "Update failed.");
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);

            const currentUser = store.getCurrentUser();
            store.setAuth(store.getToken(), { ...currentUser, ...data.data });
        } catch (err) {
            setError("Server connection error.");
        }
    };

    return (
        <div>
            <PageHeader title="Profile" subtitle="Manage your personal information." />

            <Card>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <div className="mb-1 text-xs font-semibold text-slate-600">Full name</div>
                            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>
                        <div>
                            <div className="mb-1 text-xs font-semibold text-slate-600">Email</div>
                            <Input value={email} disabled />
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                        {error ? <div className="text-sm font-semibold text-red-600">{error}</div> : null}
                        <div className="flex items-center gap-2">
                            <Button onClick={onSave}>Save</Button>
                            {saved ? <div className="text-sm font-semibold text-emerald-600">Saved successfully!</div> : null}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}