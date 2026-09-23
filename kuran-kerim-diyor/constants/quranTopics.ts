import { AppLanguage } from './languages';

type LocalizedText = Record<AppLanguage, string>;

export type QuranTopic = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  color: string;
  verses: Array<{ surah: number; ayah: number }>;
};

export const QURAN_TOPICS: QuranTopic[] = [
  {
    id: 'patience', color: '#3D7A6C', verses: [{ surah: 2, ayah: 153 }, { surah: 3, ayah: 200 }, { surah: 39, ayah: 10 }, { surah: 94, ayah: 5 }],
    title: { tr: 'Sabır ve dayanıklılık', en: 'Patience and resilience', ar: 'الصبر والثبات', de: 'Geduld und Standhaftigkeit', fr: 'Patience et persévérance', es: 'Paciencia y constancia' },
    description: { tr: 'Zorluk karşısında kalbi ve davranışı korumak.', en: 'Steadiness of heart and action through hardship.', ar: 'ثبات القلب والعمل عند الشدائد.', de: 'Herz und Handeln in Prüfungen bewahren.', fr: 'Garder le cœur et les actes fermes dans l’épreuve.', es: 'Mantener firme el corazón y la conducta ante la dificultad.' },
  },
  {
    id: 'mercy', color: '#B77A62', verses: [{ surah: 1, ayah: 1 }, { surah: 7, ayah: 156 }, { surah: 21, ayah: 107 }, { surah: 39, ayah: 53 }],
    title: { tr: 'Rahmet ve bağışlanma', en: 'Mercy and forgiveness', ar: 'الرحمة والمغفرة', de: 'Barmherzigkeit und Vergebung', fr: 'Miséricorde et pardon', es: 'Misericordia y perdón' },
    description: { tr: 'Allah’ın rahmeti, umut ve dönüş kapısı.', en: 'Divine mercy, hope, and the path of return.', ar: 'رحمة الله وباب الرجاء والعودة.', de: 'Göttliche Barmherzigkeit, Hoffnung und Umkehr.', fr: 'La miséricorde divine, l’espoir et le retour.', es: 'La misericordia divina, la esperanza y el retorno.' },
  },
  {
    id: 'justice', color: '#5079A0', verses: [{ surah: 4, ayah: 58 }, { surah: 4, ayah: 135 }, { surah: 5, ayah: 8 }, { surah: 16, ayah: 90 }],
    title: { tr: 'Adalet ve emanet', en: 'Justice and trust', ar: 'العدل والأمانة', de: 'Gerechtigkeit und Vertrauen', fr: 'Justice et dépôt', es: 'Justicia y confianza' },
    description: { tr: 'Kendimize karşı bile hakkı ayakta tutmak.', en: 'Upholding what is right, even against ourselves.', ar: 'القيام بالحق ولو على أنفسنا.', de: 'Das Recht wahren, selbst gegen uns selbst.', fr: 'Maintenir le droit, même contre nous-mêmes.', es: 'Sostener lo justo, incluso contra nosotros mismos.' },
  },
  {
    id: 'family', color: '#9A6B8F', verses: [{ surah: 4, ayah: 1 }, { surah: 17, ayah: 23 }, { surah: 30, ayah: 21 }, { surah: 66, ayah: 6 }],
    title: { tr: 'Aile ve merhamet', en: 'Family and compassion', ar: 'الأسرة والمودة', de: 'Familie und Mitgefühl', fr: 'Famille et affection', es: 'Familia y afecto' },
    description: { tr: 'Anne-baba, eşler ve aile sorumluluğu.', en: 'Parents, spouses, and responsibility at home.', ar: 'الوالدان والزوجان ومسؤولية الأسرة.', de: 'Eltern, Ehepartner und Verantwortung in der Familie.', fr: 'Parents, époux et responsabilité familiale.', es: 'Padres, esposos y responsabilidad familiar.' },
  },
  {
    id: 'purpose', color: '#A47B39', verses: [{ surah: 2, ayah: 30 }, { surah: 23, ayah: 115 }, { surah: 51, ayah: 56 }, { surah: 67, ayah: 2 }],
    title: { tr: 'Yaratılış ve amaç', en: 'Creation and purpose', ar: 'الخلق والغاية', de: 'Schöpfung und Sinn', fr: 'Création et finalité', es: 'Creación y propósito' },
    description: { tr: 'İnsan neden yaratıldı ve hayat neyi sınar?', en: 'Why were we created, and what does life test?', ar: 'لماذا خُلق الإنسان وما اختبار الحياة؟', de: 'Warum wurden wir erschaffen und was prüft das Leben?', fr: 'Pourquoi sommes-nous créés et que teste la vie ?', es: '¿Por qué fuimos creados y qué prueba la vida?' },
  },
  {
    id: 'gratitude', color: '#708C49', verses: [{ surah: 2, ayah: 152 }, { surah: 14, ayah: 7 }, { surah: 16, ayah: 18 }, { surah: 31, ayah: 12 }],
    title: { tr: 'Şükür ve nimet', en: 'Gratitude and blessings', ar: 'الشكر والنعم', de: 'Dankbarkeit und Gaben', fr: 'Gratitude et bienfaits', es: 'Gratitud y bendiciones' },
    description: { tr: 'Nimeti fark etmek ve şükrü davranışa dönüştürmek.', en: 'Recognizing blessings and turning thanks into action.', ar: 'معرفة النعمة وتحويل الشكر إلى عمل.', de: 'Gaben erkennen und Dank in Handeln verwandeln.', fr: 'Reconnaître les bienfaits et traduire la gratitude en actes.', es: 'Reconocer las bendiciones y convertir la gratitud en acción.' },
  },
];
