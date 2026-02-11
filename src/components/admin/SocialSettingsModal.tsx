import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Linkedin, MessageCircle, Save, Loader2, Info } from 'lucide-react';
import { SocialPlatform, SocialPlatformConfig, PLATFORM_INFO } from '../../types/socialPost';
import { getSocialPlatformConfig, saveSocialPlatformConfig, togglePlatformStatus } from '../../services/socialSettings';

interface SocialSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SocialSettingsModal({ isOpen, onClose }: SocialSettingsModalProps) {
    const [activeTab, setActiveTab] = useState<SocialPlatform>('linkedin');
    const [configs, setConfigs] = useState<Record<SocialPlatform, SocialPlatformConfig | null>>({
        linkedin: null,
        twitter: null,
        reddit: null,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (isOpen) {
            loadConfigs();
        }
    }, [isOpen]);

    const loadConfigs = async () => {
        setLoading(true);
        const [li, tw, rd] = await Promise.all([
            getSocialPlatformConfig('linkedin'),
            getSocialPlatformConfig('twitter'),
            getSocialPlatformConfig('reddit'),
        ]);

        setConfigs({
            linkedin: li,
            twitter: tw,
            reddit: rd,
        });

        // Initialize form data based on active tab
        updateFormData('linkedin', li);
        setLoading(false);
    };

    const updateFormData = (platform: SocialPlatform, config: SocialPlatformConfig | null) => {
        if (platform === 'linkedin') {
            setFormData({
                clientId: config?.credentials?.clientId || '',
                clientSecret: config?.credentials?.clientSecret || '',
                accessToken: config?.credentials?.accessToken || '',
                personUrn: config?.credentials?.personUrn || '',
                organizationId: config?.credentials?.organizationId || '',
            });
        } else if (platform === 'twitter') {
            setFormData({
                accessToken: config?.credentials?.accessToken || '',
                clientId: config?.credentials?.clientId || '',
                clientSecret: config?.credentials?.clientSecret || '',
            });
        } else if (platform === 'reddit') {
            setFormData({
                clientId: config?.credentials?.clientId || '',
                clientSecret: config?.credentials?.clientSecret || '',
                accessToken: config?.credentials?.accessToken || '',
                username: config?.credentials?.username || '',
                password: config?.credentials?.password || '',
                userAgent: config?.credentials?.userAgent || 'SocialStudio/1.0.0',
            });
        }
    };

    const handleConnect = (platform: SocialPlatform) => {
        // Save config first to ensure Client ID/Secret are available to the backend
        handleSave().then(() => {
            const width = 600;
            const height = 700;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;

            const authUrl = `https://us-central1-jobzai.cloudfunctions.net/authRedirect?platform=${platform}`;

            const popup = window.open(authUrl, `Connect ${platform}`, `width=${width},height=${height},left=${left},top=${top}`);

            // Poll for popup close – when user finishes OAuth, the popup closes
            // and we reload configs from Firestore to reflect the new tokens
            if (popup) {
                const pollTimer = setInterval(async () => {
                    if (popup.closed) {
                        clearInterval(pollTimer);
                        // Reload all configs from Firestore
                        const [li, tw, rd] = await Promise.all([
                            getSocialPlatformConfig('linkedin'),
                            getSocialPlatformConfig('twitter'),
                            getSocialPlatformConfig('reddit'),
                        ]);
                        setConfigs({ linkedin: li, twitter: tw, reddit: rd });
                        updateFormData(platform, platform === 'linkedin' ? li : platform === 'twitter' ? tw : rd);
                    }
                }, 1000);
            }
        });
    };

    useEffect(() => {
        updateFormData(activeTab, configs[activeTab]);
    }, [activeTab]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveSocialPlatformConfig(activeTab, formData);
            // Reload configs to update state
            const newConfig = await getSocialPlatformConfig(activeTab);
            setConfigs(prev => ({ ...prev, [activeTab]: newConfig }));
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (enabled: boolean) => {
        try {
            await togglePlatformStatus(activeTab, enabled);
            setConfigs(prev => {
                const current = prev[activeTab];
                if (!current) return prev;
                return {
                    ...prev,
                    [activeTab]: { ...current, enabled }
                };
            });
        } catch (error) {
            console.error('Toggle error:', error);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const renderForm = () => {
        if (activeTab === 'linkedin') {
            return (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex gap-2 mb-4">
                        <Info className="w-4 h-4 shrink-0" />
                        <div>
                            <p className="font-semibold mb-1">Setup Instructions:</p>
                            <p>1. Create an app in <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noreferrer" className="underline">LinkedIn Developers</a>.</p>
                            <p>2. Set Redirect URL to: <code className="bg-blue-100 px-1 rounded">https://us-central1-jobzai.cloudfunctions.net/authCallback</code></p>
                            <p>3. Copy Client ID and Secret below.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                            <input
                                type="text"
                                value={formData.clientId}
                                onChange={(e) => handleInputChange('clientId', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                            <input
                                type="password"
                                value={formData.clientSecret}
                                onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={() => handleConnect('linkedin')}
                            disabled={!formData.clientId || !formData.clientSecret}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0077b5] text-white rounded-lg font-medium hover:bg-[#006097] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Linkedin size={18} />
                            Connect LinkedIn
                        </button>
                    </div>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or Manual Entry</span></div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                        <input
                            type="password"
                            value={formData.accessToken}
                            onChange={(e) => handleInputChange('accessToken', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                            placeholder="LiAx..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Person URN</label>
                        <input
                            type="text"
                            value={formData.personUrn}
                            onChange={(e) => handleInputChange('personUrn', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                            placeholder="12345678"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Organization ID (Optional)</label>
                        <input
                            type="text"
                            value={formData.organizationId}
                            onChange={(e) => handleInputChange('organizationId', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                            placeholder="12345678 (Leave empty to post as Person)"
                        />
                        <p className="mt-1 text-xs text-gray-400">Enter your Company Page ID to post as the organization.</p>
                    </div>
                </div >
            );
        }

        if (activeTab === 'twitter') {
            return (
                <div className="space-y-4">
                    <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 text-xs text-sky-800 flex gap-2 mb-4">
                        <Info className="w-4 h-4 shrink-0" />
                        <div>
                            <p className="font-semibold mb-1">Setup Instructions (OAuth 2.0 PKCE):</p>
                            <p>1. Create an app in <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank" rel="noreferrer" className="underline">Twitter Developer Portal</a>.</p>
                            <p>2. Enable "User authentication settings" with OAuth 2.0.</p>
                            <p>3. Set Redirect URL to: <code className="bg-sky-100 px-1 rounded">https://us-central1-jobzai.cloudfunctions.net/authCallback</code></p>
                            <p>4. Set Type of App to "Confidential client". Copy Client ID and Secret below.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                            <input
                                type="text"
                                value={formData.clientId}
                                onChange={(e) => handleInputChange('clientId', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                            <input
                                type="password"
                                value={formData.clientSecret}
                                onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={() => handleConnect('twitter')}
                            disabled={!formData.clientId || !formData.clientSecret}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="text-lg font-bold">𝕏</span>
                            Connect Twitter
                        </button>
                    </div>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or Manual Entry</span></div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">OAuth 2.0 Access Token</label>
                        <input
                            type="password"
                            value={formData.accessToken}
                            onChange={(e) => handleInputChange('accessToken', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                            placeholder="Bearer Token"
                        />
                        <p className="mt-1 text-xs text-gray-400">User Context Access Token with write privileges.</p>
                    </div>
                </div>
            );
        }

        if (activeTab === 'reddit') {
            return (
                <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800 flex gap-2 mb-4">
                        <Info className="w-4 h-4 shrink-0" />
                        <div>
                            <p className="font-semibold mb-1">Setup Instructions:</p>
                            <p>1. Create an app in <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noreferrer" className="underline">Reddit Prefs</a> (select "script" or "web app").</p>
                            <p>2. Set Redirect URL to: <code className="bg-amber-100 px-1 rounded">https://us-central1-jobzai.cloudfunctions.net/authCallback</code></p>
                            <p>3. Copy Client ID and Secret below.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                            <input
                                type="text"
                                value={formData.clientId}
                                onChange={(e) => handleInputChange('clientId', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                            <input
                                type="password"
                                value={formData.clientSecret}
                                onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={() => handleConnect('reddit')}
                            disabled={!formData.clientId || !formData.clientSecret}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ff4500] text-white rounded-lg font-medium hover:bg-[#e03d00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <MessageCircle size={18} />
                            Connect Reddit
                        </button>
                    </div>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or Manual Entry</span></div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                        <input
                            type="password"
                            value={formData.accessToken}
                            onChange={(e) => handleInputChange('accessToken', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                        />
                    </div>
                </div>
            );
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Platform Connections</h2>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex flex-1 overflow-hidden">
                            {/* Sidebar */}
                            <div className="w-48 bg-gray-50 border-r border-gray-100 p-4 flex flex-col gap-2 overflow-y-auto">
                                {(['linkedin', 'twitter', 'reddit'] as SocialPlatform[]).map((platform) => {
                                    const info = PLATFORM_INFO[platform];
                                    const config = configs[platform];
                                    return (
                                        <button
                                            key={platform}
                                            onClick={() => setActiveTab(platform)}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${activeTab === platform
                                                ? 'bg-white shadow-sm ring-1 ring-black/5 text-gray-900'
                                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                                }`}
                                        >
                                            <span
                                                className="w-6 h-6 rounded flex items-center justify-center text-xs"
                                                style={{ backgroundColor: info.bgColor, color: info.color }}
                                            >
                                                {platform === 'linkedin' && <Linkedin size={14} />}
                                                {platform === 'twitter' && <span>𝕏</span>}
                                                {platform === 'reddit' && <MessageCircle size={14} />}
                                            </span>
                                            <span className="flex-1">{info.name}</span>
                                            {config?.enabled && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-6 overflow-y-auto">
                                {loading ? (
                                    <div className="h-full flex items-center justify-center text-gray-400">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                    </div>
                                ) : (
                                    <div className="max-w-md mx-auto">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                                                    style={{
                                                        backgroundColor: PLATFORM_INFO[activeTab].bgColor,
                                                        color: PLATFORM_INFO[activeTab].color
                                                    }}
                                                >
                                                    {activeTab === 'linkedin' && <Linkedin size={20} />}
                                                    {activeTab === 'twitter' && <span className="text-lg font-bold">𝕏</span>}
                                                    {activeTab === 'reddit' && <MessageCircle size={20} />}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{PLATFORM_INFO[activeTab].name}</h3>
                                                    <p className="text-xs text-gray-500">Configure API access</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-medium ${configs[activeTab]?.enabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                    {configs[activeTab]?.enabled ? 'Active' : 'Disabled'}
                                                </span>
                                                <button
                                                    onClick={() => handleToggle(!configs[activeTab]?.enabled)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${configs[activeTab]?.enabled ? 'bg-emerald-500' : 'bg-gray-200'
                                                        }`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${configs[activeTab]?.enabled ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-6">
                                            {renderForm()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/50 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || loading}
                                className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Configuration
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
