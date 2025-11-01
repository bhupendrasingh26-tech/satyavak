export const LANGUAGES = ['English', 'हिन्दी (Hindi)', 'தமிழ் (Tamil)', 'తెలుగు (Telugu)', 'বাংলা (Bengali)', 'मराठी (Marathi)'];

export const LANGUAGE_MAP: { [key: string]: string } = {
    'English': 'English',
    'हिन्दी (Hindi)': 'Hindi',
    'தமிழ் (Tamil)': 'Tamil',
    'తెలుగు (Telugu)': 'Telugu',
    'বাংলা (Bengali)': 'Bengali',
    'मराठी (Marathi)': 'Marathi',
};

export type View = 'dashboard' | 'chatbot' | 'locator' | 'courtroom' | 'generator' | 'sms' | 'casestudies' | 'profile' | 'settings' | 'notifications';