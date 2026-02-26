// src/component/pages/common/NotFound.js
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, Button } from "component/ui";

export default function NotFound() {
    return (
        <div className="min-h-[60vh] grid place-items-center">
            <Card className="max-w-md w-full">
                <CardContent>
                    <div className="text-xl font-bold text-slate-900">404 - Not Found</div>
                    <p className="mt-2 text-sm text-slate-600">The page you’re looking for doesn’t exist.</p>
                    <div className="mt-4">
                        <Link to="/"><Button>Back to Home</Button></Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}