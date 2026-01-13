# React + TypeScript + Vite

Esta plantilla proporciona una configuración mínima para hacer funcionar React en Vite con HMR y algunas reglas de ESLint.

Actualmente, hay dos plugins oficiales disponibles:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) utiliza [Babel](https://babeljs.io/) para Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) utiliza [SWC](https://swc.rs/) para Fast Refresh

## Ampliando la configuración de ESLint

Si estás desarrollando una aplicación de producción, recomendamos actualizar la configuración para habilitar reglas de linting conscientes de tipos:

- Configura la propiedad `parserOptions` de nivel superior así:

```js
export default tseslint.config({
  languageOptions: {
    // otras opciones...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Reemplaza `tseslint.configs.recommended` por `tseslint.configs.recommendedTypeChecked` o `tseslint.configs.strictTypeChecked`
- Opcionalmente añade `...tseslint.configs.stylisticTypeChecked`
- Instala [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) y actualiza la configuración:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Establece la versión de react
  settings: { react: { version: '18.3' } },
  plugins: {
    // Añade el plugin de react
    react,
  },
  rules: {
    // otras reglas...
    // Habilita sus reglas recomendadas
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
