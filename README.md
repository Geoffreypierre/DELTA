# DELTΔ" - Calculatrice Graphique Interactive

Une calculatrice graphique moderne, simpliste et intuitive développée avec HTML5, CSS3 et JavaScript, conçue pour visualiser et analyser des fonctions mathématiques en temps réel.

<img width="593" height="496" alt="image" src="https://github.com/user-attachments/assets/1475bc7b-633e-4b2b-a431-cfee02246366" />

## ✨ Fonctionnalités

### 📊 Visualisation de Fonctions
- **Tracé en temps réel** : Affichage instantané des courbes mathématiques
- **Rendu haute précision** : Algorithme adaptatif pour un tracé fluide même pour les fonctions complexes
- **Support des fonctions discontinues** : Gestion intelligente des asymptotes et points de discontinuité
- **Couleurs distinctes** : Attribution automatique de couleurs pour différencier les fonctions

### 🧮 Opérations Mathématiques Avancées
- **Dérivation numérique** : Calcul et affichage de la dérivée de n'importe quelle fonction (par calcul du taux d'accroissement)

<img width="555" height="372" alt="image" src="https://github.com/user-attachments/assets/61b93c34-9e92-441b-9891-97023e964f34" />
  
- **Intégration numérique** : Calcul de primitives avec méthode d'intégration numérique

<img width="555" height="372" alt="image" src="https://github.com/user-attachments/assets/ea22f6e1-16a6-48c5-be5d-ee607f2a11e5" />

- **Fonction inverse** : Calcul de l'inverse multiplicatif (1/f(x))

<img width="555" height="372" alt="image" src="https://github.com/user-attachments/assets/e0202080-823c-4657-99f1-08d3dea29ffb" />

- **Validation automatique** : Vérification de la validité des opérations

### 🎮 Interface Interactive
- **Navigation fluide** : Zoom et déplacement à la souris ou trackpad
- **Grille dynamique** : Espacement intelligent qui s'adapte au niveau de zoom
- **Axes gradués** : Affichage automatique des graduations avec formatage adaptatif
- **Contrôles tactiles** : Interface optimisée pour tous les périphériques

### 🔧 Outils de Contrôle
- **Zoom intelligent** : Zoom +/- avec préservation du point focal
- **Reset rapide** : Retour à la vue par défaut en un clic
- **Basculement de grille** : Activation/désactivation de la grille
- **Effacement global** : Suppression de toutes les fonctions

## 🚀 Installation et Utilisation

### Prérequis
- Navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Aucune installation requise pour la version web

### Lancement Direct
```bash
# Cloner le repository
git clone https://github.com/votre-repo/delta.git

# Naviguer dans le dossier
cd DELTA

# Ouvrir index.html dans votre navigateur
open index.html
# ou
python -m http.server 8000  # Pour un serveur local
```

### Version Electron (Bureau)
```bash
# Installer les dépendances
npm install electron --save-dev

# Créer le fichier main.js pour Electron
# (voir section Configuration Electron ci-dessous)

# Lancer l'application
npm start
```

### Téléchargement Logiciel (Bureau)
```bash
# Installer les dépendances
exécuter Delta Setup 1.0.0.exe
ou
# Installer les dépendances
npm install electron --save-dev

# compiler le projet
npm run dist

# Éxecuter l'installation
exécuter Delta Setup 1.0.0.exe
```

## 📖 Guide d'Utilisation

### Saisie de Fonctions
1. **Syntaxe supportée** :
   ```
   Fonctions de base : sin(x), cos(x), tan(x)
   Fonctions hyperboliques : sh(x), ch(x), th(x)
   Fonctions inverses : arcsin(x), arccos(x), arctan(x)
   Logarithmes : ln(x), log(x)
   Autres : sqrt(x), abs(x)
   Constantes : pi, e
   Opérateurs : +, -, *, /, ^, ²
   ```

2. **Exemples de fonctions** :
   ```
   x^2 + 2*x + 1
   sin(x) * cos(x)
   ln(x) / x
   sqrt(x^2 + 1)
   e^(-x²)
   ```

### Navigation
- **Déplacement** : Clic-glisser pour déplacer la vue
- **Zoom** : Molette de la souris pour zoomer/dézoomer
- **Zoom focal** : Le zoom se centre sur la position du curseur

### Analyse de Fonctions
1. **Sélectionner une fonction** : Cliquer sur une fonction dans la liste
2. **Calculer la dérivée** : Cliquer sur l'icône "dérivée"
3. **Calculer la primitive** : Cliquer sur l'icône "primitive"
4. **Calculer l'inverse** : Cliquer sur l'icône "inverse"

## 🏗️ Architecture Technique

### Structure des Fichiers
```
delta/
├── index.html          # Interface principale
├── math.js            # Logique mathématique et rendu
├── styles/
│   └── styles.css     # Styles et animations
└── img/               # Ressources graphiques
    ├── der_gray.png   # Icônes dérivée
    ├── prim_gray.png  # Icônes primitive
    └── inv_gray.png   # Icônes inverse
```

### Technologies Utilisées
- **HTML5 Canvas** : Rendu graphique haute performance
- **MathJax** : Rendu des formules mathématiques LaTeX
- **CSS3** : Design moderne avec glassmorphism
- **JavaScript ES6+** : Logique applicative et calculs

### Algorithmes Implémentés
- **Dérivation numérique** : Méthode des différences finies centrées
- **Intégration numérique** : Méthode des rectangles avec pas adaptatif
- **Rendu adaptatif** : Algorithme de subdivision automatique pour les courbes complexes
- **Détection de discontinuités** : Analyse de la validité des points

## 🐛 Résolution de Problèmes

### Problèmes Courants
1. **Fonction ne s'affiche pas** :
   - Vérifier la syntaxe de la fonction
   - S'assurer que la fonction est définie dans le domaine visible

2. **Performance lente** :
   - Réduire le niveau de zoom pour les fonctions complexes
   - Éviter les fonctions avec de nombreuses discontinuités

3. **Calculs incorrects** :
   - Les dérivées et primitives utilisent des méthodes numériques (approximations)
   - La précision diminue pour les fonctions très oscillantes

### Limitations
- Calculs numériques uniquement (pas de calcul symbolique)
- Précision limitée pour les fonctions extrêmes
- Pas de support pour les fonctions à plusieurs variables

## 📄 Licence

Ce projet est open source.

**DELTΔ"** - Où les mathématiques prennent vie ! 📊✨
