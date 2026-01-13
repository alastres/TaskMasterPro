import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { motion } from 'framer-motion';

const LanguageToggle = () => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language;

    const toggleLanguage = () => {
        const newLang = currentLang === 'es' ? 'en' : 'es';
        i18n.changeLanguage(newLang);
    };

    return (
        <motion.button
            onClick={toggleLanguage}
            className="relative inline-flex items-center justify-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={`Switch to ${currentLang === 'es' ? 'English' : 'Español'}`}
        >
            <Languages className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">
                {currentLang}
            </span>
        </motion.button>
    );
};

export default LanguageToggle;
