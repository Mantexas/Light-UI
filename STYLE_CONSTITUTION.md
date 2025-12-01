# LIGHT-UI STYLE CONSTITUTION

## MANDATORY RULES - NON-NEGOTIABLE

This document defines the immutable styling rules for Light-UI. Violation of these rules is NOT acceptable.

---

## 1. PADDING & SPACING HIERARCHY

### All Page Containers MUST follow this pattern:

#### Desktop (≥1024px)
```
Vertical Padding:   --space-lg (64px)
Horizontal Padding: --space-xl (96px)
```

#### Tablet (768px - 1023px)
```
Vertical Padding:   --space-lg (64px)
Horizontal Padding: --space-md (32px)
```

#### Mobile (≤480px)
```
Vertical Padding:   --space-lg (64px)
Horizontal Padding: --space-md (32px)
```

### AFFECTED CONTAINERS (PUBLIC PAGES ONLY)
- `.hero` (index.html)
- `.gallery-container` (color.html)
- `.about-container` (artist.html)
- `.stories-container` (stories.html)
- `.video-container` (film.html)
- `.store-container` (store.html)

**EXCEPTION:** `.admin-container` - See Admin Panel Override below

### VERIFICATION
```css
/* CORRECT ✅ */
.page-container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: var(--space-lg) var(--space-xl);
}

@media (max-width: 768px) {
  .page-container {
    padding: var(--space-lg) var(--space-md);
  }
}

@media (max-width: 480px) {
  .page-container {
    padding: var(--space-lg) var(--space-md);
  }
}

/* WRONG ❌ - DO NOT DO THIS */
.page-container {
  padding: var(--space-xl);         /* WRONG - uses xl for both */
  padding: 48px 96px;               /* WRONG - hardcoded values */
  padding: var(--space-2xl);        /* WRONG - uses space-2xl */
  padding: var(--space-md);         /* WRONG - uses md for both */
}
```

---

## 1.5 ADMIN PANEL OVERRIDE - DENSE UI EXCEPTION

**Context:** Admin panels are data-dense interfaces requiring tighter spacing than portfolio pages. This override follows industry standards (Shopify Polaris, Material Design, Anthropic Claude).

### Admin Panel Spacing (admin.html ONLY):

#### Desktop (≥1024px)
```css
/* Admin Header */
.admin-header {
  padding: 20px 32px;  /* NOT var(--space-lg) */
}

/* Admin Container */
.admin-container {
  padding: 32px;  /* NOT var(--space-lg) var(--space-xl) */
}

/* Admin Tabs/Buttons */
.admin-tab-btn {
  padding: 10px 20px;  /* Compact, not --space-md */
}
```

#### Tablet (768px - 1023px)
```css
.admin-header {
  padding: 16px 24px;
}

.admin-container {
  padding: 24px;
}
```

#### Mobile (≤480px)
```css
.admin-header {
  padding: 12px 16px;
}

.admin-container {
  padding: 20px 16px;
}
```

### Rationale:
- Portfolio pages = spacious, artistic (64px/96px)
- Admin panels = efficient, compact (20-32px)
- Matches Shopify Polaris, Material Design standards
- 40-60% reduction vs portfolio spacing

### RULES
- ✅ Admin panel uses custom hardcoded values (exceptional case)
- ✅ All OTHER pages follow standard Constitution spacing
- ✅ Admin spacing based on industry best practices
- ❌ DO NOT apply admin spacing to public pages
- ❌ DO NOT apply portfolio spacing to admin panel

---

## 2. FOOTER STYLING - GLOBAL & IMMUTABLE

Footer MUST be defined ONLY in `assets/css/base.css` and MUST have:

```css
footer {
  padding: var(--space-xl) 0;
  text-align: center;
  border-top: 1px solid var(--border-color);
  margin-top: var(--space-2xl);
  max-width: var(--container-max-width);
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--space-xl);
  padding-right: var(--space-xl);
}

footer p {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  footer {
    padding-left: var(--space-md);
    padding-right: var(--space-md);
  }
}

@media (max-width: 480px) {
  footer {
    padding-left: var(--space-md);
    padding-right: var(--space-md);
  }

  footer p {
    font-size: var(--font-size-xs);
  }
}
```

### RULES
- ✅ Footer styling ONLY in base.css
- ✅ Footer MUST be centered (text-align: center)
- ✅ Footer MUST match navigation max-width and padding
- ❌ NO footer styling in other CSS files
- ❌ NO duplicate footer definitions
- ❌ NO hardcoded padding values

---

## 3. TYPOGRAPHY - POPPINS LIGHT EVERYWHERE

### Required:
- Font: Poppins (from Google Fonts)
- Default Weight: 300 (Light)
- All text must inherit from body

```css
/* base.css - IMMUTABLE */
body {
  font-family: var(--font-sans);
  font-weight: var(--font-weight-light);
  font-size: var(--font-size-base);
  line-height: var(--line-height);
  letter-spacing: var(--letter-spacing);
  color: var(--text-primary);
}

h1, h2, h3, h4, h5, h6 {
  font-weight: var(--font-weight-medium);
  line-height: 1.2;
}
```

### RULES
- ✅ All text uses Poppins Light (300) by default
- ✅ Headings use --font-weight-medium
- ✅ Use CSS variables for fonts, NEVER hardcode
- ❌ NO font-family overrides in page CSS
- ❌ NO serif fonts
- ❌ NO hardcoded font sizes (use variables)

---

## 4. SPACING SCALE - IMMUTABLE

```css
/* variables.css - DO NOT CHANGE */
--space-xs:   8px     (never used for containers)
--space-sm:   16px    (internal spacing only)
--space-md:   32px    (responsive padding - mobile/tablet)
--space-lg:   64px    (vertical padding - ALL pages)
--space-xl:   96px    (horizontal padding - desktop)
--space-2xl:  128px   (margins between major sections)
```

### RULES
- ✅ ONLY use spacing variables from this scale
- ✅ All padding/margin MUST use these variables
- ❌ NO hardcoded pixel values in spacing
- ❌ NO arbitrary spacing values

---

## 5. BREAKPOINTS - MANDATORY

All responsive design MUST use these breakpoints ONLY:

```
Desktop:    ≥1024px  (default)
Tablet:     768px - 1023px
Mobile:     ≤480px
```

### RULES
- ✅ Only use @media (max-width: 768px) and @media (max-width: 480px)
- ✅ Test on all three breakpoints
- ❌ NO random breakpoints like 600px, 900px, 1200px
- ❌ NO mobile-first approach (desktop-first only)

---

## 6. CONTAINER ALIGNMENT - IDENTICAL ACROSS ALL PAGES

Every page container MUST follow this pattern:

```css
.container-name {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: var(--space-lg) var(--space-xl);
}

@media (max-width: 768px) {
  .container-name {
    padding: var(--space-lg) var(--space-md);
  }
}

@media (max-width: 480px) {
  .container-name {
    padding: var(--space-lg) var(--space-md);
  }
}
```

---

## 7. ENFORCEMENT CHECKLIST

Before committing ANY CSS change, verify:

- [ ] **Padding**: Uses --space-lg vertical, --space-xl horizontal (desktop)
- [ ] **Responsive**: Has @media (max-width: 768px) and @media (max-width: 480px)
- [ ] **Footer**: Only defined in base.css, not duplicated
- [ ] **Typography**: Uses variables, not hardcoded
- [ ] **Spacing**: Uses CSS variables only, no hardcoded pixels
- [ ] **Alignment**: max-width = var(--container-max-width), margin: 0 auto
- [ ] **Font**: Poppins Light (300) inherited from body

---

## 8. HOW TO ADD A NEW PAGE

1. Create your HTML file
2. Import these CSS files IN ORDER:
   ```html
   <link rel="stylesheet" href="assets/css/variables.css">
   <link rel="stylesheet" href="assets/css/base.css">
   <link rel="stylesheet" href="assets/css/navigation.css">
   <link rel="stylesheet" href="assets/css/YOUR_PAGE.css">
   <link rel="stylesheet" href="assets/css/animations.css">
   ```

3. Create `assets/css/YOUR_PAGE.css` with:
   ```css
   @import 'variables.css';

   .your-container {
     max-width: var(--container-max-width);
     margin: 0 auto;
     padding: var(--space-lg) var(--space-xl);
   }

   @media (max-width: 768px) {
     .your-container {
       padding: var(--space-lg) var(--space-md);
     }
   }

   @media (max-width: 480px) {
     .your-container {
       padding: var(--space-lg) var(--space-md);
     }
   }
   ```

4. Add footer to HTML:
   ```html
   <footer style="cursor: pointer;" title="Shift+Click for admin">
     <p>&copy; 2024 All rights reserved. Our creative works are protected by copyright laws and the delicate boundaries of human understanding.</p>
   </footer>
   ```

5. Verify all breakpoints work before commit

---

## 9. WHAT NOT TO DO

```css
❌ .container { padding: 50px; }
❌ .container { padding: 50px 100px; }
❌ @media (max-width: 600px) { }
❌ @media (max-width: 900px) { }
❌ font-size: 18px;
❌ margin: 20px;
❌ padding: 1rem;
❌ font-family: 'Arial', sans-serif;
❌ footer { padding: 40px; }
❌ .container { max-width: 1200px; }
```

---

## 10. SIGN-OFF

**This constitution is non-negotiable.**

Every modification to CSS MUST comply with these rules.
Failure to comply = regression = user experience breaks.

**Consistency = Professional = Respect for the codebase**

---

*Last Updated: 2025-11-30*
*Status: ACTIVE & ENFORCED*
