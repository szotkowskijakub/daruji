# 🎁 Dáruji - Aplikace pro sdílení nepotřebných věcí

Webová aplikace pro darování věcí se **sdílenou databází** - všichni uživatelé vidí stejné položky v reálném čase!

## ✨ Funkce

- 📸 Přidávání věcí s fotkou a popisem
- 🔖 Rezervace věcí zájemci  
- 👤 Správa vlastních položek
- 🔄 **Real-time synchronizace** - změny se zobrazí okamžitě všem
- 📱 Responzivní design (mobil i desktop)

---

# 🚀 NÁVOD K NASAZENÍ (krok za krokem)

## Krok 1: Vytvoření Firebase projektu (5 minut)

### 1.1 Přihlaste se do Firebase Console
1. Jděte na **[console.firebase.google.com](https://console.firebase.google.com)**
2. Přihlaste se svým Google účtem
3. Klikněte na **"Create a project"** (nebo "Vytvořit projekt")

### 1.2 Vytvořte nový projekt
1. Zadejte název projektu: `daruji` (nebo jiný)
2. Google Analytics můžete **vypnout** (není potřeba)
3. Klikněte **"Create project"**
4. Počkejte ~30 sekund na vytvoření

### 1.3 Přidejte webovou aplikaci
1. Na hlavní stránce projektu klikněte na ikonu **`</>`** (Web)
2. Zadejte název aplikace: `daruji-web`
3. ❌ **NEZAŠKRTÁVEJTE** "Firebase Hosting"
4. Klikněte **"Register app"**
5. 📋 **ZKOPÍRUJTE SI** zobrazené hodnoty (budete je potřebovat):
   ```
   apiKey: "AIza..."
   authDomain: "daruji-xxxxx.firebaseapp.com"
   projectId: "daruji-xxxxx"
   storageBucket: "daruji-xxxxx.appspot.com"
   messagingSenderId: "123456789"
   appId: "1:123456789:web:abcdef"
   ```
6. Klikněte **"Continue to console"**

### 1.4 Vytvořte Firestore databázi
1. V levém menu klikněte na **"Build"** → **"Firestore Database"**
2. Klikněte **"Create database"**
3. Vyberte **"Start in test mode"** (pro začátek)
4. Vyberte lokaci: **"eur3 (europe-west)"** (nejbližší pro ČR)
5. Klikněte **"Enable"**

### 1.5 Nastavte bezpečnostní pravidla (DŮLEŽITÉ!)
1. V Firestore klikněte na záložku **"Rules"**
2. Nahraďte obsah tímto:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /items/{itemId} {
         // Kdokoli může číst položky
         allow read: if true;
         // Kdokoli může vytvářet položky
         allow create: if true;
         // Upravovat a mazat může kdokoli (pro jednoduchost)
         // Pro produkci doporučuji přidat autentizaci
         allow update, delete: if true;
       }
     }
   }
   ```
3. Klikněte **"Publish"**

---

## Krok 2: Nastavení projektu lokálně (3 minuty)

### 2.1 Rozbalte stažený ZIP soubor

### 2.2 Vytvořte soubor `.env.local`
V hlavní složce projektu vytvořte soubor `.env.local` s tímto obsahem (doplňte VAŠE hodnoty z Firebase):

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=daruji-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=daruji-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=daruji-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 2.3 (Volitelné) Otestujte lokálně
```bash
npm install
npm run dev
```
Otevřete http://localhost:5173

---

## Krok 3: Nasazení na Vercel (5 minut)

### 3.1 Nahrajte na GitHub
1. Vytvořte nový repozitář na [github.com/new](https://github.com/new)
2. Pojmenujte ho `daruji`
3. V terminálu ve složce projektu:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/VASE_JMENO/daruji.git
   git push -u origin main
   ```

### 3.2 Propojte s Vercel
1. Jděte na **[vercel.com](https://vercel.com)**
2. Přihlaste se přes GitHub
3. Klikněte **"Add New Project"**
4. Vyberte repozitář `daruji`
5. **DŮLEŽITÉ** - Před kliknutím na Deploy rozbalte **"Environment Variables"**
6. Přidejte VŠECHNY proměnné z vašeho `.env.local`:
   
   | Name | Value |
   |------|-------|
   | `VITE_FIREBASE_API_KEY` | AIzaSy... |
   | `VITE_FIREBASE_AUTH_DOMAIN` | daruji-xxx.firebaseapp.com |
   | `VITE_FIREBASE_PROJECT_ID` | daruji-xxx |
   | `VITE_FIREBASE_STORAGE_BUCKET` | daruji-xxx.appspot.com |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | 123... |
   | `VITE_FIREBASE_APP_ID` | 1:123...:web:abc... |

7. Klikněte **"Deploy"**
8. ✅ **HOTOVO!** Za ~1 minutu dostanete URL jako `daruji-xyz.vercel.app`

---

## 🎉 Gratulujeme!

Vaše aplikace nyní běží na internetu se sdílenou databází. Pošlete odkaz komukoliv a uvidíte stejné položky v reálném čase!

---

## 📝 Další kroky (volitelné)

### Vlastní doména
1. V Vercel dashboardu jděte do Settings → Domains
2. Přidejte svou doménu a nastavte DNS záznamy

### Přidání autentizace (doporučeno pro produkci)
Pro větší bezpečnost můžete přidat přihlašování přes Google:
1. V Firebase Console → Authentication → Sign-in method
2. Povolte "Google" provider
3. Upravte kód aplikace pro přihlašování

---

## 🛠️ Technologie

- **React 18** + **Vite** - Frontend
- **Firebase Firestore** - Real-time databáze
- **Tailwind CSS** - Styling
- **Vercel** - Hosting

---

## 📁 Struktura projektu

```
daruji/
├── public/
│   └── gift.svg
├── src/
│   ├── App.jsx          # Hlavní komponenta
│   ├── firebase.js      # Firebase konfigurace
│   ├── main.jsx
│   └── index.css
├── .env.local           # VAŠE Firebase credentials (neverzovat!)
├── .env.example         # Vzor pro .env.local
├── index.html
├── package.json
└── ...config soubory
```

---

## ❓ Řešení problémů

### "Permission denied" při čtení/zápisu
→ Zkontrolujte Firestore Rules (krok 1.5)

### Aplikace se nenačítá na Vercel
→ Zkontrolujte, že jste přidali VŠECHNY Environment Variables ve Vercelu

### Změny se nezobrazují ostatním
→ Zkontrolujte Firebase Console → Firestore → zda se data ukládají

---

## 📄 Licence

MIT - Používejte volně!
