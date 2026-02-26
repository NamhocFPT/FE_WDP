// src/component/pages/common/Profile.js
import React, { useState } from "react";
import { store } from "service/store";
import { PageHeader, Card, CardContent, Input, Button } from "component/ui";

export default function Profile() {
    const u = store.getCurrentUser();
    const [fullName, setFullName] = useState(u?.fullName || "");
    const [email] = useState(u?.email || "");
    const [saved, setSaved] = useState(false);

    const onSave = () => {
        store.updateProfile({ fullName });
        setSaved(true);
        setTimeout(() => setSaved(false), 1200);
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

                    <div className="mt-4 flex items-center gap-2">
                        <Button onClick={onSave}>Save</Button>
                        {saved ? <div className="text-sm font-semibold text-emerald-600">Saved!</div> : null}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}