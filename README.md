# MateMate

MateMate ya esta preparado para correr como app Android con `Capacitor`.

## Scripts

- `npm run build`: build web
- `npm run cap:sync`: sincroniza `dist/` con las plataformas nativas
- `npm run cap:sync:android`: build web + sync solo Android
- `npm run android:add`: crea la plataforma Android
- `npm run android:open`: abre el proyecto en Android Studio
- `npm run android:run`: build web + corre en dispositivo/emulador Android

## Flujo Android

1. Instala Android Studio y el SDK de Android.
2. Corre `npm install`.
3. Corre `npm run cap:sync:android`.
4. Corre `npm run android:open`.
5. Desde Android Studio genera el `AAB` firmado para Google Play.

## Cambios ya hechos para Android

- Integracion de `Capacitor` y proyecto `android/`
- Configuracion nativa en `capacitor.config.ts`
- Manejo del boton fisico de regreso de Android
- Ajustes para no usar fullscreen web dentro de la app nativa
- Barra de estado y splash configuradas para el look del juego

## Antes de publicar en Google Play

- Reemplazar el icono launcher por uno final
- Generar splash/logo finales si quieres branding propio
- Crear un keystore de release
- Subir `AAB` firmado a Google Play Console
- Completar ficha de tienda, politica de privacidad y clasificacion por edades


$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
java -version


npm install
npm run cap:sync:android
cd android
.\gradlew.bat clean assembleDebug


$env:ANDROID_HOME="C:\Users\elcua\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT="C:\Users\elcua\AppData\Local\Android\Sdk"
cd C:\APP\math-game\android
.\gradlew.bat clean assembleDebug

pixelar:
python scripts/pixel_art.py C:\APP\math-game\reference\unicorn_face.png

release a android
npm run build
npx cap sync android
npx cap open android