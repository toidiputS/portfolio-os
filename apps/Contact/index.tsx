import React, { useState } from 'react';
import { useKernel } from '../../store/kernel';
import { Send, MailCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Contact: React.FC = () => {
    const setHasNewMessage = useKernel(state => state.setHasNewMessage);
    const closeWindow = useKernel(state => state.closeWindow);
    const windows = useKernel(state => state.windows);
    const thisWindow = windows.find(w => w.appId === 'contact');

    const [formData, setFormData] = useState({ email: '', subject: '', message: '' });
    const [isSent, setIsSent] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Construct mailto link - Replace with your actual email
        const recipientEmail = "hello@example.com";
        const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(formData.message)}%0D%0A%0D%0AFrom: ${formData.email}`;

        // Open default mail client
        window.open(mailtoLink, '_blank');

        console.log('Form Submitted (simulated):', formData);
        setHasNewMessage(true);
        setIsSent(true);
        setTimeout(() => {
            if (thisWindow) {
                closeWindow(thisWindow.id);
            }
        }, 3000);
    };

    return (
        <div className="p-8 h-full flex items-center justify-center bg-transparent">
            {!isSent ? (
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSubmit}
                    className="w-full max-w-lg space-y-4"
                >
                    <div>
                        <h1 className="text-3xl font-bold">Contact Me</h1>
                        <p className="text-[hsl(var(--muted-foreground-hsl))]">Feel free to reach out. I'll get back to you as soon as possible.</p>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[hsl(var(--muted-foreground-hsl))] mb-1">Your Email</label>
                        <input type="email" name="email" id="email" required onChange={handleChange} value={formData.email} className="w-full bg-[hsl(var(--input-hsl))] border border-[hsl(var(--border-hsl))] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring-hsl))]" />
                    </div>
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-[hsl(var(--muted-foreground-hsl))] mb-1">Subject</label>
                        <input type="text" name="subject" id="subject" required onChange={handleChange} value={formData.subject} className="w-full bg-[hsl(var(--input-hsl))] border border-[hsl(var(--border-hsl))] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring-hsl))]" />
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-[hsl(var(--muted-foreground-hsl))] mb-1">Message</label>
                        <textarea name="message" id="message" rows={5} required onChange={handleChange} value={formData.message} className="w-full bg-[hsl(var(--input-hsl))] border border-[hsl(var(--border-hsl))] rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring-hsl))]"></textarea>
                    </div>
                    <button type="submit" className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-[hsl(var(--accent-strong-hsl))] text-[hsl(var(--accent-foreground-hsl))] hover:brightness-90 transition-colors font-semibold">
                        <Send size={18} /> Send Message
                    </button>
                </motion.form>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <MailCheck size={64} className="mx-auto text-green-400 mb-4" />
                    <h2 className="text-2xl font-bold">Message Sent!</h2>
                    <p className="text-[hsl(var(--muted-foreground-hsl))]">Thank you for reaching out.</p>
                </motion.div>
            )}
        </div>
    );
};

export default Contact;