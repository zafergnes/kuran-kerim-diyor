import React from 'react';
import { Text, TextInput } from 'react-native';

/**
 * Kullanıcıların telefon ayarlarında (Erişilebilirlik > Metin Boyutu / Ekran Büyütme) belirlediği
 * aşırı büyük yazı tipi ölçeğinin (fontScale > 1.5x) uygulamanın tab bar, header,
 * alt gezinme butonları ve genel UI iskeletini bozmasını engeller.
 *
 * Kur'an metni ve meal boyutları, uygulamanın kendi "Metin Boyutlandırma (aA)"
 * sistemi üzerinden kullanıcı tercihine göre güvenli ve taşma yapmadan ölçeklenir.
 */
export function setupFontScalingProtection() {
    try {
        const TextModule = require('react-native/Libraries/Text/Text');
        const OriginalText = TextModule?.default;
        if (OriginalText && !(OriginalText as any).__isScalingPatched) {
            const PatchedText = React.forwardRef((props: any, ref: any) => {
                return React.createElement(OriginalText, {
                    allowFontScaling: false,
                    maxFontSizeMultiplier: 1.15,
                    ...props,
                    ref,
                });
            });
            PatchedText.displayName = 'Text';
            (PatchedText as any).__isScalingPatched = true;
            Object.assign(PatchedText, OriginalText);
            TextModule.default = PatchedText;
        }
    } catch (_) {}

    try {
        const TextInputModule = require('react-native/Libraries/Components/TextInput/TextInput');
        const OriginalTextInput = TextInputModule?.default;
        if (OriginalTextInput && !(OriginalTextInput as any).__isScalingPatched) {
            const PatchedTextInput = React.forwardRef((props: any, ref: any) => {
                return React.createElement(OriginalTextInput, {
                    allowFontScaling: false,
                    maxFontSizeMultiplier: 1.15,
                    ...props,
                    ref,
                });
            });
            PatchedTextInput.displayName = 'TextInput';
            (PatchedTextInput as any).__isScalingPatched = true;
            Object.assign(PatchedTextInput, OriginalTextInput);
            TextInputModule.default = PatchedTextInput;
        }
    } catch (_) {}

    try {
        if ((Text as any).defaultProps == null) {
            (Text as any).defaultProps = {};
        }
        (Text as any).defaultProps.allowFontScaling = false;
        (Text as any).defaultProps.maxFontSizeMultiplier = 1.15;

        if ((TextInput as any).defaultProps == null) {
            (TextInput as any).defaultProps = {};
        }
        (TextInput as any).defaultProps.allowFontScaling = false;
        (TextInput as any).defaultProps.maxFontSizeMultiplier = 1.15;
    } catch (_) {}
}

setupFontScalingProtection();
