import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from '../translations/ar.json';
import bn from '../translations/bn.json';
import de from '../translations/de.json';
import en from '../translations/en.json';
import es from '../translations/es.json';
import fa from '../translations/fa.json';
import fr from '../translations/fr.json';
import hi from '../translations/hi.json';
import id from '../translations/id.json';
import it from '../translations/it.json';
import ja from '../translations/ja.json';
import ko from '../translations/ko.json';
import mr from '../translations/mr.json';
import nl from '../translations/nl.json';
import pa from '../translations/pa.json';
import pl from '../translations/pl.json';
import pt from '../translations/pt.json';
import ru from '../translations/ru.json';
import ta from '../translations/ta.json';
import te from '../translations/te.json';
import th from '../translations/th.json';
import tr from '../translations/tr.json';
import ur from '../translations/ur.json';
import vi from '../translations/vi.json';
import zh from '../translations/zh.json';

const resources = {
  ar: { translation: ar },
  bn: { translation: bn },
  de: { translation: de },
  en: { translation: en },
  es: { translation: es },
  fa: { translation: fa },
  fr: { translation: fr },
  hi: { translation: hi },
  id: { translation: id },
  it: { translation: it },
  ja: { translation: ja },
  ko: { translation: ko },
  mr: { translation: mr },
  nl: { translation: nl },
  pa: { translation: pa },
  pl: { translation: pl },
  pt: { translation: pt },
  ru: { translation: ru },
  ta: { translation: ta },
  te: { translation: te },
  th: { translation: th },
  tr: { translation: tr },
  ur: { translation: ur },
  vi: { translation: vi },
  zh: { translation: zh },
};

const deviceLocale = Localization.getLocales()?.[0]?.languageCode ?? 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLocale,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
