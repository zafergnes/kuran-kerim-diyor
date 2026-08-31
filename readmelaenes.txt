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
- EAS projesi zafergunes hesabina aktarildi.
- app.json icindeki EAS owner: zafergunes
- Production EAS ortami build profiline baglandi.
- EXPO_PUBLIC_API_BASE_URL production degiskeni EAS'e tanimlandi.

6. EAS ERISIM DURUMU

- Bu bilgisayarda giris yapilan Expo hesabi: zafergunes
- Proje tam adi: @zafergunes/kuran-kerim-diyor
- Proje erisimi ve production environment baglantisi dogrulandi.
- Mevcut projectId korunuyor; yeni EAS projesi olusturulmadi.

7. YAYIN ONCESI TEKNIK KONTROL SONUCLARI

- Backend testleri: 13/13 basarili
- Mobil TypeScript: basarili
- Web TypeScript, ESLint ve production build: basarili
- Web npm audit: 0 acik
- Expo Doctor: 18/18 basarili
- expo 54.0.37 ve expo-constants 18.0.14 surumlerine guncellendi.
- Mobil TypeScript ve iOS bundle/export kontrolleri basarili.
- Web ESLint ve production build kontrolleri basarili.
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

8. YAYIN ICIN KALANLAR

1) Apple distribution certificate ve provisioning profile'i EAS'te dogrula/olustur.
2) Production iOS build al ve App Store Connect'e gonder.
3) TestFlight uzerinden gercek cihaz regresyon testi yap.
4) Apple metadata ve 6 dil yerellestirmelerini App Store Connect'e gir.
5) App Privacy, age rating, content rights ve review bilgilerini tamamla.
6) Hazirlanan ham ekran goruntulerini market boyutlarina getirip yukle.
7) Son kontrol sonrasi App Review'a elle gonder.

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

10. EAS PRODUCTION VE SURUM YONETIMI

- Uygulamanin gorunen adi Kur'an Ne Diyor? olarak guncellendi.
- EAS owner zafergunes olarak ayarlandi.
- Production profili production environment'a baglandi.
- Surum kaynagi remote yapildi ve production build numarasi otomatik artacak
  sekilde ayarlandi.
- EAS remote iOS build numarasi 1 olarak baslatildi; bu nedenle app.json icindeki
  yerel ios.buildNumber alani kaldirildi.
- Apple Developer hesabi store@emektra.com olarak dogrulandi.
- Ilk production build, Apple oturumu eskidigi ve sifre/2FA terminalden yeniden
  girilmesi gerektigi icin kimlik dogrulama adiminda bekliyor.

11. SESLI OKUMA ILERLEMESI VE SES KONUMU

- Sayfa gorunumunde aktif ayetin tamamini tek renge boyamak yerine, ses ilerledikce
  Arapca metnin harf harf vurgu rengine donmesi saglandi.
- Ayni harf ilerlemesi ayet ayet okuma gorunumune de eklendi.
- Arapca harekeler bagli olduklari temel harfle birlikte isleniyor.
- Ses cubugu ileri/geri suruklenirken yatay sayfa gecisi gecici olarak kapatiliyor;
  parmak birakilinca yeniden aciliyor. Boylece iki hareket birbiriyle cakismiyor.
- Ayet gorunumunde ses calarken Arapca bir kelimeye dokunuldugunda ses, kelimenin
  metindeki yaklasik konumuna atlaniyor.
- Sayfa gorunumunde aktif ayetin veya ayni sayfadaki baska bir ayetin kelimesine
  dokunularak ilgili ayet/kelime civarindan okumaya devam edilebiliyor.
- Ses saglayicisi kelime veya harf zaman kodu vermedigi icin senkronizasyon,
  oynatma suresinin metindeki harf oranina dagitilmasiyla yaklasik hesaplaniyor.
- Son kontroller: TypeScript basarili, Expo Doctor 18/18, iOS production bundle
  ve export basarili, backend testleri 13/13 basarili.
