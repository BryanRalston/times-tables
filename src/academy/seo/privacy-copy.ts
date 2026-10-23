import type { SeoLang } from "./copy";

export interface PrivacyCopy {
  title: string;
  description: string;
  kicker: string;
  h1: string;
  paragraphs: readonly string[];
  contact: string;
  back: string;
  sheets: string;
}

export const PRIVACY_DESCRIPTION_EN =
  "Squishee Academy collects no personal information. Progress stays on this device. No ads, no accounts. Page views are counted with GoatCounter, which sets no cookies.";

const PRIVACY_COPY: Record<SeoLang, PrivacyCopy> = {
  en: {
    title: "Privacy | Squishee Academy",
    description: PRIVACY_DESCRIPTION_EN,
    kicker: "On this device",
    h1: "Privacy",
    paragraphs: [
      "Squishee Academy is free forever. There are no ads and no accounts. Nothing here is about an individual child.",
      "We do not collect personal information. A name typed into the app stays on this device. Progress stays on this device. We do not send it to a server. We do not know who is playing.",
      "We count page views with GoatCounter, a privacy-friendly counter. It sets no cookies and collects no personal information. It records only things like which page was viewed, the broad browser and screen size, and the referring site. It does not store IP addresses. It honors Do Not Track.",
      "This is a COPPA-friendly kids' site. We do not ask children for an email, a photo, a location, or any contact information.",
      "A backup code is made on this device so a grown-up can move progress to another device. The code is not uploaded. If you copy it, you are the one holding it.",
      "The games, pictures, and worksheets can be saved on the device the first time you visit, so they still open with the internet off. That copy stays in this browser.",
    ],
    contact: "Contact:",
    back: "Back to games",
    sheets: "Worksheets",
  },
  es: {
    title: "Privacidad | Squishee Academy",
    description:
      "Squishee Academy no recoge información personal. El progreso se queda en este aparato. Sin anuncios ni cuentas. Las visitas se cuentan con GoatCounter, que no pone cookies.",
    kicker: "En este aparato",
    h1: "Privacidad",
    paragraphs: [
      "Squishee Academy es gratis para siempre. No hay anuncios ni cuentas. Aquí no hay nada sobre un niño en particular.",
      "No recogemos información personal. Un nombre escrito en la aplicación se queda en este aparato. El progreso se queda en este aparato. No lo enviamos a un servidor. No sabemos quién está jugando.",
      "Contamos las visitas a las páginas con GoatCounter, un contador que cuida la privacidad. No pone cookies y no recoge información personal. Solo anota cosas como qué página se vio, el navegador en general y el tamaño de la pantalla, y el sitio del que vienes. No guarda direcciones IP. Respeta Do Not Track.",
      "Este es un sitio para niños, pensado para COPPA. No pedimos a los niños un correo, una foto, un lugar ni ningún dato de contacto.",
      "Un código de respaldo se crea en este aparato para que un adulto pueda llevar el progreso a otro aparato. El código no se sube. Si lo copias, lo guardas tú.",
      "Los juegos, las imágenes y las fichas se pueden guardar en el aparato la primera vez que entras, así se abren sin internet. Esa copia se queda en este navegador.",
    ],
    contact: "Contacto:",
    back: "Volver a los juegos",
    sheets: "Fichas",
  },
  "pt-BR": {
    title: "Privacidade | Squishee Academy",
    description:
      "Squishee Academy não coleta informações pessoais. O progresso fica neste aparelho. Sem anúncios e sem contas. As visitas são contadas com o GoatCounter, que não coloca cookies.",
    kicker: "Neste aparelho",
    h1: "Privacidade",
    paragraphs: [
      "Squishee Academy é grátis para sempre. Não há anúncios nem contas. Aqui não há nada sobre uma criança em particular.",
      "Não coletamos informações pessoais. Um nome digitado no aplicativo fica neste aparelho. O progresso fica neste aparelho. Não enviamos isso a um servidor. Não sabemos quem está jogando.",
      "Contamos as visitas às páginas com o GoatCounter, um contador que respeita a privacidade. Ele não coloca cookies e não coleta informações pessoais. Ele anota só coisas como qual página foi vista, o navegador em linhas gerais e o tamanho da tela, e o site de onde a pessoa veio. Ele não guarda endereços IP. Ele respeita o Do Not Track.",
      "Este é um site para crianças, pensado para a COPPA. Não pedimos às crianças um e-mail, uma foto, um lugar nem um contato.",
      "Um código de reserva é criado neste aparelho para um adulto levar o progresso a outro aparelho. O código não é enviado. Se você copiar, quem guarda é você.",
      "Os jogos, as imagens e as folhas podem ser salvos no aparelho na primeira visita, e assim abrem sem internet. Essa cópia fica neste navegador.",
    ],
    contact: "Contato:",
    back: "Voltar aos jogos",
    sheets: "Folhas",
  },
  fr: {
    title: "Confidentialité | Squishee Academy",
    description:
      "Squishee Academy ne collecte pas d'informations personnelles. La progression reste sur cet appareil. Sans publicité et sans compte. Les pages vues sont comptées avec GoatCounter, qui ne dépose pas de cookies.",
    kicker: "Sur cet appareil",
    h1: "Confidentialité",
    paragraphs: [
      "Squishee Academy est gratuit pour toujours. Il n'y a pas de publicité et pas de compte. Rien ici ne parle d'un enfant en particulier.",
      "Nous ne collectons pas d'informations personnelles. Un prénom écrit dans l'application reste sur cet appareil. La progression reste sur cet appareil. Nous ne l'envoyons pas à un serveur. Nous ne savons pas qui joue.",
      "Nous comptons les pages vues avec GoatCounter, un compteur qui respecte la vie privée. Il ne dépose pas de cookies et ne collecte pas d'informations personnelles. Il note seulement des choses comme la page vue, le navigateur dans les grandes lignes et la taille de l'écran, et le site d'où l'on vient. Il ne conserve pas les adresses IP. Il respecte Do Not Track.",
      "C'est un site pour les enfants, pensé pour la COPPA. Nous ne demandons pas aux enfants d'e-mail, de photo, de lieu, ni de moyen de contact.",
      "Un code de sauvegarde est créé sur cet appareil pour qu'un adulte puisse emporter la progression sur un autre appareil. Le code n'est pas envoyé. Si vous le copiez, c'est vous qui le gardez.",
      "Les jeux, les images et les fiches peuvent être enregistrés sur l'appareil dès la première visite, et ils s'ouvrent encore sans internet. Cette copie reste dans ce navigateur.",
    ],
    contact: "Contact :",
    back: "Retour aux jeux",
    sheets: "Fiches",
  },
  "zh-Hans": {
    title: "隐私 | Squishee Academy",
    description:
      "Squishee Academy 不收集个人的东西。进度留在这台设备上。没有广告，也不用账号。页面浏览用 GoatCounter 来数，它不放 cookie。",
    kicker: "在这台设备上",
    h1: "隐私",
    paragraphs: [
      "Squishee Academy 一直免费。没有广告，也不用账号。这里没有一个孩子自己的事。",
      "我们不收集个人的名字，也不收集别的个人的东西。在应用里写下的名字留在这台设备上。进度留在这台设备上。我们不会把它送到别的地方。我们不知道是哪一个孩子在玩。",
      "我们用 GoatCounter 数页面浏览。这是一个小心隐私的计数。它不放 cookie，也不收集个人的东西。它只记下打开了哪一页、浏览器和屏幕大小，还有从哪个网站过来。它不保存 IP。它听从 Do Not Track。",
      "这是给孩子的网站，也按 COPPA 来做。我们不向孩子要名字、图片、位置，也不问他们住在哪里。",
      "备份代码在这台设备上生成，这样大人可以把进度带到另一台设备。这个代码不会送到别的地方。如果你复制了它，你自己收着就好。",
      "第一次打开时，游戏、图片和练习纸可以存在这台设备上，没有网络也能打开。这些东西留在这个浏览器里。",
    ],
    contact: "找我们：",
    back: "返回游戏",
    sheets: "练习纸",
  },
  hi: {
    title: "गोपनीयता | Squishee Academy",
    description:
      "Squishee Academy निजी जानकारी नहीं लेता। प्रगति इस डिवाइस पर रहती है। कोई विज्ञापन नहीं, कोई खाता नहीं। पेज देखने की गिनती GoatCounter करता है, और वह कुकी नहीं रखता।",
    kicker: "इस डिवाइस पर",
    h1: "गोपनीयता",
    paragraphs: [
      "Squishee Academy हमेशा के लिए मुफ़्त है। कोई विज्ञापन नहीं, कोई खाता नहीं। यहाँ किसी एक बच्चे के बारे में कुछ नहीं है।",
      "हम निजी जानकारी नहीं लेते। ऐप में लिखा नाम इस डिवाइस पर रहता है। प्रगति इस डिवाइस पर रहती है। हम उसे किसी सर्वर पर नहीं भेजते। हमें नहीं पता कौन खेल रहा है।",
      "हम पेज देखने की गिनती GoatCounter से करते हैं। यह गिनती निजता का ध्यान रखती है। यह कुकी नहीं रखता और निजी जानकारी नहीं लेता। यह सिर्फ इतना नोट करता है: कौन सा पेज खुला, मोटे तौर पर ब्राउज़र और स्क्रीन का आकार, और किस साइट से आए। यह IP पते नहीं रखता। यह Do Not Track का ध्यान रखता है।",
      "यह बच्चों की साइट है, और COPPA के अनुकूल है। हम बच्चों से ईमेल, फ़ोटो, जगह, या कोई संपर्क नहीं माँगते।",
      "बैकअप कोड इसी डिवाइस पर बनता है, ताकि कोई बड़ा प्रगति को दूसरी डिवाइस पर ले जा सके। कोड अपलोड नहीं होता। अगर आप उसे कॉपी करते हैं, तो वह आपके पास रहता है।",
      "पहली बार खोलने पर खेल, चित्र और वर्कशीट इस डिवाइस पर सहेजे जा सकते हैं, ताकि इंटरनेट बंद हो तब भी खुलें। वह प्रति इस ब्राउज़र में रहती है।",
    ],
    contact: "संपर्क:",
    back: "खेलों पर वापस",
    sheets: "वर्कशीट",
  },
  ar: {
    title: "الخصوصية | Squishee Academy",
    description:
      "Squishee Academy لا يجمع معلومات شخصية. التقدم يبقى على هذا الجهاز. بلا إعلانات وبلا حسابات. تُعد مشاهدات الصفحات باستخدام GoatCounter، وهو لا يضع كوكيز.",
    kicker: "على هذا الجهاز",
    h1: "الخصوصية",
    paragraphs: [
      "Squishee Academy مجاني دائمًا. لا إعلانات ولا حسابات. لا شيء هنا عن طفل بعينه.",
      "لا نجمع معلومات شخصية. الاسم الذي يُكتب في التطبيق يبقى على هذا الجهاز. التقدم يبقى على هذا الجهاز. لا نرسله إلى خادم. لا نعرف من يلعب.",
      "نعدّ مشاهدات الصفحات باستخدام GoatCounter، وهو عدّاد يراعي الخصوصية. لا يضع كوكيز ولا يجمع معلومات شخصية. يسجّل فقط أمورًا مثل الصفحة التي فُتحت، والمتصفح وحجم الشاشة بصورة عامة، والموقع الذي أتى منه الزائر. لا يخزّن عناوين IP. وهو يحترم Do Not Track.",
      "هذا موقع للأطفال، ومراعٍ لـ COPPA. لا نطلب من الأطفال بريدًا أو صورة أو مكانًا أو أي وسيلة اتصال.",
      "يُنشأ رمز احتياطي على هذا الجهاز ليتمكن أحد الكبار من نقل التقدم إلى جهاز آخر. لا يُرفع الرمز. إذا نسخته فأنت من يحتفظ به.",
      "يمكن حفظ الألعاب والصور وأوراق العمل على الجهاز في أول زيارة، فتُفتح حتى من غير إنترنت. تبقى هذه النسخة في هذا المتصفح.",
    ],
    contact: "للتواصل:",
    back: "العودة إلى الألعاب",
    sheets: "أوراق العمل",
  },
};

export function privacyCopy(lang: SeoLang): PrivacyCopy {
  return PRIVACY_COPY[lang];
}
