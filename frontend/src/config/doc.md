# Documentation: Adding New Routes to the Application

## English
### How to Add a New Route to the Application

#### 1. Create a Component
First, create your component in the appropriate subdirectory of the `pages` folder:
```tsx
// Example: src/pages/dashboard/MyNewPage.tsx
import React from 'react';

export default function MyNewPage() {
  return (
    <div>
      <h1>My New Page</h1>
      {/* Your page content goes here */}
    </div>
  );
}
```

#### 2. Register the Route in `config/index.ts`
Open the `config/index.ts` file and follow these steps:

1. Import your component:
   ```typescript
   const MyNewPage = lazy(() => import('../pages/dashboard/MyNewPage'));
   ```

2. Add your route to the appropriate routes array:
   ```typescript
   dashboard: [
     // Existing routes...
     {
       path: '/my-new-page',
       component: MyNewPage,
       roles: ['admin', 'enseignant', 'etudiant'], // Specify which roles can access this route
     },
   ],
   ```

#### 3. Add the Navigation Item in `config/navigation.ts`
To make your route appear in the sidebar, add it to the navigation configuration for the relevant roles:

```typescript
case 'admin':
  return {
    main: [
      // Existing items...
      { title: 'My New Page', href: '/my-new-page', icon: FileText }, // Use an appropriate icon
    ]
  };
```

#### 4. Test Your New Route
Navigate to your newly created route to ensure it works correctly and that the access permissions are enforced correctly.

## Français
### Comment ajouter une nouvelle route à l'application

#### 1. Créer un composant
D'abord, créez votre composant dans le sous-répertoire approprié du dossier `pages` :
```tsx
// Exemple: src/pages/dashboard/MaNouvellePage.tsx
import React from 'react';

export default function MaNouvellePage() {
  return (
    <div>
      <h1>Ma Nouvelle Page</h1>
      {/* Le contenu de votre page va ici */}
    </div>
  );
}
```

#### 2. Enregistrer la route dans `config/index.ts`
Ouvrez le fichier `config/index.ts` et suivez ces étapes :

1. Importez votre composant :
   ```typescript
   const MaNouvellePage = lazy(() => import('../pages/dashboard/MaNouvellePage'));
   ```

2. Ajoutez votre route au tableau de routes approprié :
   ```typescript
   dashboard: [
     // Routes existantes...
     {
       path: '/ma-nouvelle-page',
       component: MaNouvellePage,
       roles: ['admin', 'enseignant', 'etudiant'], // Spécifiez quels rôles peuvent accéder à cette route
     },
   ],
   ```

#### 3. Ajouter l'élément de navigation dans `config/navigation.ts`
Pour faire apparaître votre route dans la barre latérale, ajoutez-la à la configuration de navigation pour les rôles concernés :

```typescript
case 'admin':
  return {
    main: [
      // Éléments existants...
      { title: 'Ma Nouvelle Page', href: '/ma-nouvelle-page', icon: FileText }, // Utilisez une icône appropriée
    ]
  };
```

#### 4. Tester votre nouvelle route
Naviguez vers votre nouvelle route pour vous assurer qu'elle fonctionne correctement et que les permissions d'accès sont correctement appliquées.

## العربية
### كيفية إضافة مسار جديد إلى التطبيق

#### 1. إنشاء مكون
أولاً، قم بإنشاء المكون الخاص بك في الدليل الفرعي المناسب من مجلد `pages`:
```tsx
// مثال: src/pages/dashboard/صفحتي_الجديدة.tsx
import React from 'react';

export default function صفحتي_الجديدة() {
  return (
    <div>
      <h1>صفحتي الجديدة</h1>
      {/* محتوى صفحتك يذهب هنا */}
    </div>
  );
}
```

#### 2. تسجيل المسار في `config/index.ts`
افتح ملف `config/index.ts` واتبع هذه الخطوات:

1. استيراد المكون الخاص بك:
   ```typescript
   const صفحتي_الجديدة = lazy(() => import('../pages/dashboard/صفحتي_الجديدة'));
   ```

2. أضف المسار الخاص بك إلى مصفوفة المسارات المناسبة:
   ```typescript
   dashboard: [
     // المسارات الموجودة...
     {
       path: '/صفحتي-الجديدة',
       component: صفحتي_الجديدة,
       roles: ['admin', 'enseignant', 'etudiant'], // حدد أي الأدوار يمكنها الوصول إلى هذا المسار
     },
   ],
   ```

#### 3. إضافة عنصر التنقل في `config/navigation.ts`
لجعل المسار الخاص بك يظهر في الشريط الجانبي، أضفه إلى تكوين التنقل للأدوار ذات الصلة:

```typescript
case 'admin':
  return {
    main: [
      // العناصر الموجودة...
      { title: 'صفحتي الجديدة', href: '/صفحتي-الجديدة', icon: FileText }, // استخدم رمزًا مناسبًا
    ]
  };
```

#### 4. اختبار المسار الجديد الخاص بك
انتقل إلى المسار الجديد الذي أنشأته للتأكد من أنه يعمل بشكل صحيح وأن أذونات الوصول مطبقة بشكل صحيح.

---

## Additional Notes / Notes Supplémentaires / ملاحظات إضافية

### English
- Make sure to use kebab-case for route paths (e.g., `/my-new-page` instead of `/myNewPage`)
- Import appropriate icons from `lucide-react` library for sidebar navigation items
- The structure of the route depends on whether it's a public route, a dashboard route, or a special route like 404
- Routes may require authentication and specific role permissions

### Français
- Assurez-vous d'utiliser le kebab-case pour les chemins de route (ex: `/ma-nouvelle-page` au lieu de `/maNouvellePage`)
- Importez les icônes appropriées de la bibliothèque `lucide-react` pour les éléments de navigation de la barre latérale
- La structure de la route dépend de s'il s'agit d'une route publique, une route de tableau de bord ou une route spéciale comme 404
- Les routes peuvent nécessiter une authentification et des autorisations de rôle spécifiques

### العربية
- تأكد من استخدام kebab-case لمسارات الطرق (مثل `/صفحتي-الجديدة` بدلاً من `/صفحتيالجديدة`)
- استيراد الأيقونات المناسبة من مكتبة `lucide-react` لعناصر التنقل في الشريط الجانبي
- تعتمد بنية المسار على ما إذا كان مسارًا عامًا، أو مسار لوحة تحكم، أو مسارًا خاصًا مثل 404
- قد تتطلب المسارات المصادقة وأذونات دور محددة
