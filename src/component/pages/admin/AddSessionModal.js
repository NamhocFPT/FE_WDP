import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "service/adminApi";

export default function AddSessionModal({ isOpen, onClose, classId, onSuccess }) {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        day_of_week: "",
        start_time: "",
        end_time: "",
        room: "",
        teacher_id: ""
    });

    useEffect(() => {
        if (!isOpen) return;
        adminApi.getTeachers()
            .then(res => setTeachers(res.data.data))
            .catch(err => console.error("Error fetching teachers:", err));
        
        // Reset form data when opened
        setFormData({
            day_of_week: "",
            start_time: "",
            end_time: "",
            room: "",
            teacher_id: ""
        });
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // TODO: adjust API method based on adminApi implementation for adding a session
            // Example payload
            const payload = {
                day_of_week: formData.day_of_week,
                start_time: formData.start_time,
                end_time: formData.end_time,
                room: formData.room,
                teacher_id: formData.teacher_id || null // Optional teacher
            };
            
            await adminApi.addSession(classId, payload);
            toast.success("Session added successfully!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Error adding session.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex justify-between items-start p-6 pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Add Session</h3>
                        <p className="text-sm text-slate-500 mt-1">Schedule a new class session</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-5">
                    {/* Day of Week */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2">Day of Week</label>
                        <select 
                            required
                            className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                            value={formData.day_of_week}
                            onChange={(e) => setFormData({...formData, day_of_week: e.target.value})}
                        >
                            <option value="" disabled>Select day</option>
                            <option value="Monday">Monday</option>
                            <option value="Tuesday">Tuesday</option>
                            <option value="Wednesday">Wednesday</option>
                            <option value="Thursday">Thursday</option>
                            <option value="Friday">Friday</option>
                            <option value="Saturday">Saturday</option>
                            <option value="Sunday">Sunday</option>
                        </select>
                    </div>

                    {/* Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-700 block mb-2">Start Time</label>
                            <input 
                                type="time" required
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                                value={formData.start_time}
                                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-700 block mb-2">End Time</label>
                            <input 
                                type="time" required
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                                value={formData.end_time}
                                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Room */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2">Room</label>
                        <input 
                            type="text" required placeholder="e.g., Room 301"
                            className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                            value={formData.room}
                            onChange={(e) => setFormData({...formData, room: e.target.value})}
                        />
                    </div>

                    {/* Teacher Optional */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2">Teacher (Optional)</label>
                        <select 
                            className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                            value={formData.teacher_id}
                            onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                        >
                            <option value="">Use default teacher</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
                            ))}
                        </select>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            type="button" 
                            className="px-6 py-2.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="animate-spin" size={16} />}
                            Add Session
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
