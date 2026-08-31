KUR'AN NE DIYOR? - APPLE YAYIN HAZIRLIGI / ENES'E DEVIR NOTU
Tarih: 31 Agustos 2026

Bu dosya Zafer ve Enes'in ortak gelistirdigi uygulamanin Apple App Store yayin
hazirliginda yapilan islemleri ve siradaki adimlari kaydetmek icin olusturuldu.

1. UYGULAMA ADI KARARI

- Yeni marka/magaza adi: Kur'an Ne Diyor?
- Teknik Bundle ID degismedi: com.kurankerimdiyor
- Apple App Store alt baslik onerisi: Oku, Dinle ve Tefekkur Et
- EAS proje slug'i ve mevcut teknik kimlikler simdilik degistirilmedi.

2. APPLE DEVELOPER TARAFINDA TAMAMLANANLAR

- Apple Developer hesabi aktif.
- Free Apps Agreement: Active
- Paid Apps Agreement: Active
- Banka ve vergi formlari: Active
- Digital Services Act (DSA) uygunlugu: Active
- Explicit App ID olusturuldu:
  Description: Kuran Ne Diyor
  Bundle ID: com.kurankerimdiyor
- Push Notifications capability etkinlestirildi.
- Push Notifications altindaki Broadcast Capability acilmadi; uygulama Live
  Activities broadcast push kullanmiyor.

3. APP STORE CONNECT UYGULAMA KAYDI

- Uygulama adi: Kur'an Ne Diyor?
- Platform: iOS
- Primary language: Turkish
- Bundle ID: com.kurankerimdiyor
- SKU: kurannediyor-ios
- Apple ID / ascAppId: 6806882595
- User access: Hesaptaki tum kullanicilar erisebiliyor.

4. APP STORE CONNECT API ANAHTARI

- Yeni ve bu uygulamaya ozel API key olusturuldu.
- Key adi: Kuran Ne Diyor Release
- Issuer ID: af37806c-54af-4305-ae64-5a95fb904810
- Key ID: LHKS4U6KLB
- Dosya adi: AuthKey_LHKS4U6KLB.p8
- .p8 dosyasinin icerigi bu belgeye veya Git'e eklenmedi.
- Kok .gitignore icindeki "*.p8" kurali dosyanin Git tarafindan izlenmesini
  engelliyor.
- Apple .p8 dosyasini ikinci kez indirmeye izin vermedigi icin guvenli bir
  yedegi ayrica saklanmali.

5. KOD/PROJE TARAFINDA YAPILANLAR

- kuran-kerim-diyor/eas.json icine production submit profili eklendi:
  ios.ascAppId = 6806882595
- JSON yapisi dogrulandi.
- Mevcut Expo/EAS project ID korunuyor:
  cc7bed36-1460-4f3c-84ff-3d98b7c27429
- app.json icindeki mevcut EAS owner: enesakca04

6. EAS ERISIM ENGELI

- Bu bilgisayarda giris yapilan Expo hesabi: zafergunes
- EAS projesi enesakca04 hesabina ait.
- zafergunes hesabi su anda projeyi okuyamiyor; EAS "Entity not authorized"
  hatasi veriyor.
- Bu nedenle yeni EAS projesi olusturulmadi, projectId degistirilmedi ve mevcut
  signing credentials uzerine yazilmadi.

ENES'TEN BEKLENEN:

- Tercihen zafergunes hesabina mevcut kuran-kerim-diyor EAS projesi icin
  gerekli proje/organizasyon erisimini vermek.
- Alternatif olarak build ve credentials islemleri sirasinda enesakca04
  hesabiyla EAS CLI oturumu acmak.
- Mevcut signing credentials ve push yapilandirmasi korunmali.

7. YAYIN ONCESI TEKNIK KONTROL SONUCLARI

- Backend testleri: 13/13 basarili
- Mobil TypeScript: basarili
- Web TypeScript, ESLint ve production build: basarili
- Web npm audit: 0 acik
- Expo Doctor: 17/18 basarili
- Guncellenmesi gereken Expo patch surumleri:
  expo 54.0.36 -> 54.0.37
  expo-constants 18.0.13 -> 18.0.14
- Backend npm audit, Prisma/deepmerge-ts zincirinde 3 high bulgu nedeniyle
  release-check betigini durduruyor. Breaking downgrade/force fix uygulanmadi.
- Mobil audit bulgulari Expo/Metro arac zincirinde. "npm audit fix --force"
  Expo 57'ye zorladigi icin uygulanmadi.
- Public sayfalar calisiyor:
  https://kurannediyor.com.tr/privacy
  https://kurannediyor.com.tr/terms
  https://kurannediyor.com.tr/support
  https://kurannediyor.com.tr/account-deletion
  https://kurannediyor.com.tr/sources
- Backend health endpoint calisiyor:
  https://api.kurannediyor.com.tr/api/health

8. EAS ERISIMI GELINCE YAPILACAKLAR

1) EAS proje erisimini dogrula.
2) Apple API key ve iOS distribution credentials'i EAS'e guvenli bicimde tanit.
3) Expo patch surumlerini kontrollu guncelle ve test et.
4) Uygulamanin gorunen adini tum gerekli yerlerde Kur'an Ne Diyor? yap.
5) Apple metadata/localization dosyalarini hazirla ve App Store Connect'e gonder.
6) App Privacy, age rating, content rights ve review bilgilerini tamamla.
7) iPhone ve iPad ekran goruntulerini uret.
8) Production iOS build al, fiziksel cihaz/TestFlight testi yap.
9) Son kontrol sonrasi App Review'a elle gonder.

GUVENLIK NOTU

- Sifreler, Apple dogrulama kodlari, Gemini API key, JWT secret ve .p8 icerigi
  Git'e, bu dosyaya veya mesajlasma kanallarina yazilmayacak.
- Yeni EAS projesi acmak veya mevcut projectId'yi degistirmek ancak iki
  gelistiricinin ortak karariyla yapilacak.

9. SON MOBIL DUZENLEMELER

- Ayarlar ekranina Sistem / Acik / Koyu secenekli uygulama temasi eklendi.
- Tema tercihi cihazda kalici saklaniyor ve tum uygulama ekranlarina uygulanıyor.
- Durum cubugu secilen temaya gore otomatik olarak acik veya koyu gorunuyor.
- Paylasilacak ayet gorselinin tasarimi tutarli kalmasi icin paylasim karti acik
  temada birakildi; uygulama arayuzu temasindan bagimsizdir.
